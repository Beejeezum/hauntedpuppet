"""Isolated synthetic-audio pilot. Default invocation is offline and starts no worker."""
import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import wave

DRIVER = Path(__file__).with_name('fictional-driver-24k.wav')
PROVIDER_SECONDS = 30
BODY_SECONDS = 20
REQUIRED = ('RUNWAYML_API_SECRET', 'LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'WISP_RUNWAY_AVATAR_ID')


def inspect_driver():
    with wave.open(str(DRIVER)) as audio:
        if (audio.getnchannels(), audio.getsampwidth(), audio.getframerate()) != (1, 2, 24000):
            raise ValueError('Pilot needs its supplied mono PCM16 24kHz fictional driver')
        seconds = audio.getnframes() / audio.getframerate()
        if not 0 < seconds <= 10:
            raise ValueError('Fictional driver must be at most ten seconds')
    return {'seconds': seconds, 'sha256': hashlib.sha256(DRIVER.read_bytes()).hexdigest()}


async def audio_frames(frame_factory):
    inspect_driver()
    with wave.open(str(DRIVER)) as audio:
        while data := audio.readframes(480):
            # SDK output handles pacing. Only the final partial 20ms frame is zero-padded.
            data = data.ljust(960, b'\0')
            yield frame_factory(data, sample_rate=24000, num_channels=1, samples_per_channel=480)


async def bounded_pilot(session, avatar, room, *, agent, options, frames,
                        body_seconds=BODY_SECONDS, settle_seconds=2, cleanup_seconds=4):
    """No retry; provider cap is independent of local timeout and cleanup success."""
    if not 0 < body_seconds <= BODY_SECONDS or not 0 <= settle_seconds <= 2 or not 0 < cleanup_seconds <= 4:
        raise ValueError('Pilot timing limits may only be reduced')
    events = []

    async def perform():
        await avatar.start(session, room=room)
        events.append('avatar-ready')
        await session.start(agent, room=room, room_options=options, record=False, session_host=False)
        events.append('session-ready-no-input')
        speech = session.say('', audio=frames, allow_interruptions=False, add_to_chat_ctx=False)
        await speech.wait_for_playout()
        events.append('fictional-audio-finished')
        await asyncio.sleep(settle_seconds)
        events.append('idle-observed-window')

    try:
        await asyncio.wait_for(perform(), timeout=body_seconds)
        return events
    finally:
        # Every cleanup is attempted, even if a preceding cleanup times out/fails.
        for name, close in [('avatar', avatar.aclose), ('session', session.aclose), ('room', room.disconnect)]:
            try:
                await asyncio.wait_for(close(), timeout=cleanup_seconds if name != 'room' else min(2, cleanup_seconds))
                events.append(name + '-closed')
            except Exception:
                events.append(name + '-cleanup-failed')


class OneShotGate:
    """Reject wrong-room and repeated jobs before constructing any paid avatar."""
    def __init__(self, room_name, claim_file=None):
        if not room_name or not room_name.startswith('wisp-pilot-'):
            raise ValueError('A dedicated wisp-pilot- room is required')
        self.room_name = room_name
        self.claimed = False
        self.claim_file = claim_file

    def claim(self, room_name):
        if room_name != self.room_name:
            raise ValueError('Pilot room does not match')
        if self.claimed:
            raise RuntimeError('This pilot already accepted its single job')
        if self.claim_file:
            # Shared across SDK job subprocesses; only one may construct an avatar.
            try:
                fd = os.open(self.claim_file, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            except FileExistsError:
                raise RuntimeError('Pilot job already claimed by another process') from None
            os.close(fd)
        self.claimed = True


async def pilot_entrypoint(ctx):
    # Module-level function is required by the SDK's spawn/forkserver job transfer.
    from livekit import rtc
    from livekit.agents import Agent, AgentSession, APIConnectOptions, room_io
    from livekit.plugins import runway
    gate = OneShotGate(os.environ.get('WISP_PILOT_ROOM_NAME'), os.environ.get('WISP_PILOT_CLAIM_FILE'))
    gate.claim(ctx.job.room.name)
    await asyncio.wait_for(ctx.connect(), timeout=10)
    inspect_driver()
    session = AgentSession()  # No STT, LLM, TTS or user input is configured.
    avatar = runway.AvatarSession(
        avatar_id=os.environ['WISP_RUNWAY_AVATAR_ID'], max_duration=PROVIDER_SECONDS,
        conn_options=APIConnectOptions(max_retry=0, timeout=10),
    )
    options = room_io.RoomOptions(audio_input=False, video_input=False, text_input=False,
                                  text_output=False, close_on_disconnect=True)
    try:
        events = await bounded_pilot(session, avatar, ctx.room,
            agent=Agent(instructions='Synthetic audio visual compatibility pilot only.'),
            options=options, frames=audio_frames(rtc.AudioFrame))
        # Only lifecycle labels; never tokens, request bodies or visitor data.
        print(json.dumps({'pilotEvents': events}))
    finally:
        ctx.shutdown(reason='Synthetic pilot finished or failed')
        Path(os.environ['WISP_PILOT_DONE_FILE']).touch(mode=0o600)


def create_server():
    from livekit.agents import AgentServer
    server = AgentServer()
    server.rtc_session(pilot_entrypoint, agent_name='wisp-synthetic-visual-pilot')
    return server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', action='store_true', help='Start one supervised private pilot after configuration')
    parser.add_argument('--sdk-child', action='store_true', help=argparse.SUPPRESS)
    parser.add_argument('--keychain', action='store_true', help='Use the separately saved private pilot configuration; requires --run')
    parser.add_argument('--viewer', action='store_true', help='Wait for a private silent viewer before starting the single pilot')
    args = parser.parse_args()
    if args.viewer and not args.run:
        parser.error('--viewer requires an explicit --run')
    if args.keychain and not args.run:
        parser.error('--keychain requires an explicit --run')
    audio = inspect_driver()
    if args.sdk_child:
        for name in ('WISP_PILOT_CLAIM_FILE', 'WISP_PILOT_DONE_FILE'):
            if not os.environ.get(name):
                parser.error('SDK child requires the supervised launcher')
        from livekit.agents import cli
        sys.argv = [sys.argv[0], 'connect', '--room', os.environ['WISP_PILOT_ROOM_NAME'], '--log-level', 'error']
        cli.run_app(create_server())
        return
    if not args.run:
        print(json.dumps({'mode': 'offline-preflight', 'audio': audio,
                          'providerMaxSeconds': PROVIDER_SECONDS, 'bodyMaxSeconds': BODY_SECONDS,
                          'inputs': {'microphone': False, 'camera': False, 'text': False},
                          'workerStarted': False, 'sessionCreated': False}))
        return
    if args.keychain:
        from private_setup import load_private
        os.environ.update(load_private())
    missing = [name for name in (*REQUIRED, 'WISP_PILOT_ROOM_NAME') if not os.environ.get(name)]
    if missing:
        parser.error('Private configuration missing: ' + ', '.join(missing))
    OneShotGate(os.environ['WISP_PILOT_ROOM_NAME'])
    from supervisor import supervise
    from contextlib import nullcontext
    from viewer_server import ViewerServer, viewer_token
    viewer_context = ViewerServer(lambda: {'url': os.environ['LIVEKIT_URL'],
                                          'token': viewer_token(os.environ)}) if args.viewer else nullcontext(None)
    with viewer_context as viewer, tempfile.TemporaryDirectory(prefix='wisp-pilot-') as directory:
        if viewer:
            print('Open this local-only silent viewer and connect within60seconds: '+viewer.origin+'/', flush=True)
            if not viewer.wait_ready(timeout=60):
                print('Viewer not connected. No worker or provider session started.')
                return
        env = dict(os.environ)
        env['WISP_PILOT_CLAIM_FILE'] = str(Path(directory) / 'claimed')
        env['WISP_PILOT_DONE_FILE'] = str(Path(directory) / 'done')
        result = supervise([sys.executable, str(Path(__file__).resolve()), '--sdk-child'],
                           env=env, done_file=env['WISP_PILOT_DONE_FILE'],
                           stop_event=viewer.stop_requested if viewer else None)
        print(json.dumps({'localSupervisor': result, 'remoteCancellationVerified': False}))


if __name__ == '__main__':
    main()

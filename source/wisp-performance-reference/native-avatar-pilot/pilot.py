"""Isolated synthetic-audio pilot. Default invocation is offline and starts no worker."""
import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path
import sys
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


def create_server():
    from livekit import rtc
    from livekit.agents import Agent, AgentServer, AgentSession, APIConnectOptions, room_io
    from livekit.plugins import runway
    server = AgentServer()

    @server.rtc_session(agent_name='wisp-synthetic-visual-pilot')
    async def entrypoint(ctx):
        inspect_driver()
        session = AgentSession()  # No STT, LLM, TTS or user input is configured.
        avatar = runway.AvatarSession(
            avatar_id=os.environ['WISP_RUNWAY_AVATAR_ID'], max_duration=PROVIDER_SECONDS,
            conn_options=APIConnectOptions(max_retry=0, timeout=10),
        )
        options = room_io.RoomOptions(audio_input=False, video_input=False, text_input=False,
                                      text_output=False, close_on_disconnect=True)
        events = await bounded_pilot(session, avatar, ctx.room,
            agent=Agent(instructions='Synthetic audio visual compatibility pilot only.'),
            options=options, frames=audio_frames(rtc.AudioFrame))
        # Only bounded lifecycle labels; never tokens, request bodies or visitor data.
        print(json.dumps({'pilotEvents': events}))
        ctx.shutdown(reason='Synthetic pilot complete')
    return server


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run', action='store_true', help='Reserved: live execution remains disabled until isolated dispatch is verified')
    args, sdk_args = parser.parse_known_args()
    audio = inspect_driver()
    if not args.run:
        print(json.dumps({'mode': 'offline-preflight', 'audio': audio,
                          'providerMaxSeconds': PROVIDER_SECONDS, 'bodyMaxSeconds': BODY_SECONDS,
                          'inputs': {'microphone': False, 'camera': False, 'text': False},
                          'workerStarted': False, 'sessionCreated': False}))
        return
    parser.error('Live execution is disabled: dedicated-room dispatch and worker termination must be verified first. Offline preflight remains available.')


if __name__ == '__main__':
    main()

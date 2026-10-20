"""Offline lifecycle checks; no provider imports, network or credentials."""
import asyncio
import unittest
import tempfile
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
import pilot


class Lifecycle(unittest.IsolatedAsyncioTestCase):
    async def exercise(self, fail_start=False, hang=False, fail_close=False):
        calls = []
        async def start(*args, **kwargs):
            if fail_start:
                raise RuntimeError('synthetic start failure')
            if hang:
                await asyncio.sleep(10)
        def closer(name, fail=False):
            async def close():
                calls.append(name)
                if fail:
                    raise RuntimeError('synthetic cleanup failure')
            return close
        speech = SimpleNamespace(wait_for_playout=AsyncMock())
        session = SimpleNamespace(start=AsyncMock(), say=lambda *a, **k: speech,
                                  aclose=closer('session'))
        avatar = SimpleNamespace(start=start, aclose=closer('avatar', fail_close))
        room = SimpleNamespace(disconnect=closer('room'))
        try:
            events = await pilot.bounded_pilot(session, avatar, room, agent=object(),
                options=object(), frames=None, body_seconds=.02, settle_seconds=0,
                cleanup_seconds=.02)
            return events, calls, session
        finally:
            self.assertEqual(calls, ['avatar', 'session', 'room'])

    async def test_normal_closes_every_resource(self):
        events, calls, session = await self.exercise()
        self.assertIn('fictional-audio-finished', events)
        self.assertEqual(events[-3:], ['avatar-closed', 'session-closed', 'room-closed'])
        self.assertFalse(session.start.call_args.kwargs['record'])
        self.assertFalse(session.start.call_args.kwargs['session_host'])

    async def test_start_failure_still_cleans_up(self):
        with self.assertRaises(RuntimeError):
            await self.exercise(fail_start=True)

    async def test_timeout_still_cleans_up(self):
        with self.assertRaises(asyncio.TimeoutError):
            await self.exercise(hang=True)

    async def test_cleanup_failure_does_not_skip_remaining(self):
        events, calls, session = await self.exercise(fail_close=True)
        self.assertIn('avatar-cleanup-failed', events)
        self.assertEqual(events[-2:], ['session-closed', 'room-closed'])

    async def test_audio_frames_are_complete_pcm_frames(self):
        frames = [frame async for frame in pilot.audio_frames(lambda data, **kw: (data, kw))]
        self.assertTrue(frames)
        self.assertTrue(all(len(data) == 960 for data, kw in frames))
        self.assertTrue(all(kw['sample_rate'] == 24000 for data, kw in frames))

    async def test_stalled_cleanup_does_not_skip_remaining(self):
        calls = []
        async def stuck():
            calls.append('avatar')
            await asyncio.sleep(10)
        async def session_close():
            calls.append('session')
        async def room_close():
            calls.append('room')
        speech = SimpleNamespace(wait_for_playout=AsyncMock())
        session = SimpleNamespace(start=AsyncMock(), say=lambda *a, **k: speech,
                                  aclose=session_close)
        avatar = SimpleNamespace(start=AsyncMock(), aclose=stuck)
        room = SimpleNamespace(disconnect=room_close)
        events = await pilot.bounded_pilot(session, avatar, room, agent=None,
            options=None, frames=None, body_seconds=.1, settle_seconds=0,
            cleanup_seconds=.01)
        self.assertEqual(calls, ['avatar', 'session', 'room'])
        self.assertEqual(events[-3:], ['avatar-cleanup-failed', 'session-closed', 'room-closed'])


class Dispatch(unittest.TestCase):
    def test_wrong_room_does_not_consume_single_job(self):
        gate = pilot.OneShotGate('wisp-pilot-offline')
        with self.assertRaises(ValueError):
            gate.claim('real-show-room')
        gate.claim('wisp-pilot-offline')
        with self.assertRaises(RuntimeError):
            gate.claim('wisp-pilot-offline')

    def test_shared_claim_rejects_second_independent_gate(self):
        with tempfile.TemporaryDirectory() as directory:
            claim = str(Path(directory) / 'claimed')
            first = pilot.OneShotGate('wisp-pilot-offline', claim)
            second = pilot.OneShotGate('wisp-pilot-offline', claim)
            first.claim('wisp-pilot-offline')
            with self.assertRaises(RuntimeError):
                second.claim('wisp-pilot-offline')

    def test_missing_or_show_room_rejected(self):
        for room in (None, '', 'real-show-room'):
            with self.assertRaises(ValueError):
                pilot.OneShotGate(room)


if __name__ == '__main__':
    unittest.main()

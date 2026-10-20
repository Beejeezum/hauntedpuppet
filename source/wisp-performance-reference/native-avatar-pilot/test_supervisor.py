"""Real local subprocess checks; no SDK/network/provider credentials."""
import os
from pathlib import Path
import sys
import tempfile
import time
import unittest
from supervisor import supervise


@unittest.skipUnless(os.name == 'posix', 'POSIX process group test')
class Supervisor(unittest.TestCase):
    def test_normal_exit(self):
        result = supervise([sys.executable, '-c', 'pass'], wall_seconds=2, grace_seconds=.05)
        self.assertEqual(result['returnCode'], 0)
        self.assertFalse(result['timedOut'])

    def test_failure_exit(self):
        result = supervise([sys.executable, '-c', 'raise SystemExit(7)'], wall_seconds=2, grace_seconds=.05)
        self.assertEqual(result['returnCode'], 7)

    def test_ignoring_term_cannot_outlive_deadline(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = Path(directory) / 'should-not-exist'
            script = ('import signal,time,pathlib;signal.signal(signal.SIGTERM, signal.SIG_IGN);'
                      f'time.sleep(.7);pathlib.Path({str(marker)!r}).touch()')
            result = supervise([sys.executable, '-c', script], wall_seconds=.15, grace_seconds=.05)
            self.assertTrue(result['timedOut'])
            self.assertLess(result['elapsedSeconds'], .6)
            time.sleep(.75)
            self.assertFalse(marker.exists())

    def test_descendant_stopped_when_root_exits(self):
        with tempfile.TemporaryDirectory() as directory:
            marker = Path(directory) / 'should-not-exist'
            child = f'import time,pathlib;time.sleep(.7);pathlib.Path({str(marker)!r}).touch()'
            root = f'import subprocess,sys;subprocess.Popen([sys.executable,"-c",{child!r}])'
            result = supervise([sys.executable, '-c', root], wall_seconds=2, grace_seconds=.05)
            self.assertEqual(result['returnCode'], 0)
            time.sleep(.75)
            self.assertFalse(marker.exists())

    def test_completion_signal_stops_worker_before_deadline(self):
        with tempfile.TemporaryDirectory() as directory:
            done = str(Path(directory) / 'done')
            script = f'import pathlib,time;pathlib.Path({done!r}).touch();time.sleep(10)'
            result = supervise([sys.executable, '-c', script], wall_seconds=2,
                               grace_seconds=.05, done_file=done)
            self.assertTrue(result['completionSignal'])
            self.assertFalse(result['timedOut'])
            self.assertLess(result['elapsedSeconds'], 1)

    def test_cannot_increase_cap(self):
        with self.assertRaises(ValueError):
            supervise([sys.executable, '-c', 'pass'], wall_seconds=36)


if __name__ == '__main__':
    unittest.main()

"""Actual SDK registration and process transfer, without executing a job/network."""
import importlib.util
import multiprocessing as mp
from multiprocessing.reduction import ForkingPickler
import unittest
from unittest.mock import patch
import os
import pilot


def inspect_in_child(entrypoint, connection):
    connection.send((entrypoint.__module__, entrypoint.__qualname__))
    connection.close()


@unittest.skipUnless(importlib.util.find_spec('livekit'), 'Isolated SDK environment required')
class WorkerEntrypoint(unittest.TestCase):
    def test_actual_sdk_registered_entrypoint_can_be_serialized(self):
        with patch.dict(os.environ, {'WISP_PILOT_ROOM_NAME':'wisp-pilot-synthetic'}):
            server = pilot.create_server()
        restored = ForkingPickler.loads(ForkingPickler.dumps(server._entrypoint_fnc))
        self.assertIs(restored, pilot.pilot_entrypoint)

    def test_entrypoint_transfers_to_spawned_job_process(self):
        for name in ('spawn', 'forkserver'):
            if name not in mp.get_all_start_methods():
                continue
            context = mp.get_context(name)
            receiver, sender = context.Pipe(duplex=False)
            process = context.Process(target=inspect_in_child, args=(pilot.pilot_entrypoint, sender))
            try:
                process.start()
                sender.close()
                self.assertTrue(receiver.poll(5), name+' did not return')
                self.assertEqual(receiver.recv(), ('pilot','pilot_entrypoint'))
                process.join(5)
                self.assertEqual(process.exitcode, 0)
            finally:
                if process.pid and process.is_alive():
                    process.terminate();process.join(2)
                    if process.is_alive():
                        process.kill();process.join(2)
                receiver.close();sender.close()


if __name__ == '__main__':
    unittest.main()

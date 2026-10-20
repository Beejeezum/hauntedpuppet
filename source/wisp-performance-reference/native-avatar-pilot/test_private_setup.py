"""Synthetic configuration only. Never opens Keychain or reads a real credential."""
import json
import unittest
from unittest.mock import Mock, patch
import private_setup as setup


class PrivateSetup(unittest.TestCase):
    def values(self):
        return dict(zip(setup.FIELDS, ['synthetic-runway-secret', 'wss://pilot.example.test',
                                     'synthetic-api-key', 'synthetic-livekit-secret', 'synthetic-avatar']))

    def test_round_trip_uses_only_explicit_store_and_fresh_rooms(self):
        store = Mock()
        with patch.object(setup, 'keychain', side_effect=AssertionError('No real Keychain')):
            setup.save_private(self.values(), store)
            store.load.return_value = store.save.call_args.args[0]
            self.assertEqual(json.loads(store.load.return_value), self.values())
            first, second = setup.load_private(store), setup.load_private(store)
        self.assertNotEqual(first['WISP_PILOT_ROOM_NAME'], second['WISP_PILOT_ROOM_NAME'])
        self.assertTrue(first['WISP_PILOT_ROOM_NAME'].startswith('wisp-pilot-'))

    def test_invalid_configuration_never_writes(self):
        for url in ['ws://example.test', 'wss://user:secret@example.test', 'wss://example.test?token=secret']:
            values = {**self.values(), 'LIVEKIT_URL': url}
            store = Mock()
            with self.assertRaises(ValueError):
                setup.save_private(values, store)
            store.save.assert_not_called()

    def test_missing_extra_and_whitespace_rejected(self):
        for values in [{}, {**self.values(), 'OPENAI_API_KEY': 'wrong-provider'},
                       {**self.values(), 'RUNWAYML_API_SECRET': 'secret with whitespace'}]:
            with self.assertRaises(ValueError):
                setup.validate(values)

    def test_no_saved_value_does_not_fall_back_to_openai(self):
        store = Mock(); store.load.return_value = None
        with self.assertRaisesRegex(ValueError, 'OpenAI setup is separate'):
            setup.load_private(store)

    def test_errors_never_echo_stored_secret(self):
        store = Mock(); store.load.return_value = 'SYNTHETIC-SENSITIVE-INVALID-JSON'
        with self.assertRaises(ValueError) as caught:
            setup.load_private(store)
        self.assertNotIn(store.load.return_value, str(caught.exception))


if __name__ == '__main__':
    unittest.main()

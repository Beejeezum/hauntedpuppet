"""User-run private setup; separate Keychain service, no credential files or argv."""
import getpass
import json
from pathlib import Path
import sys
from urllib.parse import urlparse
import uuid

SERVICE = 'com.beejeezum.hauntedpuppet.native-avatar-pilot'
FIELDS = ('RUNWAYML_API_SECRET', 'LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'WISP_RUNWAY_AVATAR_ID')


def validate(values):
    if not isinstance(values, dict) or set(values) != set(FIELDS):
        raise ValueError('Pilot configuration must contain exactly the five documented fields')
    clean = {}
    for name in FIELDS:
        value = values[name]
        if not isinstance(value, str) or not value or any(c.isspace() for c in value):
            raise ValueError('Invalid private field: ' + name)
        if name.endswith('SECRET') and len(value) < 16:
            raise ValueError('Private secret is too short: ' + name)
        clean[name] = value
    url = urlparse(clean['LIVEKIT_URL'])
    if url.scheme != 'wss' or not url.hostname or url.username or url.password or url.query or url.fragment:
        raise ValueError('LIVEKIT_URL must be a secure WebSocket address without credentials or query data')
    encoded = json.dumps(clean, separators=(',', ':'))
    if len(encoded) > 1024:
        raise ValueError('Private configuration exceeds the isolated Keychain entry limit')
    return clean


def keychain():
    # Importing this module does not open Keychain. Only explicit save/load does.
    sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
    from credential_store import Keychain

    class PilotKeychain(Keychain):
        def dictionary(self, values):
            if 'kSecAttrLabel' in values:
                values = {**values, 'kSecAttrLabel': 'Haunted Puppet native avatar pilot'}
            return super().dictionary(values)
    return PilotKeychain(service=SERVICE)


def save_private(values, store=None):
    clean = validate(values)
    (store if store is not None else keychain()).save(json.dumps(clean, separators=(',', ':')))


def load_private(store=None):
    encoded = (store if store is not None else keychain()).load()
    if not encoded:
        raise ValueError('No native-avatar pilot configuration saved; existing OpenAI setup is separate')
    try:
        values = json.loads(encoded)
    except (ValueError, TypeError):
        raise ValueError('Saved pilot configuration is invalid; repeat private setup') from None
    clean = validate(values)
    # A fresh disposable room for each explicitly started pilot, not a show room.
    return {**clean, 'WISP_PILOT_ROOM_NAME': 'wisp-pilot-' + uuid.uuid4().hex[:12]}


def main():
    print('Native avatar pilot only. Existing OpenAI credentials stay separate. Inputs are hidden.')
    values = {name: getpass.getpass(name + ': ') for name in FIELDS}
    save_private(values)
    print('Saved in the separate macOS Keychain entry. No provider session was started.')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, EOFError, KeyboardInterrupt):
        print('Setup not completed. No provider session was started.', file=sys.stderr)
        raise SystemExit(1)

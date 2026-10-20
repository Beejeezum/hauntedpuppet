import json
import unittest
from unittest.mock import patch
import public_workspace


class PublicWorkspace(unittest.TestCase):
    def test_range_requests(self):
        self.assertIsNone(public_workspace.byte_range(None, 100))
        for header, result in (('bytes=0-1', (0, 1)), ('bytes=10-', (10, 99)),
                               ('bytes=-10', (90, 99)), ('bytes=90-500', (90, 99)),
                               ('bytes=-500', (0, 99))):
            self.assertEqual(public_workspace.byte_range(header, 100), result)
        for header in ('bytes=100-', 'bytes=9-2', 'bytes=-0', 'bytes=-', 'bytes=0-1,5-9', 'garbage'):
            with self.subTest(header=header), self.assertRaises(ValueError):
                public_workspace.byte_range(header, 100)

    def test_all_published_assets_match_build(self):
        for prefix, name in public_workspace.WORKSPACES.items():
            manifest = json.loads((public_workspace.ROOT / 'scripts' / name).read_text())
            for item in manifest['files']:
                with self.subTest(asset=prefix + item['destination']):
                    data, mime = public_workspace.asset(prefix + item['destination'])
                    self.assertEqual(public_workspace.hashlib.sha256(data).hexdigest(),
                                     item.get('publishedSha256', item['sha256']))
                    self.assertTrue(mime)

    def test_unknown_and_private_paths_are_not_exposed(self):
        self.assertIsNone(public_workspace.asset('/server.py'))
        for name in ('../server.py', 'source/server.py', 'unknown.mp4'):
            with self.assertRaises(FileNotFoundError):
                public_workspace.asset('/assets/wisp-showdesk/' + name)

    def test_manifest_cannot_publish_private_source(self):
        for source in ('server.py', 'source/wisp-performance-reference/ambient-show/../../../server.py'):
            with self.subTest(source=source), patch.object(public_workspace.json, 'loads', return_value={
                    'files': [{'source': source, 'destination': 'leak.js'}]}):
                with self.assertRaises(FileNotFoundError):
                    public_workspace.asset('/assets/wisp-showdesk/leak.js')

    def test_changed_bytes_fail_closed(self):
        with patch.object(public_workspace.json, 'loads', return_value={
                'files': [{'source': 'source/wisp-performance-reference/ambient-show/showdesk.css',
                           'destination': 'changed.css', 'bytes': 1, 'sha256': '0' * 64}]}):
            with self.assertRaises(ValueError):
                public_workspace.asset('/assets/wisp-showdesk/changed.css')

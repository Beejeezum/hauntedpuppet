import json
import unittest
import tempfile
from pathlib import Path
from contextlib import contextmanager
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

    def test_compiled_library_is_available_on_local_workspace(self):
        data, mime = public_workspace.asset('/assets/wisp-showdesk/playback-library.json')
        self.assertEqual(mime, 'application/json')
        self.assertEqual(json.loads(data)['schema'], 1)
        publication, _ = public_workspace.asset('/assets/wisp-showdesk/approved-publication.json')
        self.assertEqual(json.loads(data), json.loads(publication)['runtime'])

    @contextmanager
    def compiled_fixture(self):
        # Synthetic publication fixture tests serving policy, not movie/visual approval.
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            folder = root / 'source/wisp-performance-reference/ambient-show'
            folder.mkdir(parents=True)
            (root / 'scripts').mkdir()
            catalog = folder / 'catalog.json'
            catalog.write_bytes(b'{"clips":[]}')
            movie = folder / 'fixture.mp4'
            movie.write_bytes(b'synthetic movie bytes, no decode claim')
            sha = public_workspace.hashlib.sha256(movie.read_bytes()).hexdigest()
            name = 'fixture-' + sha[:12] + '.mp4'
            descriptor = {'schema': 1, 'catalogSha256': public_workspace.hashlib.sha256(catalog.read_bytes()).hexdigest(),
                          'runtime': {'schema': 1, 'clips': [], 'routes': []},
                          'files': [{'source': str(movie.relative_to(root)), 'destination': name, 'sha256': sha}]}
            source = folder / 'approved-publication.json'
            source.write_text(json.dumps(descriptor))
            digest = public_workspace.hashlib.sha256(source.read_bytes()).hexdigest()
            (root / 'scripts/public-showdesk.json').write_text(json.dumps({'files': [{
                'source': str(source.relative_to(root)), 'destination': 'approved-publication.json',
                'bytes': source.stat().st_size, 'sha256': digest, 'publishedSha256': digest}]}))
            with patch.object(public_workspace, 'ROOT', root):
                yield catalog, movie, name

    def test_changed_catalog_requires_new_compiler_export(self):
        with self.compiled_fixture() as (catalog, _, __):
            catalog.write_text('{"clips":[],"changed":true}')
            with self.assertRaisesRegex(ValueError, 'stale'):
                public_workspace.asset('/assets/wisp-showdesk/playback-library.json')

    def test_approved_media_requires_exact_bytes_and_listed_name(self):
        with self.compiled_fixture() as (_, movie, name):
            data, mime = public_workspace.asset('/assets/wisp-showdesk/' + name)
            self.assertEqual(data, movie.read_bytes())
            self.assertEqual(mime, 'video/mp4')
            with self.assertRaises(FileNotFoundError):
                public_workspace.asset('/assets/wisp-showdesk/unknown-0123456789ab.mp4')
            movie.write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError, 'checksum'):
                public_workspace.asset('/assets/wisp-showdesk/' + name)

    def test_unknown_and_private_paths_are_not_exposed(self):
        self.assertIsNone(public_workspace.asset('/server.py'))
        for prefix in public_workspace.WORKSPACES:
            for name in ('../server.py', 'source/server.py', 'unknown.mp4'):
                with self.subTest(prefix=prefix, name=name), self.assertRaises(FileNotFoundError):
                    public_workspace.asset(prefix + name)

    def test_manifest_cannot_publish_private_source(self):
        for source in ('server.py', 'source/wisp-performance-reference/ambient-show/../../../server.py'):
            with self.subTest(source=source), patch.object(public_workspace.json, 'loads', return_value={
                    'files': [{'source': source, 'destination': 'leak.js'}]}):
                with self.assertRaises(FileNotFoundError):
                    public_workspace.asset('/assets/wisp-showdesk/leak.js')

    def test_mouth_and_cue_previews_are_explicit_workspaces(self):
        self.assertEqual(public_workspace.WORKSPACES['/assets/wisp-mouth-study/'], 'public-mouth-study.json')
        self.assertEqual(public_workspace.WORKSPACES['/assets/wisp-cue-review/'], 'public-cue-review.json')
        for prefix in public_workspace.WORKSPACES:
            for source in ('server.py', 'source/wisp-art-reference/painted-speech-study/../../../server.py'):
                with self.subTest(prefix=prefix, source=source), patch.object(public_workspace.json, 'loads', return_value={
                        'files': [{'source': source, 'destination': 'leak.js'}]}):
                    with self.assertRaises(FileNotFoundError):
                        public_workspace.asset(prefix + 'leak.js')

    def test_changed_bytes_fail_closed(self):
        with patch.object(public_workspace.json, 'loads', return_value={
                'files': [{'source': 'source/wisp-performance-reference/ambient-show/showdesk.css',
                           'destination': 'changed.css', 'bytes': 1, 'sha256': '0' * 64}]}):
            with self.assertRaises(ValueError):
                public_workspace.asset('/assets/wisp-showdesk/changed.css')

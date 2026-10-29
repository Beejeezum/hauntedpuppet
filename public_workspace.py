"""Serve only the same explicitly checksummed film assets as the public build."""
from pathlib import Path
import hashlib
import json
import mimetypes
import re

ROOT = Path(__file__).resolve().parent
WORKSPACES = {
    '/assets/wisp-showdesk/': 'public-showdesk.json',
    '/assets/wisp-film-preview/': 'public-film-preview.json',
    '/assets/wisp-tonight/': 'public-tonight-demo.json',
    '/assets/wisp-mouth-study/': 'public-mouth-study.json',
    '/assets/wisp-cue-review/': 'public-cue-review.json',
}


SOURCE_ROOTS = {
    'public-showdesk.json': ('source/wisp-performance-reference/ambient-show/', 'source/wisp-performance-reference/runway-pilots/', 'source/wisp-performance-reference/button-cue-batch/'),
    'public-film-preview.json': ('source/wisp-performance-reference/runway-pilots/',),
    'public-tonight-demo.json': ('source/wisp-performance-reference/tonight-demo/',),
    'public-mouth-study.json': ('source/wisp-art-reference/painted-speech-study/',),
    'public-cue-review.json': ('source/wisp-performance-reference/button-cue-batch/',),
}


def byte_range(header, size):
    """Return an inclusive single byte range; reject malformed or unsatisfiable ranges."""
    if header is None:
        return None
    match = re.fullmatch(r'bytes=(\d*)-(\d*)', header)
    if not match or not any(match.groups()) or size <= 0:
        raise ValueError('Invalid range')
    first, last = match.groups()
    if first:
        start, end = int(first), min(int(last), size - 1) if last else size - 1
    else:
        suffix = int(last)
        if suffix <= 0:
            raise ValueError('Invalid range')
        start, end = max(0, size - suffix), size - 1
    if start > end or start >= size:
        raise ValueError('Unsatisfiable range')
    return start, end


def approved_asset(name):
    """Use the compiler's checksummed export; no Node process or private source route."""
    descriptor, _ = asset('/assets/wisp-showdesk/approved-publication.json')
    publication = json.loads(descriptor)
    catalog = ROOT / 'source/wisp-performance-reference/ambient-show/catalog.json'
    if (publication.get('schema') != 1 or
            hashlib.sha256(catalog.read_bytes()).hexdigest() != publication.get('catalogSha256')):
        raise ValueError('Approved catalog export is stale')
    if name == 'playback-library.json':
        return (json.dumps(publication['runtime'], ensure_ascii=False, indent=2) + '\n').encode(), 'application/json'
    item = next((f for f in publication['files'] if f['destination'] == name), None)
    if item is None:
        raise FileNotFoundError('Unknown approved film')
    source = (ROOT / item['source']).resolve()
    folder = (ROOT / 'source/wisp-performance-reference').resolve()
    if folder not in source.parents or source.suffix != '.mp4':
        raise FileNotFoundError('Invalid approved film source')
    data = source.read_bytes()
    if hashlib.sha256(data).hexdigest() != item['sha256']:
        raise ValueError('Approved film checksum mismatch')
    return data, 'video/mp4'


def asset(path):
    if path.startswith('/assets/wisp-showdesk/'):
        name = path[len('/assets/wisp-showdesk/'):]
        if name == 'playback-library.json' or re.fullmatch(r'[a-z0-9][a-z0-9-]*-[a-f0-9]{12}\.mp4', name):
            return approved_asset(name)
    for prefix, manifest_name in WORKSPACES.items():
        if not path.startswith(prefix):
            continue
        name = path[len(prefix):]
        if not name or Path(name).name != name:
            raise FileNotFoundError('Unknown workspace asset')
        manifest = json.loads((ROOT / 'scripts' / manifest_name).read_text())
        item = next((f for f in manifest['files'] if f['destination'] == name), None)
        if item is None:
            raise FileNotFoundError('Unknown workspace asset')
        folders = SOURCE_ROOTS[manifest_name]
        if not item['source'].startswith(folders):
            raise FileNotFoundError('Invalid workspace source')
        source = (ROOT / item['source']).resolve()
        roots = [ROOT / folder for folder in folders]
        if not any(folder.resolve() in source.parents for folder in roots):
            raise FileNotFoundError('Invalid workspace asset')
        data = source.read_bytes()
        digest = lambda value: hashlib.sha256(value).hexdigest()
        if len(data) != item['bytes'] or digest(data) != item['sha256']:
            raise ValueError('Workspace source checksum mismatch')
        if item.get('rewrites'):
            text = data.decode('utf-8')
            for rewrite in item['rewrites']:
                if text.count(rewrite['from']) != 1:
                    raise ValueError('Ambiguous workspace rewrite')
                text = text.replace(rewrite['from'], rewrite['to'])
            data = text.encode('utf-8')
        if digest(data) != item.get('publishedSha256', item['sha256']):
            raise ValueError('Workspace publication checksum mismatch')
        mime = 'text/javascript' if name.endswith(('.js', '.mjs')) else mimetypes.guess_type(name)[0]
        return data, mime or 'application/octet-stream'
    return None

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


def asset(path):
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
        allowed = (r'^source/wisp-performance-reference/(ambient-show|runway-pilots)/'
                   if manifest_name == 'public-showdesk.json' else
                   r'^source/wisp-performance-reference/runway-pilots/')
        if not re.match(allowed, item['source']):
            raise FileNotFoundError('Invalid workspace source')
        source = (ROOT / item['source']).resolve()
        folders = ('ambient-show', 'runway-pilots') if manifest_name == 'public-showdesk.json' else ('runway-pilots',)
        roots = [ROOT / 'source' / 'wisp-performance-reference' / folder for folder in folders]
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

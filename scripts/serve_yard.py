#!/usr/bin/env python3
"""Private yard console + existing local voice API. No credentials in static files."""
from pathlib import Path
import os
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault('HAUNT_3D_PORT', '8902')
import server

CONSOLE = ROOT / 'source/attraction-v2/console'
EXTRA = {
    'assets/projection-mapping.js', 'assets/spirit-atmosphere.js',
    'assets/spirit-effects/manifest.json', 'assets/spirit-effects/vapor-atlas.png',
    'source/wisp-performance-reference/ambient-show/pcm-voice.mjs',
    'source/wisp-performance-reference/ambient-show/single-movie-study/finite-cues/finite-player.mjs',
    'source/wisp-performance-reference/runway-pilots/wisp-film-output.js',
}
SUFFIXES = {'.html', '.css', '.js', '.mjs', '.json', '.mp4', '.png', '.svg', '.woff2'}

def yard_file(path):
    """Serve the bounded console package and its seven reviewed shared dependencies."""
    if path == '/':
        path = '/source/attraction-v2/console/index.html'
    elif path == '/source/attraction-v2/console/':
        path += 'index.html'
    candidate = (ROOT / path.lstrip('/')).resolve()
    if ROOT not in candidate.parents:
        return None
    if candidate.is_file() and candidate.suffix in SUFFIXES and (
        CONSOLE.resolve() in candidate.parents or candidate.relative_to(ROOT).as_posix() in EXTRA
    ):
        return candidate
    return None

class YardHandler(server.Handler):
    def reply(self, code, data):
        if code == 200 and urlsplit(self.path).path == '/api/status' and isinstance(data, dict):
            data = {**data, 'yardPhone': True}
        return super().reply(code, data)

    def serve_yard(self, head=False):
        if not self.allowed():
            self.send_error(403)
            return True
        path = unquote(urlsplit(self.path).path)
        file = yard_file(path)
        if file is None:
            return False
        self.path = '/' + file.relative_to(ROOT).as_posix()
        # SimpleHTTPRequestHandler supplies Last-Modified and correct module/media MIME.
        if head:
            return super(server.Handler, self).do_HEAD() or True
        return super(server.Handler, self).do_GET() or True

    def do_GET(self):
        if not self.serve_yard():
            super().do_GET()

    def do_HEAD(self):
        if not self.serve_yard(head=True):
            super().do_HEAD()

if __name__ == '__main__':
    server.restore_credentials()
    server.realtime_voice.start_janitor()
    print(f'Wisp yard voice console: http://127.0.0.1:{server.PORT}/source/attraction-v2/console/', flush=True)
    server.ThreadingHTTPServer(('127.0.0.1', server.PORT), YardHandler).serve_forever()

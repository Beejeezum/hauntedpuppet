"""Ephemeral loopback-only visual receiver. No credentials in HTML, URL or logs."""
from datetime import timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import threading
import time
from urllib.parse import urlsplit

ROOT = Path(__file__).with_name('viewer')
FILES = {'/': ('index.html', 'text/html'), '/viewer.js': ('viewer.js', 'text/javascript'),
         '/vendor/livekit-client.umd.js': ('vendor/livekit-client.umd.js', 'text/javascript')}


def viewer_token(values):
    from livekit import api
    room = values['WISP_PILOT_ROOM_NAME']
    if not room.startswith('wisp-pilot-'):
        raise ValueError('A dedicated pilot room is required')
    return (api.AccessToken(values['LIVEKIT_API_KEY'], values['LIVEKIT_API_SECRET'])
            .with_identity('wisp-visual-reviewer').with_ttl(timedelta(seconds=45))
            .with_grants(api.VideoGrants(room_join=True, room=room, can_publish=False,
                         can_publish_data=False, can_subscribe=True, can_update_own_metadata=False))
            .to_jwt())


class ViewerServer:
    def __init__(self, connection):
        self.connection = connection
        self.ready = threading.Event()
        self.stop_requested = threading.Event()
        self.issued = False
        self.issue_lock = threading.Lock()
        owner = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def respond(self, code, body=b'', content_type='text/plain'):
                self.send_response(code)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(body)))
                self.send_header('Cache-Control', 'no-store')
                self.send_header('Referrer-Policy', 'no-referrer')
                self.send_header('X-Frame-Options', 'DENY')
                self.send_header('Permissions-Policy', 'camera=(), microphone=()')
                self.send_header('X-Content-Type-Options', 'nosniff')
                self.send_header('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self' wss: https:; media-src blob:; frame-ancestors 'none'")
                self.end_headers()
                self.wfile.write(body)

            def trusted(self):
                return (self.headers.get('Host') == owner.host and
                        self.headers.get('Origin', owner.origin) == owner.origin and
                        not urlsplit(self.path).query)

            def do_GET(self):
                if not self.trusted():
                    return self.respond(403)
                item = FILES.get(self.path)
                if not item:
                    return self.respond(404)
                name, content_type = item
                return self.respond(200, (ROOT / name).read_bytes(), content_type)

            def do_POST(self):
                if not self.trusted():
                    return self.respond(403)
                if self.path == '/connect':
                    with owner.issue_lock:
                        if owner.stop_requested.is_set():
                            return self.respond(410)
                        if owner.issued:
                            return self.respond(409)
                        owner.issued = True
                    try:
                        data = json.dumps(owner.connection()).encode()
                    except Exception:
                        return self.respond(503)
                    return self.respond(200, data, 'application/json')
                if self.path == '/stop':
                    owner.stop_requested.set()
                    return self.respond(204)
                if self.path == '/ready' and owner.issued:
                    owner.ready.set()
                    return self.respond(204)
                return self.respond(404)

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.host = '127.0.0.1:' + str(self.server.server_port)
        self.origin = 'http://' + self.host
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)

    def wait_ready(self, timeout=60):
        deadline = time.monotonic() + min(60, max(0, timeout))
        while not self.stop_requested.is_set() and time.monotonic() < deadline:
            if self.ready.wait(timeout=min(.1, max(0, deadline-time.monotonic()))):
                return not self.stop_requested.is_set()
        return False

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *args):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

"""Isolated real phone transport + synthetic speech. Never loads keys or binds LAN."""
import base64
import io
import json
from pathlib import Path
import signal
import sys
import threading
import time
import wave

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from scripts.serve_yard import YardHandler, server
import phone_bridge
from phone_remote.phone_server import create_server

phone_bridge.create_server = lambda *_: create_server('127.0.0.1', 0)
phone_bridge._links = lambda service: [f'http://127.0.0.1:{service.server_port}/']
metrics = {'providerRequests': 0, 'delay': 0, 'fail': False}
audio = io.BytesIO()
with wave.open(audio, 'wb') as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(24000)
    wav.writeframes(b'\0' * 24000 * 2 * 2)
pcm = base64.b64encode(audio.getvalue()).decode()

class Fixture(YardHandler):
    def do_GET(self):
        if self.path == '/api/status':
            return self.reply(200, {'configured': True, 'token': server.TOKEN, 'mode': 'direct'})
        if self.path == '/test/metrics':
            return self.reply(200, metrics)
        return super().do_GET()

    def do_POST(self):
        if self.path == '/test/settings':
            data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            metrics.update({k: data[k] for k in ('delay', 'fail') if k in data})
            return self.reply(200, {'ok': True})
        if self.path == '/api/performance':
            if not self.allowed() or self.headers.get('X-Haunt-Token') != server.TOKEN:
                return self.reply(403, {'error': 'Invalid fixture request'})
            data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            assert set(data) <= {'provider', 'voice', 'mood', 'intensity', 'speed', 'instructions', 'text'}
            metrics['providerRequests'] += 1
            time.sleep(metrics['delay'])
            try:
                return self.reply(503 if metrics['fail'] else 200, {'error': 'Synthetic failure'} if metrics['fail'] else {'audio': pcm})
            except (BrokenPipeError, ConnectionResetError):
                return
        return super().do_POST()

httpd = server.ThreadingHTTPServer(('127.0.0.1', 0), Fixture)
server.PORT = httpd.server_port
def stop(*_):
    threading.Thread(target=httpd.shutdown, daemon=True).start()
signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)
print(json.dumps({'base': f'http://127.0.0.1:{server.PORT}'}), flush=True)
try:
    httpd.serve_forever()
finally:
    phone_bridge.disable()
    httpd.server_close()

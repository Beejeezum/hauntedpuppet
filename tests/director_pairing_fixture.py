"""Own loopback-only integration services; never load Keychain/provider credentials."""
import json,os,signal
os.environ.pop('OPENAI_API_KEY',None)
import server,phone_bridge
from http.server import ThreadingHTTPServer
remote=phone_bridge.create_server('127.0.0.1',0)
phone_bridge.create_server=lambda *_args:remote
http=ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
server.PORT=http.server_port
print(json.dumps({'base':'http://127.0.0.1:'+str(http.server_port),'phoneBase':'http://127.0.0.1:'+str(remote.server_port)}),flush=True)
def stop(*_args):raise KeyboardInterrupt
signal.signal(signal.SIGTERM,stop)
try:http.serve_forever()
except KeyboardInterrupt:pass
finally:
 phone_bridge.disable();remote.server_close();http.server_close()

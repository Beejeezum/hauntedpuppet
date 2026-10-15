"""LAN remote enable must never wait for hostname DNS or reverse DNS."""
import sys,time,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from phone_remote.phone_server import create_server
class PhoneDiscoveryTest(unittest.TestCase):
 def test_cold_start_without_dns(self):
  start=time.monotonic()
  with patch('socket.getfqdn',side_effect=AssertionError('No reverse DNS')),patch('socket.gethostbyname_ex',side_effect=AssertionError('No hostname DNS')):
   server=create_server(port=0)
  try:
   self.assertIn('localhost',server.allowed_hosts)
   self.assertIn('127.0.0.1',server.allowed_hosts)
   self.assertNotIn('0.0.0.0',server.allowed_hosts)
   self.assertLess(time.monotonic()-start,1)
  finally:server.server_close()
if __name__=='__main__':unittest.main()

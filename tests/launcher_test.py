import unittest,sys,json
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import launch
class Status:
 def __init__(self,version):self.version=version
 def __enter__(self):return self
 def __exit__(self,*a):pass
 def read(self):return json.dumps({'version':self.version}).encode()
class Launcher(unittest.TestCase):
 def test_current_server_reused(self):
  with patch.object(launch.urllib.request,'urlopen',return_value=Status('0.9.0')),patch.object(launch.subprocess,'run') as run,patch.object(launch,'alert') as alert:
   launch.main();alert.assert_not_called();self.assertEqual(run.call_args.args[0],['/usr/bin/open','-a','Google Chrome',launch.BASE])
 def test_other_server_does_not_silently_open_old_build(self):
  with patch.object(launch.urllib.request,'urlopen',return_value=Status('0.7.1')),patch.object(launch.subprocess,'run') as run,patch.object(launch,'alert') as alert:
   launch.main();run.assert_not_called();alert.assert_called_once();self.assertIn('different Haunt version',alert.call_args.args[0])
if __name__=='__main__':unittest.main()

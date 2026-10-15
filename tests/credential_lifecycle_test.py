import unittest,sys,os,json
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[1]));import server as s
DUMMY='test-only-app-key-never-a-real-credential'
class CredentialLifecycle(unittest.TestCase):
 def setUp(self):s.SAVED_CREDENTIAL=False;s.CREDENTIAL_WARNING=''
 def tearDown(self):s.SAVED_CREDENTIAL=False;s.CREDENTIAL_WARNING=''
 def test_restore_saved_app_credential(self):
  with patch.dict(os.environ,{},clear=True),patch.object(s.credential_store,'supported',return_value=True),patch.object(s.credential_store,'load',return_value=DUMMY):
   s.restore_credentials();self.assertEqual(os.getenv('OPENAI_API_KEY'),DUMMY);self.assertTrue(s.credential_status()['savedCredential']);self.assertNotIn(DUMMY,json.dumps(s.credential_status()))
 def test_explicit_environment_takes_precedence(self):
  with patch.dict(os.environ,{'OPENAI_API_KEY':DUMMY}),patch.object(s.credential_store,'load') as load:
   s.restore_credentials();load.assert_not_called()
 def test_private_entry_saves_by_default(self):
  with patch.dict(os.environ,{},clear=True),patch.object(s.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout=DUMMY)),patch.object(s.credential_store,'save') as save:
   s.connect_voice();save.assert_called_once_with(DUMMY);self.assertTrue(s.SAVED_CREDENTIAL)
 def test_save_failure_is_explicit_session_fallback(self):
  with patch.dict(os.environ,{},clear=True),patch.object(s.subprocess,'run',return_value=SimpleNamespace(returncode=0,stdout=DUMMY)),patch.object(s.credential_store,'save',side_effect=ValueError('synthetic failure')):
   s.connect_voice();self.assertEqual(os.getenv('OPENAI_API_KEY'),DUMMY);self.assertFalse(s.SAVED_CREDENTIAL);self.assertIn('could not save',s.CREDENTIAL_WARNING);self.assertNotIn(DUMMY,s.CREDENTIAL_WARNING)
 def test_forget_clears_store_and_memory(self):
  with patch.dict(os.environ,{'OPENAI_API_KEY':DUMMY}),patch.object(s.realtime_voice,'inspect',return_value={'activeCalls':0}),patch.object(s.credential_store,'delete') as delete:
   s.SAVED_CREDENTIAL=True;result=s.forget_credentials();delete.assert_called_once();self.assertNotIn('OPENAI_API_KEY',os.environ);self.assertTrue(result['forgotten']);self.assertFalse(result['savedCredential'])
 def test_active_call_must_close_before_forgetting(self):
  with patch.object(s.realtime_voice,'inspect',return_value={'activeCalls':1}),patch.object(s.credential_store,'delete') as delete:
   with self.assertRaises(s.realtime_voice.CallBusy):s.forget_credentials()
   delete.assert_not_called()
 def test_unsupported_platform_does_not_touch_store(self):
  with patch.dict(os.environ,{},clear=True),patch.object(s.credential_store,'supported',return_value=False),patch.object(s.credential_store,'load') as load:
   s.restore_credentials();load.assert_not_called()
if __name__=='__main__':unittest.main()

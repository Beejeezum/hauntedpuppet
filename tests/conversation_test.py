import unittest,sys,os,json,base64
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
import conversation as c
class Conversation(unittest.TestCase):
 def test_missing_key(self):
  with patch.dict(os.environ,{},clear=True),self.assertRaises(ValueError):c.key()
 def test_invalid_audience(self):
  with self.assertRaises(ValueError):c.reply({'audience':'adult','text':'Hi'})
 def test_recovery_without_provider(self):
  with patch.object(c,'request') as req:
   r=c.reply({'text':'What is your phone number?','audience':'little'})
   self.assertEqual(r['source'],'family-recovery');req.assert_not_called()
 def test_audience_and_length_caps(self):
  output={'output':[{'content':[{'type':'output_text','text':json.dumps({'reply':'Hello friend! '*100,'mood':'sinister','gesture':'spooky'})}]}]}
  with patch.object(c,'request',return_value=output) as req:
   r=c.reply({'text':'Hello!','audience':'little'})
   self.assertEqual(r['mood'],'amused');self.assertEqual(r['gesture'],'delight');self.assertLessEqual(len(r['reply'].split()),45)
   self.assertFalse(req.call_args.args[1]['store']);self.assertIn('JSON',req.call_args.args[1]['input'][0]['content']);self.assertEqual(req.call_args.args[1]['input'][0]['role'],'developer');self.assertNotIn('tools',req.call_args.args[1])
 def test_recording_validation(self):
  for d in ({'audio':'x'},{'audio':base64.b64encode(b'a'*500).decode(),'mime':'text/plain'}):
   with self.assertRaises(ValueError):c.transcribe(d)
 def test_multipart(self):
  with patch.object(c,'request',return_value={'text':'Hello Pip'}) as req:
   r=c.transcribe({'audio':base64.b64encode(b'a'*500).decode(),'mime':'audio/webm;codecs=opus'})
   self.assertEqual(r['text'],'Hello Pip');self.assertIn(b'visitor.webm',req.call_args.args[1]);self.assertIn('multipart/form-data',req.call_args.args[2])
if __name__=='__main__':unittest.main()

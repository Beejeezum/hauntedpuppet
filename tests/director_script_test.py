import json, unittest
import director_script
class DirectorScript(unittest.TestCase):
    def test_exact_never_calls_provider(self):
        data=dict(text='Hello, little ghosts!',mode='exact',character='friendly')
        self.assertEqual(director_script.line(data,None,lambda req:self.fail('Paid request')),data)
    def test_prompt_and_output_bounds(self):
        def request(req):
            data=json.loads(req.data);self.assertFalse(data['store']);self.assertIn('same playful being',data['instructions']);self.assertEqual(data['input'],'Welcome the pirate')
            return {'status':'completed','output':[{'type':'reasoning'},{'type':'message','role':'assistant','content':[{'type':'output_text','text':'Ahoy, candy captain!'}]}]}
        data=dict(text='Welcome the pirate',mode='prompt',character='scary')
        self.assertEqual(director_script.line(data,'fixture-key',request)['text'],'Ahoy, candy captain!')
        for result in [{'status':'incomplete','output':[]},{'status':'completed','output':[]},{'status':'completed','output':[{'type':'message','role':'assistant','content':[{'type':'output_text','text':'word '*30}]}]}]:
            with self.assertRaises(ValueError):director_script.line(data,'fixture-key',lambda req:result)
    def test_validation_before_provider(self):
        good=dict(text='Hi',mode='prompt',character='friendly')
        for patch in [dict(text='x'*401),dict(text='\x00'),dict(mode='bad'),dict(character='unknown'),dict(model='untrusted')]:
            with self.assertRaises(ValueError):director_script.line(dict(good,**patch),'key',lambda req:self.fail('Paid request'))

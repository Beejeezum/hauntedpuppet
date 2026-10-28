import unittest
from phone_remote.phone_server import Remote, valid_performance
class PerformanceContract(unittest.TestCase):
    def test_bounded_and_workspace_owned(self):
        good=dict(text='Hello, little ghosts!',mode='exact',character='friendly',animation='friendly-wave')
        self.assertTrue(valid_performance(good,dict(workspace='director'),['friendly-wave']))
        for patch in [dict(text=' '),dict(text='a'*401),dict(text='bad\x00'),dict(mode='unknown'),dict(character='other'),dict(animation='missing'),dict(apiKey='not-allowed')]:
            self.assertFalse(valid_performance(dict(good,**patch),dict(workspace='director'),['friendly-wave']))
        self.assertFalse(valid_performance(good,dict(workspace='live'),['friendly-wave']))
    def test_delivery_and_stop_priority(self):
        r=Remote(clock=lambda:100);code=r.pairing()['code'];token=r.pair('test',code)[1]['token'];r.bridge_at=r.state_at=100;r.state={'workspace':'director'};r.cues=['friendly-wave']
        payload=dict(text='Boo!',mode='exact',character='scary',animation='friendly-wave')
        self.assertEqual(r.command(token,dict(id='perform-001',command='perform',value=payload))[0],202)
        self.assertEqual(r.poll()['commands'][0]['value'],payload)
        self.assertEqual(r.command(token,dict(id='perform-002',command='perform',value=payload))[0],202)
        self.assertEqual(r.command(token,dict(id='stop-now-001',command='stop',value=None))[0],202)
        self.assertEqual([c['command'] for c in r.poll()['commands']],['stop'])
        self.assertEqual(r.command(token,dict(id='bad-list-001',command='gesture',value=[]))[0],400)

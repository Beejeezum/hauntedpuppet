import unittest,time
from unittest.mock import patch
import phone_bridge as bridge
from phone_remote.phone_server import create_server

class PhoneDeskOwnership(unittest.TestCase):
 def setUp(self):
  self.first={'clientId':'desk-first-123'};self.second={'clientId':'desk-second-123'}
  self.patch=patch.object(bridge,'create_server',side_effect=lambda host,port:create_server('127.0.0.1',0));self.patch.start()
 def tearDown(self):bridge.disable();self.patch.stop()
 def test_owner_isolation_and_recovery(self):
  bridge.dispatch('enable',self.first)
  self.assertTrue(bridge.dispatch('status',self.first)['owner']);self.assertFalse(bridge.dispatch('status',self.second)['owner'])
  for action in ('poll','state','ack','pairing'):
   with self.assertRaises(ValueError):bridge.dispatch(action,self.second)
  with self.assertRaises(ValueError):bridge.dispatch('enable',self.second)
  bridge.OWNER_AT=time.monotonic()-6
  bridge.dispatch('enable',self.second)
  self.assertTrue(bridge.dispatch('status',self.second)['owner'])
  with self.assertRaises(ValueError):bridge.dispatch('poll',self.first)
 def test_identity_and_qr(self):
  with self.assertRaises(ValueError):bridge.dispatch('enable',{})
  bridge.dispatch('enable',self.first);data=bridge.dispatch('pairing',self.first)
  self.assertEqual(len(data['code']),6);self.assertTrue(data['qrSvg'].startswith('<svg'));self.assertNotIn(bridge.SERVER.remote.secret,data['qrSvg'])

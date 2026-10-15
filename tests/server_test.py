import unittest,urllib.request,urllib.error,json
BASE='http://127.0.0.1:8770'
class LocalServer(unittest.TestCase):
 def status(self):
  with urllib.request.urlopen(BASE+'/api/status') as r:return json.load(r)
 def code(self,path,headers=None,body=None):
  try:
   with urllib.request.urlopen(urllib.request.Request(BASE+path,headers=headers or {},data=body)) as r:return r.status
  except urllib.error.HTTPError as e:return e.code
 def test_public_page(self):self.assertEqual(self.code('/'),200)
 def test_source_private(self):self.assertEqual(self.code('/server.py'),404)
 def test_asset_traversal(self):self.assertEqual(self.code('/assets/%2e%2e/server.py'),403)
 def test_host(self):self.assertEqual(self.code('/',{'Host':'evil.example'}),403)
 def test_missing_token(self):self.assertEqual(self.code('/api/performance',{'Origin':BASE},b'{}'),403)
 def test_cross_origin(self):self.assertEqual(self.code('/api/performance',{'Origin':'https://evil.example','X-Haunt-Token':self.status()['token']},b'{}'),403)
 def test_size_bound(self):self.assertEqual(self.code('/api/performance',{'Origin':BASE,'X-Haunt-Token':self.status()['token']},b'x'*12001),400)
if __name__=='__main__':unittest.main()

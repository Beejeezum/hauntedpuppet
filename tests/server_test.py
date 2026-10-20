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
 def test_live_workspace(self):self.assertEqual(self.code('/live.html'),200)
 def test_workspace_video_ranges(self):
  import public_workspace
  path='/assets/wisp-showdesk/friendly.mp4';data,_=public_workspace.asset(path)
  for header,start,end in [('bytes=0-1',0,1),('bytes=-32',len(data)-32,len(data)-1),('bytes=8-31',8,31)]:
   with urllib.request.urlopen(urllib.request.Request(BASE+path,headers={'Range':header})) as r:
    self.assertEqual(r.status,206);self.assertEqual(r.headers['Content-Range'],f'bytes {start}-{end}/{len(data)}');self.assertEqual(r.read(),data[start:end+1])
  self.assertEqual(self.code(path,{'Range':f'bytes={len(data)}-'}),416)
  with urllib.request.urlopen(urllib.request.Request(BASE+path,method='HEAD')) as r:
   self.assertEqual(r.status,200);self.assertEqual(int(r.headers['Content-Length']),len(data));self.assertEqual(r.read(),b'')
 def test_private_head(self):
  with self.assertRaises(urllib.error.HTTPError) as e:urllib.request.urlopen(urllib.request.Request(BASE+'/server.py',method='HEAD'))
  self.assertEqual(e.exception.code,404)
 def test_source_private(self):self.assertEqual(self.code('/server.py'),404)
 def test_asset_traversal(self):self.assertEqual(self.code('/assets/%2e%2e/server.py'),403)
 def test_host(self):self.assertEqual(self.code('/',{'Host':'evil.example'}),403)
 def test_missing_token(self):self.assertEqual(self.code('/api/performance',{'Origin':BASE},b'{}'),403)
 def test_cross_origin(self):self.assertEqual(self.code('/api/performance',{'Origin':'https://evil.example','X-Haunt-Token':self.status()['token']},b'{}'),403)
 def test_size_bound(self):self.assertEqual(self.code('/api/performance',{'Origin':BASE,'X-Haunt-Token':self.status()['token']},b'x'*12001),400)
if __name__=='__main__':unittest.main()

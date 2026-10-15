import unittest,json,hashlib,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'assets/wisp'
class PaintedAssets(unittest.TestCase):
 def test_registered_pixels_preserved(self):
  data=json.loads((ROOT/'integrity.json').read_text());self.assertEqual(len(data['files']),23)
  for name,expected in data['files'].items():
   raw=(ROOT/name).read_bytes();self.assertEqual(hashlib.sha256(raw).hexdigest(),expected,name)
   self.assertEqual(raw[:8],b'\x89PNG\r\n\x1a\n');self.assertEqual(struct.unpack('>II',raw[16:24]),(1024,1536),name)
 def test_contract(self):
  d=json.loads((ROOT/'asset-manifest.json').read_text());self.assertEqual(d['version'],'1.1');self.assertEqual(d['canvas'],[1024,1536])
  for a in d['assets']:
   if a.get('registeredFile'):self.assertIn(a['z'],range(6));self.assertEqual(len(a['pivot']),2)
if __name__=='__main__':unittest.main()

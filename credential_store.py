"""Persistent local OpenAI credential in macOS Keychain; never shell arguments or files."""
import ctypes,sys,threading
SERVICE='com.beejeezum.hauntedpuppet.openai'
ACCOUNT='local-user'
LOCK=threading.RLock()
NOT_FOUND=-25300
DUPLICATE=-25299

class Keychain:
 def __init__(self,service=SERVICE,account=ACCOUNT):
  self.service=service;self.account=account
  if sys.platform!='darwin':raise ValueError('Automatic key storage uses macOS Keychain. On other systems use the OPENAI_API_KEY environment variable.')
  self.cf=ctypes.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
  self.sec=ctypes.CDLL('/System/Library/Frameworks/Security.framework/Security')
  p=ctypes.c_void_p;n=ctypes.c_long
  self.cf.CFStringCreateWithCString.argtypes=[p,ctypes.c_char_p,ctypes.c_uint32];self.cf.CFStringCreateWithCString.restype=p
  self.cf.CFDataCreate.argtypes=[p,p,n];self.cf.CFDataCreate.restype=p
  self.cf.CFDictionaryCreateMutable.argtypes=[p,n,p,p];self.cf.CFDictionaryCreateMutable.restype=p
  self.cf.CFDictionarySetValue.argtypes=[p,p,p];self.cf.CFDictionarySetValue.restype=None
  self.cf.CFRelease.argtypes=[p];self.cf.CFRelease.restype=None
  self.cf.CFDataGetLength.argtypes=[p];self.cf.CFDataGetLength.restype=n
  self.cf.CFDataGetBytePtr.argtypes=[p];self.cf.CFDataGetBytePtr.restype=p
  self.sec.SecItemAdd.argtypes=[p,ctypes.POINTER(p)];self.sec.SecItemAdd.restype=ctypes.c_int32
  self.sec.SecItemCopyMatching.argtypes=[p,ctypes.POINTER(p)];self.sec.SecItemCopyMatching.restype=ctypes.c_int32
  self.sec.SecItemUpdate.argtypes=[p,p];self.sec.SecItemUpdate.restype=ctypes.c_int32
  self.sec.SecItemDelete.argtypes=[p];self.sec.SecItemDelete.restype=ctypes.c_int32
 def constant(self,name):return ctypes.c_void_p.in_dll(self.sec,name).value
 def dictionary(self,values):
  refs=[];d=self.cf.CFDictionaryCreateMutable(None,0,None,None)
  try:
   for name,value in values.items():
    if isinstance(value,bytes):v=self.cf.CFDataCreate(None,ctypes.c_char_p(value),len(value));refs.append(v)
    elif value is True:v=ctypes.c_void_p.in_dll(self.cf,'kCFBooleanTrue').value
    elif isinstance(value,str) and value.startswith('kSec'):v=self.constant(value)
    else:v=self.cf.CFStringCreateWithCString(None,str(value).encode(),0x08000100);refs.append(v)
    if not v:raise ValueError('Could not prepare secure key storage.')
    self.cf.CFDictionarySetValue(d,self.constant(name),v)
   return d,refs
  except Exception:
   for ref in refs:self.cf.CFRelease(ref)
   self.cf.CFRelease(d);raise
 def release(self,d,refs):
  self.cf.CFRelease(d)
  for ref in refs:self.cf.CFRelease(ref)
 def query(self):return {'kSecClass':'kSecClassGenericPassword','kSecAttrService':self.service,'kSecAttrAccount':self.account}
 def load(self):
  with LOCK:
   d,refs=self.dictionary({**self.query(),'kSecReturnData':True,'kSecMatchLimit':'kSecMatchLimitOne'});result=ctypes.c_void_p()
   try:
    status=self.sec.SecItemCopyMatching(d,ctypes.byref(result))
    if status==NOT_FOUND:return None
    if status:raise ValueError(f'Mac Keychain could not unlock the saved key (status {status}).')
    try:
     length=self.cf.CFDataGetLength(result)
     if not 0<length<=4096:raise ValueError('The saved credential is invalid. Replace it through Connect OpenAI.')
     return ctypes.string_at(self.cf.CFDataGetBytePtr(result),length).decode('utf-8')
    finally:self.cf.CFRelease(result)
   finally:self.release(d,refs)
 def save(self,key):
  if not isinstance(key,str) or not 16<=len(key)<=1024 or any(c.isspace() for c in key):raise ValueError('Enter a valid API key without spaces.')
  with LOCK:
   d,refs=self.dictionary({**self.query(),'kSecAttrLabel':'Haunted Puppet OpenAI key','kSecValueData':key.encode()})
   try:status=self.sec.SecItemAdd(d,None)
   finally:self.release(d,refs)
   if status==DUPLICATE:
    q,qr=self.dictionary(self.query());a,ar=self.dictionary({'kSecValueData':key.encode()})
    try:status=self.sec.SecItemUpdate(q,a)
    finally:self.release(q,qr);self.release(a,ar)
   if status:raise ValueError(f'Mac Keychain could not save the key (status {status}).')
   return True
 def delete(self):
  with LOCK:
   d,refs=self.dictionary(self.query())
   try:status=self.sec.SecItemDelete(d)
   finally:self.release(d,refs)
   if status not in (0,NOT_FOUND):raise ValueError(f'Mac Keychain could not remove the key (status {status}).')
   return True

def load():return Keychain().load()
def save(key):return Keychain().save(key)
def delete():return Keychain().delete()
def supported():return sys.platform=='darwin'

# SPDX-License-Identifier: GPL-3.0-only
"""Isolated adapter to the pinned upstream Seed-VC toolkit; no capture/recording."""
import os,sys,ast,pathlib,types,contextlib,time
class SeedEngine:
 def __init__(self,checkout,references):
  os.environ['PYTORCH_ENABLE_MPS_FALLBACK']='1';os.environ['TQDM_DISABLE']='1';self.checkout=pathlib.Path(checkout).resolve();os.chdir(self.checkout);sys.path.insert(0,str(self.checkout))
  import torch,torchaudio,librosa,numpy as np,inference
  from huggingface_hub import hf_hub_download
  self.torch,self.np,self.librosa=torch,np,librosa
  if not torch.backends.mps.is_available():raise RuntimeError('This local build requires Apple Silicon with MPS available.')
  checkpoint=hf_hub_download('Plachta/Seed-VC','DiT_uvit_tat_xlsr_ema.pth',cache_dir='./checkpoints');config=hf_hub_download('Plachta/Seed-VC','config_dit_mel_seed_uvit_xlsr_tiny.yml',cache_dir='./checkpoints')
  loaded=inference.load_models(types.SimpleNamespace(fp16=False,f0_condition=False,checkpoint=checkpoint,config=config));self.stack=(loaded[0],loaded[1],loaded[3],loaded[4],loaded[5],loaded[6]);self.sr=loaded[-1]['sampling_rate'];self.device=inference.device
  tree=ast.parse((self.checkout/'real-time-gui.py').read_text());function=next(n for n in tree.body if isinstance(n,ast.FunctionDef)and n.name=='custom_infer');self.ns=dict(torch=torch,torchaudio=torchaudio,device=self.device,fp16=False,prompt_condition=None,mel2=None,style2=None,reference_wav_name='',prompt_len=3,ce_dit_difference=0);exec(compile(ast.Module(body=[function],type_ignores=[]),'Seed-VC/custom_infer','exec'),self.ns)
  self.prompt_cache={};self.refs={name:librosa.load(str(path),sr=self.sr)[0]for name,path in references.items()};self.quiet=open(os.devnull,'w');self.reset('cute')
 def warm(self):
  zero=self.np.zeros(3200,dtype='<f4').tobytes()
  for name in self.refs:
   self.reset(name)
   for _ in range(2):self.convert(zero)
  self.reset('cute')
 def reference(self,voice,pcm):
  import io,wave
  if voice not in self.refs or len(pcm)>4000000:raise ValueError('Invalid voice reference')
  with wave.open(io.BytesIO(pcm))as w:
   if w.getnchannels()not in (1,2)or w.getsampwidth()!=2 or not 1<=w.getnframes()/w.getframerate()<=15:raise ValueError('Use a 1–15second PCM16 WAV reference')
  self.refs[voice]=self.librosa.load(io.BytesIO(pcm),sr=self.sr)[0];self.prompt_cache.pop(voice,None);self.reset(voice);zero=self.np.zeros(3200,dtype='<f4').tobytes();self.convert(zero);self.convert(zero)
 def reset(self,voice):
  if voice not in self.refs:raise ValueError('Unknown voice')
  self.voice=voice
  for key,value in self.prompt_cache.get(voice,dict(prompt_condition=None,mel2=None,style2=None,reference_wav_name='',prompt_len=3)).items():self.ns[key]=value
  self.buffer=self.torch.zeros(64*320,device=self.device);self.sola=self.np.zeros(int(self.sr*.04));self.fade=self.np.sin(self.np.linspace(0,self.np.pi/2,len(self.sola)))**2;self.speech_until=0
 def convert(self,pcm):
  np,torch=self.np,self.torch;data=np.frombuffer(pcm,dtype='<f4').copy()
  if len(data)!=3200 or not np.isfinite(data).all():raise ValueError('Expected one finite 200ms 16kHz mono block')
  data=np.clip(data,-1,1);self.buffer=torch.cat([self.buffer[3200:],torch.tensor(data,device=self.device)]);rms=float(np.sqrt(np.mean(data*data)))
  if rms>.008:self.speech_until=time.monotonic()+.32
  torch.mps.synchronize();started=time.perf_counter()
  with contextlib.redirect_stdout(self.quiet):audio=self.ns['custom_infer'](self.stack,self.refs[self.voice],self.voice,self.buffer,3200,50,1,13,4,0.0,2.0,0)
  self.prompt_cache[self.voice]={key:self.ns[key]for key in ['prompt_condition','mel2','style2','reference_wav_name','prompt_len']};audio=audio.cpu().numpy();overlap=len(self.sola);search=int(self.sr*.02);candidate=audio[:overlap+search];corr=np.correlate(candidate,self.sola,mode='valid');norm=np.sqrt(np.convolve(candidate**2,np.ones(overlap),mode='valid')+1e-8);audio=audio[int(np.argmax(corr/norm)):];audio[:overlap]=audio[:overlap]*self.fade+self.sola*(1-self.fade);block=self.sr//5;self.sola=audio[block:block+overlap].copy();audio=audio[:block]
  if time.monotonic()>self.speech_until:audio=np.zeros_like(audio)
  if len(audio)!=block or not np.isfinite(audio).all():raise ValueError('Invalid converter output')
  torch.mps.synchronize();return np.clip(audio,-.98,.98).astype('<f4').tobytes(),(time.perf_counter()-started)*1000

/** Local operator audio only. No network, recording or speech-generation path. */
export class LocalPuppetVoice {
 constructor(onState=()=>{}){this.onState=onState;this.epoch=0;this.phase='off';this.output=false;this.rms=0;this.samples=new Float32Array(512);}
 inspect(){return{phase:this.phase,tracks:this.stream?.getAudioTracks().filter(t=>t.readyState==='live').length||0,context:this.context?.state||'not-created',output:this.output,rms:this.rms,error:this.error||null};}
 emit(){this.onState(this.inspect());}
 async start(){if(this.phase==='starting'||this.phase==='live')return;this.stop();const token=++this.epoch;this.phase='starting';this.error='';this.emit();let acquired,context;
  try{context=new AudioContext();this.context=context;let resumeError;const resumed=context.resume().catch(e=>{resumeError=e});acquired=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:false},video:false});if(token!==this.epoch){acquired.getTracks().forEach(t=>t.stop());if(context.state!=='closed')await context.close();return;}await resumed;if(resumeError)throw resumeError;if(token!==this.epoch){acquired.getTracks().forEach(t=>t.stop());return;}
   this.stream=acquired;this.source=context.createMediaStreamSource(acquired);this.filter=context.createBiquadFilter();this.filter.type='highpass';this.filter.frequency.value=75;this.analyser=context.createAnalyser();this.analyser.fftSize=512;this.gain=context.createGain();this.gain.gain.value=this.output?.8:0;this.source.connect(this.filter);this.filter.connect(this.analyser);this.analyser.connect(this.gain);this.gain.connect(context.destination);for(const t of acquired.getTracks())t.onended=()=>this.stop('Microphone disconnected');this.phase='live';this.emit();
  }catch(e){acquired?.getTracks().forEach(t=>t.stop());if(token===this.epoch){this.stop();this.error=e.name==='NotAllowedError'?'Microphone permission declined':e.name==='NotReadableError'?'Microphone is busy':'Microphone could not start';this.phase='error';this.emit();}}
 }
 setOutput(enabled){this.output=!!enabled;if(this.gain)this.gain.gain.setTargetAtTime(this.output?.8:0,this.context.currentTime,.025);this.emit();}
 sample(){if(this.analyser){this.analyser.getFloatTimeDomainData(this.samples);this.rms=Math.sqrt(this.samples.reduce((s,v)=>s+v*v,0)/512);}return this.rms;}
 stop(reason=''){this.epoch++;const c=this.context;for(const t of this.stream?.getTracks()||[]){t.onended=null;t.stop();}for(const n of [this.source,this.filter,this.analyser,this.gain])try{n?.disconnect();}catch{}this.stream=this.context=this.source=this.filter=this.analyser=this.gain=null;this.rms=0;this.phase='off';if(c&&c.state!=='closed')c.close().catch(()=>{});this.emit();}
}

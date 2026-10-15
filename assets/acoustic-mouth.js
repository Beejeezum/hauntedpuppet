// Acoustic animation cues, not phoneme recognition. Prepared lines retain forced alignment.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export class AcousticMouth {
 constructor(analyser=null){this.analyser=analyser;if(analyser){analyser.fftSize=2048;analyser.smoothingTimeConstant=.35;this.wave=new Float32Array(analyser.fftSize);this.spectrum=new Float32Array(analyser.frequencyBinCount);}this.reset();}
 reset(){this.level=0;this.peak=.09;this.mouth='rest';this.changedAt=-Infinity;this.lastAt=null;this.closed=true;this.weights={rest:1};}
 read(at){
  if(!this.analyser)return this.update({rms:0,bands:[0,0,0,0]},at);
  this.analyser.getFloatTimeDomainData(this.wave);this.analyser.getFloatFrequencyData(this.spectrum);
  let sum=0;for(const v of this.wave)sum+=v*v;const rms=Math.sqrt(sum/this.wave.length),bands=[0,0,0,0],counts=[0,0,0,0],step=this.analyser.context.sampleRate/this.analyser.fftSize;
  for(let i=1;i<this.spectrum.length;i++){const hz=i*step;if(hz<150||hz>6500)continue;const band=hz<700?0:hz<1700?1:hz<3200?2:3;const power=10**(this.spectrum[i]/10);if(Number.isFinite(power)){bands[band]+=power;counts[band]++;}}
  // Band totals retain formant energy rather than assigning a phoneme to a frequency bin.
  return this.update({rms,bands},at);
 }
 update({rms=0,bands=[0,0,0,0]},at=0){
  rms=Number.isFinite(rms)?Math.max(0,rms):0;const dt=this.lastAt===null?1/60:clamp(at-this.lastAt,.001,.1);this.lastAt=at;
  this.level+=(rms-this.level)*(1-Math.exp(-dt/(rms>this.level?.018:.045)));
  this.peak=Math.max(.07,rms,this.peak*Math.exp(-dt/.85));
  const threshold=this.closed?.007:.0045;this.closed=this.level<threshold;
  const opening=this.closed?0:clamp((this.level-.0045)/Math.max(.025,this.peak)*1.25);
  const energy=bands.map(v=>Number.isFinite(v)?Math.max(0,v):0),total=energy.reduce((a,b)=>a+b,0)||1;
  const [low,mid,high,air]=energy.map(v=>v/total);
  let wanted='aa';
  if(opening<.055)wanted='rest';
  else if(air>.42)wanted='ss';
  else if(low>.64)wanted=opening<.48?'oo':'oh';
  else if(high>.36&&low<.37)wanted='ee';
  else if(opening<.24)wanted='ee';
  const hold=wanted==='rest'?.035:.075;
  if(wanted!==this.mouth&&at-this.changedAt>=hold){this.mouth=wanted;this.changedAt=at;}
  const active=opening===0?0:Math.max(.55,opening),weights=this.mouth==='rest'?{rest:1}:{rest:1-active,[this.mouth==='aa'?'A':this.mouth==='ee'?'E':this.mouth==='oh'?'O':this.mouth==='oo'?'U':'S']:active};
  this.weights=weights;return {mouth:this.mouth,weights,jaw:opening,rms:this.level,source:'live-acoustic-animation',phonemeAccurate:false};
 }
}

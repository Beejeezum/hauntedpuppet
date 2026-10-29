/** Bounded microphone capture / converted PCM playback. No network or recording. */
class WispNeuralIO extends AudioWorkletProcessor{
 constructor(){super();this.capture=[];this.sum=0;this.n=0;this.phase=0;this.queue=[];this.active=null;this.offset=0;this.underruns=0;this.started=false;this.prefill=0;this.envelope=0;this.counter=0;this.alive=true;this.port.onmessage=({data:d})=>{if(d.type==='stop'){this.alive=false;this.queue=[];this.active=null;}if(d.type==='flush'){this.queue=[];this.active=null;this.offset=0;this.capture=[];this.started=false;this.prefill=0;this.envelope=0;}if(d.type==='audio'){if(this.queue.length>=3)this.queue.shift();this.queue.push(d.samples);if(!this.started){this.prefill=Math.round(sampleRate*.06);this.envelope=0;}this.started=true;}};}
 process(inputs,outputs){if(!this.alive)return false;const input=inputs[0]?.[0],output=outputs[0]?.[0];if(!output)return true;let energy=0;
  for(let i=0;i<output.length;i++){
   this.sum+=input?.[i]||0;this.n++;this.phase+=16000/sampleRate;
   if(this.phase>=1){this.capture.push(this.sum/this.n);this.sum=0;this.n=0;this.phase-=1;if(this.capture.length===3200){const a=new Float32Array(this.capture);this.capture=[];this.port.postMessage({type:'input',samples:a},[a.buffer]);}}
   if(this.prefill>0){this.prefill--;output[i]=0;continue;}
   if(!this.active&&this.queue.length){this.active=this.queue.shift();this.offset=0;}
   let v=0;if(this.active){const a=Math.floor(this.offset),mix=this.offset-a;v=(this.active[a]||0)*(1-mix)+(this.active[a+1]||0)*mix;this.offset+=22050/sampleRate;if(this.offset>=this.active.length)this.active=null;}else if(this.started&&i===0)this.underruns++;
   this.envelope=Math.min(1,this.envelope+1/(sampleRate*.008));v*=this.envelope;output[i]=Math.max(-1,Math.min(1,v));energy+=v*v;
  }
  if(++this.counter%20===0)this.port.postMessage({type:'meter',rms:Math.sqrt(energy/output.length),queuedMs:(this.queue.length+(this.active?1:0))*200,underruns:this.underruns});return true;
 }
}
registerProcessor('wisp-neural-io',WispNeuralIO);

import {AcousticMouth} from '../../../assets/acoustic-mouth.js';
import {PaintedMouthCues} from './painted-mouth-cues.js';
/** Laptop-owned decoded audio clock. Acoustic animation, never phoneme recognition. */
export class FilmAudioMouthDriver{
 constructor(context){this.context=context;this.source=null;this.disposed=false;this.generation=0;this.weights={rest:1};this.last=null;this.analyser=context.createAnalyser();this.gain=context.createGain();this.analyser.connect(this.gain);this.gain.connect(context.destination);this.acoustic=new AcousticMouth(this.analyser);this.cues=new PaintedMouthCues({draw:()=>{this.weights={rest:1}},drawWeights:w=>{this.weights={...w}},dispose(){}},{now:()=>context.currentTime*1000});}
 play(buffer){if(this.disposed)throw Error('Audio study disposed');if(this.context.state!=='running')throw Error('Enable laptop sound first');this.stop();const generation=this.generation,source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.analyser);this.source=source;this.last=this.context.currentTime;this.token=this.cues.begin({source:'acoustic-estimate'});source.onended=()=>{if(this.generation!==generation||this.source!==source)return;source.disconnect();this.source=null;this.acoustic.reset();this.cues.stop();this.last=null;};source.start();}
 sample(){if(this.disposed||!this.source||this.context.state!=='running')return{rest:1};const at=this.context.currentTime,dt=Math.max(0,Math.min(.1,at-(this.last??at)));this.last=at;const value=this.acoustic.read(at);this.cues.cue(this.token,{weights:value.weights});this.cues.tick(dt);return{...this.weights};}
 stop(){this.generation++;if(this.source){const old=this.source;this.source=null;old.onended=null;try{old.stop()}catch{}old.disconnect();}this.acoustic.reset();this.cues.stop();this.last=null;}
 dispose(){if(this.disposed)return;this.stop();this.disposed=true;this.cues.dispose();this.analyser.disconnect();this.gain.disconnect();}
}

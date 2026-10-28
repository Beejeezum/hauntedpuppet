import {NativeFilmMouthStudy} from './native-film-mouth-study.mjs';
import {PaintedMouthCues} from './painted-mouth-cues.js';
import {validateMouthTimeline,mouthAt} from './film-mouth-timeline.mjs';
import {AcousticMouth} from '../../../assets/acoustic-mouth.js';
/** Opt-in, unapproved friendly speech study. Passively observes laptop-owned audio. */
export class PhonePaintedMouthLayer{
 constructor(){this.mouth=new NativeFilmMouthStudy();this.canvas=document.createElement('canvas');this.canvas.width=1916;this.canvas.height=1080;this.disposed=false;this.weights={rest:1};this.graph=null;this.draws=0;}
 load(){return this.mouth.load();}
 begin({context,source,startedAt,duration,visemes=[]}){
  this.stop();if(this.disposed)return;const analyser=context.createAnalyser(),mute=context.createGain();mute.gain.value=0;analyser.connect(mute);mute.connect(context.destination);source.connect(analyser);
  const acoustic=new AcousticMouth(analyser),cues=new PaintedMouthCues({draw:()=>{this.weights={rest:1}},drawWeights:w=>{this.weights=w},dispose(){}},{now:()=>context.currentTime*1000});let timeline=null;try{if(visemes.length)timeline=validateMouthTimeline(visemes,duration)}catch{}
  this.graph={context,source,analyser,mute,acoustic,cues,timeline,startedAt,last:startedAt,token:cues.begin({source:timeline?'automatic-alignment':'acoustic-estimate'})};return timeline?'automatic alignment · review needed':'acoustic estimate · review needed';
 }
 render(video){
  const g=this.graph;if(this.disposed||!g||g.context.state!=='running'||video?.tagName!=='VIDEO'||video.dataset.cue!=='friendly-drift'||video.videoWidth!==1916||video.videoHeight!==1080||video.readyState<2)return null;
  const at=g.context.currentTime,dt=Math.max(0,Math.min(.1,at-g.last));g.last=at;g.cues.cue(g.token,{weights:g.timeline?mouthAt(g.timeline,at-g.startedAt):g.acoustic.read(at).weights});g.cues.tick(dt);if((this.weights.rest??1)>.999)return null;
  const ctx=this.canvas.getContext('2d');ctx.drawImage(video,0,0);if(!this.mouth.draw(ctx,video,this.weights))return null;this.draws++;return this.canvas;
 }
 inspect(){return{ready:this.mouth.surface.ready,active:!!this.graph,opening:1-(this.weights.rest??1),draws:this.draws,disposed:this.disposed};}
 stop(){const g=this.graph;this.graph=null;if(g){try{g.source.disconnect(g.analyser)}catch{}g.analyser.disconnect();g.mute.disconnect();g.cues.dispose();}this.weights={rest:1};}
 dispose(){if(this.disposed)return;this.stop();this.disposed=true;this.mouth.dispose();this.canvas.width=this.canvas.height=1;}
}

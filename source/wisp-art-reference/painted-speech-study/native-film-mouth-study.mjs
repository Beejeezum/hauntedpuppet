import {registeredMouthPose} from './registered-mouth-pose.mjs';
import {PaintedMouthSurface} from './painted-mouth-surface.js';
/** Source-only compositing study. Candidate registration and artwork are unapproved. */
export class NativeFilmMouthStudy{
 constructor(){this.surface=new PaintedMouthSurface({outputRect:{x:169,y:439,width:136,height:136}});this.patch=document.createElement('canvas');this.patch.width=this.patch.height=136;this.disposed=false;}
 async load(){const base=new URL('./',import.meta.url);const [loaded,data]=await Promise.all([this.surface.load({imageURL:new URL('wisp-friendly-speaking-study-v2.png',base),dataURL:new URL('wisp-speaking-registration-study.json',base)}),fetch(new URL('friendly-v28-mouth-template-candidates.json',base)).then(r=>{if(!r.ok)throw Error('Registration unavailable');return r.json()})]);if(this.disposed)return false;if(data.frames?.length!==122||data.dimensions?.join()!=='1916,1080')throw Error('Unexpected candidate registration');this.data=data;return loaded;}
 draw(ctx,video,weights={rest:1}){
  if(this.disposed||!this.surface.ready||!this.data)return false;
  if((weights.rest||0)>=.999)return false; // Original movie is exact at rest.
  const anchor=registeredMouthPose(this.data,video.currentTime);
  if(!anchor||anchor.correlation<.72)return false;
  this.surface.drawWeights(weights);const p=this.patch.getContext('2d');p.clearRect(0,0,136,136);p.globalCompositeOperation='source-over';p.drawImage(this.surface.canvas,0,0);
  // Local oval, away from the eyes and outer fog. Its edge still needs visual review.
  p.globalCompositeOperation='destination-in';p.save();p.translate(67.5,60);p.scale(1,.78);const mask=p.createRadialGradient(0,0,38,0,0,58);mask.addColorStop(0,'white');mask.addColorStop(1,'transparent');p.fillStyle=mask;p.fillRect(-68,-90,136,180);p.restore();p.globalCompositeOperation='source-over';
  const opening=1-Math.min(1,Math.max(0,Number(weights.rest)||0)),fade=Math.min(1,opening/.15);
  ctx.save();ctx.globalAlpha=fade*fade*(3-2*fade);ctx.translate(...anchor.center);ctx.rotate(-anchor.rotationDegrees*Math.PI/180);const scale=.59*anchor.scale;ctx.scale(scale,scale);ctx.drawImage(this.patch,-67.5,-50.5);ctx.restore();return true;
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.surface.dispose();this.data=null;this.patch.width=this.patch.height=1;}
}

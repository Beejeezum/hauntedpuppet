/** The owner draws all visual layers; projector mirrors this canvas, never media/audio. */
const BLENDS = new Set(['source-over', 'screen', 'lighter', 'multiply']);
const unit = value => Number.isFinite(value) && value >= 0 && value <= 1;
export class StageCompositor {
 constructor(canvas, {onLayerError = () => {}} = {}) {
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.layers=[];this.black=true;this.suspended=false;this.level=1;this.onLayerError=onLayerError;this.disposed=false;this.draws=0;
 }
 add({id,source,opacity=1,blend='source-over',visible=true,kind='effect'}) {
  if(this.disposed||!id||this.layers.some(l=>l.id===id)||this.layers.length>=12)throw Error('Invalid or duplicate layer');
  if(!unit(opacity)||!BLENDS.has(blend)||!source)throw Error('Invalid layer settings');
  this.layers.push({id,source,opacity,blend,visible:!!visible,kind});return id;
 }
 update(id,patch) {
  const layer=this.layers.find(l=>l.id===id);if(!layer)throw Error('Unknown layer');
  if(patch.opacity!==undefined&&!unit(patch.opacity)||patch.blend!==undefined&&!BLENDS.has(patch.blend))throw Error('Invalid layer settings');
  for(const key of ['opacity','blend','visible'])if(patch[key]!==undefined)layer[key]=key==='visible'?!!patch[key]:patch[key];
 }
 move(id,index) {const i=this.layers.findIndex(l=>l.id===id);if(i<0||!Number.isInteger(index)||index<0||index>=this.layers.length)throw Error('Invalid layer order');this.layers.splice(index,0,this.layers.splice(i,1)[0]);}
 remove(id){this.layers=this.layers.filter(l=>l.id!==id);}
 setLevel(value){if(!unit(value))throw Error('Invalid stage level');this.level=value;}
 blackout(){this.black=true;this.render();}
 suspend(value){this.suspended=!!value;}
 reveal(){if(!this.disposed)this.black=false;}
 inspect(){return{black:this.black,suspended:this.suspended,level:this.level,draws:this.draws,layers:this.layers.map(({source,...settings})=>({...settings}))};}
 render(){
  const {ctx,canvas}=this;if(this.disposed)return;
  ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
  if(!this.black&&!this.suspended&&this.level>0)for(const layer of this.layers){
   if(!layer.visible||!layer.opacity)continue;
   const s=typeof layer.source==='function'?layer.source():layer.source;
   if(!s||'readyState'in s&&s.readyState<2||'complete'in s&&!s.complete)continue;
   const w=s.videoWidth||s.naturalWidth||s.width,h=s.videoHeight||s.naturalHeight||s.height;if(!w||!h)continue;
   const fit=Math.min(canvas.width/w,canvas.height/h);
   ctx.save();ctx.globalAlpha=layer.opacity*this.level;ctx.globalCompositeOperation=layer.blend;
   try{ctx.drawImage(s,(canvas.width-w*fit)/2,(canvas.height-h*fit)/2,w*fit,h*fit);}catch{this.onLayerError(layer.id);}
   finally{ctx.restore();}
  }
  ctx.restore();this.draws++;
 }
 dispose(){this.blackout();this.layers=[];this.disposed=true;}
}

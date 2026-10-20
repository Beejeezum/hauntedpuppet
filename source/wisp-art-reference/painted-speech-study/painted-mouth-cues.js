const unit=v=>Number.isFinite(v)?Math.min(1,Math.max(0,v)):0;
const normalize=w=>{const sum=Object.values(w).reduce((a,b)=>a+b,0);return sum?Object.fromEntries(Object.entries(w).map(([k,v])=>[k,v/sum])):{rest:1,AH:0,OO:0,EE:0}};
/** Coarse painted shape mapping, not phoneme-accurate lip sync. */
export class PaintedMouthCues {
 constructor(surface,{now=()=>performance.now(),staleMs=250}={}){this.surface=surface;this.now=now;this.staleMs=staleMs;this.epoch=0;this.running=false;this.target=this.value=0;this.lastCue=-Infinity;this.source='rest';this.currentWeights=this.targetWeights={rest:1,AH:0,OO:0,EE:0};}
 begin({source='acoustic-estimate'}={}){this.stop();this.running=true;this.source=['acoustic-estimate','authored-visemes','automatic-alignment','synthetic-rehearsal'].includes(source)?source:'acoustic-estimate';return this.epoch;}
 cue(token,{jaw,weights}={}){if(token!==this.epoch||!this.running)return false;this.targetWeights=Number.isFinite(jaw)?{rest:1-unit(jaw),AH:unit(jaw),OO:0,EE:0}:normalize({rest:unit(weights?.rest)+unit(weights?.M)+unit(weights?.F),AH:unit(weights?.AH??weights?.A),OO:unit(weights?.OO??weights?.O)+unit(weights?.U),EE:unit(weights?.EE??weights?.E)+unit(weights?.I)});this.target=1-this.targetWeights.rest;this.lastCue=this.now();return true;}
 tick(dt){const elapsed=Number.isFinite(dt)?Math.min(.1,Math.max(0,dt)):0,stale=this.now()-this.lastCue>this.staleMs,target=this.running&&!stale?this.targetWeights:{rest:1,AH:0,OO:0,EE:0};const next={};for(const k of ['rest','AH','OO','EE']){const current=this.currentWeights[k];next[k]=current+(target[k]-current)*(1-Math.exp(-elapsed*(target[k]>current?24:18)));if(next[k]<.0001)next[k]=0;}this.currentWeights=normalize(next);this.value=1-this.currentWeights.rest;if(this.surface.drawWeights)this.surface.drawWeights(this.currentWeights);else this.surface.draw(this.value);return this.value;}
 stop(){this.epoch++;this.running=false;this.target=this.value=0;this.lastCue=-Infinity;this.source='rest';this.currentWeights=this.targetWeights={rest:1,AH:0,OO:0,EE:0};this.surface.draw(0);}
 inspect(){return {epoch:this.epoch,running:this.running,opening:this.value,target:this.target,weights:{...this.currentWeights},source:this.source,supportedShape:'Coarse painted AH/OO/EE mapping; not phoneme accurate',stale:this.now()-this.lastCue>this.staleMs};}
 dispose(){this.stop();this.surface.dispose();}
}

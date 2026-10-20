/** Authored source rehearsal. Timings use one monotonic clock; no voice/network/media ownership. */
export class WispShowDirector {
 constructor({play,hold,clock=()=>performance.now(),onChange=()=>{}}){this.play=play;this.hold=hold;this.clock=clock;this.onChange=onChange;this.epoch=0;this.timer=null;this.running=false;this.step=-1;this.disposed=false;}
 start(show){if(this.disposed)throw Error('Show director disposed');if(!show?.steps?.length||show.steps.some(s=>!['idle','greeting','scary','morph','return','absent'].includes(s.clip)||!Number.isFinite(s.seconds)||s.seconds<=0))throw Error('Invalid show');this.stop();this.show=show;this.duration=show.steps.reduce((n,s)=>n+s.seconds,0);this.started=this.clock();this.running=true;this.step=-1;const ticket=this.epoch;this.tick(ticket);}
 async tick(ticket){if(!this.running||ticket!==this.epoch)return;const elapsed=(this.clock()-this.started)/1000,at=elapsed%this.duration;let boundary=0,index=0;for(;index<this.show.steps.length-1;index++){boundary+=this.show.steps[index].seconds;if(at<boundary)break;}const cycle=Math.floor(elapsed/this.duration),key=cycle+':'+index;
  if(key!==this.key){this.key=key;this.step=index;try{await this.play(this.show.steps[index].clip);}catch{if(ticket===this.epoch)this.stop();return;}if(!this.running||ticket!==this.epoch)return;this.onChange(this.inspect());}
  this.timer=setTimeout(()=>this.tick(ticket),50);
 }
 stop(){this.running=false;this.epoch++;clearTimeout(this.timer);this.timer=null;this.key=null;this.hold();this.onChange(this.inspect());}
 inspect(){return {running:this.running,show:this.show?.id||null,step:this.step,elapsed:this.running?(this.clock()-this.started)/1000:0,duration:this.duration||0,epoch:this.epoch,presence:this.running&&this.show?.steps[this.step]?.clip==='absent'?'absent':'visible',disposed:this.disposed};}
 dispose(){this.stop();this.disposed=true;}
}

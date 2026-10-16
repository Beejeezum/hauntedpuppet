/** One authoritative form controller. A visual change never owns speech or microphone. */
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
export class WispFormDirector{
 constructor(){this.blend=0;this.target=0;this.from=0;this.started=0;this.duration=.85;this.audience='little';this.ready=false;this.revision=0;}
 request(form,{now=0,immediate=false}={}){if(!['friendly','haunting'].includes(form))return false;if(form==='haunting'&&(!this.ready||this.audience!=='big'))return false;this.tick(now);this.from=this.blend;this.target=form==='haunting'?1:0;this.started=now;this.duration=Math.max(.18,.85*Math.abs(this.target-this.from));this.revision++;if(immediate)this.blend=this.from=this.target;return true;}
 setAudience(audience,now=0){if(!['little','family','big'].includes(audience))return false;this.audience=audience;if(audience!=='big')this.request('friendly',{now,immediate:true});return true;}
 tick(now){if(!Number.isFinite(now))return this.blend;this.blend=this.from+(this.target-this.from)*ease((now-this.started)/this.duration);if(!this.ready||this.audience!=='big')this.blend=0;return this.blend;}
 apply(snapshot){if(!snapshot||!['little','family','big'].includes(snapshot.audience)||![0,1].includes(snapshot.target)||!Number.isFinite(snapshot.blend)||snapshot.blend<0||snapshot.blend>1)return false;this.audience=snapshot.audience;this.target=this.audience==='big'?snapshot.target:0;this.blend=this.from=this.ready&&this.audience==='big'?snapshot.blend:0;return true;}
 inspect(){return{form:this.blend>=.5?'haunting':'friendly',blend:this.blend,target:this.target,audience:this.audience,ready:this.ready,revision:this.revision,transitioning:Math.abs(this.target-this.blend)>.001};}
}
export class WispFormComposite{
 constructor(morph=null){this.canvas=document.createElement('canvas');this.canvas.width=1280;this.canvas.height=720;this.ctx=this.canvas.getContext('2d');this.frames=0;this.morph=morph;}
 loadMorph(){return this.morph?.load();}
 render(cute,scary,blend,options={}){const ctx=this.ctx;ctx.clearRect(0,0,1280,720);blend=scary?clamp(blend):0;if(blend<=.001){ctx.drawImage(cute,0,0);return this.canvas}if(blend>=.999){ctx.drawImage(scary,0,0);return this.canvas}// Continuous endpoint handoffs retain the exact live puppet at both ends.
 const entrance=ease(blend/.22),exit=ease((blend-.78)/.22),morphWeight=entrance*(1-exit);ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-entrance;ctx.drawImage(cute,0,0);ctx.globalAlpha=exit;ctx.drawImage(scary,0,0);ctx.globalAlpha=1;
 if(!this.morph?.draw(ctx,blend,{...options,opacity:(options.opacity??1)*morphWeight})){ctx.globalAlpha=(1-blend)*morphWeight;ctx.drawImage(cute,0,0);ctx.globalAlpha=blend*morphWeight;ctx.drawImage(scary,0,0);}ctx.restore();this.frames++;return this.canvas;}
}
/** Abortable authored beat runner. Generation checks prevent a late reveal after welcome/Stop. */
export class WispRevealRunner{
 constructor({ready,audience,setForm,action,speak,notify=()=>{}}){Object.assign(this,{ready,audience,setForm,action,speak,notify});this.controller=null;this.revision=0;this.running=false;this.phase='idle';}
 stop(message='Reveal cancelled'){this.revision++;this.controller?.abort();this.controller=null;this.running=false;this.phase='idle';this.notify(message);}
 wait(ms,signal){return new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'))},timer=setTimeout(()=>{signal.removeEventListener('abort',abort);resolve()},ms);if(signal.aborted)abort();else signal.addEventListener('abort',abort,{once:true})});}
 async run(){this.stop();if(!this.ready())throw Error('Scary Wisp is still loading.');if(this.audience()!=='big')throw Error('Choose Big kids before the reveal.');const revision=this.revision,controller=new AbortController(),signal=controller.signal;this.controller=controller;this.running=true;const check=()=>{if(signal.aborted||revision!==this.revision||this.audience()!=='big')throw new DOMException('Cancelled','AbortError')};try{this.phase='invitation';this.setForm('friendly');this.action('shy');this.notify('Friendly setup…');if(this.speak)await this.speak('I am only a tiny friendly ghost.',signal);else await this.wait(1700,signal);check();this.phase='hold';this.notify('A tiny suspicious pause…');await this.wait(450,signal);check();this.phase='reveal';this.setForm('haunting');this.action('surprise');this.notify('BOO · scary reveal!');if(this.speak)await this.speak('Boo!',signal);else await this.wait(1100,signal);check();await this.wait(750,signal);check();this.phase='recovery';this.setForm('friendly');this.action('laugh');this.notify('Goofy recovery · friendly Wisp returns.');await this.wait(1200,signal);check();this.running=false;this.controller=null;this.phase='idle';this.notify('Reveal complete · friendly and ready.');return true;}catch(error){if(revision===this.revision){this.stop(error.name==='AbortError'?'Reveal cancelled.':error.message);this.setForm('friendly');}if(error.name!=='AbortError')throw error;return false;}}
 inspect(){return{running:this.running,phase:this.phase,revision:this.revision};}
}

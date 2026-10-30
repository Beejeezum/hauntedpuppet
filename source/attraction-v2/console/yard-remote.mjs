import {speechSpec, waitForCharacter} from './yard-speech.mjs';

const moves={'Loom-Closer':'near','Fog-Swell':'fog',Vanish:'vanish',Appear:'appear','Drift-Left':'left','Drift-Right':'right','Drift-Away':'far','Come-Home':'home'};
const performances={'friendly-stay':null,'friendly-wave':'welcome','scary-stay':null,'scary-loom':'near'};
const cancelled=()=>Object.assign(Error('Command cancelled'),{cancelled:true});
/** Bounded laptop adapter. It never owns a network service, credentials or a microphone. */
export class YardRemote {
  constructor({player,scene,speech,getTone,setTone,setMode,start,stop,action}) {
    Object.assign(this,{player,scene,speech,getTone,setTone,setMode,startShow:start,stopShow:stop,action});
    this.epoch=0;this.waiters=new Set();this.disposed=false;this.letteringPending=null;
  }
  invalidate() { this.epoch++;for(const c of this.waiters)c.abort();this.waiters.clear(); }
  dispose() { this.invalidate();this.disposed=true; }
  remoteState() {
    const s=this.player.inspect(),v=this.speech.inspect(),form=this.getTone()==='haunted'?'scary':this.getTone()==='gentle'?'friendly':s.form;
    const cues=['Start-Show','Friendly-Wisp','Evil-Wisp','Mixed-Auto'];
    const waveAllowed=this.player.plan?.allows?.('welcome')??this.getTone()!=='haunted';
    if(s.running)cues.push('Auto','Host',...(waveAllowed?['Wave-Hello']:['Loom-Closer']),...Object.keys(moves).filter(k=>k!=='Loom-Closer'),...Object.keys(performances));
    return {state:{workspace:'yard',status:!s.running?'Stage is stopped':v.active?'Voice: '+v.phase:v.phase==='error'?'Voice could not finish':'Yard: '+s.mode,blackout:!s.running,form,speechReady:!!v.configured&&!!v.castReady?.[form]&&this.speech.context?.state==='running'},cues};
  }
  async ensureStarted(epoch) {
    const started=this.player.running||await this.startShow();
    if(epoch!==this.epoch||this.disposed)throw cancelled();
    if(!started)throw Error('Start the show on the laptop.');
  }
  async remoteCommand(command,value) {
    if(this.disposed)throw cancelled();
    if(command==='stop'||command==='blackout'&&value==='on'){this.invalidate();this.stopShow();return;}
    if(command==='perform')return this.perform(value);
    if(command!=='cue'||typeof value!=='string'||!this.remoteState().cues.includes(value)||Object.hasOwn(performances,value))throw Error('This control is not available in the yard show.');
    if(value==='Friendly-Wisp'||value==='Evil-Wisp'||value==='Mixed-Auto')this.setTone({'Friendly-Wisp':'gentle','Evil-Wisp':'haunted','Mixed-Auto':'mischief'}[value]);
    const epoch=this.epoch;await this.ensureStarted(epoch);
    if(value==='Start-Show')return;
    if(value==='Mixed-Auto'||value==='Auto'){this.setMode('auto');return;}
    if(value==='Host'){this.setMode('host');return;}
    if(value==='Friendly-Wisp'||value==='Evil-Wisp')return;
    if(value==='Wave-Hello'){this.player.request('welcome');return;}
    if(value==='Vanish')this.invalidate();
    if(Object.hasOwn(moves,value)){this.action(moves[value]);return;}
    throw Error('Unknown yard control.');
  }
  async perform(value) {
    if(!value||Object.keys(value).sort().join(',')!=='animation,character,mode,text'||!['exact','lettering'].includes(value.mode)||!Object.hasOwn(performances,value.animation)||!value.animation.startsWith(value.character+'-'))throw Error('Choose a supported character, motion and exact line.');
    const spec=speechSpec(value.text,value.character);
    if(!this.player.running)throw Error('Start the show before sending a line.');
    if(this.letteringPending||value.mode==='lettering'&&this.speech.inspect().active)throw Error('Let the current line finish, or stop it before sending silent lettering.');
    if(value.mode==='exact'&&!this.speech.inspect().castReady?.[value.character])throw Error('Choose this character voice on the laptop casting page first.');
    if(value.mode==='exact'&&(!this.speech.configured||this.speech.context?.state!=='running'))throw Error('Enable character speech on the laptop first.');
    this.setTone(value.character==='scary'?'haunted':'gentle');
    const epoch=this.epoch,controller=new AbortController();this.waiters.add(controller);
    if(value.mode==='lettering')this.letteringPending=controller;
    try{
      // Speech generation already overlaps the authored character change in YardSpeech.
      // Silent lettering has no preparation step, so it waits before appearing.
      if(value.mode==='lettering')await waitForCharacter(this.player,value.character,controller.signal);
      if(epoch!==this.epoch||this.disposed)throw cancelled();
      const motion=performances[value.animation];if(motion==='welcome')this.player.request('welcome');else if(motion)this.action(motion);
      if(value.mode==='exact')return await new Promise((resolve,reject)=>{
        const clean=()=>controller.signal.removeEventListener('abort',abort),abort=()=>{clean();reject(cancelled());};
        controller.signal.addEventListener('abort',abort,{once:true});
        try{this.speech.enqueue(spec.text,value.character,true,error=>{clean();error?reject(error):resolve();});}catch(error){clean();reject(error);}
        if(controller.signal.aborted)abort();
      });
      const start=performance.now(),duration=Math.max(4,Math.min(14,spec.text.length/16));
      this.scene.motion.request('appear',start/1000);this.scene.lettering.show(spec.text,value.character,()=> (performance.now()-start)/1000,duration);
      await new Promise((resolve,reject)=>{let timer;const clean=()=>{clearTimeout(timer);controller.signal.removeEventListener('abort',abort);};const abort=()=>{clean();reject(cancelled());};controller.signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>{clean();resolve();},(duration+2)*1000);if(controller.signal.aborted)abort();});
    }catch(error){if(controller.signal.aborted||epoch!==this.epoch)throw cancelled();throw error;}
    finally{this.waiters.delete(controller);if(this.letteringPending===controller)this.letteringPending=null;}
  }
}

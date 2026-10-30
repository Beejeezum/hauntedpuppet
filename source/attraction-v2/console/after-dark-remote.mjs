const programs={'Watching-Eyes':'eyes','Spider-on-Silk':'spider','Quiet-Apparitions':'apparitions'};
const cancelled=()=>Object.assign(Error('Scene command cancelled'),{cancelled:true});
/** Reuses the existing paired cue transport. No voice, capture, navigation or provider. */
export class AfterDarkRemote {
  constructor({inspect,select,start,stop,nightWatch}) {Object.assign(this,{inspect,select,start,stop,nightWatch});this.epoch=0;this.disposed=false;}
  invalidate(){this.epoch++;}
  dispose(){this.invalidate();this.disposed=true;}
  remoteState(){
    const s=this.inspect(),cues=Object.entries(programs).filter(([,p])=>s.available[p]).map(([cue])=>cue);
    if(cues.length)cues.push('Night-Watch');
    return {state:{workspace:'films',loop:'after-dark',blackout:!s.running,status:s.loading?'Preparing the next scene':s.nightWatch.running?'Night watch is running':s.running?({'eyes':'Watching eyes','spider':'Spider on silk','apparitions':'Quiet apparitions'}[s.program]):'After dark is stopped',volume:0},cues};
  }
  async remoteCommand(command,value){
    if(this.disposed)throw cancelled();
    if(command==='stop'||command==='blackout'&&value==='on'){this.invalidate();this.stop();return;}
    if(command!=='cue'||typeof value!=='string'||!this.remoteState().cues.includes(value))throw Error('Choose an available after-dark scene.');
    const own=++this.epoch;
    const applied=value==='Night-Watch'?await this.nightWatch():await this.select(programs[value]);
    if(!applied||own!==this.epoch||this.disposed)throw cancelled();
    if(!this.inspect().running){const started=await this.start();if(!started||own!==this.epoch||this.disposed)throw cancelled();}
  }
}

/** A small unattended story. Scene changes wait for actual empty-stage evidence.
 * Timings are acting/dark-hold intent, not decoder seeks or a promise of a movie master. */
const order = ['eyes','spider','apparitions'];
const timing = {eyes:{finish:32,hold:5,limit:52},spider:{finish:26,hold:8,limit:45},apparitions:{finish:46,hold:5,limit:65}};
export class NightWatch {
  constructor() { this.stop(); }
  start(available) {
    this.stop(); this.order = order.filter(name=>available[name]);
    if (!this.order.length) throw Error('No scene is available for Night watch.');
    this.running = true; this.pending = true; return this.order[0];
  }
  enter(now) { if (!this.running) return; this.pending=false; this.started=now; this.clearAt=null; this.draining=false; }
  tick(now, clear) {
    if (!this.running || this.pending) return null;
    const elapsed=Math.max(0,now-this.started),program=this.order[this.index],rules=timing[program];this.elapsed=elapsed;
    if (elapsed>=rules.limit && !clear) { this.stop(); return {action:'fail',message:'The scene did not clear. Night watch stopped safely.'}; }
    if (program==='eyes' && elapsed>=rules.finish && !this.draining) {this.draining=true;return {action:'drain'};}
    if (elapsed<rules.finish || !clear) {this.clearAt=null;return null;}
    if (this.clearAt===null) this.clearAt=now;
    if (now-this.clearAt<rules.hold) return null;
    this.index=(this.index+1)%this.order.length;this.changes++;this.pending=true;
    return {action:'advance',program:this.order[this.index]};
  }
  stop(){this.running=false;this.pending=false;this.order=[];this.index=0;this.started=0;this.elapsed=0;this.clearAt=null;this.draining=false;this.changes=0;}
  inspect(){return {running:this.running,pending:this.pending,program:this.order[this.index]||null,next:this.order[(this.index+1)%this.order.length]||null,elapsed:this.elapsed,emptyHold:this.clearAt!==null,changes:this.changes};}
}
export function nightGhostAction(elapsed) {
  return elapsed<10?'home':elapsed<20?'left':elapsed<30?'far':elapsed<38?'home':'vanish';
}

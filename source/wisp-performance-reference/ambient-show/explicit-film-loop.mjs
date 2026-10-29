/** Isolated replay experiment. Not selected by the app transport.
 * An ended event restarts the same native film on a new task. No new decoder,
 * inserted picture or generated animation. Seam smoothness needs measurement.
 */
export class ExplicitFilmLoop {
 constructor({onError=()=>{}}={}){this.onError=onError;this.epoch=0;this.video=null;this.timer=null;this.restarts=0;this.pending=0;this.disposed=false;}
 start(video){
  if(this.disposed)throw Error('Loop controller disposed');
  this.stop();const epoch=this.epoch;this.video=video;video.loop=false;
  this.ended=()=>{
   if(this.disposed||this.epoch!==epoch||this.video!==video||this.timer!==null||this.pending)return;
   this.timer=setTimeout(()=>{
    this.timer=null;if(this.disposed||this.epoch!==epoch||this.video!==video)return;
    try{
     video.currentTime=0;const replay=video.play();this.pending++;
     Promise.resolve(replay).then(()=>{if(this.epoch===epoch&&this.video===video&&!this.disposed)this.restarts++;},error=>{if(this.epoch===epoch&&this.video===video&&!this.disposed)this.onError(error);}).finally(()=>this.pending--);
    }catch(error){this.onError(error);}
   },0);
  };
  video.addEventListener('ended',this.ended);
 }
 finishCurrent(){this.epoch++;clearTimeout(this.timer);this.timer=null;if(this.video)this.video.removeEventListener('ended',this.ended);this.video=null;this.ended=null;}
 stop(){const video=this.video;this.finishCurrent();video?.pause();}
 inspect(){return{active:!!this.video,restarts:this.restarts,pending:this.pending,timer:this.timer!==null,disposed:this.disposed};}
 dispose(){if(this.disposed)return;this.stop();this.disposed=true;}
}

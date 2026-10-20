/** Bounded in-memory protocol timing. No transcripts, IDs, recordings or network writes.
 * Measures receipt of speech_stopped -> output_audio_buffer.started, not speaker latency.
 */
export class RealtimeResponseTiming {
 constructor(clock=()=>performance.now()){this.clock=clock;this.pending=null;this.samples=[];}
 cancel(){this.pending=null;}
 visitorStopped(){if(this.pending===null)this.pending=this.clock();}
 replyStarted(){if(this.pending===null)return;const elapsed=this.clock()-this.pending;this.pending=null;if(Number.isFinite(elapsed)&&elapsed>=0){this.samples.push(Math.round(elapsed));if(this.samples.length>20)this.samples.shift();}}
 inspect(){const sorted=[...this.samples].sort((a,b)=>a-b);return {scope:'Received speech-stop to provider output-buffer-start events; not measured audible speaker latency',sampleCount:sorted.length,lastMs:this.samples.at(-1)??null,medianMs:sorted.length?sorted[Math.floor((sorted.length-1)/2)]:null,p95Ms:sorted.length?sorted[Math.ceil(sorted.length*.95)-1]:null,pending:this.pending!==null};}
}

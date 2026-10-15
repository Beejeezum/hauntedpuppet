// Small authored beats give Wisp timing and recovery, independent of AI response latency.
export const ROUTINES=[
 {id:'visitor',title:'Someone can see me!',description:'A glance, a surprised hello, then a little wave.',steps:[['gaze','left'],['wait',600],['gesture','surprise'],['gaze','center'],['cue','hello'],['gesture','wave'],['wait',1600],['gaze','audience']]},
 {id:'brave',title:'My terrifying ghost voice',description:'Wisp gets shy, tries his tiny cough, and laughs it off.',steps:[['gesture','shy'],['wait',900],['cue','cough'],['gesture','laugh'],['wait',1600],['gaze','audience']]},
 {id:'farewell',title:'Until the next haunting',description:'A warm goodbye and a wave back into waiting.',steps:[['gaze','center'],['cue','goodbye'],['gesture','wave'],['wait',1700],['gaze','audience']]}
];
export class RoutineRunner{
 constructor(command,notify=()=>{}){this.command=command;this.notify=notify;this.controller=null;this.generation=0;this.current=null;this.step=0;this.running=false;}
 inspect(){return{running:this.running,id:this.current?.id||null,step:this.step};}
 stop(message='Routine stopped'){this.generation++;this.controller?.abort();this.controller=null;this.current=null;this.running=false;this.step=0;this.notify(message,this.inspect());}
 async run(routine){
  this.stop('Starting routine');const generation=this.generation;const controller=new AbortController();this.controller=controller;this.current=routine;this.running=true;this.notify('Performing: '+routine.title,this.inspect());
  try{
   for(let i=0;i<routine.steps.length;i++){
    if(controller.signal.aborted||generation!==this.generation)return;
    this.step=i+1;this.notify(routine.title+' · beat '+this.step+' of '+routine.steps.length,this.inspect());
    const [command,value]=routine.steps[i];
    if(command==='wait')await new Promise((resolve,reject)=>{const cancel=()=>{clearTimeout(timer);reject(new DOMException('Cancelled','AbortError'))},timer=setTimeout(()=>{controller.signal.removeEventListener('abort',cancel);resolve()},value);controller.signal.addEventListener('abort',cancel,{once:true});});
    else await this.command(command,value);
   }
   if(generation===this.generation){this.current=null;this.running=false;this.controller=null;this.notify('Routine complete · Wisp is ready for the next visitor.',this.inspect());}
  }catch(error){if(generation!==this.generation)return;this.stop(error.name==='AbortError'?'Routine stopped':'Routine could not finish: '+error.message);}
 }
}
export function mountRoutines(){
 const show=window.HauntShow;if(!show)return;
 const box=document.createElement('section');box.className='authored-routines';box.innerHTML='<h3>Small stories, ready to perform</h3><p class="help">Rehearsed timing, gesture and voice. Starting a story ends live conversation. Included recordings work offline.</p><div class="routine-buttons"></div><p class="help" id="routineStatus" role="status" aria-live="polite">Choose a story when you want a complete little performance.</p>';
 const panel=document.querySelector('.show-desk'),heading=panel.querySelector('.cue-heading');heading.before(box);
 const original=show.remoteCommand.bind(show),runner=new RoutineRunner(original,(text,s)=>{box.querySelector('#routineStatus').textContent=text;box.dataset.running=String(s.running);});
 for(const routine of ROUTINES){const b=document.createElement('button');b.innerHTML='<strong></strong><small></small>';b.querySelector('strong').textContent=routine.title;b.querySelector('small').textContent=routine.description;b.onclick=async()=>{show.stop();document.getElementById('stop').click();await runner.run(routine)};box.querySelector('.routine-buttons').append(b);}
 window.addEventListener('haunt-stop',()=>runner.stop());window.addEventListener('pagehide',()=>runner.stop(),{once:true});
 document.addEventListener('click',e=>{if(!runner.running||box.contains(e.target))return;if(e.target.closest('.show-cue,.performance-buttons button,[data-cue],#startMic,#newEncounter,#test,#speak'))runner.stop('Operator took over.');},true);
 show.remoteCommand=async(command,value)=>{if(runner.running)runner.stop('Remote operator took over.');return original(command,value)};
 window.HauntRoutines={inspect:()=>runner.inspect(),stop:()=>runner.stop()};
}

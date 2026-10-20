/** Source rehearsal only: one decoded/composited frame, mirrored without a second media player. */
export function mountFilmOutput(stage, inspect) {
 const button=document.createElement('button');button.textContent='Open silent rehearsal output';button.type='button';
 stage.after(button);const outputs=new Set();let disposed=false;
 button.onclick=()=>{
  if(disposed)return;
  const output=window.open('about:blank','_blank','popup,width=960,height=540');
  if(!output){button.textContent='Popup blocked · allow and retry';return;}
  outputs.add(output);const d=output.document;d.title='Wisp · silent rehearsal output';
  d.body.style.cssText='margin:0;background:black;overflow:hidden';
  const canvas=d.createElement('canvas');canvas.width=stage.width;canvas.height=stage.height;
  canvas.style.cssText='width:100vw;height:100vh;object-fit:contain;background:black;display:block';d.body.append(canvas);
  const context=canvas.getContext('2d'),fullscreen=d.createElement('button');fullscreen.textContent='Full screen';
  fullscreen.style.cssText='position:fixed;top:12px;left:12px;padding:12px';d.body.append(fullscreen);
  fullscreen.onclick=()=>d.documentElement.requestFullscreen().catch(()=>fullscreen.textContent='Full screen unavailable · retry');
  d.addEventListener('fullscreenchange',()=>fullscreen.hidden=!!d.fullscreenElement);
  let frame=0,stopped=false,stale=false,stalls=0,lastDraw=null,lastChange=output.performance.now();const clear=()=>context.clearRect(0,0,canvas.width,canvas.height);
  function paint(){if(stopped)return;let state;try{state=!window.closed&&!disposed&&inspect();}catch{}if(!state||state.disposed){clear();stopped=true;return;}const now=output.performance.now(),draws=state.metrics?.draws;if(draws!==lastDraw){lastDraw=draws;lastChange=now;}const nextStale=Number.isFinite(draws)&&!state.black&&now-lastChange>1200;if(nextStale&&!stale)stalls++;stale=nextStale;if(state.black||stale)clear();else context.drawImage(stage,0,0);frame=output.requestAnimationFrame(paint);}
  output.addEventListener('keydown',event=>{if(event.key==='Escape'){clear();stopped=true;output.cancelAnimationFrame(frame);}});
  output.addEventListener('pagehide',()=>{stopped=true;output.cancelAnimationFrame(frame);outputs.delete(output);});
  output.WispFilmOutput={inspect:()=>({silent:true,stopped,stale,stalls,width:canvas.width,height:canvas.height,owner:!window.closed&&!disposed}),blackout:clear};
  paint();
 };
 function dispose(){disposed=true;button.disabled=true;for(const output of outputs)if(!output.closed)output.WispFilmOutput?.blackout();outputs.clear();window.removeEventListener('pagehide',dispose);}
 window.addEventListener('pagehide',dispose,{once:true});
 return {blackout(){for(const output of outputs)if(!output.closed)output.WispFilmOutput?.blackout();},dispose};
}

/** Mirror one composed picture. No second decoder, audio context or microphone. */
export function mountFilmOutput(stage, inspect, {beforePaint, windowName='hauntedpuppet-film-output'}={}) {
 const button=document.createElement('button');button.textContent='Open silent rehearsal output';button.type='button';
 stage.after(button);const outputs=new Map();let disposed=false;
 button.onclick=()=>{
  if(disposed)return;
  for(const [existing,owned] of outputs){
   try{if(!existing.closed&&existing.WispFilmOutput===owned&&owned.inspect().owner){if(owned.inspect().stopped)owned.resume();existing.focus();return;}}catch{}
   outputs.delete(existing);
  }
  const output=window.open('',windowName,'popup,width=960,height=540');
  if(!output){button.textContent='Popup blocked · allow and retry';return;}
  let d;try{d=output.document;output.WispFilmOutput?.dispose?.();}catch{button.textContent='Output window unavailable · close it and retry';return;}
  d.body.replaceChildren();d.title='Wisp · silent rehearsal output';d.body.style.cssText='margin:0;background:black;overflow:hidden';
  const canvas=d.createElement('canvas');canvas.width=stage.width;canvas.height=stage.height;
  canvas.style.cssText='width:100vw;height:100vh;object-fit:contain;background:black;display:block';d.body.append(canvas);
  const context=canvas.getContext('2d'),fullscreen=d.createElement('button');fullscreen.textContent='Full screen';
  fullscreen.style.cssText='position:fixed;top:12px;left:12px;padding:12px';d.body.append(fullscreen);fullscreen.hidden=!!d.fullscreenElement;
  fullscreen.onclick=()=>d.documentElement.requestFullscreen().catch(()=>fullscreen.textContent='Full screen unavailable · retry');
  const onFullscreen=()=>fullscreen.hidden=!!d.fullscreenElement;d.addEventListener('fullscreenchange',onFullscreen);
  let frame=0,stopped=false,stale=false,stalls=0,lastDraw=null,lastChange=output.performance.now(),detached=false;
  const clear=()=>context.clearRect(0,0,canvas.width,canvas.height);
  function paint(){
   if(stopped||detached)return;let state;try{state=!window.closed&&!disposed&&inspect();}catch{}
   if(!state||state.disposed){clear();stopped=true;return;}
   // A live renderer can refresh its owner canvas while this output window is
   // foreground and the operator's requestAnimationFrame is throttled.
   if(beforePaint)try{beforePaint();state=inspect();}catch{clear();stopped=true;return;}
   if(!state||state.disposed){clear();stopped=true;return;}
   const now=output.performance.now(),draws=state.metrics?.draws;if(draws!==lastDraw){lastDraw=draws;lastChange=now;}
   const nextStale=Number.isFinite(draws)&&!state.black&&now-lastChange>1200;if(nextStale&&!stale)stalls++;stale=nextStale;
   if(state.black||stale)clear();else context.drawImage(stage,0,0);frame=output.requestAnimationFrame(paint);
  }
  const stopOutput=()=>{stopped=true;output.cancelAnimationFrame(frame);clear();};
  const onKey=event=>{if(event.key==='Escape')stopOutput();};
  const onHide=()=>{detach();outputs.delete(output);};
  function detach(){if(detached)return;stopOutput();detached=true;output.removeEventListener('keydown',onKey);output.removeEventListener('pagehide',onHide);d.removeEventListener('fullscreenchange',onFullscreen);}
  output.addEventListener('keydown',onKey);output.addEventListener('pagehide',onHide);
  const owned={
   inspect:()=>({silent:true,stopped,stale,stalls,width:canvas.width,height:canvas.height,owner:!detached&&!window.closed&&!disposed}),
   resume:()=>{let state;try{state=inspect();}catch{}if(detached||!state||state.disposed||state.black||state.paused){clear();return false;}stopped=false;stale=false;lastDraw=state.metrics?.draws;lastChange=output.performance.now();output.cancelAnimationFrame(frame);paint();return true;},
   releasePicture:()=>{let state;try{state=inspect()}catch{}if(detached||!state?.black)return false;canvas.width=canvas.width;return true;},
   blackout:clear,stop:stopOutput,dispose:detach
  };
  output.WispFilmOutput=owned;outputs.set(output,owned);paint();
 };
 function dispose(){disposed=true;button.disabled=true;for(const [output,owned]of outputs){try{if(!output.closed&&output.WispFilmOutput===owned)owned.dispose();}catch{}}outputs.clear();window.removeEventListener('pagehide',dispose);}
 window.addEventListener('pagehide',dispose,{once:true});
 return{releasePictures(){let released=0;for(const [output,owned]of outputs){try{if(!output.closed&&output.WispFilmOutput===owned&&owned.releasePicture())released++;}catch{}}return released;},blackout(){for(const [output,owned]of outputs){try{if(!output.closed&&output.WispFilmOutput===owned)owned.blackout();}catch{}}},dispose};
}

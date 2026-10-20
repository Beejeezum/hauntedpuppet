/** Bounded film commands for the existing paired-phone bridge; no audio or capture. */
export function createFilmRemote({chooseCue,startProgram,stop,inspect}){
 const films={'Friendly-Wisp':'cute','Menacing-Wisp':'scary'};
 const shows={'Show-Cute-Only':'cute','Show-Scary-Only':'scary','Show-Alternating':'alternate','Show-Mostly-Scary':'mostly-scary'};
 let restore='cute';
 const interrupted=message=>Object.assign(Error(message),{cancelled:true});
 async function choose(id){await chooseCue(id);const state=inspect();if(state.director.phase==='unavailable')throw Error('Film cue unavailable');if(state.director.current!==id||state.director.phase!=='playing')throw interrupted('Film cue interrupted');restore=id;}
 return{
  async remoteCommand(command,value){
   if(command==='stop'&&value==null||command==='blackout'&&value==='on'){const current=inspect().director.current;if(['cute','scary'].includes(current))restore=current;stop();return{accepted:true};}
   if(command==='blackout'&&value==='off'){await choose(restore);return{accepted:true};}
   if(command==='cue'&&value==='Restore-Picture'){if(!inspect().composition.black&&inspect().director.phase==='playing')return{accepted:true};await choose(restore);return{accepted:true};}
   if(command==='welcome'&&value==null){await choose('cute');return{accepted:true};}
   if(command==='cue'&&Object.hasOwn(films,value)){await choose(films[value]);return{accepted:true};}
   if(command==='cue'&&Object.hasOwn(shows,value)){
    const mode=shows[value];await startProgram(mode);const state=inspect();if(state.director.phase==='unavailable')throw Error('Show film unavailable');if(state.mode!==mode||state.director.phase!=='playing')throw interrupted('Show start interrupted');restore=state.director.current;return{accepted:true};
   }
   throw Error('This control belongs to live puppeteering or is not an enabled film cue');
  },
  remoteState(){const state=inspect(),phase={stopped:'Stage black',preparing:'Preparing next cue',exiting:'Planned exit','empty-stage':'Planned transition',entering:'Arriving',playing:state.director.current==='scary'?'Menacing Wisp':'Friendly Wisp',unavailable:'Film unavailable'}[state.director.phase]||'Stage waiting',program={manual:'Manual cues',cute:'Cute only',scary:'Scary only',alternate:'Alternating','mostly-scary':'Mostly scary'}[state.mode];return{state:{workspace:'films',form:state.director.current==='scary'?'haunting':'friendly',blackout:state.composition.black,loop:state.mode==='manual'?'off':'on',status:(phase+' · '+program).slice(0,120)},cues:[...Object.keys(films),...Object.keys(shows),'Restore-Picture']};}
 };
}

/** Bounded film commands for the existing paired-phone bridge; no audio or capture. */
export function createFilmRemote({chooseCue,startProgram,stop,inspect,clips,programModes,savedPlaylist}){
 const legacy=!clips,friendly=legacy?'cute':clips.find(c=>c.form==='friendly'&&!c.manualOnly)?.id,scary=legacy?'scary':clips.find(c=>c.form==='scary'&&!c.manualOnly)?.id;
 const films=legacy?{'Friendly-Wisp':'cute','Menacing-Wisp':'scary'}:Object.fromEntries(clips.map(c=>[c.id,c.id]));if(friendly)films['Friendly-Wisp']=friendly;if(scary)films['Menacing-Wisp']=scary;
 const advertised=legacy?Object.keys(films):clips.map(c=>c.id);
 const shows={'Show-Cute-Only':'cute','Show-Scary-Only':'scary','Show-Alternating':'alternate','Show-Mostly-Scary':'mostly-scary'};
 if(programModes)for(const name of Object.keys(shows))if(!programModes.includes(shows[name]))delete shows[name];
 let restore=friendly||scary||clips?.[0]?.id;
 const formOf=id=>{const clip=clips?.find(c=>c.id===id);return legacy?(id==='scary'?'scary':'friendly'):clip?.form==='transition'?(clip.exitPort==='scary-rest'?'scary':'friendly'):clip?.form;};
 const interrupted=message=>Object.assign(Error(message),{cancelled:true});
 const selectedSaved=()=>{try{const p=savedPlaylist?.selected();return p&&typeof p.name==='string'&&p.name.trim()?p:null;}catch{return null;}};
 async function choose(id){if(!id)throw Error('No approved film is available');await chooseCue(id);const state=inspect();if(state.director.phase==='unavailable')throw Error('Film cue unavailable');if(state.director.current!==id||state.director.phase!=='playing')throw interrupted('Film cue interrupted');restore=id;}
 return{
  async remoteCommand(command,value){
   if(command==='stop'&&value==null||command==='blackout'&&value==='on'){const current=inspect().director.current;if(legacy?['cute','scary'].includes(current):clips.some(c=>c.id===current))restore=current;stop();return{accepted:true};}
   if(command==='blackout'&&value==='off'){await choose(restore);return{accepted:true};}
   if(command==='cue'&&value==='Restore-Picture'){if(!inspect().composition.black&&inspect().director.phase==='playing')return{accepted:true};await choose(restore);return{accepted:true};}
   if(command==='welcome'&&value==null){await choose(friendly);return{accepted:true};}
   if(command==='cue'&&Object.hasOwn(films,value)){await choose(films[value]);return{accepted:true};}
   if(command==='cue'&&value==='Run-Saved-Playlist'){
    const selected=selectedSaved();if(!selected||typeof savedPlaylist?.run!=='function')throw Error('Select an available saved playlist on the laptop');
    await savedPlaylist.run();const state=inspect();if(state.director.phase==='unavailable')throw Error('Saved show unavailable');if(state.mode!=='playlist'||state.playlist?.name!==selected.name||state.director.phase!=='playing')throw interrupted('Saved show start interrupted');restore=state.director.current;return{accepted:true};
   }
   if(command==='cue'&&Object.hasOwn(shows,value)){
    const mode=shows[value];await startProgram(mode);const state=inspect();if(state.director.phase==='unavailable')throw Error('Show film unavailable');if(state.mode!==mode||state.director.phase!=='playing')throw interrupted('Show start interrupted');restore=state.director.current;return{accepted:true};
   }
   throw Error('This control belongs to live puppeteering or is not an enabled film cue');
  },
  remoteState(){const state=inspect(),selected=selectedSaved(),phase={stopped:'Stage black',preparing:'Preparing next cue',exiting:'Planned exit','empty-stage':'Planned transition',entering:'Arriving',bridging:'Changing form',playing:legacy?(state.director.current==='scary'?'Menacing Wisp':'Friendly Wisp'):(clips.find(c=>c.id===state.director.current)?.title||'On stage'),unavailable:'Film unavailable'}[state.director.phase]||'Stage waiting',program={manual:'Manual cues',cute:'Cute only',scary:'Scary only',alternate:'Alternating','mostly-scary':'Mostly scary',playlist:'Playlist: '+(state.playlist?.name||'saved show')}[state.mode];return{state:{workspace:'films',form:formOf(state.director.current)==='scary'?'haunting':'friendly',blackout:state.composition.black,loop:state.mode==='manual'?'off':'on',status:(phase+' · '+program+(selected&&(state.mode!=='playlist'||state.playlist?.name!==selected.name)?' · ready: '+selected.name:'')).slice(0,120)},cues:[...advertised,...Object.keys(shows),...(selected?['Run-Saved-Playlist']:[]),'Restore-Picture']};}
 };
}

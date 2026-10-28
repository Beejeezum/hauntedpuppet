/** Local operator playlists. Only playable library IDs can be saved or scheduled. */
const controlsBySection=new WeakMap();
export function playlistControls(section){const value=controlsBySection.get(section);if(!value)throw Error('Playlist controls are unavailable');return value;}
export function validatePlaylist(value, available) {
 if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 60 ||
     !Array.isArray(value.steps) || !value.steps.length || value.steps.length > 60) throw Error('Name the playlist and add 1–60 steps.');
 return {name:value.name.trim(),steps:value.steps.map(step=>{
  if (!available.includes(step.cue) || !Number.isInteger(step.seconds) || step.seconds < 5 || step.seconds > 300) throw Error('Choose an available film and a duration from 5–300 seconds.');
  return {cue:step.cue,seconds:step.seconds};
 })};
}
export function recoverPlaylists(value,available,cueAliases={}){
 const playable=[],unavailable=[];
 if(!Array.isArray(value))return{playable,unavailable};
 for(const original of value.slice(0,30)){
  try{playable.push(validatePlaylist({...original,steps:original.steps.map(step=>({...step,cue:cueAliases[step.cue]||step.cue}))},available));}
  catch{unavailable.push(original);}
 }
 return{playable,unavailable};
}
export class PlaylistRunner {
 constructor(){this.stop();}
 start(playlist,available){this.playlist=validatePlaylist(playlist,available);this.index=0;this.since=null;this.pausedAt=null;return this.current().cue;}
 current(){return this.playlist?.steps[this.index]||null;}
 observe(cue,now){if(this.current()?.cue===cue && this.since===null)this.since=now;}
 suspend(paused,now){if(this.since===null)return;if(paused&&this.pausedAt===null)this.pausedAt=now;else if(!paused&&this.pausedAt!==null){this.since+=Math.max(0,now-this.pausedAt);this.pausedAt=null;}}
 due(now){return this.pausedAt===null&&this.since!==null && now-this.since>=this.current().seconds*1000;}
 advance(){if(!this.playlist)return null;this.index=(this.index+1)%this.playlist.steps.length;this.since=null;this.pausedAt=null;return this.current().cue;}
 stop(){this.playlist=null;this.index=0;this.since=null;this.pausedAt=null;}
 inspect(){return {name:this.playlist?.name||null,index:this.index,step:this.current(),since:this.since,paused:this.pausedAt!==null};}
}
export function mountPlaylists(host,{clips,onRun,cueAliases={},description}){
 const key='hauntedpuppet-film-playlists-v1',selectionKey=key+'-selected',available=clips.map(c=>c.id);
 const section=document.createElement('section');section.innerHTML='<h2>Saved playlists</h2><label>Playlist name<input maxlength="60" data-name placeholder="My doorstep show"></label><div data-steps></div><button data-add>Add film step</button><button data-save>Save on this laptop</button><label>Saved shows<select data-saved></select></label><p class="note" data-phone-note>On the phone, “Run selected saved show” starts this saved version. Save edits before sending them to the phone.</p><button data-run>Run playlist on repeat</button><button data-delete>Delete saved playlist</button><p class="note" data-message role="status">Studies use a planned fade through black. Durations are minimum holds; exits finish before the next arrival. No sound or camera starts here.</p>';
 if(description)section.querySelector('[data-message]').textContent=description;
 host.append(section);const $=q=>section.querySelector(q);let saved=[],unavailable=[],selectedName=null;
 try{selectedName=localStorage.getItem(selectionKey);const recovered=recoverPlaylists(JSON.parse(localStorage.getItem(key)||'[]'),available,cueAliases);saved=recovered.playable;unavailable=recovered.unavailable;}catch{saved=[];}
 if(unavailable.length)$('[data-message]').textContent=unavailable.length+' saved show(s) need unavailable films. They remain saved; other shows are ready.';
 function row(step={cue:available[0],seconds:30}){const div=document.createElement('div');div.className='playlist-step';const select=document.createElement('select');select.setAttribute('aria-label','Film for playlist step');for(const c of clips)select.add(new Option(c.title,c.id));select.value=step.cue;const seconds=document.createElement('input');seconds.type='number';seconds.min=5;seconds.max=300;seconds.value=step.seconds;seconds.setAttribute('aria-label','Minimum seconds for playlist step');const remove=document.createElement('button');remove.textContent='Remove step';remove.onclick=()=>div.remove();div.append(select,seconds);for(const [text,direction] of [['Move earlier',-1],['Move later',1]]){const move=document.createElement('button');move.textContent=text;move.onclick=()=>{if(direction<0&&div.previousElementSibling)div.previousElementSibling.before(div);else if(direction>0&&div.nextElementSibling)div.nextElementSibling.after(div);};div.append(move);}div.append(remove);$('[data-steps]').append(div);}
 const draft=()=>validatePlaylist({name:$('[data-name]').value,steps:[...section.querySelectorAll('.playlist-step')].map(r=>({cue:r.querySelector('select').value,seconds:Number(r.querySelector('input').value)}))},available);
 function remember(name){selectedName=name||null;try{if(selectedName)localStorage.setItem(selectionKey,selectedName);else localStorage.removeItem(selectionKey);}catch{}}
 function load(){const p=saved[Number($('[data-saved]').value)];if(!p)return;$('[data-name]').value=p.name;$('[data-steps]').replaceChildren();p.steps.forEach(row);}
 function refresh(index=Math.max(0,saved.findIndex(p=>p.name===selectedName))){$('[data-saved]').replaceChildren(...saved.map((p,i)=>new Option(p.name,String(i))));$('[data-saved]').value=String(index);$('[data-delete]').disabled=!saved.length;$('[data-phone-note]').hidden=!saved.length;}
 const attempt=fn=>{try{Promise.resolve(fn()).catch(e=>$('[data-message]').textContent=e.message);}catch(e){$('[data-message]').textContent=e.message;}};
 $('[data-add]').onclick=()=>{if(section.querySelectorAll('.playlist-step').length>=60)return;row();};
 $('[data-save]').onclick=()=>attempt(()=>{const p=draft(),index=saved.findIndex(s=>s.name===p.name),next=saved.slice();if(index<0){if(next.length+unavailable.length>=30)throw Error('Delete a saved playlist before adding another.');next.push(p);}else next[index]=p;localStorage.setItem(key,JSON.stringify([...next,...unavailable]));saved=next;remember(p.name);refresh(index<0?saved.length-1:index);$('[data-message]').textContent='Saved on this laptop. Playback has not started.';});
 $('[data-delete]').onclick=()=>attempt(()=>{const next=saved.filter((_,i)=>i!==Number($('[data-saved]').value));localStorage.setItem(key,JSON.stringify([...next,...unavailable]));saved=next;refresh();load();remember(saved[Number($('[data-saved]').value)]?.name);});
 const run=async p=>{await onRun(p);$('[data-message]').textContent='Repeating '+p.name+'. Manual cues or Blackout stop the playlist.';return p.name;};
 $('[data-run]').onclick=()=>attempt(()=>run(draft()));
 $('[data-saved]').onchange=()=>{load();remember(saved[Number($('[data-saved]').value)]?.name);};refresh();if(saved.length)load();else row();
 if(!available.length){for(const button of section.querySelectorAll('button'))button.disabled=true;$('[data-message]').textContent='No films are ready for automatic playlists.';}
 // Phone launch reads the selected saved record afresh, never the editable draft.
 const selected=()=>{const name=saved[Number($('[data-saved]').value)]?.name;if(!name)return null;try{return recoverPlaylists(JSON.parse(localStorage.getItem(key)||'[]'),available,cueAliases).playable.find(p=>p.name===name)||null;}catch{return null;}};
 controlsBySection.set(section,{selected,run:()=>{const p=selected();if(!p)throw Error('Select an available saved playlist on the laptop');return run(p);}});
 return section;
}

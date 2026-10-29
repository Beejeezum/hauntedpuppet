/** Operator pad bank. Recording appends IDs to the existing editable playlist;
 * it never starts sound or bypasses the transport's transition rules. */
export function mountCueBoard(host,{clips,inventory,playlists,chooseCue,stop,runSaved,toggleSound,openOutput,onError=()=>{}}){
 let recording=false,disposed=false;const keys='1234567890qwerty';
 const bar=document.createElement('div');bar.className='cue-board-toolbar';
 const label=document.createElement('p');label.setAttribute('role','status');label.textContent='LIVE · tap a film to cue it';
 const record=document.createElement('button');record.textContent='Record cue order';record.setAttribute('aria-pressed','false');
 const change=()=>{record.setAttribute('aria-pressed',String(recording));record.textContent=recording?'Finish recording':'Record cue order';label.textContent=recording?'RECORDING ORDER · taps add steps, without playing':'LIVE · tap a film to cue it';host.classList.toggle('recording',recording);};
 record.onclick=()=>{recording=!recording;change();};bar.append(record,label);host.before(bar);
 const error=e=>{label.textContent=e.message;onError(e);};const attempt=fn=>{try{Promise.resolve(fn()).catch(error);}catch(e){error(e);}};
 const pads=[];
 const fire=clip=>attempt(()=>{if(!recording)return chooseCue(clip.id);if(clip.manualOnly)throw Error('Operator-only scare: play it live, outside unattended shows');playlists.append(clip.id);label.textContent='ADDED '+playlists.draft().steps.length+' · '+clip.title;});
 const aliases={'friendly-drift':'cute','scary-drift':'scary'};
 for(const [index,item] of inventory.entries()){
  const clip=clips.find(c=>c.id===item.id||c.id===aliases[item.id]);const button=document.createElement('button');button.className='cue-pad '+(item.form==='scary'?'scary':item.form==='friendly'?'friendly':'transition');button.innerHTML='<span class="pad-number"></span><strong></strong><small></small><span class="cue-state" aria-hidden="true"></span>';
  button.querySelector('.pad-number').textContent=String(index+1).padStart(2,'0')+' · '+(keys[index]||'');button.querySelector('strong').textContent=item.title;
  button.querySelector('small').textContent=clip?(clip.detail||'Ready'):'Film still in production';button.disabled=!clip;
  if(clip){if(clip.manualOnly)button.setAttribute('aria-description','Operator-only scare. Play live; unavailable for unattended shows.');button.setAttribute('aria-label',clip.title===item.title?item.title:clip.title+' · '+item.title);button.dataset.cue=clip.id;button.onclick=()=>fire(clip);}else button.title='This film has not been finished. No placeholder will play.';
  pads.push({button,clip});host.append(button);
 }
 const actions=[['▶ Play draft',()=>{recording=false;change();return playlists.runDraft();}],['■ Blackout',stop],['↶ Undo last step',()=>playlists.undo()],['Save playlist',()=>{playlists.save();label.textContent='Playlist saved on this laptop';}],['Run saved show',runSaved],['Clear draft',()=>{playlists.clear();label.textContent='Draft cleared · saved shows kept';}],['Laptop sound',toggleSound],['Projector output',openOutput]];
 for(const [name,fn]of actions){const button=document.createElement('button');button.className='cue-pad action';button.textContent=name;button.onclick=()=>attempt(fn);host.append(button);}
 const keyboard=event=>{if(disposed||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.target.closest('input,textarea,select,[contenteditable="true"],dialog'))return;const index=keys.indexOf(event.key.toLowerCase());if(index<0||!pads[index]?.clip||pads[index].button.disabled)return;event.preventDefault();fire(pads[index].clip);};
 document.addEventListener('keydown',keyboard);
 return{inspect:()=>({recording,pads:pads.length,available:pads.filter(p=>p.clip).length}),dispose(){disposed=true;document.removeEventListener('keydown',keyboard);}};
}

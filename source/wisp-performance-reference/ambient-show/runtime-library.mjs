import {CatalogCueDirector} from './catalog-director.mjs';
const forms=['friendly','scary','transition','atmosphere'],idPattern=/^[a-z0-9][a-z0-9-]{0,63}$/;
export function validateRuntime(library){
 if(library?.schema!==1||!Array.isArray(library.clips)||library.clips.length>64||!Array.isArray(library.routes)||library.routes.length>4096)throw Error('Invalid playback library');
 for(const c of library.clips){
  const src=typeof c.src==='string'&&(!c.src.includes('..'))&&(/^\.\/[a-z0-9-]+-[a-f0-9]{12}\.mp4$/.test(c.src)||/^\/source\/wisp-performance-reference\/[a-zA-Z0-9/_-]+\.mp4$/.test(c.src));
  if(!idPattern.test(c.id)||typeof c.id!=='string'||!forms.includes(c.form)||typeof c.title!=='string'||!c.title.trim()||c.title.length>120||!src||!/^[a-f0-9]{64}$/.test(c.sha256)||!['empty','friendly-rest','scary-rest'].includes(c.entryPort)||!['empty','friendly-rest','scary-rest'].includes(c.exitPort)||c.exitPolicy!=='finish'||typeof c.loop!=='boolean'||typeof c.manualOnly!=='boolean')throw Error('Invalid approved cue');
 }
 for(const r of library.routes)if(r.kind==='empty-stage'&&(!Number.isFinite(r.minimumBlackMs)||r.minimumBlackMs<500||r.minimumBlackMs>300000))throw Error('Invalid empty-stage timing');
 const director=new CatalogCueDirector({},library);for(const route of library.routes)director.resolve(route.from,route.to);
 return library;
}
export async function loadRuntime(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('Playback library unavailable');return validateRuntime(await r.json());}
export function cueForm(clip){return clip?.form==='transition'?(clip.exitPort==='scary-rest'?'scary':'friendly'):clip?.form;}
export class ProgramPicker {
 constructor(library){this.clips=library.clips;this.routes=new Set(library.routes.map(r=>r.from+'>'+r.to));this.reset();}
 reset(){this.cursor={friendly:0,scary:0};}
 can(from,to){return !from||this.routes.has(from+'>'+to);}
 pool(form){return this.clips.filter(c=>c.form===form&&!c.manualOnly);}
 assertMode(mode){
  if(!['cute','scary','alternate','mostly-scary'].includes(mode))throw Error('Unknown show mode');
  const required=mode==='cute'?['friendly']:mode==='scary'?['scary']:['friendly','scary'];
  for(const form of required){const pool=this.pool(form);if(!pool.length)throw Error('No approved '+form+' films for this program');
   for(const from of pool)for(const targetForm of required)if(!this.pool(targetForm).every(to=>this.can(from.id,to.id)))throw Error('Program still needs reviewed transitions');
  }
 }
 pick(form,current){
  const pool=this.pool(form),compatible=pool.filter(c=>this.can(current,c.id));if(!compatible.length)throw Error('No reviewed '+form+' destination');
  const others=compatible.filter(c=>c.id!==current),allowed=others.length?others:compatible;
  for(let n=0;n<pool.length;n++){const i=(this.cursor[form]+n)%pool.length;if(allowed.includes(pool[i])){this.cursor[form]=(i+1)%pool.length;return pool[i].id;}}
 }
}

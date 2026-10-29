/** Rehearsal variety only: whole films with the desk's fade-through-black exits.
 * Never grants an approved catalog route or selects an operator-only scare. */
export class RehearsalProgram {
 constructor(clips){this.clips=clips;this.reset();}
 reset(){this.cursor={friendly:0,scary:0};}
 pool(form){if(!['friendly','scary'].includes(form))throw Error('Choose a friendly or scary program');return this.clips.filter(c=>c.form===form&&!c.manualOnly);}
 pick(form,current){
  const pool=this.pool(form);if(!pool.length)throw Error('No rehearsal films for this form');
  const start=this.cursor[form];for(let n=0;n<pool.length;n++){const index=(start+n)%pool.length,clip=pool[index];if(pool.length>1&&clip.id===current)continue;this.cursor[form]=(index+1)%pool.length;return clip.id;}
 }
}

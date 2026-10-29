/** Keep one real stage canvas: desktop preview beside the bank, stacked on phones. */
export function mountCueLayout({main,primary,aside,stage}){
 const query=matchMedia('(min-width:1100px)');let disposed=false;
 const apply=()=>{if(disposed)return;const desktop=query.matches,target=desktop?aside:primary;if(stage.parentNode!==target)target.prepend(stage);main.dataset.cueLayout=desktop?'console':'stacked';};
 query.addEventListener('change',apply);apply();
 return{dispose(){disposed=true;query.removeEventListener('change',apply);}};
}

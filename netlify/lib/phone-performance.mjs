/** Bounded direction, never provider options, URLs, credentials or audio. */
export function validPhonePerformance(value,state,cues){
 return state?.workspace==='director' && value!==null && typeof value==='object' && !Array.isArray(value)
  && Object.keys(value).sort().join(',')==='animation,character,mode,text'
  && typeof value.text==='string' && [...value.text].length<=400 && value.text.trim().length>0
  && !/[\u0000-\u0008\u000b-\u001f]/.test(value.text)
  && ['exact','prompt'].includes(value.mode) && ['friendly','scary'].includes(value.character)
  && typeof value.animation==='string' && cues.includes(value.animation);
}

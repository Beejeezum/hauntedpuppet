const shapes=new Set(['rest','A','E','O','U','MBP','FV','L','TH','CH','S']);
/** Automatic timings require human review; painted atlas supports only coarse AH/OO/EE. */
export function validateMouthTimeline(cues,duration){
 if(!Array.isArray(cues)||!cues.length||cues.length>5000||!Number.isFinite(duration)||duration<=0)throw Error('Invalid mouth timing track');
 let previous=0;return cues.map(c=>{if(!c||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<previous||c.end<=c.start||c.end>duration+.001||!shapes.has(c.shape))throw Error('Mouth timing track is out of order or unavailable');previous=c.end;return{start:c.start,end:c.end,shape:c.shape};});
}
export function mouthAt(cues,at){
 if(!Number.isFinite(at)||at<0)return{rest:1};let low=0,high=cues.length-1;
 while(low<=high){const mid=(low+high)>>1,c=cues[mid];if(at<c.start)high=mid-1;else if(at>=c.end)low=mid+1;else{const shape=c.shape==='A'?'AH':c.shape==='O'||c.shape==='U'?'OO':['E','L','TH','CH','S'].includes(c.shape)?'EE':null;return shape?{rest:.15,[shape]:.85}:{rest:1};}}
 return{rest:1};
}

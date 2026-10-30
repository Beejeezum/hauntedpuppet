/** Experimental fixed-film normalized-color matching. Exact source hash and
 * unknown/ambiguous rejection remain mandatory; no clock fallback or artwork
 * approval. Source-only neutral film registration; not attached to any runtime mouth. Default routes stay unchanged. */
function normalized(bytes){
 const count=bytes.length/3,values=new Float64Array(count);let mean=0;
 for(let i=0;i<count;i++){values[i]=(bytes[i*3]+2*bytes[i*3+1]+bytes[i*3+2])/4;mean+=values[i]/count;}
 let squared=0;for(const value of values)squared+=(value-mean)**2;
 if(squared/count<1)return null;const result=new Float32Array(count),scale=Math.sqrt(squared);
 for(let i=0;i<count;i++)result[i]=(values[i]-mean)/scale;
 return result;
}
export class NeutralCanonicalPictureRegistration{
 constructor(profile){
  if(profile?.sourceSha256!=='27ac763bbf5d6349737b751a22abae5adba410872a5fd2d08b4bd483157750eb'||profile.width!==1088||profile.height!==704||profile.frames!==193||profile.fps!==24||profile.crop?.x!==490||profile.crop.y!==295||profile.crop.width!==100||profile.crop.height!==85||profile.sample?.offset!==1||profile.sample.xStep!==3||profile.sample.yStep!==2||profile.sample.radius!==1||profile.fingerprints?.length!==193)throw Error('Unsupported canonical references');
  this.refs=profile.fingerprints.map(value=>{if(typeof value!=='string'||value.length!==5544||!/^[A-Za-z0-9+/]+$/.test(value))throw Error('Invalid canonical samples');const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));if(bytes.length!==4158)throw Error('Invalid canonical sample size');const result=normalized(bytes);if(!result)throw Error('Uninformative canonical reference');return result;});this.calls=this.matches=this.rejected=this.cached=0;this.last=null;this.result=null;this.disposed=false;
 }
 match(packet){
  if(this.disposed||packet?.canvas?.width!==1088||packet.canvas.height!==704)return null;
  this.calls++;const rgba=packet.canvas.getContext('2d').getImageData(490,295,100,85).data,bytes=new Uint8Array(4158);let at=0;for(let y=1;y<85;y+=2)for(let x=1;x<100;x+=3)for(let c=0;c<3;c++){let sum=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)sum+=rgba[((y+dy)*100+x+dx)*4+c];bytes[at++]=Math.round(sum/9);}
  if(this.last&&bytes.every((v,i)=>v===this.last[i])){this.cached++;return this.result;}this.last=bytes;
  const values=normalized(bytes);if(!values){this.rejected++;this.result=null;return null;}
  let best=-1,score=-Infinity,second=-Infinity;
  for(let i=0;i<this.refs.length;i++){let sum=0;for(let p=0;p<values.length;p++)sum+=values[p]*this.refs[i][p];if(sum>score){second=score;score=sum;best=i}else second=Math.max(second,sum);}
  const margin=score-second;this.candidate={frame:best,correlation:score,margin};
  if(score<.998||margin<.00015){this.rejected++;this.result=null;return null;}
  this.matches++;return this.result={frame:best,time:best/24,correlation:score,margin,source:'neutral-canonical-picture-study'};
 }
 reset(){this.last=null;this.result=null;this.candidate=null;}
 inspect(){return{calls:this.calls,matches:this.matches,rejected:this.rejected,cached:this.cached,frame:this.result?.frame??null,candidate:this.candidate??null,disposed:this.disposed};}
 dispose(){if(this.disposed)return;this.disposed=true;this.refs=[];this.last=null;this.result=null;this.candidate=null;}
}

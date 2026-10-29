/** Experimental fixed-film normalized-color matching. Exact source hash and
 * unknown/ambiguous rejection remain mandatory; no clock fallback or artwork
 * approval. Source-only scary film registration; not attached to any runtime mouth. Default routes stay unchanged. */
function normalized(bytes){
 const mean=[0,0,0],count=bytes.length/3;for(let i=0;i<bytes.length;i++)mean[i%3]+=bytes[i]/count;
 const rms=[0,0,0];for(let i=0;i<bytes.length;i++){const d=bytes[i]-mean[i%3];rms[i%3]+=d*d/count;}
 if(rms.some(v=>v<1))return null;const scale=rms.map(v=>Math.sqrt(v*bytes.length)),result=new Float32Array(bytes.length);for(let i=0;i<bytes.length;i++)result[i]=(bytes[i]-mean[i%3])/scale[i%3];return result;
}
export class ScaryCanonicalPictureRegistration{
 constructor(profile){
  if(profile?.sourceSha256!=='21e8efec67ec7e024fc954cc16af458cad8f8427553a998341ff9d37286ca35a'||profile.width!==1280||profile.height!==720||profile.frames!==121||profile.fps!==24||profile.crop?.x!==540||profile.crop.y!==240||profile.crop.width!==200||profile.crop.height!==180||profile.sample?.offset!==2||profile.sample.xStep!==10||profile.sample.yStep!==4||profile.fingerprints?.length!==121)throw Error('Unsupported canonical references');
  this.refs=profile.fingerprints.map(value=>{if(typeof value!=='string'||value.length!==3600||!/^[A-Za-z0-9+/]+$/.test(value))throw Error('Invalid canonical samples');const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));if(bytes.length!==2700)throw Error('Invalid canonical sample size');const result=normalized(bytes);if(!result)throw Error('Uninformative canonical reference');return result;});this.calls=this.matches=this.rejected=this.cached=0;this.last=null;this.result=null;this.disposed=false;
 }
 match(packet){
  if(this.disposed||packet?.canvas?.width!==1280||packet.canvas.height!==720)return null;
  this.calls++;const rgba=packet.canvas.getContext('2d').getImageData(540,240,200,180).data,bytes=new Uint8Array(2700);let at=0;for(let y=2;y<180;y+=4)for(let x=2;x<200;x+=10)for(let c=0;c<3;c++)bytes[at++]=rgba[(y*200+x)*4+c];
  if(this.last&&bytes.every((v,i)=>v===this.last[i])){this.cached++;return this.result;}this.last=bytes;
  const values=normalized(bytes);if(!values){this.rejected++;this.result=null;return null;}
  let best=-1,score=-Infinity,second=-Infinity;
  for(let i=0;i<this.refs.length;i++){let sum=0;for(let p=0;p<values.length;p++)sum+=values[p]*this.refs[i][p];if(sum>score){second=score;score=sum;best=i}else second=Math.max(second,sum);}
  const margin=score-second;
  if(score<.998||margin<.00015){this.rejected++;this.result=null;return null;}
  this.matches++;return this.result={frame:best,time:best/24,correlation:score,margin,source:'canonical-picture-study'};
 }
 reset(){this.last=null;this.result=null;}
 inspect(){return{calls:this.calls,matches:this.matches,rejected:this.rejected,cached:this.cached,frame:this.result?.frame??null,disposed:this.disposed};}
 dispose(){if(this.disposed)return;this.disposed=true;this.refs=[];this.last=null;this.result=null;}
}

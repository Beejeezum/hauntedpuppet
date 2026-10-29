/** Source-only fixed-film registration study. References are actual centered
 * source-frame samples decoded by the same browser. No clock-based fallback.
 * A different film/color path must fail closed, not pick a plausible face pose.
 */
export class NativePictureRegistration{
 constructor(profile){
  if(profile?.sourceSha256!=='52d54d03c0f0406a9724c7c04b9e2fa0557a675486edfaa40fd0ca2e24a682bd'||profile.width!==1916||profile.height!==1080||profile.frames!==122||profile.fps!==24||profile.crop?.x!==850||profile.crop.y!==370||profile.crop.width!==220||profile.crop.height!==240||profile.sample?.offset!==2||profile.sample.step!==4||profile.fingerprints?.length!==122)throw Error('Unsupported native frame references');
  this.refs=profile.fingerprints.map(value=>{if(typeof value!=='string'||value.length!==13200||!/^[A-Za-z0-9+/]+$/.test(value))throw Error('Invalid native picture samples');const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));if(bytes.length!==9900)throw Error('Invalid native picture sample size');return bytes;});this.last=null;this.result=null;this.calls=0;this.matches=0;this.rejected=0;this.cached=0;this.disposed=false;
 }
 match(packet){
  if(this.disposed||packet?.canvas?.width!==1916||packet.canvas.height!==1080)return null;
  this.calls++;const rgba=packet.canvas.getContext('2d').getImageData(850,370,220,240).data,values=new Uint8Array(9900);let at=0;for(let y=2;y<240;y+=4)for(let x=2;x<220;x+=4)for(let c=0;c<3;c++)values[at++]=rgba[(y*220+x)*4+c];
  if(this.last&&values.every((v,i)=>v===this.last[i])){this.cached++;return this.result;}
  this.last=values;let best=-1,error=Infinity,second=Infinity;
  for(let i=0;i<this.refs.length;i++){let sum=0;for(let p=0;p<values.length;p++){const d=values[p]-this.refs[i][p];sum+=d*d;}if(sum<error){second=error;error=sum;best=i}else second=Math.min(second,sum);}
  const mse=error/values.length,secondMse=second/values.length;
  if(mse>1||secondMse-mse<1){this.rejected++;this.result=null;return null;}
  this.matches++;return this.result={frame:best,time:best/24,mse,secondMse,source:'same-browser-picture-study'};
 }
 reset(){this.last=null;this.result=null;}
 inspect(){return{calls:this.calls,matches:this.matches,rejected:this.rejected,cached:this.cached,frame:this.result?.frame??null,disposed:this.disposed};}
 dispose(){if(this.disposed)return;this.disposed=true;this.refs=[];this.last=null;this.result=null;}
}

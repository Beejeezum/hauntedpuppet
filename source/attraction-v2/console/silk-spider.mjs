/** Articulated painted raster study: eight independently jointed legs on one body.
 * The sheet is original generated artwork; silk and joint motion are runtime animation.
 * No video, audio, microphone, provider or external dependency is used here. */
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x);return clamp(x*x*x*(x*(x*6-15)+10));};
const lerp=(a,b,t)=>a+(b-a)*t;
const len=v=>Math.hypot(...v),sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],add=(a,b)=>[a[0]+b[0],a[1]+b[1]],mul=(a,n)=>[a[0]*n,a[1]*n];
const unit=v=>mul(v,1/(len(v)||1));
const sourceLegs=[
 [[588,110],[675,54],[875,218],[1005,462]],
 [[1130,112],[1204,58],[1416,224],[1599,468]],
 [[598,542],[686,480],[900,663],[1041,906]],
 [[1133,537],[1210,480],[1431,667],[1608,904]],
];
const restAngles=[[-1.72,-.18,1.22],[-.72,.48,1.54],[.12,.90,1.82],[.62,1.40,1.95]];
const roots=[[55,-30],[65,-12],[70,10],[52,30]],lengths=[[60,110,120],[70,100,135],[65,115,135],[60,110,130]];
const body={sx:50,sy:40,sw:500,sh:850,x:-100,y:-210,w:200,h:340};
const attachmentY=body.y+28;
const imageHash='942f2d56172308bd47be007f8405e064b2caeb6c374dc979c53cce6a95e41c93';

export function silkBeat(elapsed){
 const cycle=Math.max(0,Math.floor(elapsed/36)),t=Math.max(0,elapsed)%36;
 const down=smooth((t-4)/4.5),up=smooth((t-20)/5),recoil=smooth((t-19)/.65)*(1-smooth((t-20)/1.5));
 const reach=smooth((t-15.4)/1.3)*(1-smooth((t-18.4)/.6));
 const climb=smooth((t-20)/.4)*(1-smooth((t-24.6)/.4)),lower=Math.sin(Math.PI*down);
 return {cycle,t,alpha:smooth((t-3)/1)*(1-smooth((t-25)/1)),x:[640,370,900,550][cycle%4],y:190+170*down*(1-up)-25*recoil,scale:.55,reach,climb,lower,phase:t<3||t>=26?'empty':t<4?'emerge':t<8.5?'descend':t<15.4?'watch':t<19?'reach':t<20?'recoil':t<25?'climb':'leave'};
}

export function legPose(pair,side,beat){
 const {t,reach,climb,lower}=beat,angles=restAngles[pair].slice();
 const crawl=climb*Math.sin((t-20)*7+pair*1.8+side*1.1);
 const breathe=Math.sin(t*1.25+pair*1.45+side*.7);
 angles[0]+=.055*breathe+.17*crawl+(pair>=2?-.3*reach:reach*.08);
 angles[1]+=.07*Math.sin(t*1.7+pair*1.7+side*.8)+.22*crawl+(pair>=2?-.46*reach:0)+lower*.08;
 angles[2]+=.06*Math.sin(t*1.4+pair*1.9+side*.6)+climb*.18*Math.cos((t-20)*7+pair*1.8+side*1.1)+(pair>=2?-.38*reach:0);
 const points=[roots[pair].slice()];for(let i=0;i<3;i++)points.push(add(points[i],[Math.cos(angles[i])*lengths[pair][i],Math.sin(angles[i])*lengths[pair][i]]));
 return points.map(([x,y])=>[x*side,y]);
}

function boneMap(point,a,b,p,q){const v=sub(b,a),w=sub(q,p),d=len(v),scale=len(w)/d,angle=Math.atan2(w[1],w[0])-Math.atan2(v[1],v[0]),local=sub(point,a);return add(p,[scale*(local[0]*Math.cos(angle)-local[1]*Math.sin(angle)),scale*(local[0]*Math.sin(angle)+local[1]*Math.cos(angle))]);}
function ribbon(joints){
 const widths=[65,58,40,7],rows=[];
 for(let bone=0;bone<3;bone++)for(let step=0;step<5;step++){
  if(bone&&step===0)continue;const t=step/4,center=add(joints[bone],mul(sub(joints[bone+1],joints[bone]),t));
  let tangent=unit(sub(joints[bone+1],joints[bone]));
  if(step===0&&bone)tangent=unit(add(tangent,unit(sub(joints[bone],joints[bone-1]))));
  if(step===4&&bone<2)tangent=unit(add(tangent,unit(sub(joints[bone+2],joints[bone+1]))));
  const n=[-tangent[1],tangent[0]],width=lerp(widths[bone],widths[bone+1],t);
  rows.push({bone,t,points:[add(center,mul(n,-width)),add(center,mul(n,width))]});
 }
 return rows;
}
function deform(point,row,source,target){
 const {bone,t}=row,own=boneMap(point,source[bone],source[bone+1],target[bone],target[bone+1]);
 if(t===1&&bone<2){const next=boneMap(point,source[bone+1],source[bone+2],target[bone+1],target[bone+2]);return mul(add(own,next),.5);}
 return own;
}
function triangle(ctx,image,src,dst){
 const [a,b,c]=src,[u,v,w]=dst,d=(b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]);if(Math.abs(d)<.00001)return;
 const sx=( (v[0]-u[0])*(c[1]-a[1])-(w[0]-u[0])*(b[1]-a[1]))/d;
 const shx=(-(v[0]-u[0])*(c[0]-a[0])+(w[0]-u[0])*(b[0]-a[0]))/d;
 const shy=((v[1]-u[1])*(c[1]-a[1])-(w[1]-u[1])*(b[1]-a[1]))/d;
 const sy=(-(v[1]-u[1])*(c[0]-a[0])+(w[1]-u[1])*(b[0]-a[0]))/d;
 const center=mul(add(add(u,v),w),1/3),expanded=dst.map(p=>add(p,mul(unit(sub(p,center)),.3)));
 ctx.save();ctx.beginPath();expanded.forEach((p,i)=>ctx[i?'lineTo':'moveTo'](...p));ctx.closePath();ctx.clip();ctx.transform(sx,shy,shx,sy,u[0]-sx*a[0]-shx*a[1],u[1]-shy*a[0]-sy*a[1]);ctx.drawImage(image,0,0);ctx.restore();
}

export class SilkSpider {
 constructor({light=.16}={}){this.light=clamp(Number.isFinite(light)?light:.16,0,.24);this.ready=false;this.disposed=false;this.running=false;this.frames=0;this.theta=.045;this.angularVelocity=0;this.meshes=sourceLegs.map(ribbon);this.rigCanvas=document.createElement('canvas');this.rigCanvas.width=this.rigCanvas.height=720;this.rig=this.rigCanvas.getContext('2d');}
 async load(){
  this.controller=new AbortController();const timer=setTimeout(()=>this.controller.abort(),12000);
  try{
   const response=await fetch('./media/spider-rig-sheet-v1.png',{signal:this.controller.signal});if(!response.ok)throw Error('Spider artwork unavailable');
   const bytes=await response.arrayBuffer();if(bytes.byteLength>6000000)throw Error('Spider artwork exceeds its limit');
   const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==imageHash)throw Error('Spider artwork changed; refresh before playing');
   this.image=await createImageBitmap(new Blob([bytes],{type:'image/png'}));if(this.image.width!==1672||this.image.height!==941)throw Error('Spider artwork dimensions changed');
   if(this.disposed){this.image.close();this.image=null;return;}this.ready=true;
  }catch(error){this.image?.close();this.image=null;if(!this.disposed)this.error=this.controller.signal.aborted?'Spider artwork load timed out':error.message;}
  finally{clearTimeout(timer);}
 }
 start(now){this.stop();this.started=now;this.running=true;this.last=now;this.cycle=-1;}
 stop(){this.running=false;this.theta=.045;this.angularVelocity=0;this.last=null;this.bounds=null;this.beat=null;}
 draw(ctx,now){
  if(!this.running||!this.ready||this.disposed)return;
  const beat=silkBeat(now-this.started),dt=clamp(now-(this.last??now),0,.05);this.last=now;
  if(beat.cycle!==this.cycle){this.theta=.045*(beat.cycle%2?-1:1);this.angularVelocity=0;this.cycle=beat.cycle;}
  const threadLength=beat.y+attachmentY*beat.scale-10;
  this.angularVelocity+=(-1200/threadLength*Math.sin(this.theta)-1.1*this.angularVelocity+beat.climb*.06*Math.sin(beat.t*7))*dt;this.theta+=this.angularVelocity*dt;
  const x=beat.x+Math.sin(this.theta)*threadLength,y=beat.y,roll=this.theta*.4+Math.sin(beat.t*1.35)*.008;
  this.beat=beat;this.bounds=null;if(beat.alpha<.001)return;
  ctx.save();ctx.globalCompositeOperation='source-over';ctx.globalAlpha*=beat.alpha;
  const silkTip=[x-Math.sin(roll)*attachmentY*beat.scale,y+Math.cos(roll)*attachmentY*beat.scale];
  const gradient=ctx.createLinearGradient(beat.x,10,...silkTip);gradient.addColorStop(0,'rgba(180,181,166,0)');gradient.addColorStop(.22,'rgba(180,181,166,.45)');gradient.addColorStop(1,'rgba(228,220,195,.85)');ctx.strokeStyle=gradient;ctx.lineWidth=.85;ctx.beginPath();ctx.moveTo(beat.x,10);ctx.quadraticCurveTo(beat.x+(silkTip[0]-beat.x)*.25,(silkTip[1]+10)*.5,...silkTip);ctx.stroke();
  // Compose opaque body-over-leg occlusion before applying the appearance envelope.
  const rig=this.rig;rig.clearRect(0,0,720,720);rig.save();rig.translate(360,300);const vertices=[];
  for(let pair=0;pair<4;pair++)for(const side of [-1,1]){
   const target=legPose(pair,side,beat),source=sourceLegs[pair],rows=this.meshes[pair];
   const mapped=rows.map(row=>row.points.map(p=>deform(p,row,source,target)));vertices.push(...mapped.flat());
   for(let j=0;j<rows.length-1;j++){
    triangle(rig,this.image,[rows[j].points[0],rows[j].points[1],rows[j+1].points[0]],[mapped[j][0],mapped[j][1],mapped[j+1][0]]);
    triangle(rig,this.image,[rows[j].points[1],rows[j+1].points[1],rows[j+1].points[0]],[mapped[j][1],mapped[j+1][1],mapped[j+1][0]]);
   }
  }
  rig.drawImage(this.image,body.sx,body.sy,body.sw,body.sh,body.x,body.y,body.w,body.h);rig.restore();
  // A little ambient light raises painted shadow detail without changing alpha,
  // silhouette, geometry or the source artwork. Canvas filters are absent in WebKit.
  if(this.light){rig.save();rig.globalCompositeOperation='source-atop';rig.globalAlpha=this.light;rig.fillStyle='rgb(230,235,242)';rig.fillRect(0,0,720,720);rig.restore();}
  ctx.translate(x,y);ctx.rotate(roll);ctx.scale(beat.scale,beat.scale);ctx.drawImage(this.rigCanvas,-360,-300);ctx.restore();
  vertices.push([body.x,body.y],[body.x+body.w,body.y],[body.x,body.y+body.h],[body.x+body.w,body.y+body.h]);
  const world=vertices.map(p=>[x+beat.scale*(p[0]*Math.cos(roll)-p[1]*Math.sin(roll)),y+beat.scale*(p[0]*Math.sin(roll)+p[1]*Math.cos(roll))]);
  this.bounds={minX:Math.min(...world.map(p=>p[0])),maxX:Math.max(...world.map(p=>p[0])),minY:Math.min(...world.map(p=>p[1])),maxY:Math.max(...world.map(p=>p[1]))};this.frames++;
 }
 dispose(){this.stop();this.disposed=true;this.controller?.abort();this.image?.close();this.image=null;this.rigCanvas.width=this.rigCanvas.height=0;this.ready=false;}
 inspect(){return{ready:this.ready,running:this.running,disposed:this.disposed,error:this.error||null,frames:this.frames,phase:this.beat?.phase||'empty',cycle:this.cycle,bounds:this.bounds,legs:8,light:this.light,source:'original painted body and four mirrored articulated raster legs',audio:false};}
}

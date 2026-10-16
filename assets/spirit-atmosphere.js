/** Painted vapor emitted at the body, then released into the world with drag and settling. */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class SpiritAtmosphere {
 constructor(){this.particles=[];this.previous=null;this.serial=0;this.credit=0;this.ready=false;this.frames=0;}
 async load(base='/assets/spirit-effects/'){try{const r=await fetch(base+'manifest.json');if(!r.ok)throw Error('Vapor atlas unavailable');const m=await r.json();if(m.image!=='vapor-atlas.png'||m.cells?.length!==6)throw Error('Invalid vapor atlas');const image=new Image();image.src=base+m.image;await image.decode();if(image.naturalWidth!==m.canvas[0]||image.naturalHeight!==m.canvas[1])throw Error('Vapor canvas mismatch');for(const cell of m.cells)if(cell.length!==4||!cell.every(Number.isFinite)||cell[2]<=0||cell[3]<=0||cell[0]<0||cell[1]<0||cell[0]+cell[2]>image.width||cell[1]+cell[3]>image.height)throw Error('Invalid vapor cell');this.image=image;this.manifest=m;this.ready=true;}catch(e){this.error=e.message;}return this;}
 clear(){this.particles.length=0;this.previous=null;this.credit=0;}
 draw(ctx,{clock=0,visible=1,body,pose,emissionPoints,anchor=[512,1100],amount=.35,reduced=false}={}){
  if(!Number.isFinite(clock)||visible<=.001||!body||![body.minX,body.maxX,body.minY,body.maxY].every(Number.isFinite)){this.clear();return;}
  const emitters=Array.isArray(emissionPoints)?emissionPoints.filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y)):[];let x=(body.minX+body.maxX)/2,y=body.minY+(body.maxY-body.minY)*.78;const attached=pose&&[pose.dx,pose.dy,pose.rotation,pose.scaleX,pose.scaleY].every(Number.isFinite);if(attached){const u=(anchor[0]-512)*pose.scaleX,v=(anchor[1]-768)*pose.scaleY;x=640+pose.dx+u*Math.cos(pose.rotation)-v*Math.sin(pose.rotation);y=360+pose.dy+u*Math.sin(pose.rotation)+v*Math.cos(pose.rotation);}if(emitters.length){x=emitters.reduce((n,p)=>n+p.x,0)/emitters.length;y=emitters.reduce((n,p)=>n+p.y,0)/emitters.length;}const height=body.maxY-body.minY,width=body.maxX-body.minX,prior=this.previous;
  if(prior&&(clock<prior.clock||clock-prior.clock>.25))this.clear();
  const dt=this.previous?clamp(clock-this.previous.clock,0,.05):0,dx=this.previous?x-this.previous.x:0,dy=this.previous?y-this.previous.y:0;
  const vx=dt?clamp(dx/dt,-650,650):0,vy=dt?clamp(dy/dt,-650,650):0;this.previous={x,y,clock,emitters:emitters.map(p=>({...p}))};
  if(reduced||!this.ready||amount<=0){this.particles.length=0;this.credit=0;return;}
  const strength=clamp(amount,0,1),speed=Math.hypot(vx,vy);this.credit+=dt*(8+Math.min(18,speed*.035))*strength;
  while(this.credit>=1&&this.particles.length<48){this.credit--;const n=this.serial++,side=n%2?1:-1,jitter=((n*73)%101)/100;
   const emitter=emitters.length?emitters[n%emitters.length]:null,oldEmitter=emitter&&prior?.emitters?.find(p=>p.id===emitter.id),evx=oldEmitter&&dt?clamp((emitter.x-oldEmitter.x)/dt,-650,650):vx,evy=oldEmitter&&dt?clamp((emitter.y-oldEmitter.y)/dt,-650,650):vy;
   this.particles.push({x:emitter?emitter.x:x+(attached?side*100*pose.scaleX*Math.cos(pose.rotation):side*width*(.18+jitter*.08)),y:emitter?emitter.y:y+(attached?side*100*pose.scaleX*Math.sin(pose.rotation):(jitter-.5)*height*.08),vx:evx*.38+side*8,vy:evy*.3+9,age:0,life:1.1+jitter*.7,size:clamp(height*(emitters.length?.075+jitter*.035:.18+jitter*.09),4,140),angle:Math.atan2(-vy,-vx||side*12),cell:n%6});}
  this.credit=Math.min(this.credit,1);
  ctx.save();ctx.globalCompositeOperation='screen';
  for(const p of this.particles){p.age+=dt;const damping=Math.exp(-dt*2.4);p.vx*=damping;p.vy=p.vy*damping+dt*7;p.x+=p.vx*dt;p.y+=p.vy*dt;const q=p.age/p.life,fade=Math.sin(Math.PI*clamp(q,0,1))**1.3,extent=p.size*(1+q*.45),cell=this.manifest.cells[p.cell];ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.globalAlpha=clamp(visible,0,1)*fade*(.17+.16*strength);ctx.drawImage(this.image,...cell,-extent*.52,-extent*.33,extent,extent*.66);ctx.restore();}
  ctx.restore();this.particles=this.particles.filter(p=>p.age<p.life);this.frames++;
 }
 inspect(){return{ready:this.ready,error:this.error||null,particles:this.particles.length,maxParticles:48,source:'painted-raster-vapor',emission:'body-local origins, world-space wake',motion:'inherited velocity, drag and settling',frames:this.frames};}
}

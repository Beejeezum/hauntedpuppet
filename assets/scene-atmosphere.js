// Optional painted scenery. The character remains the original registered paintings.
export class SceneAtmosphere {
  constructor(){this.ready=false;this.image=new Image();this.image.src='/assets/scenes/haunted-window.png';this.image.decode().then(()=>this.ready=true).catch(()=>{});this.level=0;}
  draw(ctx,{scene='void',clock=0,level=0,visible=1,reduced=false}) {
    if(scene!=='window'||!this.ready||visible<=.001)return;
    this.level+=(Math.min(.2,Math.max(0,level))-this.level)*.08;
    const breath=reduced?0:Math.sin(clock*.45)*.035;
    ctx.save();ctx.globalAlpha=Math.min(1,visible)*(.86+breath+this.level*.35);
    ctx.drawImage(this.image,0,0,1280,720);ctx.restore();
  }
  inspect(){return{ready:this.ready,source:'painted-background-plate',audioReactive:'slow brightness only',characterModified:false};}
}

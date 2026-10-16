// Front-only painted jaw corrective driven by the registered mouth aperture.
// Preserves row ordering; not a substitute for jaw/cheek corrective artwork.
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function supportMouth(vertices,columns,mouth){
 const opening=Math.max(0,Math.min(1,(mouth.height-30)/130));if(!opening)return;
 for(let row=0;row<vertices.length/(columns*2);row++){
  const start=row*columns*2,y=vertices[start+1],weight=smooth((y-590)/70)*(1-smooth((y-760)/160)),amount=opening*weight;
  if(!amount)continue;
  const left=vertices[start+4],right=vertices[start+(columns-3)*2],center=(left+right)/2,width=Math.max(8,right-left);
  const scale=1+(Math.max(1,(mouth.width+80)/width)-1)*amount,targetCenter=center+((mouth.x+mouth.width/2)-center)*amount*.6;
  const drop=56*amount*smooth((y-610)/70);
  for(let col=0;col<columns;col++){const k=start+col*2;vertices[k]=targetCenter+(vertices[k]-center)*scale;vertices[k+1]=y+drop;}
 }
}

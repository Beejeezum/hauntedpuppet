/** Cache the continuous path once per arm pose instead of reevaluating trigonometry per vertex. */
export function sampledSpine(path,s,e,w,palm){
 const count=1040,start=-.65,step=.0025,points=[];for(let i=-1;i<=count+1;i++)points.push(path(s,e,w,start+i*step,palm));
 const normals=[],raw=[],lo=[],hi=[];
 for(let i=0;i<=count;i++){const a=points[i],p=points[i+1],b=points[i+2],dx=(b[0]-a[0])/(2*step),dy=(b[1]-a[1])/(2*step),length=Math.hypot(dx,dy),ddx=(b[0]-2*p[0]+a[0])/(step*step),ddy=(b[1]-2*p[1]+a[1])/(step*step);normals.push([-dy/length,dx/length]);raw.push((dx*ddy-dy*ddx)/Math.max(.001,length**3));}
 for(let i=0;i<=count;i++){let low=0,high=0;for(let j=Math.max(0,i-16);j<=Math.min(count,i+16);j++){low=Math.min(low,raw[j]);high=Math.max(high,raw[j]);}lo.push(low);hi.push(high);}
 return(t,offset)=>{if(t<start||t>start+count*step)throw Error('Painted arm source exceeds cached spine range: '+t);const index=Math.max(0,Math.min(count-.000001,(t-start)/step)),i=Math.floor(index),f=index-i,blend=(a,b)=>a*(1-f)+b*f,p=points[i+1],q=points[i+2],nx=blend(normals[i][0],normals[i+1][0]),ny=blend(normals[i][1],normals[i+1][1]),length=Math.hypot(nx,ny),list=offset<0?lo:hi,k=blend(list[i],list[i+1]),bounded=offset/(1+2*Math.max(0,k*offset));return[blend(p[0],q[0])+nx/length*bounded,blend(p[1],q[1])+ny/length*bounded];};
}

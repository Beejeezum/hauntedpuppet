// Original implementation of a separable squared Euclidean distance transform.
// Algorithm reference: Felzenszwalb/Huttenlocher, dt-final.pdf (Brown).
export function squaredDistance(seeds,width,height){
 if(seeds.length!==width*height)throw Error('Distance field size mismatch');
 if(!seeds.some(Boolean))return new Float64Array(seeds.length).fill(Infinity);
 const max=Math.max(width,height),f=new Float64Array(max),g=new Float64Array(max),sites=new Int32Array(max),breaks=new Float64Array(max+1),temp=new Float64Array(seeds.length),out=new Float64Array(seeds.length);
 const line=n=>{let k=0;sites[0]=0;breaks[0]=-Infinity;breaks[1]=Infinity;
  for(let q=1;q<n;q++){let s;for(;;){const p=sites[k];s=(f[q]+q*q-f[p]-p*p)/(2*(q-p));if(s>breaks[k]||k===0)break;k--;}sites[++k]=q;breaks[k]=s;breaks[k+1]=Infinity;}
  k=0;for(let q=0;q<n;q++){while(breaks[k+1]<q)k++;const d=q-sites[k];g[q]=d*d+f[sites[k]];}
 };
 for(let y=0;y<height;y++){for(let x=0;x<width;x++)f[x]=seeds[y*width+x]?0:1e12;line(width);for(let x=0;x<width;x++)temp[y*width+x]=g[x];}
 for(let x=0;x<width;x++){for(let y=0;y<height;y++)f[y]=temp[y*width+x];line(height);for(let y=0;y<height;y++)out[y*width+x]=g[y];}
 return out;
}
export function signedDistance(mask,width,height){const inverse=Uint8Array.from(mask,v=>v?0:1),inside=squaredDistance(mask,width,height),outside=squaredDistance(inverse,width,height);return Float32Array.from(inside,(d,i)=>Math.sqrt(outside[i])-Math.sqrt(d));}
export function paintedDistanceTexture(P,image){
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height),mask=new Uint8Array(c.width*c.height);
 for(let i=0;i<mask.length;i++)mask[i]=data.data[i*4+3]>=96?1:0;
 const d=signedDistance(mask,c.width,c.height),range=64;
 for(let i=0;i<mask.length;i++){data.data[i*4]=data.data[i*4+1]=data.data[i*4+2]=255;data.data[i*4+3]=Math.round(Math.max(0,Math.min(1,.5+d[i]/(2*range)))*255);}
 ctx.putImageData(data,0,0);return P.Texture.from(c);
}

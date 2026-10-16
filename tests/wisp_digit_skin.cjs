const assert=require('node:assert/strict');
(async()=>{const{bindDigits,bendDigit,digitAngles,DIGITS}=await import('../assets/wisp-performance/digit-skin.js');let minAreaRatio=Infinity,maxTipTravel=0,samples=0,minAreaSample=null;
for(const side of ['left','right']){
 for(const p of [[330,400],[540,770],[790,870]]){const q=side==='left'?[1230-p[0],p[1]]:p;const a=bendDigit(...q,bindDigits(...q,side),[0,0,0,0]);assert.deepEqual(a,q);}
 const size=side==='left'?[1206,1305]:[1230,1278];
 for(let time=0;time<12;time+=.2){const angles=digitAngles(time,side,1,1);
  for(let y=0;y<size[1]-4;y+=12)for(let x=0;x<size[0]-4;x+=12){const points=[[x,y],[x+4,y],[x,y+4]].map(p=>bendDigit(...p,bindDigits(...p,side),angles));const[a,b,c]=points,ratio=((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/16;if(ratio<minAreaRatio){minAreaRatio=ratio;minAreaSample={side,time,x,y};}assert(ratio>.45&&ratio<1.8,'Digit control folds or crushes local painting '+JSON.stringify({side,time,x,y,ratio}));samples++;}
  for(const d of DIGITS[side]){const q=bendDigit(...d.tip,bindDigits(...d.tip,side),angles);maxTipTravel=Math.max(maxTipTravel,Math.hypot(q[0]-d.tip[0],q[1]-d.tip[1]));}
 }
 const rest=[...DIGITS[side][0].tip];assert.deepEqual(bendDigit(...rest,bindDigits(...rest,side),digitAngles(5,side,0,1)),rest);
 assert(new Set(digitAngles(2,side)).size===4,'Digits share one rigid motion');
}
assert(maxTipTravel>10&&maxTipTravel<35);console.log('PASS independent painted digit bends, zero-energy identity, bounded silhouette travel, positive local area',{samples,minAreaRatio,minAreaSample,maxTipTravel});})().catch(e=>{console.error(e);process.exitCode=1});

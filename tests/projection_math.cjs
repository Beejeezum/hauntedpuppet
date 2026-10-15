const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../assets/projection-mapping.js'),'utf8');
 const {homography,projectPoint,validMapping}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 for(const corners of [[[0,0],[100,0],[100,100],[0,100]],[[12,8],[92,19],[75,90],[20,82]],[[32,5],[68,5],[68,95],[32,95]]]){
  const h=homography(corners);[[0,0],[1,0],[1,1],[0,1]].forEach(([u,v],i)=>projectPoint(h,u,v).forEach((n,j)=>assert(Math.abs(n-corners[i][j]/100)<1e-9)));
  const a=projectPoint(h,0,.3),b=projectPoint(h,1,.3);
  for(let n=0;n<=100;n++){const c=projectPoint(h,n/100,.3);assert(Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))<1e-9,'Straight lines must stay straight');}
 }
 assert.throws(()=>homography([[0,0],[0,0],[0,0],[0,0]]));assert.throws(()=>homography([[NaN,0],[100,0],[100,100],[0,100]]));
 assert(validMapping({brightness:100,feather:5,mask:'ellipse',testPattern:false}));
 assert(!validMapping({brightness:Infinity,feather:5,mask:'ellipse',testPattern:false}));
 console.log('PASS perspective corner placement,303 straight-line samples, degenerate rejection and calibration validation.');
})().catch(e=>{console.error(e);process.exit(1)});

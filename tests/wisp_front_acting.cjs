const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const{frontActingPose}=await import(pathToFileURL(path.resolve('assets/wisp-performance/front-acting.js'))),{POSES,poseWeights}=await import(pathToFileURL(path.resolve('assets/wisp-performance/poses.js'))),base=POSES[0];
 const sample=t=>frontActingPose(base,{action:{kind:'wave',at:t},motion:{gesture:100}});
 for(const time of [0,2.8])for(const key of ['head','chest','tail','left','right'])assert.deepEqual(sample(time)[key],base[key]);
 for(const time of [.24,.67,1.05,1.78,2.35]){
  const h=1e-5,a=sample(time-h),b=sample(time),c=sample(time+h);
  for(const key of ['head','chest','tail','left','right'])for(let axis=0;axis<2;axis++)assert(Math.abs((b[key][axis]-a[key][axis])/h-(c[key][axis]-b[key][axis])/h)<.3,'Velocity kink at '+time+' '+key);
 }
 const h=.0001;assert((sample(.67+h).left[1]-sample(.67-h).left[1])/(2*h)<-400,'Arm should flow through the raised-arm breakdown');
 assert.deepEqual(sample(1.2).left,sample(1.6).left);assert.equal(frontActingPose(base,{reduced:true,action:{kind:'wave',at:1}}),base);
 assert(poseWeights({kind:'exit',at:2.2})[9]>.99);assert(poseWeights({kind:'exit',at:4.4})[0]>.99,'Reform facing guests before farewell routine settles');
 const threat=frontActingPose(base,{action:{kind:'surprise',at:.48},evilBlend:1});assert(threat.left[1]<700&&threat.right[1]<700,'Scary reveal needs two raised claws');const gentle=frontActingPose(base,{action:{kind:'surprise',at:.48},evilBlend:0});assert.equal(gentle,base);const half=frontActingPose(base,{action:{kind:'surprise',at:.48},evilBlend:.5});for(const side of ['left','right'])assert(Math.abs(half[side][1]-(base[side][1]+threat[side][1])/2)<1e-6);
 console.log('PASS authored continuous wave breakdowns, intentional hold, exact rest endpoints, reduced motion and departure/return direction');
})().catch(e=>{console.error(e);process.exitCode=1});

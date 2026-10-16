const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const {bindPoseCage,mapPoseCage}=await import('data:text/javascript;base64,'+fs.readFileSync(require('node:path').join(__dirname,'pose-cage.js')).toString('base64'));
const anchors=[[900,340],[1080,860],[650,720],[430,630]],angle=.83,scale=.43,transform=([x,y])=>[137+scale*(Math.cos(angle)*x-Math.sin(angle)*y),-42+scale*(Math.sin(angle)*x+Math.cos(angle)*y)],targets=anchors.map(transform);let maximumError=0,samples=0;
for(let y=0;y<=1254;y+=17)for(let x=0;x<=1254;x+=19){const actual=mapPoseCage(bindPoseCage(anchors,[x,y]),targets),expected=transform([x,y]);maximumError=Math.max(maximumError,Math.hypot(actual[0]-expected[0],actual[1]-expected[1]));samples++;}assert(maximumError<1e-9);
for(let i=0;i<anchors.length;i++)assert.deepEqual(mapPoseCage(bindPoseCage(anchors,anchors[i]),targets),targets[i]);
assert.throws(()=>mapPoseCage(bindPoseCage(anchors,anchors[0]),targets.slice(1)),/count mismatch/);
assert.throws(()=>bindPoseCage([[0,0],[0,0]],[1,1]),/Degenerate/);assert.throws(()=>bindPoseCage(anchors,[NaN,0]),/Invalid/);assert.throws(()=>mapPoseCage(bindPoseCage(anchors,[1,1]),[[0,0],[1,1]]),/count mismatch/);
console.log(JSON.stringify({samples,maximumError,exactAnchors:4,scope:'Similarity/anchor invariants only; arbitrary deformation injectivity unproven'}));})().catch(e=>{console.error(e);process.exitCode=1});

const {spawnSync}=require('node:child_process');
const path=require('node:path');
const {suites,selectSuites}=require('./browser-test-suites.cjs');
const selected=selectSuites(process.env.HAUNT_BROWSER_SHARD);
console.log('Browser regression selection: '+selected.length+'/'+suites.length+' suites'+(process.env.HAUNT_BROWSER_SHARD?' · shard '+process.env.HAUNT_BROWSER_SHARD:''));
for(const suite of selected){
 const file=path.join(__dirname,'..','tests',suite);
 if(!require('node:fs').existsSync(file))throw Error('Required regression suite missing: '+suite);
 const result=spawnSync(process.execPath,[file],{stdio:'inherit',env:{...process.env,...(suite==='face_tracker.cjs'?{HAUNT_FACE_MODEL_SMOKE:'1'}:{})}});
 if(result.status!==0)process.exit(result.status||1);
}

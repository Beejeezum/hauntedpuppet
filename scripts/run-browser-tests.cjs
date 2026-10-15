const {spawnSync}=require('node:child_process');
const path=require('node:path');
const suites=['realtime_events.cjs','realtime_failures.cjs','wisp.cjs','wisp_resilience.cjs','microphone.cjs','realtime_browser.cjs','phone_browser.cjs','phone_cue_errors.cjs','accessibility.cjs'];
for(const suite of suites){
 const file=path.join(__dirname,'..','tests',suite);
 if(!require('node:fs').existsSync(file))throw Error('Required regression suite missing: '+suite);
 const result=spawnSync(process.execPath,[file],{stdio:'inherit',env:process.env});
 if(result.status!==0)process.exit(result.status||1);
}

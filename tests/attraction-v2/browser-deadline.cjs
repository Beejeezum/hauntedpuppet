// A native media call can block the browser's own clock. Bound the Node process
// as well so a stuck decoder fails with evidence instead of consuming a CI job.
const fs=require('node:fs'),path=require('node:path');
exports.browserDeadline=({folder,label,milliseconds=90000})=>{
 let phase='starting',closed=false;
 const timer=setTimeout(()=>{
  fs.mkdirSync(folder,{recursive:true});
  fs.writeFileSync(path.join(folder,'process-timeout.json'),JSON.stringify({result:'failed',label,phase,budgetSeconds:milliseconds/1000,cleanupVerified:false,scope:'Native browser did not finish within its process budget; no acceptance claimed.'},null,2));
  console.error(`${label}: process deadline exceeded during ${phase}; failing, not accepting stalled native media.`);
  process.exit(1);
 },milliseconds);
 return {phase(value){phase=value;},close(){if(!closed){closed=true;clearTimeout(timer);}}};
};

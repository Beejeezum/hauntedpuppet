// A separate opt-in browser preview. Never publish the general source tree.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const shared=new Set([
 'source/wisp-performance-reference/runway-pilots/wisp-film-output.js',
 'source/wisp-performance-reference/ambient-show/pcm-voice.mjs',
 'source/wisp-performance-reference/ambient-show/single-movie-study/finite-cues/finite-player.mjs'
]);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function compileYardPreview(manifest,{root}){
 if(manifest.schema!==1||manifest.kind!=='picture-only-review'||manifest.releaseApproved!==false)throw Error('Yard preview must remain an opt-in review');
 const names=new Set();let total=0;
 const files=manifest.files.map(item=>{
  for(const value of [item.source,item.destination])if(typeof value!=='string'||value.includes('\\')||path.posix.isAbsolute(value)||path.posix.normalize(value)!==value||value.split('/').some(p=>p==='..'||p.startsWith('.')))throw Error('Invalid yard preview path');
  if(!item.source.startsWith('source/attraction-v2/console/')&&!shared.has(item.source))throw Error('Unlisted yard source');
  if(!/\.(html|css|mjs|js|json|mp4|png|svg|woff2)$/.test(item.destination)&&!item.destination.endsWith('/LICENSE'))throw Error('Non-browser yard file');
  if(names.has(item.destination))throw Error('Duplicate yard destination');names.add(item.destination);
  const source=path.join(root,item.source);if(!fs.lstatSync(source).isFile())throw Error('Yard source must be a regular file');
  let bytes=fs.readFileSync(source);
  if(bytes.length!==item.bytes||hash(bytes)!==item.sha256)throw Error('Unreviewed yard asset: '+item.destination);
  for(const edit of item.rewrites||[]){const text=bytes.toString('utf8');if(!edit.from||typeof edit.to!=='string'||text.split(edit.from).length!==2)throw Error('Ambiguous yard rewrite');bytes=Buffer.from(text.replace(edit.from,edit.to));}
  if(hash(bytes)!==item.publishedSha256)throw Error('Yard published checksum mismatch');
  total+=bytes.length;if(total>16*1024*1024)throw Error('Yard preview exceeds reviewed size budget');
  return {destination:item.destination,data:bytes};
 });
 for(const required of ['index.html','haunt-loops.html','voice-casting.html','yard-environment.mjs','media/manifest.json'])if(!names.has(required))throw Error('Incomplete yard preview');
 const config=files.find(f=>f.destination==='yard-environment.mjs').data.toString('utf8');
 if(!config.includes('export const PICTURE_ONLY = true;')||config.includes('export const PICTURE_ONLY = false;'))throw Error('Public yard must disable local service calls');
 return {files,totalBytes:total};
}
module.exports={compileYardPreview};

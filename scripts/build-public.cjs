// Publish browser assets only. Python services and credentials never belong on the CDN.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of ['index.html', 'live.html', 'app.js']) fs.copyFileSync(path.join(root, file), path.join(out, file));
for (const dir of ['assets', 'vendor']) fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true, filter: file => !/\.(py|key|pem|log)$|\/\.env/.test(file) });
// Explicitly approved opt-in preview only; never publish the entire source tree.
const preview = JSON.parse(fs.readFileSync(path.join(root, 'scripts/public-film-preview.json'), 'utf8'));
const previewOut = path.join(out, 'assets/wisp-film-preview');
fs.mkdirSync(previewOut, {recursive:true});
for (const item of preview.files) {
  if (!item.source.startsWith('source/wisp-performance-reference/runway-pilots/') || path.basename(item.destination) !== item.destination) throw Error('Invalid preview asset path');
  const bytes = fs.readFileSync(path.join(root, item.source));
  if (bytes.length !== item.bytes || require('node:crypto').createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw Error('Unreviewed preview asset: '+item.destination);
  fs.writeFileSync(path.join(previewOut, item.destination), bytes);
}
// Explicit show desk allowlist. Rejected studies and the rest of source/ remain excluded.
const desk = JSON.parse(fs.readFileSync(path.join(root, 'scripts/public-showdesk.json'), 'utf8'));
const deskOut = path.join(out, 'assets/wisp-showdesk');
fs.mkdirSync(deskOut, {recursive:true});
for (const item of desk.files) {
  if (!/^source\/wisp-performance-reference\/(ambient-show|runway-pilots|button-cue-batch)\//.test(item.source) || path.basename(item.destination) !== item.destination) throw Error('Invalid show desk asset path');
  let bytes = fs.readFileSync(path.join(root, item.source));
  const hash = b => require('node:crypto').createHash('sha256').update(b).digest('hex');
  if (bytes.length !== item.bytes || hash(bytes) !== item.sha256) throw Error('Unreviewed show desk asset: '+item.destination);
  if (item.rewrites) {
    let source = bytes.toString('utf8');
    for (const rewrite of item.rewrites) {
      if (source.split(rewrite.from).length !== 2) throw Error('Ambiguous show desk rewrite');
      source = source.replace(rewrite.from, rewrite.to);
    }
    bytes = Buffer.from(source);
  }
  if (hash(bytes) !== item.publishedSha256) throw Error('Show desk publication checksum mismatch');
  fs.writeFileSync(path.join(deskOut, item.destination), bytes);
}
// Explicit opt-in mouth study; no other source art, voice recording or study page is published.
const mouthStudy=JSON.parse(fs.readFileSync(path.join(root,'scripts/public-mouth-study.json'),'utf8'));
const mouthRegistration=JSON.parse(fs.readFileSync(path.join(root,'source/wisp-art-reference/painted-speech-study/friendly-v28-mouth-template-candidates.json'),'utf8'));
if(mouthRegistration.sourceSha256!==desk.files.find(item=>item.destination==='friendly.mp4')?.sha256)throw Error('Mouth registration does not match published friendly film');
const nativeLipRegistration=JSON.parse(fs.readFileSync(path.join(root,'source/wisp-art-reference/painted-speech-study/native-lip-mesh-study/friendly-native-lip-candidates-v1.json'),'utf8'));
if(nativeLipRegistration.sourceSha256!==mouthRegistration.sourceSha256||nativeLipRegistration.dimensions?.join()!=='1916,1080'||nativeLipRegistration.frames?.length!==122)throw Error('Native lip geometry does not match published friendly film');
const mouthOut=path.join(out,'assets/wisp-mouth-study');fs.mkdirSync(mouthOut,{recursive:true});
for(const item of mouthStudy.files){
 if(!item.source.startsWith('source/wisp-art-reference/painted-speech-study/')||path.basename(item.destination)!==item.destination||item.source.includes('/../'))throw Error('Invalid mouth study asset path');
 let bytes=fs.readFileSync(path.join(root,item.source));const hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');
 if(bytes.length!==item.bytes||hash(bytes)!==item.sha256)throw Error('Mouth study source changed');
 for(const rewrite of item.rewrites||[]){const text=bytes.toString('utf8');if(text.split(rewrite.from).length!==2)throw Error('Ambiguous mouth study rewrite');bytes=Buffer.from(text.replace(rewrite.from,rewrite.to));}
 if(hash(bytes)!==item.publishedSha256)throw Error('Mouth study publication checksum mismatch');fs.writeFileSync(path.join(mouthOut,item.destination),bytes);
}
// Final library media is published only from explicit hash-linked approvals.
const approvedLibrary=require('./compile-wisp-library.cjs').compileLibrary(JSON.parse(fs.readFileSync(path.join(root,'source/wisp-performance-reference/ambient-show/catalog.json'),'utf8')),{root});
for(const file of approvedLibrary.files)fs.writeFileSync(path.join(deskOut,file.destination),file.data);
fs.writeFileSync(path.join(deskOut,'playback-library.json'),JSON.stringify(approvedLibrary.runtime,null,2)+'\n');
// A single-file review reel, deliberately separate from the approved show library.
const cueReview=JSON.parse(fs.readFileSync(path.join(root,'scripts/public-cue-review.json'),'utf8'));
const cueReviewOut=path.join(out,'assets/wisp-cue-review');fs.mkdirSync(cueReviewOut,{recursive:true});
for(const item of cueReview.files){
 if(!item.source.startsWith('source/wisp-performance-reference/button-cue-batch/')||path.basename(item.destination)!==item.destination)throw Error('Invalid cue review path');
 const bytes=fs.readFileSync(path.join(root,item.source));
 if(bytes.length!==item.bytes||require('node:crypto').createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Cue review checksum mismatch');
 fs.writeFileSync(path.join(cueReviewOut,item.destination),bytes);
}
// Tonight's opt-in review is an exact file list, not general source publication.
const tonight = JSON.parse(fs.readFileSync(path.join(root, 'scripts/public-tonight-demo.json'), 'utf8'));
const tonightOut = path.join(out, 'assets/wisp-tonight');
fs.mkdirSync(tonightOut, {recursive:true});
for (const item of tonight.files) {
  if (!item.source.startsWith('source/wisp-performance-reference/tonight-demo/') || path.basename(item.destination) !== item.destination) throw Error('Invalid tonight asset path');
  let bytes = fs.readFileSync(path.join(root,item.source));
  const hash = b => require('node:crypto').createHash('sha256').update(b).digest('hex');
  if (bytes.length !== item.bytes || hash(bytes) !== item.sha256) throw Error('Unreviewed tonight asset: '+item.destination);
  if (item.rewrites) {
    let text=bytes.toString('utf8');
    for(const rewrite of item.rewrites){if(text.split(rewrite.from).length!==2)throw Error('Ambiguous tonight rewrite');text=text.replace(rewrite.from,rewrite.to);}
    bytes=Buffer.from(text);
  }
  if(hash(bytes)!==item.publishedSha256)throw Error('Tonight publication checksum mismatch');
  fs.writeFileSync(path.join(tonightOut,item.destination),bytes);
}
fs.mkdirSync(path.join(out, 'phone_remote'), { recursive: true });
for (const file of ['index.html', 'phone.js', 'phone.css']) {
  const source = path.join(root, 'phone_remote', file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(out, 'phone_remote', file));
}
const bad = [];
function check(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) check(file);
    else if (/\.(py|key|pem|log)$|^\.env/.test(item.name)) bad.push(file);
  }
}
check(out);
if (bad.length) throw new Error('Private files entered the public build');
fs.writeFileSync(path.join(out, 'build-info.json'), JSON.stringify({version:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,commit:process.env.COMMIT_REF||null,builtAt:new Date().toISOString()},null,2));
console.log('Browser-only build ready in dist. Backend functions are bundled separately.');

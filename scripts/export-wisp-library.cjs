const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{compileLibrary}=require('./compile-wisp-library.cjs');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'source/wisp-performance-reference/ambient-show');
const catalog=JSON.parse(fs.readFileSync(path.join(folder,'catalog.json'),'utf8'));
const {runtime}=compileLibrary(catalog,{root,sourceUrls:true});
fs.writeFileSync(path.join(folder,'playback-library.json'),JSON.stringify(runtime,null,2)+'\n');
const compiled=compileLibrary(catalog,{root});
const publication={schema:1,catalogSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(folder,'catalog.json'))).digest('hex'),runtime:compiled.runtime,files:compiled.files.map(({data,...file})=>file)};
fs.writeFileSync(path.join(folder,'approved-publication.json'),JSON.stringify(publication,null,2)+'\n');
// Only this generated metadata checksum follows explicit compiler approvals.
const manifestPath=path.join(root,'scripts/public-showdesk.json'),manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const entry=manifest.files.find(f=>f.destination==='approved-publication.json');
if(!entry||entry.source!=='source/wisp-performance-reference/ambient-show/approved-publication.json')throw Error('Missing approved-publication allowlist');
const bytes=fs.readFileSync(path.join(folder,'approved-publication.json'));entry.bytes=bytes.length;entry.sha256=crypto.createHash('sha256').update(bytes).digest('hex');entry.publishedSha256=entry.sha256;
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('Exported '+runtime.clips.length+' explicitly approved local preview cues. No approvals changed.');

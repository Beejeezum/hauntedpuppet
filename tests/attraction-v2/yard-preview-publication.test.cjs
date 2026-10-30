const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {compileYardPreview}=require('../../scripts/compile-yard-preview.cjs');
const root=path.resolve(__dirname,'../..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/public-yard-preview.json'),'utf8'));
test('exact opt-in package includes all browser assets and disables local services',()=>{const p=compileYardPreview(manifest,{root});assert(p.files.length>30);assert(p.totalBytes<4*1024*1024);assert(p.files.some(f=>f.destination==='media/spider-rig-sheet-v1.png'));});
for(const [name,edit] of [
 ['changed source hash',m=>m.files[0].sha256='0'.repeat(64)],
 ['changed published hash',m=>m.files[0].publishedSha256='0'.repeat(64)],
 ['private source',m=>m.files[0].source='server.py'],
 ['parent traversal',m=>m.files[0].destination='../server.py'],
 ['absolute destination',m=>m.files[0].destination='/index.html'],
 ['duplicate destination',m=>m.files.push(m.files[0])],
 ['approval misrepresentation',m=>m.releaseApproved=true],
 ['ambiguous rewrite',m=>m.files[0].rewrites=[{from:'NOT PRESENT',to:'replacement'}]],
 ['public local capabilities',m=>{const f=m.files.find(f=>f.destination==='yard-environment.mjs');f.rewrites=[];f.publishedSha256=f.sha256;}],
 ['missing entry',m=>m.files=m.files.filter(f=>f.destination!=='index.html')],
])test('reject '+name,()=>{const altered=structuredClone(manifest);edit(altered);assert.throws(()=>compileYardPreview(altered,{root}));});

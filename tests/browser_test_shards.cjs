const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {suites,selectSuites}=require('../scripts/browser-test-suites.cjs');
assert.equal(new Set(suites).size,suites.length,'No duplicate browser suites');
assert.deepEqual(selectSuites(),suites,'Local default retains the entire serial suite');
for(const file of suites)assert(fs.existsSync(path.join(__dirname,file)),file+' must exist');
for(const total of [1,2,3,4,8]){
 const selected=Array.from({length:total},(_,i)=>selectSuites((i+1)+'/'+total));
 assert.deepEqual(selected.flat().sort(),suites.slice().sort(),'Shard union must exactly preserve all browser tests');
 assert.equal(new Set(selected.flat()).size,suites.length,'Every suite runs exactly once');
 assert(Math.max(...selected.map(s=>s.length))-Math.min(...selected.map(s=>s.length))<=1);
}
for(const shard of ['0/3','4/3','1/0','1/9','1.5/3','1/3x','all',3])assert.throws(()=>selectSuites(shard));
console.log('PASS '+suites.length+' browser suites preserved exactly once across bounded shards; default full run and invalid shard rejection.');

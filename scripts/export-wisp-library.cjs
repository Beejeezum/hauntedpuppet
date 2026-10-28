const fs=require('node:fs'),path=require('node:path'),{compileLibrary}=require('./compile-wisp-library.cjs');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'source/wisp-performance-reference/ambient-show');
const catalog=JSON.parse(fs.readFileSync(path.join(folder,'catalog.json'),'utf8'));
const {runtime}=compileLibrary(catalog,{root,sourceUrls:true});
fs.writeFileSync(path.join(folder,'playback-library.json'),JSON.stringify(runtime,null,2)+'\n');
console.log('Exported '+runtime.clips.length+' explicitly approved local preview cues. No approvals changed.');

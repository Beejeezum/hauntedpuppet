import assert from 'node:assert/strict';
import {supportMouth} from './jaw-surface.mjs';
const rows=[500,580,620,660,720,780,840,920,1100],columns=9;
const rest=Float32Array.from(rows.flatMap(y=>Array.from({length:columns},(_,i)=>[420+i*23,y]).flat()));
const closed=rest.slice();supportMouth(closed,columns,{x:405,y:637,width:175,height:18});assert.deepEqual([...closed],[...rest]);
const open=rest.slice();supportMouth(open,columns,{x:405,y:637,width:175,height:160});let moved=false;
for(let r=0;r<rows.length;r++)for(let c=0;c<columns;c++){
 const i=(r*columns+c)*2;assert.ok(Number.isFinite(open[i])&&Number.isFinite(open[i+1]));
 if(rows[r]<590||rows[r]>=920){assert.equal(open[i],rest[i]);assert.equal(open[i+1],rest[i+1]);}
 if(r>0)assert.ok(open[i+1]>open[i+1-columns*2],'rows retain vertical ordering');
 if(c>0)assert.ok(open[i]>open[i-2],'columns retain horizontal ordering');
 moved||=Math.abs(open[i]-rest[i])+Math.abs(open[i+1]-rest[i+1])>1;
}
assert(moved);console.log('Closed-mouth identity, pinned upper face/tail and ordered finite open-jaw surface pass');

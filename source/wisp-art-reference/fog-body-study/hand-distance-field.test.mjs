import assert from 'node:assert/strict';
import {squaredDistance,signedDistance} from './hand-distance-field.mjs';
for(let pattern=0;pattern<15;pattern++){const w=9,h=7,mask=Uint8Array.from({length:w*h},(_,i)=>(i*17+pattern*31)%23<3?1:0),d=squaredDistance(mask,w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let expected=Infinity;for(let j=0;j<mask.length;j++)if(mask[j])expected=Math.min(expected,(x-j%w)**2+(y-Math.floor(j/w))**2);assert.equal(d[y*w+x],expected);}
 const signed=signedDistance(mask,w,h);for(let i=0;i<mask.length;i++)assert(mask[i]?signed[i]>0:signed[i]<0);
}
assert(squaredDistance(new Uint8Array(9),3,3).every(v=>v===Infinity));console.log('PASS945exact distance samples against brute force, signed inside/outside and empty masks');

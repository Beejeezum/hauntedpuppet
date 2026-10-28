import assert from 'node:assert/strict';
import {validPhonePerformance as valid} from '../netlify/lib/phone-performance.mjs';
const state={workspace:'director'},cues=['friendly-wave'],good={text:'Hello, little ghosts!',mode:'exact',character:'friendly',animation:'friendly-wave'};
assert(valid(good,state,cues));assert(valid({...good,text:'👻'.repeat(400)},state,cues));
for(const patch of [{text:' '},{text:'x'.repeat(401)},{text:'bad\0'},{mode:'unknown'},{character:'other'},{animation:'missing'},{apiKey:'not-allowed'}])assert(!valid({...good,...patch},state,cues));
assert(!valid(good,{workspace:'live'},cues));assert(!valid([],state,cues));assert(!valid(null,state,cues));
console.log('PASS bounded phone performance contract and director-only ownership');

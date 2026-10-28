import assert from 'node:assert/strict';
import {PhonePerformanceDirector} from '../source/wisp-performance-reference/ambient-show/phone-performance-director.mjs';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
const value={text:'Boo!',mode:'exact',character:'friendly',animation:'wave'},animations=[{id:'wave',character:'friendly'}];
let calls=[],disposed=0;
const resource=()=>({dispose(){disposed++}});
const config={animations,prepareSpeech:async()=>{calls.push('speech');return resource()},prepareFilm:async()=>{calls.push('film');return resource()},enter:async()=>calls.push('enter'),play:async()=>calls.push('play'),returnAmbient:async()=>calls.push('ambient'),stop:()=>calls.push('stop')};
let d=new PhonePerformanceDirector(config);await d.request(value);assert.deepEqual(calls,['speech','film','enter','play','ambient']);assert.equal(disposed,2);
await assert.rejects(d.request({...value,character:'scary'}));await assert.rejects(d.request({...value,apiKey:'forbidden'}));
// Stop while a non-cooperative provider is pending. A fresh request owns output.
const late=deferred();let first=true;calls=[];disposed=0;
d=new PhonePerformanceDirector({...config,prepareSpeech:async()=>first?(first=false,late.promise):resource()});
const old=d.request(value);const oldRejected=assert.rejects(old,e=>e.cancelled);d.stop();await oldRejected;await d.request(value);const before=[...calls];late.resolve(resource());await new Promise(r=>setImmediate(r));assert.deepEqual(calls,before,'Late speech may not enter/play/return over a newer request');assert.equal(disposed,3);
// Ordered queue, bounded capacity and priority cancellation.
const hold=deferred();d=new PhonePerformanceDirector({...config,capacity:1,play:()=>hold.promise});
const one=d.request(value),oneRejected=assert.rejects(one,e=>e.cancelled);await new Promise(r=>setImmediate(r));const two=d.request(value),twoRejected=assert.rejects(two,e=>e.cancelled);await assert.rejects(d.request(value),/full/);d.stop();await Promise.all([oneRejected,twoRejected]);hold.resolve();await new Promise(r=>setImmediate(r));assert.equal(d.inspect().phase,'stopped');
// FIFO: a second request cannot prepare or play until ambient return finishes.
const returnGate=deferred();const order=[];let returningFirst=true;
d=new PhonePerformanceDirector({...config,prepareSpeech:async v=>{order.push(v.text);return resource()},returnAmbient:async()=>{if(returningFirst){returningFirst=false;await returnGate.promise}}});
const firstJob=d.request({...value,text:'First'}),secondJob=d.request({...value,text:'Second'});await new Promise(r=>setImmediate(r));assert.deepEqual(order,['First']);returnGate.resolve();await Promise.all([firstJob,secondJob]);assert.deepEqual(order,['First','Second']);
// Stop during the return: old finally must not overwrite the fresh job state.
const oldReturn=deferred();let returnOnce=true;d=new PhonePerformanceDirector({...config,returnAmbient:async()=>{if(returnOnce){returnOnce=false;await oldReturn.promise}}});
const returning=d.request(value),returningRejected=assert.rejects(returning,e=>e.cancelled);await new Promise(r=>setImmediate(r));d.stop();await returningRejected;await d.request(value);const snapshot=d.inspect();oldReturn.resolve();await new Promise(r=>setImmediate(r));assert.deepEqual(d.inspect(),snapshot);
// Provider failure must close output and release state without pretending success.
calls=[];d=new PhonePerformanceDirector({...config,prepareSpeech:async()=>{throw Error('provider unavailable')}});await assert.rejects(d.request(value),/provider unavailable/);assert.deepEqual(calls,['stop','ambient']);d.dispose();await assert.rejects(d.request(value),/closed/);
console.log('PASS laptop performance ordering, queue bounds, character matching, Stop/restart ownership, late-provider disposal and failure recovery (mock adapters)');

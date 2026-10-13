import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
class Element {
 constructor(){this.listeners={};this.attrs={};this.children=[];this.dataset={};this.hidden=false;this.disabled=false;this.textContent='';this.open=false;this.value='';this.tagName='BUTTON';this.selectedIndex=0;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)}}
 addEventListener(t,fn){this.listeners[t]=fn}
 setAttribute(k,v){this.attrs[k]=v}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(){this.children=[]}
 getBoundingClientRect(){return {width:1200,height:145,left:0,right:560,top:0,bottom:600}}
 focus(){this.focused=true}
 click(){return this.listeners.click?.({target:this})}
 showModal(){this.open=true}
 close(){this.open=false;this.listeners.close?.()}
 scrollIntoView(){}
}
const ids=['enableSound','play','clearScore','planner','lessonForm','output','path','goal','closePlanner','result','download','editEnquiry','keyboardShortcuts','score','scoreMarks','scoreEmpty','replay','scoreCaption','currentNote','soundHint','lessonStatus','learnPhrase','cancelPhrase'];
const elements=new Map(ids.map(id=>['#'+id,new Element()]));
elements.set('.score-lines path',new Element());
const keys=Array.from({length:13},(_,n)=>{const e=new Element();e.dataset.note=String(n);return e});
const steps=Array.from({length:5},()=>new Element());
const planners=['','Young musicians','Adult beginners','Returning & advancing'].map(path=>{const e=new Element();e.dataset.planner=path;return e});
const events={};let downloads=0,blob;let clock=0,nextId=0;const timers=new Map();
const doc={
 querySelector:s=>s==='.key.expected'?keys.find(k=>k.classes.has('expected')):s.startsWith('[data-step=')?steps[+s.match(/\d+/)[0]]:elements.get(s),
 querySelectorAll:s=>s==='.key'?keys:s==='[data-planner]'?planners:s==='[data-step]'?steps:[],
 createElementNS:()=>new Element(),
 createElement:()=>{const a=new Element();a.click=()=>{downloads++;assert.equal(a.download,'piano-room-demo-example.txt')};return a},
 addEventListener:(name,fn)=>events[name]=fn
};
const gain=()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});
class Audio {state='running';currentTime=0;destination={};resume(){return Promise.resolve()}createBuffer(){return {}}createBufferSource(){return{connect(){},start(){},disconnect(){}}}createGain(){return gain()}createOscillator(){return{frequency:{},connect(){},start(){},stop(){}}}}
const context={
 document:doc,navigator:{audioSession:{}},window:{AudioContext:Audio,matchMedia:()=>({matches:true}),addEventListener(){}},
 Blob,URL:{createObjectURL:b=>{blob=b;return 'blob:demo'},revokeObjectURL(){}},
 setTimeout:(fn,ms)=>{const id=++nextId;timers.set(id,{fn,at:clock+ms});return id},
 clearTimeout:id=>timers.delete(id)
};
vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),context);
const el=s=>elements.get(s);
function tick(ms){const end=clock+ms;while(true){const found=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!found)break;timers.delete(found[0]);clock=found[1].at;found[1].fn()}clock=end}
const press=key=>events.keydown({key,target:{tagName:'BODY'},preventDefault(){}});
keys[0].click();keys[4].click();keys[7].click();assert.equal(el('#scoreMarks').children.length,3);assert.equal(el('#currentNote').textContent,'G');
await el('#replay').click();assert.equal(el('#replay').disabled,true);tick(2000);assert.equal(el('#replay').disabled,false);
el('#keyboardShortcuts').click();press('s');assert.equal(el('#scoreMarks').children.length,3);
el('#keyboardShortcuts').click();press('s');assert.equal(el('#currentNote').textContent,'D');
el('#clearScore').click();assert.equal(el('#scoreMarks').children.length,0);assert.equal(el('#replay').disabled,true);
await el('#learnPhrase').click();tick(4000);assert.ok(keys[0].classes.has('expected'));
keys[2].click();assert.match(el('#lessonStatus').textContent,/Try C/);
for(const note of [0,4,7,4,0])keys[note].click();assert.match(el('#lessonStatus').textContent,/first phrase/);assert.ok(!keys.some(k=>k.classes.has('expected')));
for(const trigger of planners){trigger.click();assert.equal(el('#path').value,trigger.dataset.planner||'Adult beginners');el('#closePlanner').click();assert.ok(trigger.focused)}
planners[1].click();el('#goal').value='Build confidence at the piano';el('#lessonForm').listeners.submit({preventDefault(){}});
assert.equal(el('#output').hidden,false);assert.match(el('#result').textContent,/Young musicians/);assert.match(el('#result').textContent,/No enquiry has been sent/);
el('#download').click();assert.equal(downloads,1);assert.match(await blob.text(),/demonstration only/);
el('#editEnquiry').click();assert.equal(el('#lessonForm').hidden,false);assert.ok(el('#path').focused);
el('#closePlanner').click();await el('#learnPhrase').click();el('#cancelPhrase').click();tick(5000);assert.ok(!keys.some(k=>k.classes.has('expected')));
console.log('PASS: piano, visual score, replay/reset, character-key toggle, guided lesson/wrong-note/cancel, modal pathway/focus, demo response/edit/download.');
console.log('These are isolated JavaScript behaviour tests, not browser layout or real-audio verification.');

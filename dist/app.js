'use strict';
const $=s=>document.querySelector(s);
const planner=$('#planner');let plannerTrigger;
function openPlanner(path,trigger){stopPlayback();plannerTrigger=trigger;$('#goal').selectedIndex=0;$('#lessonForm').hidden=false;$('#output').hidden=true;$('#path').value=path||'Adult beginners';planner.showModal()}
document.querySelectorAll('[data-planner]').forEach(b=>b.addEventListener('click',()=>openPlanner(b.dataset.planner,b)));
$('#closePlanner').addEventListener('click',()=>planner.close());planner.addEventListener('close',()=>plannerTrigger?.focus());
planner.addEventListener('click',e=>{if(e.target===planner){const r=planner.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)planner.close()}});
let enquiry='';
$('#lessonForm').addEventListener('submit',e=>{
  e.preventDefault();
  enquiry='Piano Room — demonstration only\n\nLesson pathway: '+$('#path').value+'\nSample goal: '+$('#goal').value+'\n\nThanks for exploring Piano Room. In a working school website, the next step could be a conversation about suitable lessons.\n\nThis is a fictional design concept by Silverside Web Solutions. No enquiry has been sent and no lesson has been booked.';
  $('#result').textContent=enquiry;$('#lessonForm').hidden=true;$('#output').hidden=false;$('#result').focus();
});
$('#editEnquiry').addEventListener('click',()=>{$('#output').hidden=true;$('#lessonForm').hidden=false;$('#path').focus()});
$('#download').addEventListener('click',()=>{const u=URL.createObjectURL(new Blob([enquiry],{type:'text/plain'})),a=document.createElement('a');a.href=u;a.download='piano-room-demo-example.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)});
let shortcutsEnabled=true;
$('#keyboardShortcuts').addEventListener('click',()=>{
  shortcutsEnabled=!shortcutsEnabled;
  $('#keyboardShortcuts').setAttribute('aria-pressed',String(shortcutsEnabled));
  $('#keyboardShortcuts').textContent='Keyboard shortcuts: '+(shortcutsEnabled?'on':'off');
});
const keys=[...document.querySelectorAll('.key')],keyByNote=new Map(keys.map(k=>[+k.dataset.note,k]));const noteNames=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B','C'];let audio;let recorded=[];let timeouts=[];let busy=false;let lessonMode=false,lessonIndex=0;const phrase=[0,4,7,4,0];
// Start/resume in the original tap handler; wait before scheduling any notes.
async function ensureAudio(){
  try{
    if(typeof navigator!=='undefined'&&navigator.audioSession){
      try{navigator.audioSession.type='playback'}catch(e){/* Optional browser API. */}
    }
    if(!audio||audio.state==='closed'){
      const Context=window.AudioContext||window.webkitAudioContext;
      if(!Context)throw new Error('Web Audio unavailable');
      audio=new Context();
      // A one-frame silent source unlocks older mobile Web Audio implementations.
      const unlock=audio.createBufferSource();
      unlock.buffer=audio.createBuffer(1,1,22050);
      unlock.connect(audio.destination);unlock.start(0);
      unlock.onended=()=>unlock.disconnect();
    }
    if(audio.state!=='running')await audio.resume();
    if(audio.state!=='running')throw new Error('Audio did not start');
    $('#enableSound').textContent='Test sound';
    return audio;
  }catch(e){
    $('#soundHint').textContent='Sound could not start. Tap Enable sound, check media volume and turn off silent mode if needed.';
    $('#enableSound').textContent='Enable sound';
    return null;
  }
}
async function tone(n){
  const context=await ensureAudio();
  if(!context)return false;
  try{
    const t=context.currentTime,gain=context.createGain();
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.16,t+.008);
    gain.gain.exponentialRampToValueAtTime(.001,t+1.6);gain.connect(context.destination);
    [1,2,3,4].forEach((h,i)=>{
      const o=context.createOscillator(),g=context.createGain();
      o.type='sine';o.frequency.value=261.6256*Math.pow(2,n/12)*h;
      g.gain.value=[1,.28,.1,.035][i];o.connect(g);g.connect(gain);o.start(t);o.stop(t+1.7);
    });
    return true;
  }catch(e){
    $('#soundHint').textContent='Sound is unavailable. Tap Enable sound to try again.';
    $('#enableSound').textContent='Enable sound';return false;
  }
}
$('#enableSound').addEventListener('click',async()=>{
  if(await tone(0))$('#soundHint').textContent='Try the keys. If quiet, raise media volume and check silent mode or Bluetooth output.';
});
function drawScore(){const g=$('#scoreMarks');g.replaceChildren();const svg=$("#score"),r=svg.getBoundingClientRect(),width=r.width*145/r.height;svg.setAttribute("viewBox",`0 0 ${width} 145`);document.querySelector(".score-lines path").setAttribute("d",[28,50,72,94,116].map(y=>`M0 ${y}H${width}`).join(" "));const visible=recorded.slice(-Math.max(1,Math.floor((width-100)/34)));visible.forEach((n,i)=>{const x=25+i*34,y=116-n*6.2;const group=document.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('fill',i===visible.length-1?'#bb3b23':'#242520');const ellipse=document.createElementNS('http://www.w3.org/2000/svg','ellipse');ellipse.setAttribute('cx',x);ellipse.setAttribute('cy',y);ellipse.setAttribute('rx',10);ellipse.setAttribute('ry',6);ellipse.setAttribute('transform',`rotate(-18 ${x} ${y})`);const stem=document.createElementNS('http://www.w3.org/2000/svg','path');stem.setAttribute('d',`M${x+9} ${y}v-32`);stem.setAttribute('stroke',i===visible.length-1?'#bb3b23':'#242520');group.append(ellipse,stem);g.append(group)});$('#scoreEmpty').hidden=recorded.length>0;$('#replay').disabled=!recorded.length||busy;$('#scoreCaption').textContent=recorded.length?`${recorded.length} notes. A little piece of you.`:'An empty page. Endless possibilities.'}
function strike(n,record=true){tone(n);const key=keyByNote.get(n);key.classList.add('active');setTimeout(()=>key.classList.remove('active'),230);$('#currentNote').textContent=noteNames[n];if(record){recorded.push(n);if(recorded.length>30)recorded.shift();drawScore()}if(lessonMode&&record){if(n===phrase[lessonIndex]){document.querySelector(`[data-step="${lessonIndex}"]`).classList.add('active');lessonIndex++;if(lessonIndex===phrase.length){lessonMode=false;highlightExpected();$('#lessonStatus').textContent='That was your first phrase. Now make it your own.';$('#learnPhrase').textContent='Try it again ↺';$('#cancelPhrase').hidden=true}else{highlightExpected();$('#lessonStatus').textContent=`Your turn: ${noteNames[phrase[lessonIndex]]}. Note ${lessonIndex+1} of 5.`}}else{$('#lessonStatus').textContent=`Keep exploring. Try ${noteNames[phrase[lessonIndex]]} next.`}}}
keys.forEach(k=>k.addEventListener('click',()=>{if(!busy)strike(+k.dataset.note)}));
const keyboardMap={a:0,s:2,d:4,f:5,g:7,h:9,j:11,k:12,w:1,e:3,t:6,y:8,u:10};document.addEventListener('keydown',e=>{if(!shortcutsEnabled||e.target.isContentEditable||e.repeat||e.ctrlKey||e.altKey||e.metaKey||planner.open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const n=keyboardMap[e.key.toLowerCase()];if(n!==undefined&&!busy){e.preventDefault();strike(n)}});
function highlightExpected(){keys.forEach(k=>k.classList.remove('expected'));if(lessonMode)keyByNote.get(phrase[lessonIndex]).classList.add('expected')}
let playbackGeneration=0;
function stopPlayback(){playbackGeneration++;timeouts.forEach(clearTimeout);timeouts=[];busy=false;lessonMode=false;highlightExpected();$('#replay').textContent='Replay your notes ▷';$('#replay').disabled=!recorded.length;$('#learnPhrase').disabled=false;$('#cancelPhrase').hidden=true}
function schedule(fn,ms){timeouts.push(setTimeout(fn,ms))}
$('#clearScore').addEventListener('click',()=>{stopPlayback();recorded=[];drawScore();$('#currentNote').textContent='—';$('#lessonStatus').textContent='A tiny first lesson, right here.';document.querySelectorAll('[data-step]').forEach(s=>s.classList.remove('active'))});
$('#replay').addEventListener('click',async()=>{
  if(busy||!recorded.length)return;
  stopPlayback();const generation=playbackGeneration;busy=true;
  $('#replay').disabled=true;$('#replay').textContent='Starting sound…';$('#learnPhrase').disabled=true;
  const ready=await ensureAudio();
  if(generation!==playbackGeneration)return;
  if(!ready){stopPlayback();return}
  $('#replay').textContent='Playing your composition…';
  recorded.forEach((n,i)=>schedule(()=>strike(n,false),i*340));
  schedule(()=>stopPlayback(),recorded.length*340+300);
});
$('#learnPhrase').addEventListener('click',async()=>{
  stopPlayback();const generation=playbackGeneration;busy=true;lessonIndex=0;
  $('#learnPhrase').disabled=true;$('#cancelPhrase').hidden=false;$('#replay').disabled=true;
  $('#lessonStatus').textContent='Starting sound…';
  const ready=await ensureAudio();
  if(generation!==playbackGeneration)return;
  if(!ready){stopPlayback();$('#lessonStatus').textContent='Tap Enable sound at the piano, then try this lesson again.';return}
  $('#lessonStatus').textContent='Listen first: C, E, G, E, C.';
  document.querySelectorAll('[data-step]').forEach(s=>s.classList.remove('active'));
  $('#play').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
  phrase.forEach((n,i)=>schedule(()=>{
    strike(n,false);document.querySelectorAll('[data-step]').forEach(s=>s.classList.remove('active'));
    document.querySelector('[data-step="'+i+'"]').classList.add('active');
  },350+i*650));
  schedule(()=>{
    busy=false;lessonMode=true;$('#learnPhrase').disabled=false;$('#replay').disabled=!recorded.length;
    document.querySelectorAll('[data-step]').forEach(s=>s.classList.remove('active'));
    highlightExpected();$('#lessonStatus').textContent='Your turn: C. Follow the warm-coloured key.';
    $('#scoreCaption').textContent='Your turn. C → E → G → E → C.';
  },3900);
});
$('#cancelPhrase').addEventListener('click',()=>{stopPlayback();$('#lessonStatus').textContent='Lesson paused. Play at your own pace.'});

window.addEventListener('resize',drawScore);
drawScore();

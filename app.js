'use strict';
const audio=document.querySelector('#audio');
const $=s=>document.querySelector(s);
const storeKey='faith-audio-v1';
let saved={positions:{},chapter:0,rate:1};
try{saved={...saved,...JSON.parse(localStorage.getItem(storeKey)||'{}')}}catch{}
if(!saved.positions||typeof saved.positions!=='object')saved.positions={};
let chapters=[],current=0,dragging=false,lastSave=0;
const rateOptions=[1,1.25,1.5,2];
let rate=rateOptions.includes(Number(saved.rate))?Number(saved.rate):1;
const format=s=>{s=Math.max(0,Math.floor(Number(s)||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const status=t=>{$('#status').textContent=t};
function persist(){saved.chapter=current;saved.rate=rate;try{localStorage.setItem(storeKey,JSON.stringify(saved))}catch{}}
function record(){if(audio.readyState&&Number.isFinite(audio.currentTime)){saved.positions[current]=audio.currentTime;persist()}}
function renderList(){
 $('#chapters').replaceChildren(...chapters.map((c,i)=>{
  const li=document.createElement('li');li.className='chapter'+(i===current?' selected':'');
  const button=document.createElement('button');button.className='chapter-select';button.setAttribute('aria-label',`Play chapter ${i+1}: ${c.title}`);if(i===current)button.setAttribute('aria-current','true');
  const num=document.createElement('span');num.className='chapter-index';num.textContent=String(i+1).padStart(2,'0');
  const copy=document.createElement('span');copy.className='chapter-copy';
  const title=document.createElement('span');title.className='chapter-title';title.textContent=c.title;
  const meta=document.createElement('span');meta.className='chapter-meta';const pos=Number(saved.positions[i])||0;meta.textContent=`${format(c.duration)} · ${pos>5?`Saved at ${format(pos)}`:'English · MP3'}`;
  copy.append(title,meta);button.append(num,copy);button.addEventListener('click',()=>select(i,true));
  const download=document.createElement('a');download.className='track-download';download.href=c.file;download.download=`My-Catholic-Faith-Chapter-${i+1}.mp3`;download.textContent='↓';download.setAttribute('aria-label',`Download chapter ${i+1}: ${c.title}`);download.title=`Download chapter ${i+1}`;
  li.append(button,download);return li;
 }));
}
function display(){
 if(!dragging){$('#seek').value=audio.currentTime||0;$('#elapsed').textContent=format(audio.currentTime);$('#seek').setAttribute('aria-valuetext',`${format(audio.currentTime)} of ${format(audio.duration||chapters[current]?.duration)}`)}
}
function setRate(value){rate=value;audio.playbackRate=rate;audio.defaultPlaybackRate=rate;audio.preservesPitch=true;document.querySelectorAll('.rate').forEach(b=>{const on=Number(b.dataset.rate)===rate;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});persist()}
function select(index,play=false){
 if(index<0||index>=chapters.length)return;
 record();audio.pause();current=index;const c=chapters[index];
 $('#chapter-number').textContent=`CHAPTER ${index+1}`;$('#current-title').textContent=c.title;$('#duration').textContent=format(c.duration);$('#seek').max=c.duration;$('#seek').value=0;$('#elapsed').textContent='0:00';
 $('#download').href=c.file;$('#download').download=`My-Catholic-Faith-Chapter-${index+1}.mp3`;
 audio.src=c.file;audio.load();setRate(rate);persist();renderList();
 history.replaceState(null,'',`#chapter=${index+1}`);status(play?'Loading audio…':'Ready when you are.');
 if(play)audio.play().catch(()=>status('Tap Play to start listening.'));
}
function updatePlay(){const paused=audio.paused;$('#play-word').textContent=paused?'Play':'Pause';$('#play').setAttribute('aria-label',paused?'Play':'Pause');$('#play-icon').innerHTML=paused?'<path d="M8 5v14l11-7z" fill="currentColor"/>':'<path d="M6 5h4v14H6zm8 0h4v14h-4z" fill="currentColor"/>';}
$('#play').addEventListener('click',()=>{if(audio.paused){status('Loading audio…');audio.play().catch(()=>status('Unable to play. Try again or download this chapter.'))}else audio.pause()});
function skip(amount){if(!Number.isFinite(audio.duration))return;audio.currentTime=Math.min(Math.max(0,audio.currentTime+amount),audio.duration);record();display()}
$('#back').addEventListener('click',()=>skip(-10));$('#forward').addEventListener('click',()=>skip(10));
$('#seek').addEventListener('input',()=>{dragging=true;$('#elapsed').textContent=format($('#seek').value)});
$('#seek').addEventListener('change',()=>{if(Number.isFinite(audio.duration)){audio.currentTime=Math.min(Number($('#seek').value),audio.duration);record()}dragging=false;display()});
document.querySelectorAll('.rate').forEach(b=>b.addEventListener('click',()=>setRate(Number(b.dataset.rate))));
audio.addEventListener('loadedmetadata',()=>{const duration=audio.duration;if(!Number.isFinite(duration))return;$('#seek').max=duration;$('#duration').textContent=format(duration);let pos=Number(saved.positions[current])||0;if(pos>=duration-2)pos=0;audio.currentTime=Math.max(0,Math.min(pos,duration));audio.playbackRate=rate;display();if(audio.paused)status(pos>5?`Ready to resume at ${format(pos)}.`:'Choose Play to begin.');if('mediaSession'in navigator&&window.MediaMetadata){navigator.mediaSession.metadata=new MediaMetadata({title:chapters[current].title,artist:'John Paul Thomas · AI narration',album:'My Catholic Faith!'})}});
audio.addEventListener('timeupdate',()=>{display();if(Date.now()-lastSave>3000){record();lastSave=Date.now()}});
audio.addEventListener('play',()=>{updatePlay();status('Listening · your place saves automatically.')});
audio.addEventListener('playing',()=>status('Listening · your place saves automatically.'));
audio.addEventListener('pause',()=>{updatePlay();record();if(!audio.ended)status(`Paused at ${format(audio.currentTime)}.`)});
audio.addEventListener('waiting',()=>{if(!audio.paused)status('Buffering…')});
audio.addEventListener('error',()=>status('Audio could not load. Check your connection or use Download.'));
audio.addEventListener('ended',()=>{saved.positions[current]=0;persist();updatePlay();renderList();status(current<chapters.length-1?'Chapter complete. Select the next chapter when you’re ready.':'You’ve reached the end of chapter '+chapters.length+'.')});
window.addEventListener('pagehide',record);document.addEventListener('visibilitychange',()=>{if(document.hidden)record()});
window.addEventListener('hashchange',()=>{const n=Number(new URLSearchParams(location.hash.slice(1)).get('chapter'))-1;if(Number.isInteger(n)&&n>=0&&n<chapters.length&&n!==current)select(n,false)});
$('#share').addEventListener('click',async()=>{const data={title:'My Catholic Faith! · Listen',text:'Listen to My Catholic Faith! chapters 1–6.',url:location.href};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);status('Link copied—ready to share.')}}catch(e){if(e.name!=='AbortError')status('You can copy the page address from your browser to share it.')}});
if('mediaSession'in navigator){for(const [action,handler]of Object.entries({play:()=>audio.play().catch(()=>{}),pause:()=>audio.pause(),seekbackward:()=>skip(-10),seekforward:()=>skip(10),seekto:d=>{audio.currentTime=d.seekTime;record()}})){try{navigator.mediaSession.setActionHandler(action,handler)}catch{}}}
fetch('chapters.json').then(r=>{if(!r.ok)throw Error('chapters');return r.json()}).then(data=>{chapters=data;const requested=Number(new URLSearchParams(location.hash.slice(1)).get('chapter'))-1;const initial=Number.isInteger(requested)&&requested>=0&&requested<data.length?requested:Math.min(Math.max(0,Number(saved.chapter)||0),data.length-1);select(initial,false)}).catch(()=>status('Could not load the chapters. Please refresh the page.'));

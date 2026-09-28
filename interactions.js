(()=>{
const root=document.getElementById('page'),visual=document.querySelector('.visual'),breath=document.querySelector('.house-breath'),house=document.getElementById('house');
const interactionLayer=document.querySelector('.scene-interactions'),musicButton=document.getElementById('music-toggle'),musicLabel=document.getElementById('music-label');
const backgroundMusic=document.getElementById('background-music'),guitarSound=document.getElementById('guitar-sound'),whisper=document.getElementById('cottage-whisper');
const guitar=document.querySelector('.guitar-hotspot'),lamp=document.querySelector('.lamp-hotspot'),windowButton=document.querySelector('.window-hotspot');
const positioned=[...document.querySelectorAll('[data-scene-x]')];

// Replace these four files in assets/audio; time of day never changes this choice.
const guitarSounds={
  spring:'assets/audio/guitar_spring.mp3',
  summer:'assets/audio/guitar_summer.mp3',
  autumn:'assets/audio/guitar_autumn.mp3',
  winter:'assets/audio/guitar_winter.mp3'
};
const guitarVolume=.2;

function placeSceneControls(){
  const width=breath.clientWidth,height=breath.clientHeight;if(!width||!height||!house.naturalWidth)return;
  const imageRatio=house.naturalWidth/house.naturalHeight,boxRatio=width/height;
  let shownWidth,shownHeight,offsetX,offsetY;
  if(boxRatio>imageRatio){shownHeight=height;shownWidth=height*imageRatio;offsetX=(width-shownWidth)/2;offsetY=0}else{shownWidth=width;shownHeight=width/imageRatio;offsetX=0;offsetY=(height-shownHeight)/2}
  positioned.forEach(el=>{el.style.left=`${offsetX+Number(el.dataset.sceneX)*shownWidth}px`;el.style.top=`${offsetY+Number(el.dataset.sceneY)*shownHeight}px`});
  whisper.style.left=`${offsetX+.59*shownWidth}px`;whisper.style.top=`${offsetY+.47*shownHeight}px`;
}
house.addEventListener('load',placeSceneControls);addEventListener('resize',placeSceneControls,{passive:true});requestAnimationFrame(placeSceneControls);

backgroundMusic.volume=.18;guitarSound.volume=guitarVolume;
let musicOn=false;let remembered=false;try{remembered=sessionStorage.getItem('ourCottageMusic')==='on'}catch{}
if(remembered)musicLabel.textContent='Music · Ready';
function setMusicUI(on){musicOn=on;musicButton.setAttribute('aria-pressed',String(on));musicLabel.textContent=on?'Music · On':'Music · Off';try{sessionStorage.setItem('ourCottageMusic',on?'on':'off')}catch{}}
musicButton.addEventListener('click',async()=>{
  if(musicOn){backgroundMusic.pause();setMusicUI(false);return}
  try{await backgroundMusic.play();setMusicUI(true)}catch{musicLabel.textContent='Music · Tap again'}
});

function pulse(button){button.classList.remove('pulse');void button.offsetWidth;button.classList.add('pulse');setTimeout(()=>button.classList.remove('pulse'),750)}
let guitarRequest=0,knownSeason=season;
function fadeGuitar(id,duration=180){return new Promise(resolve=>{
  if(guitarSound.paused||!guitarSound.currentTime){resolve(true);return}
  const started=performance.now(),initial=guitarSound.volume;
  function step(now){
    if(id!==guitarRequest){resolve(false);return}
    const progress=Math.min(1,(now-started)/duration);guitarSound.volume=initial*(1-progress);
    if(progress<1)requestAnimationFrame(step);else{guitarSound.pause();guitarSound.currentTime=0;resolve(true)}
  }
  requestAnimationFrame(step);
})}
async function playSeasonGuitar(){
  const id=++guitarRequest,target=guitarSounds[season]||guitarSounds.summer;pulse(guitar);
  if(!await fadeGuitar(id)||id!==guitarRequest)return;
  guitarSound.pause();guitarSound.currentTime=0;guitarSound.volume=guitarVolume;
  if(guitarSound.getAttribute('src')!==target){guitarSound.setAttribute('src',target);guitarSound.load()}
  try{await guitarSound.play()}catch{}
}
async function stopGuitar(){const id=++guitarRequest;if(await fadeGuitar(id)&&id===guitarRequest)guitarSound.volume=guitarVolume}
guitar.addEventListener('click',playSeasonGuitar);

let lampOn=false;lamp.addEventListener('click',()=>{lampOn=!lampOn;root.classList.toggle('lamp-on',lampOn);lamp.setAttribute('aria-pressed',String(lampOn));lamp.setAttribute('aria-label',lampOn?'调暗门廊灯':'打开门廊灯');pulse(lamp)});
let whisperTimer=0;windowButton.addEventListener('click',()=>{
  root.classList.add('window-awake');whisper.classList.add('show');pulse(windowButton);clearTimeout(whisperTimer);
  whisperTimer=setTimeout(()=>{root.classList.remove('window-awake');whisper.classList.remove('show')},3200);
});
root.addEventListener('cottage:statechange',event=>{
  clearTimeout(whisperTimer);root.classList.remove('window-awake');whisper.classList.remove('show');
  if(event.detail.season!==knownSeason){knownSeason=event.detail.season;stopGuitar()}
});
})();

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

// Interaction overlays follow the camera assigned to each season. Values are
// normalized against the 1500 × 1280 render and remain unchanged across time.
const scenePoints={
  spring:{guitar:[.455,.62],lamp:[.526,.545],window:[.555,.405],shelf:[.585,.535],table:[.7,.55],shelfCard:[.655,.46],note:[.7,.465],whisper:[.59,.47]},
  summer:{guitar:[.393,.588],lamp:[.499,.548],window:[.547,.436],shelf:[.595,.562],table:[.63,.626],shelfCard:[.665,.487],note:[.63,.541],whisper:[.582,.501]},
  autumn:{guitar:[.417,.606],lamp:[.513,.548],window:[.556,.422],shelf:[.595,.549],table:[.676,.593],shelfCard:[.665,.474],note:[.676,.508],whisper:[.591,.487]},
  winter:{guitar:[.403,.598],lamp:[.506,.548],window:[.553,.429],shelf:[.596,.556],table:[.655,.611],shelfCard:[.666,.481],note:[.655,.526],whisper:[.588,.494]}
};
const pointTargets={guitar:'.guitar-hotspot',lamp:'.porch-light,.lamp-hotspot',window:'.window-warmth,.window-hotspot',shelf:'.shelf-book,.shelf-hotspot',table:'.table-book,.table-book-hotspot',shelfCard:'.shelf-secret',note:'.bookmark-note'};
function applyScenePoints(){
  const points=scenePoints[season]||scenePoints.spring;
  Object.entries(pointTargets).forEach(([key,selector])=>document.querySelectorAll(selector).forEach(el=>{el.dataset.sceneX=points[key][0];el.dataset.sceneY=points[key][1]}));
  return points;
}

function placeSceneControls(){
  const width=breath.clientWidth,height=breath.clientHeight;if(!width||!height||!house.naturalWidth)return;
  const imageRatio=house.naturalWidth/house.naturalHeight,boxRatio=width/height;
  let shownWidth,shownHeight,offsetX,offsetY;
  if(boxRatio>imageRatio){shownHeight=height;shownWidth=height*imageRatio;offsetX=(width-shownWidth)/2;offsetY=0}else{shownWidth=width;shownHeight=width/imageRatio;offsetX=0;offsetY=(height-shownHeight)/2}
  positioned.forEach(el=>{el.style.left=`${offsetX+Number(el.dataset.sceneX)*shownWidth}px`;el.style.top=`${offsetY+Number(el.dataset.sceneY)*shownHeight}px`});
  const points=scenePoints[season]||scenePoints.spring;whisper.style.left=`${offsetX+points.whisper[0]*shownWidth}px`;whisper.style.top=`${offsetY+points.whisper[1]*shownHeight}px`;
}
applyScenePoints();house.addEventListener('load',placeSceneControls);addEventListener('resize',placeSceneControls,{passive:true});requestAnimationFrame(placeSceneControls);

backgroundMusic.volume=.18;guitarSound.volume=guitarVolume;
let musicOn=false;let remembered=false;try{remembered=sessionStorage.getItem('ourCottageMusic')==='on'}catch{}
if(remembered)musicLabel.textContent='Music · Ready';
function setMusicUI(on){musicOn=on;musicButton.setAttribute('aria-pressed',String(on));musicLabel.textContent=on?'Music · On':'Music · Off';try{sessionStorage.setItem('ourCottageMusic',on?'on':'off')}catch{}}
musicButton.addEventListener('click',async()=>{
  if(musicOn){backgroundMusic.pause();setMusicUI(false);return}
  try{await backgroundMusic.play();setMusicUI(true)}catch{musicLabel.textContent='Music · Tap again'}
});

function pulse(button){button.classList.remove('pulse');void button.offsetWidth;button.classList.add('pulse');setTimeout(()=>button.classList.remove('pulse'),750)}
let guitarRequest=0,knownSeason=season,lastGuitarAt=0;
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
  const now=performance.now();if(now-lastGuitarAt<1400)return;lastGuitarAt=now;
  const id=++guitarRequest,target=guitarSounds[season]||guitarSounds.summer;pulse(guitar);
  if(!await fadeGuitar(id)||id!==guitarRequest)return;
  guitarSound.pause();guitarSound.currentTime=0;guitarSound.volume=guitarVolume;
  if(guitarSound.getAttribute('src')!==target){guitarSound.setAttribute('src',target);guitarSound.load()}
  try{await guitarSound.play()}catch{}
}
async function stopGuitar(){const id=++guitarRequest;if(await fadeGuitar(id)&&id===guitarRequest)guitarSound.volume=guitarVolume}
guitar.addEventListener('click',playSeasonGuitar);

let lampOn=false;function toggleLamp(){lampOn=!lampOn;root.classList.toggle('lamp-on',lampOn);lamp.setAttribute('aria-pressed',String(lampOn));lamp.setAttribute('aria-label',lampOn?'调暗门廊灯':'打开门廊灯');pulse(lamp);root.dispatchEvent(new CustomEvent('cottage:lamp',{detail:{on:lampOn}}));return lampOn}
lamp.addEventListener('click',toggleLamp);
let whisperTimer=0;function awakenWindow(){
  root.classList.add('window-awake');whisper.classList.add('show');pulse(windowButton);clearTimeout(whisperTimer);
  root.dispatchEvent(new CustomEvent('cottage:windowawake'));
  whisperTimer=setTimeout(()=>{root.classList.remove('window-awake');whisper.classList.remove('show')},3200);
}
windowButton.addEventListener('click',awakenWindow);
window.cottageInteractions={playSeasonGuitar,toggleLamp,awakenWindow,stopGuitar,isMusicOn:()=>musicOn};
root.addEventListener('cottage:statechange',event=>{
  applyScenePoints();requestAnimationFrame(placeSceneControls);
  clearTimeout(whisperTimer);root.classList.remove('window-awake');whisper.classList.remove('show');
  if(event.detail.season!==knownSeason){knownSeason=event.detail.season;stopGuitar()}
});
})();

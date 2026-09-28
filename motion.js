/* Native browser animations only. Rendered image effects do not alter the model. */
(()=>{
const root=document.getElementById('page'),visual=document.querySelector('.visual'),text=document.querySelector('.copy'),house=document.getElementById('house');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

// Central timing controls for the living-diorama transitions.
const TRANSITION={houseOut:500,houseIn:760,background:1550,textOut:430,textIn:560,textStagger:140,weather:1000};

// Weather tuning: these four values are the intended first place to adjust density.
const springPetalCount=20;
const rainCount=30;
const leafCount=20;
const snowCount=40;
const WEATHER_COUNTS={spring:springPetalCount,summer:rainCount,autumn:leafCount,winter:snowCount};
const WEATHER_NAMES={spring:'春日落花',summer:'夏季暴雨',autumn:'秋日落叶',winter:'冬日雪花'};
const mobileParticleFactor=.8;

const breath=document.createElement('div');breath.className='house-breath';house.replaceWith(breath);breath.append(house);
const halo=document.createElement('div');halo.className='ambient-halo';halo.setAttribute('aria-hidden','true');visual.prepend(halo);
const tree=document.createElement('div');tree.className='tree-breeze';tree.setAttribute('aria-hidden','true');const treeImage=new Image();treeImage.alt='';tree.append(treeImage);breath.append(tree);
const glow=document.createElement('div');glow.className='window-glow';glow.setAttribute('aria-hidden','true');breath.append(glow);
const weatherLayer=document.createElement('div');weatherLayer.className='weather-layer';weatherLayer.setAttribute('aria-hidden','true');visual.append(weatherLayer);
const tint=document.createElement('div');tint.className='weather-tint';tint.setAttribute('aria-hidden','true');root.prepend(tint);
const bg=document.createElement('div');bg.className='ambient-layer';bg.setAttribute('aria-hidden','true');root.prepend(bg);
const status=document.createElement('div');status.className='motion-status';status.setAttribute('role','status');root.append(status);
const textParts=[text.querySelector('.eyebrow'),text.querySelector('h1'),text.querySelector('.body'),text.querySelector('.personal')];

let requestedSeason=season,requestedTime=time,weatherState=params.get('weather')==='on'?'on':'off';
let revision=0,weatherRevision=0,animations=[];

function cancel(){animations.forEach(a=>a.cancel());animations=[]}
function animate(el,frames,opts){const a=el.animate(frames,opts);animations.push(a);return a.finished.catch(()=>{})}
function syncTree(){treeImage.src=house.src}
function syncWeatherButtons(){document.querySelectorAll('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.weather===weatherState))}
function syncWeatherClasses(){
  root.classList.remove('weather-on','weather-spring','weather-summer','weather-autumn','weather-winter');
  if(weatherState==='on')root.classList.add('weather-on',`weather-${season}`);
}
function makeParticle(kind,index,count){
  const particle=document.createElement('i');particle.className=`weather-particle ${kind}`;
  particle.style.setProperty('--left',`${3+((index*37)%94)}%`);
  particle.style.setProperty('--top',`${-18-((index*23)%72)}px`);
  particle.style.setProperty('--delay',`${-(index*1.73)%15}s`);
  const direction=index%2?1:-1;
  if(kind==='petal'){
    particle.style.setProperty('--duration',`${13+(index%7)*1.35}s`);
    particle.style.setProperty('--drift',`${direction*(18+(index%5)*7)}px`);
    particle.style.setProperty('--petal',['#cf5a67','#8862a8','#e6bd55'][index%3]);
    particle.style.setProperty('--size',`${8+(index%5)*1.6}px`);
  }else if(kind==='rain'){
    particle.style.setProperty('--duration',`${1.05+(index%6)*.11}s`);
  }else if(kind==='leaf'){
    particle.style.setProperty('--duration',`${11+(index%8)*1.15}s`);
    particle.style.setProperty('--drift',`${direction*(34+(index%6)*8)}px`);
    particle.style.setProperty('--spin',`${direction*(150+(index%5)*65)}deg`);
    particle.style.setProperty('--leaf',['#d9a14b','#bd743d','#8e5a38','#e1b45d'][index%4]);
  }else{
    particle.textContent=index%3===0?'❅':'❄';
    particle.style.setProperty('--duration',`${12+(index%9)*1.05}s`);
    particle.style.setProperty('--drift',`${direction*(12+(index%7)*5)}px`);
    particle.style.setProperty('--size',`${8+(index%5)*2}px`);
  }
  particle.dataset.index=`${index+1}/${count}`;
  return particle;
}
function buildWeather(){
  weatherLayer.replaceChildren();
  if(weatherState==='off'||reduced.matches){root.dataset.weatherRendered='off';return}
  const kind={spring:'petal',summer:'rain',autumn:'leaf',winter:'snow'}[season];
  weatherLayer.className=`weather-layer ${season}`;
  const count=Math.round(WEATHER_COUNTS[season]*(innerWidth<=767?mobileParticleFactor:1));
  const fragment=document.createDocumentFragment();
  for(let i=0;i<count;i++)fragment.append(makeParticle(kind,i,count));
  if(season==='summer'){const drops=document.createElement('div');drops.className='glass-drops';fragment.append(drops)}
  weatherLayer.append(fragment);root.dataset.weatherRendered=`${season}:${count}`;
}
function fadeOutgoingWeather(){
  if(!weatherLayer.childElementCount||!weatherLayer.classList.contains('is-on'))return;
  const outgoing=weatherLayer.cloneNode(true);outgoing.classList.add('weather-outgoing');weatherLayer.before(outgoing);
  requestAnimationFrame(()=>requestAnimationFrame(()=>outgoing.classList.remove('is-on')));
  setTimeout(()=>outgoing.remove(),TRANSITION.weather+120);
}
function refreshWeather(soft=true){
  const id=++weatherRevision;syncWeatherClasses();syncWeatherButtons();
  if(weatherState==='off'){
    weatherLayer.classList.remove('is-on');root.dataset.weatherRendered='off';
    setTimeout(()=>{if(id===weatherRevision)weatherLayer.replaceChildren()},soft?TRANSITION.weather:0);return;
  }
  if(soft)fadeOutgoingWeather();
  buildWeather();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{if(id===weatherRevision&&!reduced.matches)weatherLayer.classList.add('is-on')}));
}
function setWeather(next){
  weatherState=next==='on'?'on':'off';refreshWeather(true);
  status.textContent=weatherState==='on'?`${WEATHER_NAMES[season]}已开启`:'天气效果已关闭';
}
function animateTextOut(){
  return Promise.all(textParts.map((part,index)=>animate(part,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-12px)'}],{duration:TRANSITION.textOut,easing:'cubic-bezier(.4,0,.4,1)',delay:index*45,fill:'forwards'})));
}
function animateTextIn(){
  const delays=[0,70,70+TRANSITION.textStagger,70+TRANSITION.textStagger*2];
  return Promise.all(textParts.map((part,index)=>animate(part,[{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:TRANSITION.textIn,easing:'cubic-bezier(.22,.61,.36,1)',delay:delays[index],fill:'forwards'})));
}
async function select(nextSeason,nextTime){
  requestedSeason=nextSeason;requestedTime=nextTime;const id=++revision;
  const seasonChanged=nextSeason!==season;
  const realtimeStateChange=root.dataset.webgl==='ready';
  const image=new Image();image.src=`assets/${nextSeason}_${nextTime}.webp`;
  try{await image.decode()}catch{if(id===revision)status.textContent='图片暂时无法载入，请重新选择。';return}
  if(id!==revision)return;status.textContent='';cancel();
  if(!reduced.matches){
    await Promise.all([
      animateTextOut(),
      realtimeStateChange?Promise.resolve():animate(visual,[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.988)'}],{duration:TRANSITION.houseOut,easing:'cubic-bezier(.45,0,.55,1)',fill:'forwards'})
    ]);
    if(id!==revision)return;
  }
  bg.style.background=getComputedStyle(root).background;bg.style.opacity='1';
  season=nextSeason;time=nextTime;update();syncTree();
  if(seasonChanged)refreshWeather(true);else{syncWeatherClasses();syncWeatherButtons()}
  root.dataset.state=`${season}_${time}`;root.dispatchEvent(new CustomEvent('cottage:statechange',{detail:{season,time}}));
  if(reduced.matches){cancel();bg.style.opacity='0';return}
  await Promise.all([
    animateTextIn(),
    realtimeStateChange?Promise.resolve():animate(visual,[{opacity:0,transform:'scale(1.012)'},{opacity:1,transform:'scale(1)'}],{duration:TRANSITION.houseIn,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'}),
    animate(bg,[{opacity:1},{opacity:0}],{duration:TRANSITION.background,easing:'cubic-bezier(.45,0,.3,1)',fill:'forwards'})
  ]);
  if(id===revision){cancel();bg.style.opacity='0'}
}

document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>select(b.dataset.season,requestedTime));
document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>select(requestedSeason,b.dataset.time));
document.querySelectorAll('[data-weather]').forEach(b=>b.onclick=()=>setWeather(b.dataset.weather));
let frame=0;root.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=visual.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(e.clientX-r.x-r.width/2)/(r.width/2)));const y=Math.max(-1,Math.min(1,(e.clientY-r.y-r.height/2)/(r.height/2)));visual.style.setProperty('--px',`${x*2.5}px`);visual.style.setProperty('--py',`${y*1.5}px`)})},{passive:true});
root.addEventListener('pointerleave',()=>{visual.style.setProperty('--px','0px');visual.style.setProperty('--py','0px')});
document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('motion-paused',document.hidden));
reduced.addEventListener('change',()=>{revision++;cancel();bg.style.opacity='0';season=requestedSeason;time=requestedTime;update();syncTree();refreshWeather(false);root.dataset.state=`${season}_${time}`;visual.style.setProperty('--px','0px');visual.style.setProperty('--py','0px')});
window.cottageEnterState=()=>{if(weatherState!=='off')setWeather('off');return select('spring','night')};
syncTree();syncWeatherButtons();refreshWeather(false);root.dataset.state=`${season}_${time}`;
})();

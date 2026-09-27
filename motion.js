/* ============================================================================
   Weather 可调参数 —— 后续微调视觉，只改这一段即可
   petalCount  Spring 花瓣数量（Falling Petals / 春日落花）
   rainCount   Summer 暴雨雨滴数量
   leafCount   Autumn 落叶数量
   snowCount   Winter 雪花数量
   ============================================================================ */
const WEATHER_CONFIG={
petalCount:15,
rainCount:30,
leafCount:20,
snowCount:20
};
const WEATHER_BY_SEASON={spring:'petal',summer:'rain',autumn:'leaf',winter:'snow'};
/* 手机端粒子数量缩放：×0.72，即四季各减约 27%–30%（15→11 / 30→22 / 20→14）。
   低端机 GPU 填充率有限，雨天 30 条雨线是最大的开销来源。改这一个数即可整体加减。 */
const MOBILE_PARTICLE_SCALE=.72;
/* 手机端鼠标视差幅度收一档（触屏本来就没有 hover，这里主要影响调试与小屏笔记本） */
const MOBILE_PARALLAX={x:1.2,y:.8};
let narrow=window.matchMedia('(max-width:900px)');
/* 天气淡出 / 淡入时长，与 motion.css 里 .weather-layer 的 transition 保持一致 */
const WEATHER_FADE={out:420,in:950};
const WEATHER_LEAF_COLORS=['#c9873f','#b8562a','#d9a441','#8a6a3d','#a8663a'];
/* 是否已经真正进入小屋（走过序章或跳过序章）。互动热点据此决定要不要给"发现提示" */
let cottageEntered=false;
/* 花瓣配色：浅粉 / 淡白粉 / 轻桃色，每项为 [高光, 主色, 边缘]。
   边缘色略深一档，保证落在浅色春景上仍能看出花瓣轮廓。 */
const PETAL_PALETTE=[
['#fff7fa','#ffc8dd','#eb9fbd'],
['#fffbf8','#ffd4c2','#e7a68b'],
['#fff6fa','#ffc1d7','#e390b5'],
['#fffaf9','#ffe0d3','#efac93']
];

/* Native browser animations only. Rendered image effects do not alter the model. */
(()=>{
const root=document.getElementById('page'),visual=document.querySelector('.visual'),text=document.querySelector('.copy'),house=document.getElementById('house');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const breath=document.createElement('div');breath.className='house-breath';house.replaceWith(breath);breath.append(house);
const tree=document.createElement('div');tree.className='tree-breeze';tree.setAttribute('aria-hidden','true');const treeImage=new Image();treeImage.alt='';tree.append(treeImage);breath.append(tree);
const glow=document.createElement('div');glow.className='window-glow';glow.setAttribute('aria-hidden','true');breath.append(glow);
const bg=document.createElement('div');bg.className='ambient-layer';root.prepend(bg);
const weatherTint=document.createElement('div');weatherTint.className='weather-tint';weatherTint.setAttribute('aria-hidden','true');
const weatherLayer=document.createElement('div');weatherLayer.className='weather-layer';weatherLayer.setAttribute('aria-hidden','true');
visual.append(weatherTint,weatherLayer);
const status=document.createElement('div');status.className='motion-status';status.setAttribute('role','status');root.append(status);
let requestedSeason=season,requestedTime=time,revision=0,animations=[];
let weatherKind=null,weatherRevision=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const setProp=(el,k,v)=>el.style.setProperty(k,v);
function rng(seed){let s=seed|0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

/* Weather=On 时取当前季节对应的天气种类；Off 一律返回 null（不显示粒子） */
function currentKind(hint){return weather==='on'?WEATHER_BY_SEASON[hint||season]||null:null}

/* 实际粒子数：桌面用 WEATHER_CONFIG，手机按 MOBILE_PARTICLE_SCALE 折算 */
function countOf(kind){const base=WEATHER_CONFIG[kind+'Count']||0;return narrow.matches?Math.max(4,Math.round(base*MOBILE_PARTICLE_SCALE)):base}

function buildWeather(kind){
weatherLayer.replaceChildren();
if(!kind)return;
const rand=rng(kind.length*7919+countOf(kind)*131);
const frag=document.createDocumentFragment();
if(kind==='petal'){for(let i=0;i<countOf('petal');i++){const d=document.createElement('i');d.className='w-petal';
/* 每 4 片取 1 片作为「近景花瓣」：更大 + 轻微模糊 + 更快下落，制造景深 */
const near=i%4===1;const c=PETAL_PALETTE[(rand()*PETAL_PALETTE.length)|0];
setProp(d,'--x',(17+rand()*73).toFixed(2)+'%');setProp(d,'--s',(near?20+rand()*8:15+rand()*6).toFixed(1)+'px');setProp(d,'--sc',(near?(1.2+rand()*.3):(.85+rand()*.3)).toFixed(2));setProp(d,'--b',(near?1.4+rand()*.8:.1+rand()*.3).toFixed(2)+'px');setProp(d,'--d',(near?19+rand()*6:23+rand()*9).toFixed(1)+'s');setProp(d,'--dl',(-rand()*32).toFixed(1)+'s');setProp(d,'--o',(near?.9+rand()*.1:.72+rand()*.24).toFixed(2));setProp(d,'--sway',(22+rand()*46).toFixed(0));setProp(d,'--r0',(rand()*360).toFixed(0)+'deg');setProp(d,'--c1',c[0]);setProp(d,'--c2',c[1]);setProp(d,'--c3',c[2]);frag.append(d)}}
else if(kind==='rain'){for(let i=0;i<countOf('rain');i++){const d=document.createElement('i');d.className='w-rain';
setProp(d,'--x',(-2+rand()*104).toFixed(2)+'%');setProp(d,'--h',(24+rand()*26).toFixed(0)+'px');setProp(d,'--d',(0.42+rand()*0.36).toFixed(2)+'s');setProp(d,'--dl',(-rand()*0.78).toFixed(2)+'s');setProp(d,'--o',(0.38+rand()*0.42).toFixed(2));frag.append(d)}}
else if(kind==='leaf'){for(let i=0;i<countOf('leaf');i++){const d=document.createElement('i');d.className='w-leaf';
setProp(d,'--x',(12+rand()*81).toFixed(2)+'%');setProp(d,'--s',(10+rand()*7).toFixed(1)+'px');setProp(d,'--d',(15+rand()*9).toFixed(1)+'s');setProp(d,'--dl',(-rand()*24).toFixed(1)+'s');setProp(d,'--o',(0.6+rand()*0.32).toFixed(2));setProp(d,'--sway',(30+rand()*50).toFixed(0));setProp(d,'--r0',(rand()*360).toFixed(0)+'deg');setProp(d,'--c',WEATHER_LEAF_COLORS[(rand()*WEATHER_LEAF_COLORS.length)|0]);frag.append(d)}}
else if(kind==='snow'){for(let i=0;i<countOf('snow');i++){const d=document.createElement('i');d.className='w-snow';
setProp(d,'--x',(12+rand()*81).toFixed(2)+'%');setProp(d,'--s',(3+rand()*6).toFixed(1)+'px');setProp(d,'--d',(13+rand()*9).toFixed(1)+'s');setProp(d,'--dl',(-rand()*22).toFixed(1)+'s');setProp(d,'--o',(0.55+rand()*0.37).toFixed(2));setProp(d,'--sway',(20+rand()*36).toFixed(0));frag.append(d)}}
weatherLayer.append(frag);
}

/* 只有暴雨才叠暗化 + 冷色，其余季节保持原配色 */
function syncTint(kind){const rain=kind==='rain';weatherTint.classList.toggle('on',rain);visual.classList.toggle('rain',rain)}

/* 天气层柔和淡出 → 换粒子 → 淡入；用 token 防止连续点击时旧状态覆盖新状态 */
async function applyWeather(fade=true,hint){
const kind=currentKind(hint);
if(kind===weatherKind)return;
weatherKind=kind;
const token=++weatherRevision;
if(fade&&!reduced.matches&&weatherLayer.childElementCount){
weatherLayer.classList.remove('on');
await sleep(WEATHER_FADE.out);
if(token!==weatherRevision)return;
}
buildWeather(kind);
syncTint(kind);
weatherLayer.classList.toggle('on',!!kind);
}

function cancel(){animations.forEach(a=>a.cancel());animations=[]}
function animate(el,frames,opts){const a=el.animate(frames,opts);animations.push(a);return a.finished.catch(()=>{})}
/* 预载图片：使用 onload / onerror 而不是 img.decode()。
   部分浏览器在 file:// 下会让 decode() 永久挂起，导致季节切换卡住不提交。 */
function preload(src){
return new Promise(resolve=>{
const img=new Image();let settled=false,timer=0;
const finish=ok=>{if(settled)return;settled=true;clearTimeout(timer);resolve(ok)};
img.onload=()=>finish(true);img.onerror=()=>finish(false);
img.src=src;
if(img.complete&&img.naturalWidth>0)finish(true);
timer=setTimeout(()=>finish(img.complete&&img.naturalWidth>0),4000);
});
}
/* 昼夜 / 季节切换：环境色、小屋明暗、窗灯、门廊灯、暗角、粒子可见度都由 .page 的 time 类
   驱动，各走 .95s ease-in-out；这里只负责文案与小屋的横切淡入淡出，整体约 1.2s */
const SWITCH={textOut:340,visualOut:400,textIn:500,visualIn:560,bgFade:900};
async function select(nextSeason,nextTime){
requestedSeason=nextSeason;requestedTime=nextTime;const id=++revision;
if(!await preload(`assets/${nextSeason}_${nextTime}.webp`)){if(id===revision)status.textContent='图片暂时无法载入，请重新选择。';return}
if(id!==revision)return;status.textContent='';
const textOpacity=getComputedStyle(text).opacity,visualOpacity=getComputedStyle(visual).opacity;cancel();
if(!reduced.matches){applyWeather(true,nextSeason);await Promise.all([animate(text,[{opacity:textOpacity},{opacity:0}],{duration:SWITCH.textOut,easing:'ease-in-out',fill:'forwards'}),animate(visual,[{opacity:visualOpacity},{opacity:0}],{duration:SWITCH.visualOut,easing:'ease-in-out',fill:'forwards'})]);if(id!==revision)return}
bg.style.background=getComputedStyle(root).background;bg.style.opacity='1';
season=nextSeason;time=nextTime;update();treeImage.src=house.src;applyWeather(true,nextSeason);root.dataset.state=`${season}_${time}`;
if(reduced.matches){cancel();bg.style.opacity='0';return}
await Promise.all([animate(text,[{opacity:0},{opacity:1}],{duration:SWITCH.textIn,easing:'ease-out',fill:'forwards'}),animate(visual,[{opacity:0},{opacity:1}],{duration:SWITCH.visualIn,easing:'ease-out',fill:'forwards'}),animate(bg,[{opacity:1},{opacity:0}],{duration:SWITCH.bgFade,easing:'ease-in-out',fill:'forwards'})]);
if(id===revision){cancel();bg.style.opacity='0'}
}
document.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>select(b.dataset.season,requestedTime));
document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>select(requestedSeason,b.dataset.time));
document.querySelectorAll('[data-weather]').forEach(b=>b.onclick=()=>{weather=b.dataset.weather;update();applyWeather(true)});
let frame=0;root.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch')return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=visual.getBoundingClientRect();const x=Math.max(-1,Math.min(1,(e.clientX-r.x-r.width/2)/(r.width/2)));const y=Math.max(-1,Math.min(1,(e.clientY-r.y-r.height/2)/(r.height/2)));const a=narrow.matches?MOBILE_PARALLAX:{x:2.5,y:1.5};visual.style.setProperty('--px',`${x*a.x}px`);visual.style.setProperty('--py',`${y*a.y}px`)})},{passive:true});
root.addEventListener('pointerleave',()=>{visual.style.setProperty('--px','0px');visual.style.setProperty('--py','0px')});
/* 跨过 900px 断点（横竖屏切换 / 改窗口大小）时按新的粒子数重建天气 */
narrow.addEventListener('change',()=>{weatherKind=null;applyWeather(false);treeImage.src=house.src});
document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('motion-paused',document.hidden)});
reduced.addEventListener('change',()=>{revision++;cancel();bg.style.opacity='0';season=requestedSeason;time=requestedTime;update();treeImage.src=house.src;weatherKind=null;applyWeather(false);root.dataset.state=`${season}_${time}`;visual.style.setProperty('--px','0px');visual.style.setProperty('--py','0px')});
root.dataset.state=`${season}_${time}`;
treeImage.src=house.src;
applyWeather(true);
})();

/* ============================================================================
   Prologue — 首页序章 / 回家按钮 / 镜头推进感过渡
   PROLOGUE_TIMING  各段文案与按钮的出现时刻、推进总时长（ms）
   PUSH_FRAMES      镜头推进关键帧（transform / filter），调推进力度只改这里
   ?prologue=off    可直接跳过序章进入主页面
   ============================================================================ */
const PROLOGUE_TIMING={
greeting:520,      // 第 1 段「最亲密的爱人，」
declaration:1680,  // 第 2 段三行淡入起点
step:500,          // 三行之间的间隔
closing:4380,      // 第 3 段「今年生日，」两行
closeStep:540,     // 两行之间的间隔
button:6300,       // 「回家」按钮出现
pushDuration:3300  // 镜头推进总时长
};
/* 镜头沿石板路向门廊推进：transform-origin 已在 .prologue-camera 锁定门廊(48% / 56%) */
const PUSH_FRAMES=[
{transform:'translate3d(0,0,0) scale(1)',filter:'brightness(1) saturate(1)'},
{transform:'translate3d(-3.2%,1.3%,0) scale(1.36)',filter:'brightness(.94) saturate(1.02)',offset:.32},
{transform:'translate3d(-6.6%,2.7%,0) scale(1.98)',filter:'brightness(.84) saturate(1.04)',offset:.63},
{transform:'translate3d(-9.8%,4.3%,0) scale(2.9)',filter:'brightness(.66) saturate(1.06)',offset:1}
];

(()=>{
const prologue=document.getElementById('prologue');
if(!prologue)return;
const veil=document.getElementById('prologue-veil'),cam=document.getElementById('prologue-camera'),
copy=document.getElementById('prologue-copy'),btn=document.getElementById('home-btn'),
skip=document.getElementById('prologue-skip'),page=document.getElementById('page'),
proSound=document.getElementById('prologue-sound-btn'),
warmth=prologue.querySelector('.prologue-warmth'),vignette=prologue.querySelector('.prologue-vignette');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const skipRequested=new URLSearchParams(location.search).get('prologue')==='off';
/* 序章显示期间把这些主页面区块设为 inert，键盘 / 读屏不会误入 */
const behind=[...page.children].filter(el=>el!==prologue&&el!==veil);
const anims=[];let timers=[],closed=false;

const wait=ms=>new Promise(r=>timers.push(setTimeout(r,ms)));
const after=(ms,fn)=>timers.push(setTimeout(fn,ms));
const play=(el,frames,opts)=>{const a=el.animate(frames,opts);anims.push(a);return a};

/* 提前载入正式页面要用的图，黑场之后不会看到空白 */
const preload=new Image();preload.src='assets/spring_night.webp';

/* 序章显示期间：主页面区块设为 inert（键盘 / 读屏不误入），并在手机上锁住页面滚动。
   手机端序章是 fixed 覆盖层，若背景那条长页还能滚，文案的 top 百分比就会对不上「一屏」。 */
function releaseBehind(on){
behind.forEach(el=>on?el.setAttribute('inert',''):el.removeAttribute('inert'));
document.documentElement.classList.toggle('prologue-open',on);
}

/* 正式进入小屋：只有走过序章才广播，互动模块据此给热点一次很淡的提示 */
function announceEnter(){if(cottageEntered)return;cottageEntered=true;document.dispatchEvent(new Event('cottage:enter'))}

/* 序章结束，彻底让位给主页面 */
function finish(){
announceEnter();
prologue.style.display='none';
veil.style.display='none';
prologue.setAttribute('aria-hidden','true');
releaseBehind(false);
}

/* 序章默认进入的正式页面状态：Spring · Night */
function enterCottage(){season='spring';time='night';update();page.dataset.state='spring_night'}

/* 四段式出现：问候语 → 三行宣言 → 留白 → 收尾两行 → 回家按钮 */
function beginSequence(){
releaseBehind(true);
const T=PROLOGUE_TIMING,lines=[...copy.querySelectorAll('.pl')];
const at=[T.greeting,T.declaration,T.declaration+T.step,T.declaration+T.step*2,T.closing,T.closing+T.closeStep];
lines.forEach((el,i)=>after(at[i],()=>el.classList.add('in')));
after(T.button,()=>btn.classList.add('in'));
after(1500,()=>{skip.classList.add('in');if(proSound)proSound.classList.add('in')});
}

/* 跳过序章 / 系统开启减少动态：直接淡出进入 Spring · Night */
async function quickEnter(){
closed=true;timers.forEach(clearTimeout);timers=[];
btn.disabled=true;skip.disabled=true;
enterCottage();
play(prologue,[{opacity:1},{opacity:0}],{duration:620,easing:'ease-in-out',fill:'forwards'});
await wait(680);finish();
}

/* 回家：文案淡出 → 小屋镜头推进（放大 + 向门廊轻移 + 渐暗）→ 柔和黑场 → 切 Spring · Night → 黑场淡出 */
async function goHome(){
if(closed)return;closed=true;timers.forEach(clearTimeout);timers=[];
btn.disabled=true;skip.disabled=true;
if(reduced.matches){quickEnter();return}
const T=PROLOGUE_TIMING;
play(btn,[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(.955)',filter:'brightness(1.6)',offset:.42},{transform:'scale(1.035)',filter:'brightness(1.22)'}],{duration:440,easing:'ease-out',fill:'forwards'});
play(copy,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-14px)'}],{duration:900,easing:'ease-in',delay:140,fill:'forwards'});
play(skip,[{opacity:1},{opacity:0}],{duration:420,fill:'forwards'});
if(proSound)play(proSound,[{opacity:1},{opacity:0}],{duration:420,fill:'forwards'});
play(cam,PUSH_FRAMES,{duration:T.pushDuration,easing:'cubic-bezier(.42,.03,.62,.98)',fill:'forwards'});
play(warmth,[{opacity:0},{opacity:1}],{duration:2000,easing:'ease-in-out',fill:'forwards'});
play(vignette,[{opacity:0},{opacity:1}],{duration:2300,easing:'ease-in',delay:700,fill:'forwards'});
await wait(T.pushDuration-620);
await play(veil,[{opacity:0},{opacity:1}],{duration:950,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});
enterCottage();
prologue.style.visibility='hidden';
releaseBehind(false);
anims.forEach(a=>a.cancel());anims.length=0;
await play(veil,[{opacity:1},{opacity:0}],{duration:1200,easing:'ease-out',fill:'forwards'}).finished.catch(()=>{});
finish();
}

btn.addEventListener('click',goHome);
skip.addEventListener('click',quickEnter);
/* 按钮出现后，直接按回车也能「回家」；焦点在序章内的任一按钮上时交给该按钮自己处理 */
document.addEventListener('keydown',e=>{
if(e.key!=='Enter'||closed)return;
const a=document.activeElement;
if(a&&a!==document.body&&a.tagName==='BUTTON')return;
if(btn.classList.contains('in')){e.preventDefault();goHome()}
});

/* ?prologue=off：直接落在主页面。此处不广播 cottage:enter，热点的“发现提示”只在真正走过序章时出现 */
if(skipRequested){cottageEntered=true;prologue.style.display='none';veil.style.display='none';prologue.setAttribute('aria-hidden','true')}
else beginSequence();
})();

/* ============================================================================
   小屋互动 —— 背景音乐开关 / 吉他 / 门廊灯 / 窗户
   AUDIO_SRC   音频文件路径（按顺序尝试，第一个能载入的生效）
     · bgm 故意把 .wav 放前面：实测 mp3 解码后会在首部多出约 26ms 静音，
       每 16 秒循环一次就有一个约 33ms 的断口，垫音会听出轻微顿挫。
       wav 是无缝循环的，所以首选 wav；mp3 作为载入失败时的后备。
       想换成正式音乐：把 bgm.mp3 覆盖进去，再把下面数组里两项顺序调换。
     · guitar 是一次性音效、不循环，没有上述问题，直接用体积小得多的 mp3。
   AUDIO_LEVEL 音量：背景音乐 20%，吉他音效 40%
   ?prologue=off 时不会播放热点“发现提示”
   ============================================================================ */
const AUDIO_SRC={
bgm:['assets/audio/bgm.wav','assets/audio/bgm.mp3'],
guitar:['assets/audio/guitar.mp3']
};
const AUDIO_LEVEL={bgm:.20,guitar:.40};
const GUITAR_COOLDOWN=900;                        // 吉他连点冷却（ms），避免声音叠加
const CUE_LINES=['里面有人等你回家。','灯一直为你亮着。'];
const CUE_HOLD=2800;                              // 窗提示停留时长（ms）
const MUSIC_KEY='cottage.music';                  // 本次访问内的音乐开关状态

(()=>{
const page=document.getElementById('page'),visual=document.querySelector('.visual');
if(!visual)return;
const boost=document.getElementById('window-boost'),cue=document.getElementById('cue');
const btns=[document.getElementById('sound-btn'),document.getElementById('prologue-sound-btn')].filter(Boolean);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');

/* --- 音频：按列表顺序尝试，第一个能载入的生效；全部失败就把按钮标成不可用 --- */
function makeAudio(paths,loop,volume){
const el=new Audio();
el.loop=loop;el.volume=volume;el.preload='none';el.dataset.idx='0';el.src=paths[0];
return el;
}
/* 给 play() 加超时保护：万一某个音源既不放行也不报错，不至于让按钮一直卡住 */
function withTimeout(p,ms){
let t=0;
return Promise.race([p,new Promise((_,rej)=>{t=setTimeout(()=>{const e=new Error('media timeout');e.name='TimeoutError';rej(e)},ms)})])
.finally(()=>{clearTimeout(t)});
}
/* 播放并自动在后备路径间切换；返回 true=已播放，'blocked'=需要用户手势，'failed'=文件都不可用 */
async function ensurePlay(el,paths){
for(let guard=0;guard<paths.length+1;guard++){
const i=+el.dataset.idx;
try{await withTimeout(el.play(),4000);return true}
catch(err){
if(err&&err.name==='NotAllowedError')return 'blocked';
if(i+1<paths.length){el.dataset.idx=String(i+1);el.src=paths[i+1];continue}
return 'failed';
}
}
return 'failed';
}
const bgm=makeAudio(AUDIO_SRC.bgm,true,AUDIO_LEVEL.bgm);
const pluck=makeAudio(AUDIO_SRC.guitar,false,AUDIO_LEVEL.guitar);
/* 调试用：浏览器控制台里可直接查看音频状态，如 cottageAudio.bgm.volume；不影响正常使用 */
try{window.cottageAudio={bgm,pluck}}catch(e){}

let musicOn=false;
function paintMusic(){btns.forEach(b=>b.setAttribute('aria-pressed',musicOn?'true':'false'))}
function flagUnavailable(){btns.forEach(b=>b.classList.add('unavailable'))}

async function setMusic(on){
if(!on){bgm.pause();musicOn=false;paintMusic();try{sessionStorage.setItem(MUSIC_KEY,'0')}catch(e){}return}
const r=await ensurePlay(bgm,AUDIO_SRC.bgm);
if(r===true){musicOn=true;paintMusic();try{sessionStorage.setItem(MUSIC_KEY,'1')}catch(e){}}
else{if(r==='failed')flagUnavailable();musicOn=false;paintMusic()}
}
btns.forEach(b=>b.addEventListener('click',()=>setMusic(!musicOn)));

/* 刷新后若本次访问开过音乐：先尝试直接续播（浏览器可能已放行），被拦就等第一次交互 */
function resumeMusic(){setMusic(true)}
try{
if(sessionStorage.getItem(MUSIC_KEY)==='1'){
musicOn=true;paintMusic();
bgm.play().then(()=>{}).catch(()=>{
musicOn=false;paintMusic();
document.addEventListener('pointerdown',resumeMusic,{once:true});
document.addEventListener('keydown',resumeMusic,{once:true});
});
}
}catch(e){}

/* --- 吉他：短促一声，带冷却，避免连点叠音 --- */
let lastPluck=0;
function playPluck(){
const now=performance.now();
if(now-lastPluck<GUITAR_COOLDOWN)return;
lastPluck=now;
try{pluck.currentTime=0}catch(e){}
ensurePlay(pluck,AUDIO_SRC.guitar).then(r=>{if(r==='failed')flagUnavailable()});
}

/* --- 门廊灯：亮 / 暗两态，过渡交给 CSS（.9s ease-in-out） --- */
function toggleLamp(){visual.classList.toggle('lamp-off')}

/* --- 窗户：暖光抬起 + 一句轻提示，3s 后自行淡出 --- */
let cueIdx=0,boostTimer=0,cueTimer=0;
function touchWindow(){
boost.classList.add('on');
clearTimeout(boostTimer);
boostTimer=setTimeout(()=>boost.classList.remove('on'),6000);
cue.textContent=CUE_LINES[cueIdx++%CUE_LINES.length];
cue.classList.add('on');
clearTimeout(cueTimer);
cueTimer=setTimeout(()=>cue.classList.remove('on'),CUE_HOLD);
}

document.querySelectorAll('.hotspot').forEach(b=>b.addEventListener('click',()=>{
const k=b.dataset.hot;
if(k==='guitar')playPluck();
else if(k==='lamp')toggleLamp();
else if(k==='window')touchWindow();
}));

/* 走过序章后，给三个热点一次很淡的呼吸提示；之后收回到仅悬停 */
function hintHotspots(){
if(reduced.matches)return;
document.querySelectorAll('.hotspot').forEach((b,i)=>{
setTimeout(()=>{
b.classList.add('hint');
setTimeout(()=>b.classList.remove('hint'),10600);
},i*420);
});
}
if(cottageEntered)hintHotspots();
else document.addEventListener('cottage:enter',hintHotspots,{once:true});
})();

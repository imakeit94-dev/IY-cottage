(()=>{
const prologue=document.getElementById('prologue'),button=document.getElementById('home-button'),blackout=prologue.querySelector('.prologue-blackout');
const mainRegions=document.querySelectorAll('.top,.copy,.visual,.controls,.foot,.music-toggle');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
mainRegions.forEach(region=>region.inert=true);
document.body.classList.add('prologue-active');
button.addEventListener('click',async()=>{
  if(button.disabled)return;
  button.disabled=true;prologue.classList.add('departing','journey');
  if(reduced.matches){blackout.classList.add('show');await wait(140)}else{await wait(2650);blackout.classList.add('show');await wait(620)}
  if(window.cottageEnterState)await window.cottageEnterState();
  await wait(reduced.matches?80:220);
  mainRegions.forEach(region=>region.inert=false);
  prologue.classList.add('arrived');
  await wait(reduced.matches?160:980);
  prologue.hidden=true;document.body.classList.remove('prologue-active');
  document.querySelector('[data-season="spring"]')?.focus({preventScroll:true});
});
})();

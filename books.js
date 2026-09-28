(()=>{
const root=document.getElementById('page'),shelf=document.querySelector('.shelf-hotspot'),shelfCard=document.querySelector('.shelf-secret');
const tableHotspot=document.querySelector('.table-book-hotspot'),tableBook=document.querySelector('.table-book'),note=document.querySelector('.bookmark-note');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let pageTimer=0,turning=false;

function setShelfCard(open){root.classList.toggle('shelf-card-open',open);shelf.setAttribute('aria-expanded',String(open));shelfCard.setAttribute('aria-hidden',String(!open))}
function setBookmark(open){root.classList.toggle('bookmark-open',open);tableHotspot.setAttribute('aria-expanded',String(open));note.setAttribute('aria-hidden',String(!open))}
shelf.addEventListener('pointerenter',()=>root.classList.add('shelf-discovered'));shelf.addEventListener('pointerleave',()=>root.classList.remove('shelf-discovered'));
shelf.addEventListener('focus',()=>root.classList.add('shelf-discovered'));shelf.addEventListener('blur',()=>root.classList.remove('shelf-discovered'));
shelf.addEventListener('click',event=>{event.stopPropagation();setShelfCard(!root.classList.contains('shelf-card-open'));setBookmark(false)});
shelfCard.addEventListener('click',event=>{event.stopPropagation();setShelfCard(false)});
tableHotspot.addEventListener('pointerenter',()=>root.classList.add('table-book-hover'));tableHotspot.addEventListener('pointerleave',()=>root.classList.remove('table-book-hover'));
tableHotspot.addEventListener('focus',()=>root.classList.add('table-book-hover'));tableHotspot.addEventListener('blur',()=>root.classList.remove('table-book-hover'));
tableHotspot.addEventListener('click',event=>{event.stopPropagation();setBookmark(!root.classList.contains('bookmark-open'));setShelfCard(false)});
note.addEventListener('click',event=>{event.stopPropagation();setBookmark(false)});
document.addEventListener('click',event=>{if(!event.target.closest('.shelf-hotspot,.shelf-secret,.table-book-hotspot,.bookmark-note')){setShelfCard(false);setBookmark(false)}});

function turnPage(){if(turning||document.hidden||reduced.matches||root.classList.contains('bookmark-open'))return schedulePageTurn();turning=true;tableBook.classList.add('page-turning');setTimeout(()=>{tableBook.classList.remove('page-turning');turning=false;schedulePageTurn()},1450)}
function schedulePageTurn(){clearTimeout(pageTimer);if(reduced.matches)return;pageTimer=setTimeout(turnPage,12000+Math.random()*8000)}
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(pageTimer);else schedulePageTurn()});reduced.addEventListener('change',schedulePageTurn);
root.addEventListener('cottage:statechange',()=>{setShelfCard(false);setBookmark(false)});
schedulePageTurn();
})();

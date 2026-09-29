/* One clock for the living diorama: DOM and WebGL read the same 0→1 timeline. */
(()=>{
  const root=document.getElementById('page');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let revision=0,frame=0,active=null;
  const clamp=value=>Math.max(0,Math.min(1,value));
  const smooth=value=>{value=clamp(value);return value*value*(3-2*value)};
  const easeInOutCubic=value=>value<.5?4*value*value*value:1-Math.pow(-2*value+2,3)/2;
  const range=(value,start=0,end=1)=>clamp((value-start)/(end-start));
  function emit(type,detail){root.dispatchEvent(new CustomEvent(type,{detail}))}
  function cancel(){
    if(!active)return;
    const cancelled=active;cancelAnimationFrame(frame);emit('cottage:transitionend',{...cancelled,raw:1,eased:1,cancelled:true});active=null;cancelled.resolve?.({cancelled:true});
  }
  function run(meta={}){
    cancel();const id=++revision;
    const duration=reduced.matches?80:(meta.duration||((meta.seasonChanged?2100:1900)));
    const started=performance.now();active={id,duration,started,...meta};emit('cottage:transitionstart',{...active,raw:0,eased:0});
    return new Promise(resolve=>{
      active.resolve=resolve;
      function tick(now){
        if(!active||active.id!==id){resolve({cancelled:true});return}
        const raw=clamp((now-started)/duration);const eased=easeInOutCubic(raw);const detail={...active,raw,eased};
        emit('cottage:transitionframe',detail);
        if(raw<1){frame=requestAnimationFrame(tick);return}
        emit('cottage:transitionend',{...detail,cancelled:false});active=null;resolve({cancelled:false});
      }
      frame=requestAnimationFrame(tick);
    });
  }
  window.CottageTransition={run,cancel,range,smooth,easeInOutCubic,get active(){return active}};
})();

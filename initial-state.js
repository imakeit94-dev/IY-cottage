/*
 * Resolve the cottage's first season and time from the visitor's local clock.
 * This file is loaded synchronously in <head> so the result exists before the
 * static fallback or realtime 3D scene can render its first visible state.
 */
(function(global){
  const SEASONS=['spring','summer','autumn','winter'];
  const TIMES=['day','sunset','night'];

  function getInitialCottageState(input=new Date()){
    const date=input instanceof Date?input:new Date(input);
    if(Number.isNaN(date.getTime()))throw new TypeError('A valid local date is required.');

    const month=date.getMonth()+1;
    const hour=date.getHours();
    const season=month>=2&&month<=4?'spring'
      :month>=5&&month<=7?'summer'
      :month>=8&&month<=10?'autumn'
      :'winter';
    const time=hour>=6&&hour<=13?'day'
      :hour>=14&&hour<=18?'sunset'
      :'night';

    return {season,time,month,hour};
  }

  function resolveInitialCottageState(input=new Date(),search=''){
    const detected=getInitialCottageState(input);
    const query=new URLSearchParams(search);
    const requestedSeason=query.get('season');
    const requestedTime=query.get('time');
    return Object.freeze({
      ...detected,
      season:SEASONS.includes(requestedSeason)?requestedSeason:detected.season,
      time:TIMES.includes(requestedTime)?requestedTime:detected.time
    });
  }

  if(typeof module!=='undefined'&&module.exports){
    module.exports={getInitialCottageState,resolveInitialCottageState};
  }

  if(global&&global.document){
    const initial=resolveInitialCottageState(new Date(),global.location.search);
    global.CottageInitialState=initial;
    global.document.documentElement.dataset.initialSeason=initial.season;
    global.document.documentElement.dataset.initialTime=initial.time;
    const preload=global.document.createElement('link');
    preload.rel='preload';preload.as='image';preload.href=`assets/${initial.season}_${initial.time}.webp`;
    global.document.head.append(preload);
  }
})(typeof window!=='undefined'?window:globalThis);

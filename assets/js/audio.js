/* ============================================================
   G·M · portfolio · audio
   Three real recordings on one context: the cave colony, the watch tick, the
   engine. Each is fetched on demand and each is gated to its own section — the
   page is silent everywhere else, deliberately.
============================================================ */

/* paths resolve against this module, not against the document · the site keeps
   working if index.html is ever served from somewhere other than the root */
const media=f=>new URL('../../media/'+f,import.meta.url).href;

let ctx=null,caveMaster=null,caveBatGain=null,batLoaded=false;

/* public, read-only-ish · the loop needs to know whether the visitor muted the cave */
export const audio={caveOn:true};

function ensureCtx(){
  if(!ctx){
    ctx=new(window.AudioContext||window.webkitAudioContext)();
    caveMaster=ctx.createGain();caveMaster.gain.value=0;
    caveMaster.connect(ctx.destination);
  }
  return ctx;
}

/* every AudioParam ramp here used to be re-scheduled on every animation frame, which
   piles ~60 automation events a second onto a timeline that only ever needed one per
   change. Ramps are issued only when the target actually moves. */
const level={cave:-1,watch:-1,moto:-1};
function ramp(node,key,val,tc){
  if(!node||!ctx)return;
  if(Math.abs(level[key]-val)<.008)return;
  level[key]=val;
  node.gain.setTargetAtTime(val,ctx.currentTime,tc);
}

/* one loader for all three · fetch, decode, loop, connect */
function loop(file,dest,rate){
  return fetch(media(file))
    .then(r=>r.arrayBuffer())
    .then(ab=>ctx.decodeAudioData(ab))
    .then(buf=>{
      const src=ctx.createBufferSource();
      src.buffer=buf;src.loop=true;
      if(rate)src.playbackRate.value=rate;
      src.connect(dest);src.start();
      return src;
    })
    .catch(()=>{});   /* a missing or blocked file must never break the page */
}

/* ---------- the cave ---------- */
/* the ambience is 13MB of mp3 · fetching and decoding it during boot competed with the
   hero image, the fonts and the first paint for a sound nobody can hear until they have
   scrolled two viewports down. It waits for the visitor's first gesture. */
function initCave(){
  ensureCtx();
  if(batLoaded)return;
  batLoaded=true;
  /* starts at 0 and fades in on arrival · the file takes a few seconds to decode and
     may finish mid-scroll — jumping straight to full volume would pop */
  caveBatGain=ctx.createGain();caveBatGain.gain.value=0;
  caveBatGain.connect(caveMaster);
  /* the raw recording's high end is harsh · tame it before it hits the mix */
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;
  lp.connect(caveBatGain);
  loop('bat.mp3',lp).then(()=>{
    caveBatGain.gain.setTargetAtTime(.25,ctx.currentTime,.6);
  });
}

/* the descent's master fade · driven by the scrub, so the colony recedes as the
   tunnel gives way to the piece */
export function setCaveLevel(v,tc){ramp(caveMaster,'cave',audio.caveOn?v:0,tc);}

export function toggleCave(){
  audio.caveOn=!audio.caveOn;
  if(audio.caveOn){initCave();if(ctx.state==='suspended')ctx.resume();}
  paintButton();
}

const soundBtn=document.querySelector('.cave-sound');
function paintButton(){
  if(!soundBtn)return;
  soundBtn.textContent=audio.caveOn?'🔊':'🔇';
  soundBtn.setAttribute('aria-pressed',String(audio.caveOn));
}
if(soundBtn)soundBtn.addEventListener('click',toggleCave);
paintButton();

/* on by default, but the browser still requires a real gesture before audio may play —
   silently load and unlock on the visitor's first interaction, wherever it happens.
   A lot of visitors only ever scroll and never click or press a key, and 'wheel' is not
   always treated as a qualifying gesture, so 'scroll' is in the list too. */
function unlock(){
  if(audio.caveOn)initCave();
  if(ctx&&ctx.state==='suspended')ctx.resume();
}
for(const ev of ['pointerdown','keydown','touchstart','wheel','scroll'])
  document.addEventListener(ev,unlock,{once:true,passive:true});

/* ---------- the watch ---------- */
/* a real recorded mechanical tick on its own bus, independent of the cave's —
   faded purely by the piece's own visibility, never the cave's */
let tickGain=null,tickLoaded=false;
export function setWatchAudio(on){
  if(on&&!tickLoaded){
    ensureCtx();
    tickLoaded=true;
    tickGain=ctx.createGain();tickGain.gain.value=0;
    tickGain.connect(ctx.destination);
    loop('watch.mp3',tickGain,1.15);
    preloadMoto();
  }
  if(!tickGain||!ctx)return;
  if(on&&ctx.state==='suspended')ctx.resume();
  ramp(tickGain,'watch',on?.5:0,on?.8:.5);
}

/* ---------- the engine ---------- */
/* Apex · Onboard — real recorded engine, gated to its section only.
   Preloaded during the watch section so it's decoded before the visitor
   reaches the track — eliminates the 3-4 s fetch+decode delay. */
let motoGain=null,motoLoaded=false,motoBuffer=null;
export function preloadMoto(){
  if(motoBuffer||motoLoaded)return;
  ensureCtx();
  fetch(media('moto.mp3'))
    .then(r=>r.arrayBuffer())
    .then(ab=>ctx.decodeAudioData(ab))
    .then(buf=>{motoBuffer=buf;})
    .catch(()=>{});
}
export function setMotoVisible(on){
  if(on&&!motoLoaded){
    ensureCtx();
    motoLoaded=true;
    motoGain=ctx.createGain();motoGain.gain.value=0;
    motoGain.connect(ctx.destination);
    if(motoBuffer){
      const src=ctx.createBufferSource();
      src.buffer=motoBuffer;src.loop=true;
      src.connect(motoGain);src.start();
    }else{
      loop('moto.mp3',motoGain);
    }
  }
  if(!motoGain||!ctx)return;
  if(on&&ctx.state==='suspended')ctx.resume();
  ramp(motoGain,'moto',on?.08:0,on?1.4:.6);
}

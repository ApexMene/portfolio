/* ============================================================
   G·M · portfolio v5 · WAYNE
   black · grey ceramic · steel. Order over spectacle.

   This file is orchestration only: it owns the single rAF loop, the order the
   scenes are built in, and the boot sequence. Every scene owns its own state and
   its own update — nothing here reaches inside them.

   Everything scroll-driven reads the cached measurements in core/viewport.js, so
   the loop never touches layout. Every DOM write is opacity or transform: the
   compositor handles them without the main thread repainting anything.
============================================================ */
import * as THREE from 'three';
import {clamp,s5} from './core/math.js';
import {reduced} from './core/env.js';
import {view,measureAll,caveSec} from './core/viewport.js';
import {updateStage} from './core/stage.js';

import './ui/type.js';
import {nav,prog,heroImg} from './ui/chrome.js';
import {updateCursor,drawGuill} from './ui/signature.js';
import {signConsole} from './ui/console-sign.js';

import {initCave,updateCave}       from './scenes/cave.js';
import {initBezel,updateBezel}     from './scenes/bezel.js';
import {initTrack,updateTrack}     from './scenes/track.js';
import {updateMonogram}            from './scenes/monogram.js';
import {vizInit,updateProjects}    from './scenes/projects.js';

const clock=new THREE.Clock();

/* last written values · a style write that changes nothing still costs a style recalc */
let navOn=false,progLast=-1,heroLast=-1;

function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),0.05);
  const time=clock.elapsedTime;
  const y=view.sy;

  /* ---------- page chrome ---------- */
  const ns=y>40;
  if(ns!==navOn){navOn=ns;nav.classList.toggle('scrolled',ns);}
  const pr=clamp(y/view.docMax,0,1);
  if(Math.abs(pr-progLast)>.0004){progLast=pr;prog.style.transform='scaleX('+pr+')';}
  if(heroImg&&y<view.vh){
    const hp=Math.round(y*10)/10;
    if(hp!==heroLast){
      heroLast=hp;
      heroImg.style.transform=`translate3d(0,${hp*.12}px,0) scale(${1.06+hp/view.vh*.1})`;
    }
  }
  updateCursor(dt);

  /* ---------- the pinned stage, then the scenes that read it ---------- */
  updateStage(dt);
  updateCave(dt,time);
  updateBezel(dt,time);
  updateTrack(dt,time);
  updateMonogram(dt,time);
  updateProjects(dt,time);
}

/* ---------- scene construction · off the boot path ----------
   None of the three heavy scenes are needed for the first screen, so none of them
   are built during it. They go up on idle time in the order the visitor will meet
   them, and any that the visitor reaches first is built on demand by its observer. */
const built={cave:0,bez:0,track:0};
function need(k,fn){if(built[k])return;built[k]=1;fn();}
function nearby(el,fn,margin=600){
  if(!el)return;
  const o=new IntersectionObserver(es=>{
    if(es.some(e=>e.isIntersecting)){o.disconnect();fn();}
  },{rootMargin:margin+'px 0px'});
  o.observe(el);
}
function buildScenes(){
  const ric=window.requestIdleCallback||(f=>setTimeout(f,120));
  const q=[()=>need('cave',initCave),()=>need('bez',initBezel),()=>need('track',initTrack)];
  (function next(){const f=q.shift();if(f){f();ric(next);}})();
}
/* the observers are the safety net for when idle time never comes · registered only
   after the loader clears, so nothing here can compete with the first paint */
function watchScenes(){
  nearby(caveSec,()=>{need('cave',initCave);need('bez',initBezel);},700);
  nearby(document.getElementById('track-panel'),()=>need('track',initTrack),700);
}

/* the marquee is a composited transform, but an off-screen one still costs the
   compositor a tick every frame · park it when it is nowhere near the viewport */
{
  const marq=document.getElementById('marq');
  if(marq)new IntersectionObserver(es=>{
    marq.style.animationPlayState=es.some(e=>e.isIntersecting)?'running':'paused';
  },{rootMargin:'120px 0px'}).observe(marq.parentElement);
}

/* ---------- boot ----------
   The bar used to run a fixed 1.2s regardless of what the page was doing — a second
   of invented waiting on top of the real load. It tracks actual readiness and gets
   out of the way as soon as the fonts and the hero image are in. */
(function boot(){
  const fill=document.getElementById('l-fill');
  const loader=document.getElementById('loader');
  const t0=performance.now(),DUR=reduced?150:560;
  let ready=false;
  Promise.all([
    document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve(),
    heroImg&&heroImg.decode?heroImg.decode().catch(()=>{}):Promise.resolve()
  ]).then(()=>{ready=true;});
  setTimeout(()=>{ready=true;},2200);   /* never hold the page hostage to a slow font CDN */
  (function tick(){
    const el=(performance.now()-t0)/DUR;
    const k=ready?Math.min(1,el):Math.min(.9,el);
    if(fill)fill.style.transform='scaleX('+s5(k)+')';
    if(k<1){requestAnimationFrame(tick);return;}
    if(loader)loader.classList.add('done');
    document.body.classList.add('ready');   /* releases the masthead reveal */
    vizInit();drawGuill();measureAll();
    buildScenes();watchScenes();
    signConsole();
  })();
})();

frame();

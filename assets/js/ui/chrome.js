/* ============================================================
   G·M · portfolio · page chrome
   Reveals, chambers, the progress rail, counters, clocks, the video.
   Everything here is observer- or interval-driven; the per-frame half of the
   chrome (nav state, rail scale, hero parallax) lives in the one rAF loop.
============================================================ */
import {clamp,s5} from '../core/math.js';
import {onResize,view} from '../core/viewport.js';
import {setMotoVisible} from '../audio.js';

const io=new IntersectionObserver(es=>{
  for(const e of es)if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}
},{threshold:.15,rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('.rv,.hr').forEach(el=>io.observe(el));

/* chambers of the cave · every section past the descent is a dark room the
   lantern opens onto — the vignette dilates as you walk in, closes behind you */
{
  const chambers=['about','specs','collection','prov','hours','contact']
    .map(id=>document.getElementById(id)).filter(Boolean);
  const ioCh=new IntersectionObserver(es=>{
    for(const e of es)e.target.classList.toggle('lit',e.isIntersecting);
  },{threshold:.18});
  for(const s of chambers){s.classList.add('chamber');ioCh.observe(s);}
}

/* read by the rAF loop · nav state, rail scale and hero parallax are driven there.
   Doing that work inside the scroll event meant reading body.scrollHeight — a forced
   reflow — and writing three styles, several times per rendered frame. */
export const nav=document.getElementById('nav');
export const prog=document.getElementById('prog');
export const heroImg=document.querySelector('#hero .photo img');

/* one tick per section boundary · the rail reads like a bezel's minute track */
const progTicks=document.getElementById('prog-ticks');
const progSections=[];
function buildProgTicks(){
  if(!progTicks)return;
  progTicks.innerHTML='';
  progSections.length=0;
  const max=view.docMax;
  if(max<=0)return;
  document.querySelectorAll('main > section[id]').forEach(sec=>{
    const top=sec.getBoundingClientRect().top+scrollY;
    const pct=clamp(top/max*100,0,100);
    const i=document.createElement('i');
    i.style.left=pct+'%';
    progTicks.appendChild(i);
    const navLink=document.querySelector(`.nav-links a[href="#${sec.id}"]`);
    progSections.push({pct,label:navLink?navLink.textContent:sec.id});
  });
}
buildProgTicks();
addEventListener('load',buildProgTicks);
onResize.push(buildProgTicks);

/* the rail whispers which section you're over, like a bezel's reference marks */
{
  const progHit=document.getElementById('prog-hit');
  const progTip=document.getElementById('prog-tip');
  if(progHit&&progTip){
    progHit.addEventListener('mousemove',e=>{
      if(!progSections.length)return;
      const pct=e.clientX/innerWidth*100;
      let nearest=progSections[0];
      for(const s of progSections)if(Math.abs(s.pct-pct)<Math.abs(nearest.pct-pct))nearest=s;
      progTip.textContent=nearest.label;
      progTip.style.left=nearest.pct+'%';
      progTip.classList.add('show');
    });
    progHit.addEventListener('mouseleave',()=>progTip.classList.remove('show'));
  }
}

/* the stat counters · once, when they first come into view */
{
  const statsEl=document.querySelector('.stats');
  let counted=false;
  if(statsEl)new IntersectionObserver(es=>{
    if(!es.some(e=>e.isIntersecting)||counted)return;
    counted=true;
    document.querySelectorAll('[data-count]').forEach(el=>{
      const target=+el.dataset.count,t0=performance.now();
      (function step(){
        const k=Math.min(1,(performance.now()-t0)/1200);
        el.textContent=Math.round(target*s5(k))+(target===2?'+':'');
        if(k<1)requestAnimationFrame(step);
      })();
    });
  }).observe(statsEl);
}

/* one formatter, reused · building an Intl.DateTimeFormat every second was allocating
   a fresh ICU-backed object 3600 times an hour to render a value that changes 60 times */
{
  const el=document.getElementById('milano-time');
  if(el){
    const fmt=new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'});
    const paint=()=>{el.textContent=fmt.format(new Date());};
    paint();setInterval(paint,15000);
  }
}

/* live Milano time for the 3D watch hands · a single Rome-vs-local offset applied to
   Date.now() (monotonic), so the sweep is continuous — no per-second resync jitter.
   An object, not an exported `let`: the bezel needs the current value, and an imported
   binding cannot be reassigned from the importing module. */
export const rome={offsetMs:0};
function updateRomeOffset(){
  const now=Date.now();
  rome.offsetMs=new Date(new Date(now).toLocaleString('en-US',{timeZone:'Europe/Rome'})).getTime()-now;
}
updateRomeOffset();
setInterval(updateRomeOffset,30000);

/* video: play only in view · engine sound rides along, scoped strictly to this section */
{
  const vid=document.getElementById('moto-vid');
  if(vid)new IntersectionObserver(es=>{
    for(const e of es){
      if(e.isIntersecting){vid.play().catch(()=>{});setMotoVisible(true);}
      else{vid.pause();setMotoVisible(false);}
    }
  },{threshold:.25}).observe(vid);
}

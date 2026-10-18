/* hero faux-depth · mouse-driven parallax on #hero .photo (Lando uvFauxDepth, DOM port)
   The scroll zoom lives on the img (main.js); this owns the .photo parent, so the
   two transforms compose instead of fighting. Transform-only: no layout, no paint.
   Dead on touch / reduced-motion — the module then exports a no-op update. */
import {reduced} from '../core/env.js';
import {view} from '../core/viewport.js';

const hero=document.getElementById('hero');
const photo=hero?hero.querySelector('.photo'):null;
const mast=hero?hero.querySelector('.mast'):null;
const coarse=matchMedia('(hover:none)').matches;
const active=!!(hero&&photo)&&!reduced&&!coarse;

const RANGE_X=30, RANGE_Y=22, SCALE=1.07;
let tx=0,ty=0,cx=0,cy=0,lx=null,ly=null,lp=null;

if(active){
  hero.addEventListener('pointermove',e=>{
    const r=hero.getBoundingClientRect();
    if(r.width<1||r.height<1)return;
    tx=((e.clientX-r.left)/r.width-.5)*2;
    ty=((e.clientY-r.top)/r.height-.5)*2;
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{tx=0;ty=0;},{passive:true});
}

export function updateHeroDepth(dt){
  if(!active)return;
  const k=1-Math.pow(.0018,Math.min(dt,.05));
  cx+=(tx-cx)*k;
  cy+=(ty-cy)*k;
  const x=Math.round(cx*RANGE_X*10)/10, y=Math.round(cy*RANGE_Y*10)/10;
  if(x!==lx||y!==ly){
    lx=x;ly=y;
    photo.style.transform='translate3d('+x+'px,'+y+'px,0) scale('+SCALE+')';
  }
  if(mast){
    const p=Math.min(Math.max(view.sy/view.vh,0),1);
    const sp=Math.round(p*1000)/1000;
    if(sp!==lp){
      lp=sp;
      const s=(1+sp*.55).toFixed(3), ty2=Math.round(-sp*140);
      mast.style.transform='translate3d(0,'+ty2+'px,0) scale('+s+')';
      mast.style.opacity=Math.max(0,1-sp*1.5).toFixed(3);
    }
  }
}

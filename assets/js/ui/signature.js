/* ============================================================
   G·M · portfolio · signature
   The steel ring cursor and the guilloché rosette behind the piece.
============================================================ */
import {damp} from '../core/math.js';
import {onResize} from '../core/viewport.js';

const cursorEl=document.getElementById('cursor');
const finePointer=matchMedia('(pointer:fine)').matches;
let mX=innerWidth/2,mY=innerHeight/2,cX=mX,cY=mY,live=false;

/* desktop only. The smoothing runs inside the one main loop; this used to be a
   second, independent requestAnimationFrame loop running alongside it. */
if(finePointer&&cursorEl){
  addEventListener('mousemove',e=>{
    mX=e.clientX;mY=e.clientY;
    if(!live){live=true;cX=mX;cY=mY;cursorEl.classList.add('on');}
  },{passive:true});
  document.addEventListener('mouseover',e=>{
    cursorEl.classList.toggle('big',
      !!e.target.closest('a,button,.ref,.srow,#bezel-stage,.pcanvas'));
  },{passive:true});
}

export function updateCursor(dt){
  if(!finePointer||!live||!cursorEl)return;
  cX=damp(cX,mX,20,dt);cY=damp(cY,mY,20,dt);
  cursorEl.style.transform=`translate3d(${cX}px,${cY}px,0)`;
}

/* engine-turned rosette · 44 overlapping circles, the way a real dial is cut */
export function drawGuill(){
  const c=document.getElementById('guill');if(!c)return;
  const r=c.parentElement.getBoundingClientRect();
  const dpr=Math.min(devicePixelRatio,2);
  c.width=r.width*dpr;c.height=r.height*dpr;
  const x=c.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
  x.clearRect(0,0,r.width,r.height);
  x.strokeStyle='rgba(226,234,240,1)';x.lineWidth=.4;
  const cx=r.width/2,cy=r.height/2,R0=Math.min(r.width,r.height)*.52;
  for(let i=0;i<44;i++){
    const a=i/44*Math.PI*2;
    x.beginPath();
    x.arc(cx+Math.cos(a)*R0*.36,cy+Math.sin(a)*R0*.36,R0*.6,0,Math.PI*2);
    x.stroke();
  }
}
onResize.push(drawGuill);

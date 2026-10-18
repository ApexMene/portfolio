/* ============================================================
   G·M · portfolio · project mini-visuals
   Monochrome 2D loops on the collection cards. Half rate on purpose: at this speed
   30fps is invisible and it hands the frame budget back to the 3D scenes.
============================================================ */
import {lerp,clamp,sstep} from '../core/math.js';
import {onResize} from '../core/viewport.js';
import {circuitCurve} from './track.js';
const ICE='223,230,236', WHT='238,243,246', GRY='148,158,166';
const vizEls=[...document.querySelectorAll('.pcanvas')];
const vizMap=new Map();
let vizVisible=false;
export function vizInit(){
  for(const cv of vizEls){
    const w=cv.clientWidth||240, h=cv.clientHeight||120, dpr=Math.min(devicePixelRatio,2);
    cv.width=w*dpr;cv.height=h*dpr;
    const ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
    vizMap.set(cv,{ctx,w,h,st:{}});
  }
}
const VIZ={
  prism(c,t){
    const{ctx,w,h,st}=c;
    st.p??=Array.from({length:26},(_,i)=>({o:Math.random(),y:.15+Math.random()*.7,l:i%3,v:.05+Math.random()*.05}));
    const gx=w*.46;
    ctx.strokeStyle=`rgba(${WHT},.25)`;ctx.beginPath();ctx.moveTo(gx,h*.12);ctx.lineTo(gx,h*.88);ctx.stroke();
    for(const p of st.p){
      const x=((p.o+t*p.v)%1.06-0.03)*w;
      const lane=(.28+.22*p.l);
      const k=sstep((x-gx)/(w*.18));
      const y=(lerp(p.y,lane,k)+Math.sin(t*2+p.o*9)*.012*(1-k))*h;
      const col=p.l===0?ICE:p.l===1?WHT:GRY;
      ctx.fillStyle=`rgba(${col},${x<-2?0:.85})`;
      ctx.beginPath();ctx.arc(x,y,1.4,0,7);ctx.fill();
    }
    for(let l=0;l<3;l++){
      const col=l===0?ICE:l===1?WHT:GRY;
      ctx.fillStyle=`rgba(${col},.9)`;
      ctx.fillRect(w*.94,h*(.28+.22*l)-4,2,8);
    }
  },
  rag(c,t){
    const{ctx,w,h}=c;
    const ph=(t%5.5);
    const q=[w*.06,h*.5-9,w*.16,18], ans=[w*.72,h*.5-16,w*.22,32];
    const docs=[0,1,2].map(i=>[w*.40,h*.14+i*h*.27,w*.16,h*.2]);
    ctx.strokeStyle=`rgba(${WHT},.3)`;
    for(const r of[q,ans,...docs])ctx.strokeRect(...r);
    const pulse=clamp(ph/1.1,0,1);
    if(pulse<1){
      const px=lerp(q[0]+q[2],docs[1][0],pulse);
      ctx.fillStyle=`rgba(${ICE},.95)`;ctx.beginPath();ctx.arc(px,h*.5,2,0,7);ctx.fill();
    }
    docs.forEach((r,i)=>{
      const g=clamp((ph-1.1-i*.4)/.4,0,1)*(1-clamp((ph-4.6)/.6,0,1));
      if(g>0){ctx.fillStyle=`rgba(${WHT},${g*.18})`;ctx.fillRect(...r);}
    });
    const fl=clamp((ph-2.4)/1,0,1);
    if(fl>0&&fl<1){
      ctx.strokeStyle=`rgba(${WHT},.5)`;ctx.setLineDash([3,4]);ctx.lineDashOffset=-t*24;
      for(const r of docs){ctx.beginPath();ctx.moveTo(r[0]+r[2],r[1]+r[3]/2);ctx.lineTo(ans[0],h*.5);ctx.stroke();}
      ctx.setLineDash([]);
    }
    const ty=clamp((ph-3.4)/1.4,0,1);
    for(let i=0;i<3;i++){
      const bw=clamp(ty*3-i,0,1)*ans[2]*.8;
      ctx.fillStyle=`rgba(${WHT},.55)`;
      ctx.fillRect(ans[0]+ans[2]*.1,ans[1]+7+i*8,bw,2);
    }
  },
  tele(c,t){
    const{ctx,w,h,st}=c;
    if(!st.path||st.w!==w){
      st.w=w;
      const pts=circuitCurve.getPoints(150);
      let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
      for(const p of pts){x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);}
      st.fit=p=>[(p.x-x0)/(x1-x0)*w*.56+w*.05,(p.z-z0)/(z1-z0)*h*.74+h*.12];
      st.path=pts.map(st.fit);
    }
    ctx.strokeStyle=`rgba(${WHT},.4)`;ctx.beginPath();
    st.path.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.stroke();
    const u=(t*.06)%1;
    const[bx,by]=st.fit(circuitCurve.getPoint(u));
    ctx.fillStyle=`rgba(${WHT},1)`;ctx.beginPath();ctx.arc(bx,by,2.2,0,7);ctx.fill();
    for(let i=1;i<6;i++){
      const[tx2,ty2]=st.fit(circuitCurve.getPoint(((u-i*.008)%1+1)%1));
      ctx.fillStyle=`rgba(${ICE},${.6-i*.1})`;ctx.beginPath();ctx.arc(tx2,ty2,1.4,0,7);ctx.fill();
    }
    ctx.strokeStyle=`rgba(${GRY},.7)`;ctx.beginPath();
    for(let x=0;x<=w*.26;x+=2){
      const v=Math.abs(Math.sin((x*.06+t*1.6)))*.5+Math.abs(Math.sin(x*.017+t*.5))*.5;
      const y=h*.82-v*h*.5;
      x?ctx.lineTo(w*.70+x,y):ctx.moveTo(w*.70+x,y);
    }
    ctx.stroke();
    ctx.fillStyle=`rgba(${WHT},.55)`;ctx.font='7px Inter,sans-serif';
    ctx.fillText('SPD',w*.70,h*.94);
  },
  vision(c,t){
    const{ctx,w,h}=c;
    ctx.strokeStyle=`rgba(${WHT},.25)`;ctx.strokeRect(w*.04,h*.08,w*.92,h*.84);
    const blobs=[
      [w*(.3+.16*Math.sin(t*.6)),h*(.55+.12*Math.sin(t*.9)),10,16],
      [w*(.68+.14*Math.sin(t*.5+2)),h*(.5+.14*Math.cos(t*.7)),9,15],
    ];
    blobs.forEach(([x,y,rx,ry],i)=>{
      ctx.fillStyle=`rgba(${GRY},.4)`;
      ctx.beginPath();ctx.ellipse(x,y,rx*.5,ry*.8,0,0,7);ctx.fill();
      ctx.strokeStyle=`rgba(${WHT},.85)`;ctx.setLineDash([4,3]);
      ctx.strokeRect(x-rx-4,y-ry-4,rx*2+8,ry*2+8);
      ctx.setLineDash([]);
      ctx.fillStyle=`rgba(${ICE},.9)`;
      ctx.fillRect(x-rx-4,y-ry-10,(Math.sin(t*3+i)>0?14:10),2);
    });
    if(Math.sin(t*4)>0){ctx.fillStyle=`rgba(${WHT},.9)`;ctx.beginPath();ctx.arc(w*.9,h*.16,2,0,7);ctx.fill();}
  },
  brawn(c,t){
    const{ctx,w,h}=c,n=7,bw=w*.07,gap=w*.045,ox=w*.1,base=h*.84;
    ctx.strokeStyle=`rgba(${WHT},.25)`;ctx.beginPath();ctx.moveTo(ox-4,base);ctx.lineTo(ox+n*(bw+gap),base);ctx.stroke();
    const wk=Math.floor(t/1.4);
    for(let i=0;i<n;i++){
      const v=.3+.55*((Math.sin((wk+i)*1.7)+1)/2)*(.6+.4*i/n);
      const grow=i===n-1?clamp((t%1.4)/.6,0,1):1;
      ctx.fillStyle=`rgba(${i===n-1?ICE:GRY},${i===n-1?.9:.55})`;
      ctx.fillRect(ox+i*(bw+gap),base-v*h*.62*grow,bw,v*h*.62*grow);
    }
    const r=h*.16,cx=w*.86,cy=h*.3,p=(t%3)/3;
    ctx.strokeStyle=`rgba(${WHT},.2)`;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.stroke();
    ctx.strokeStyle=`rgba(${WHT},.85)`;ctx.beginPath();ctx.arc(cx,cy,r,-Math.PI/2,-Math.PI/2+p*Math.PI*2);ctx.stroke();
  },
  print(c,t){
    const{ctx,w,h}=c,cx=w*.5,cy=h*.52;
    for(let i=0;i<9;i++){
      const rx=w*(.05+i*.028),ry=h*(.06+i*.045);
      ctx.strokeStyle=`rgba(${i%3?GRY:WHT},.45)`;
      ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,Math.PI*(.08+.04*Math.sin(i)),Math.PI*(2-.08));ctx.stroke();
    }
    const sy=h*.1+((t*.35)%1)*h*.8;
    ctx.fillStyle=`rgba(${ICE},.12)`;ctx.fillRect(w*.18,sy-6,w*.64,12);
    ctx.strokeStyle=`rgba(${ICE},.9)`;ctx.beginPath();ctx.moveTo(w*.18,sy);ctx.lineTo(w*.82,sy);ctx.stroke();
    const ok=Math.sin(t*1.1)>0;
    ctx.fillStyle=`rgba(${ok?WHT:GRY},.9)`;ctx.beginPath();ctx.arc(w*.9,h*.16,2,0,7);ctx.fill();
  },
  prep(c,t){
    const{ctx,w,h}=c,cols=7,rows=5;
    const mw=w*.82,mh=h*.62,ox=w*.09,oy=h*.24,cell=mw/cols;
    ctx.fillStyle=`rgba(${WHT},.35)`;ctx.font='7px Inter,sans-serif';ctx.textAlign='center';
    ctx.fillText(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][(Math.floor(t/3.2))%12],w*.5,h*.13);
    ctx.strokeStyle=`rgba(${WHT},.15)`;ctx.lineWidth=.5;
    for(let r=0;r<=rows;r++){ctx.beginPath();ctx.moveTo(ox,oy+r*cell);ctx.lineTo(ox+mw,oy+r*cell);ctx.stroke();}
    for(let c2=0;c2<=cols;c2++){ctx.beginPath();ctx.moveTo(ox+c2*cell,oy);ctx.lineTo(ox+c2*cell,oy+mh);ctx.stroke();}
    const phase=t*1.2;
    for(let i=0;i<12;i++){
      const day=i+1,col=(day-1)%cols,row=Math.floor((day-1)/cols);
      const cx=ox+col*cell+cell/2,cy=oy+row*cell+cell/2;
      const pulse=(Math.sin(phase+day*2.3)+1)/2;
      const isStudy=i%2===0;
      if(isStudy){
        ctx.fillStyle=`rgba(${ICE},${.12+pulse*.2})`;
        ctx.fillRect(ox+col*cell+2,oy+row*cell+2,cell-4,cell-4);
      }
      ctx.fillStyle=`rgba(${ICE},${.35+pulse*.4})`;
      ctx.beginPath();ctx.arc(cx,cy,1.5,0,7);ctx.fill();
    }
    const td=Math.floor(t/1.8)%28;
    const tc=(td-1)%cols,tr=Math.floor((td-1)/cols);
    ctx.strokeStyle=`rgba(${WHT},.7)`;ctx.lineWidth=1.2;
    ctx.strokeRect(ox+tc*cell+1,oy+tr*cell+1,cell-2,cell-2);
  },
};
{
  const host=document.getElementById('collection');
  if(host)new IntersectionObserver(es=>{vizVisible=es.some(e=>e.isIntersecting);},{threshold:.05}).observe(host);
}

/* ---------- per-frame ---------- */
let vizAcc=0;
export function updateProjects(dt,time){
  vizAcc+=dt;
  if(!vizVisible||vizAcc<.033)return;
  vizAcc=0;
  for(const cv of vizEls){
    const c=vizMap.get(cv);if(!c)continue;
    c.ctx.clearRect(0,0,c.w,c.h);
    VIZ[cv.dataset.viz]?.(c,time);
  }
}

onResize.push(vizInit);

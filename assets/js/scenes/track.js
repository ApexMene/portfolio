/* ============================================================
   G·M · portfolio · SCENE 2 · MUGELLO
   The circuit and three riders, seen from a slow orbiting camera.
============================================================ */
import * as THREE from 'three';
import {sstep,gauss} from '../core/math.js';
import {isMobile,reduced,webgl,glowSprite} from '../core/env.js';
import {onResize} from '../core/viewport.js';

const sprite=glowSprite();
/* Autodromo Internazionale del Mugello · traced off the circuit's own layout plan
   rather than sketched. Clockwise, start/finish on the 1.141 km straight that ends
   at San Donato. The signature shape is all here: the climb through Luco to Poggio
   Secco at the top, the long plunge down Casanova–Savelli, the two Arrabbiate out on
   the right, then the infield — Correntaio's hook back left, Biondetti, and the long
   Bucine right that fires you onto the straight again. */
const MUGELLO=[
  [ -4.0, -1.8],   /* start / finish */
  [-19.4, -7.6],
  [-34.4,-13.3],
  [-41.6,-16.3],
  [-44.0,-18.4],   /* T1 · San Donato */
  [-43.1,-20.7],
  [-39.7,-21.4],
  [-35.3,-22.4],   /* T2 · Luco */
  [-32.6,-23.7],
  [-29.4,-26.4],
  [-26.2,-27.5],   /* T3 · Poggio Secco */
  [-23.5,-27.0],
  [-17.2,-24.0],
  [-10.1,-21.6],
  [ -5.2,-20.2],   /* T4 · Materassi */
  [ -2.6,-19.9],
  [  1.2,-21.4],   /* T5 · Borgo San Lorenzo */
  [  4.7,-21.4],
  [  7.5,-19.7],
  [ 14.2,-13.8],
  [ 20.5, -8.8],   /* T6 · Casanova */
  [ 23.7, -5.7],
  [ 26.3, -0.8],   /* T7 · Savelli */
  [ 29.1,  1.6],
  [ 35.0,  3.2],
  [ 41.4,  4.2],   /* T8 · Arrabbiata 1 */
  [ 43.9,  7.2],
  [ 44.0, 13.6],
  [ 42.7, 23.8],   /* T9 · Arrabbiata 2 */
  [ 39.0, 27.1],
  [ 32.8, 27.5],
  [ 22.1, 24.2],   /* T10 · Scarperia */
  [ 18.0, 21.9],
  [ 14.7, 17.1],   /* T11 · Palagio */
  [ 11.1, 14.8],
  [  3.5, 11.6],
  [ -8.4,  8.6],
  [-13.4,  5.9],   /* T12 · Correntaio */
  [-12.1,  3.6],
  [ -7.4,  3.0],
  [  0.6,  4.8],   /* T13 · Biondetti 1 */
  [  3.9,  6.2],
  [  7.5,  8.9],   /* T14 · Biondetti 2 */
  [ 12.8, 12.1],
  [ 22.1, 15.5],
  [ 33.0, 18.4],   /* T15 · Bucine */
  [ 38.3, 18.5],
  [ 39.0, 16.1],
  [ 34.3, 13.6],
  [ 23.5,  9.9],
  [ 10.7,  4.9],
  [  2.8,  1.2],
];
const circuitBase=new THREE.CatmullRomCurve3(
  MUGELLO.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'catmullrom',0.5);
/* Mugello is not flat and pretending otherwise throws away half of what makes it
   Mugello: it climbs from San Donato to Poggio Secco, falls away through Casanova
   and Savelli, and drags itself back up through the infield to Bucine. The profile
   is keyed to distance round the lap, not to an arbitrary sine. */
const elevation=t=>{
  const k=(a,b,h)=>{const u=(t-a)/(b-a);return u<0||u>1?0:h*Math.sin(Math.PI*u);};
  return k(.04,.28,1.5)      /* the climb · San Donato → Poggio Secco */
       - k(.34,.56,1.7)      /* the plunge · Materassi → Savelli      */
       + k(.62,.86,.9)       /* the drag back up through the infield  */
       - .15;
};
/* getPoints() on a closed curve hands back the first point again at the end · feeding
   that straight into another closed curve puts a duplicate on the seam and pinches the
   tube right on the start/finish line. Drop it. */
export const circuitCurve=new THREE.CatmullRomCurve3(
  circuitBase.getPoints(160).slice(0,-1).map((p,i,a)=>{p.y=elevation(i/a.length);return p;}),
  true,'catmullrom',0.5);

let tkRenderer,tkScene,tkCam,tkVisible=false;
const RIDERS=[
  {u:0.00,v:0.052,c:new THREE.Color(0xffffff)},
  {u:0.36,v:0.047,c:new THREE.Color(0xdfe6ec)},   /* bright steel, on track */
  {u:0.70,v:0.057,c:new THREE.Color(0x9aa6ad)},
];
const TRAIL=14;
let riderGeo,riderPos;
const trackCanvas=document.getElementById('track');
export function initTrack(){
  if(!webgl||!trackCanvas)return;
  tkRenderer=new THREE.WebGLRenderer({canvas:trackCanvas,antialias:true,alpha:true,powerPreference:'high-performance',stencil:false});
  tkRenderer.setClearColor(0,0);
  tkRenderer.setPixelRatio(Math.min(devicePixelRatio,isMobile?1.5:1.75));
  tkScene=new THREE.Scene();
  tkScene.fog=new THREE.FogExp2(0x07080a,0.006);
  tkCam=new THREE.PerspectiveCamera(52,2,.1,400);

  /* tube: silver straights → white-hot corners */
  const tubeGeo=new THREE.TubeGeometry(circuitCurve,420,0.3,8,true);
  {
    const count=tubeGeo.attributes.position.count;
    const colors=new Float32Array(count*3);
    const silver=new THREE.Color(0x93a1ab), hot=new THREE.Color(0xffffff);
    const tmp=new THREE.Color();
    const SEG=420;const curv=[];
    for(let i=0;i<=SEG;i++){
      const t1=circuitCurve.getTangent(i/SEG), t2=circuitCurve.getTangent(((i+3)%SEG)/SEG);
      curv.push(Math.min(1,t1.angleTo(t2)*6));
    }
    for(let i=0;i<count;i++){
      const seg=Math.min(SEG,Math.floor(i/(count/(SEG+1))));
      tmp.copy(silver).lerp(hot,sstep(curv[seg]));
      colors[i*3]=tmp.r;colors[i*3+1]=tmp.g;colors[i*3+2]=tmp.b;
    }
    tubeGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  }
  tkScene.add(new THREE.Mesh(tubeGeo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.75,
    blending:THREE.AdditiveBlending,depthWrite:false})));

  /* dust along the track */
  const nd=isMobile?1500:3200;
  const dpos=new Float32Array(nd*3);
  for(let i=0;i<nd;i++){
    const p=circuitCurve.getPoint(Math.random());
    dpos[i*3]=p.x+gauss()*2.2;dpos[i*3+1]=p.y+gauss()*1.4+.4;dpos[i*3+2]=p.z+gauss()*2.2;
  }
  const dg=new THREE.BufferGeometry();
  dg.setAttribute('position',new THREE.BufferAttribute(dpos,3));
  tkScene.add(new THREE.Points(dg,new THREE.PointsMaterial({size:.9,map:sprite,transparent:true,opacity:.5,
    color:0xaebbc4,blending:THREE.AdditiveBlending,depthWrite:false})));

  /* riders */
  riderGeo=new THREE.BufferGeometry();
  riderPos=new Float32Array(RIDERS.length*TRAIL*3);
  const riderCol=new Float32Array(RIDERS.length*TRAIL*3);
  RIDERS.forEach((r,ri)=>{
    for(let i=0;i<TRAIL;i++){
      const f=1-i/TRAIL*0.85;
      riderCol.set([r.c.r*f,r.c.g*f,r.c.b*f],(ri*TRAIL+i)*3);
    }
  });
  riderGeo.setAttribute('position',new THREE.BufferAttribute(riderPos,3).setUsage(THREE.DynamicDrawUsage));
  riderGeo.setAttribute('color',new THREE.BufferAttribute(riderCol,3));
  const riderPts=new THREE.Points(riderGeo,new THREE.PointsMaterial({size:3,map:sprite,transparent:true,
    vertexColors:true,blending:THREE.AdditiveBlending,depthWrite:false}));
  riderPts.frustumCulled=false;
  tkScene.add(riderPts);

  function sizeTrack(){
    const r=trackCanvas.parentElement.getBoundingClientRect();
    tkRenderer.setSize(r.width,r.height,false);
    tkCam.aspect=r.width/r.height;tkCam.updateProjectionMatrix();
  }
  sizeTrack();
  onResize.push(sizeTrack);
  new IntersectionObserver(es=>{tkVisible=es.some(e=>e.isIntersecting);},{threshold:.1})
    .observe(trackCanvas.parentElement);
}


/* ---------- per-frame ---------- */
export function updateTrack(dt,time){
  if(!tkRenderer||!tkVisible)return;
  const a=reduced?0:time*0.05;
  tkCam.position.set(Math.sin(a)*74,36+Math.sin(time*.11)*3,Math.cos(a)*74);
  tkCam.lookAt(-3,0,-4);
  for(let ri=0;ri<RIDERS.length;ri++){
    const r=RIDERS[ri];
    r.u=(r.u+dt*r.v)%1;
    for(let i=0;i<TRAIL;i++){
      const u=((r.u-i*0.004)%1+1)%1;
      const p=circuitCurve.getPoint(u);
      const j=(ri*TRAIL+i)*3;
      riderPos[j]=p.x;riderPos[j+1]=p.y+0.4;riderPos[j+2]=p.z;
    }
  }
  riderGeo.attributes.position.needsUpdate=true;
  tkRenderer.render(tkScene,tkCam);
}

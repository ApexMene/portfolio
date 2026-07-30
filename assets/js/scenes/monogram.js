/* ============================================================
   G·M · portfolio · SCENE 3 · the monogram
   Particles settling into the signature under the contact block.
============================================================ */
import * as THREE from 'three';
import {lerp,s5,gauss} from '../core/math.js';
import {isMobile,webgl,glowSprite} from '../core/env.js';
import {onResize} from '../core/viewport.js';

const sprite=glowSprite();
let gmRenderer,gmScene,gmCam,gmGeo,gmFrom,gmTo,gmT=0,gmVisible=false,gmBuilt=false;
const gmCanvas=document.getElementById('gm-canvas');
function buildGM(){
  if(gmBuilt||!webgl||!gmCanvas)return;
  const c=document.createElement('canvas');c.width=640;c.height=200;
  const x=c.getContext('2d');
  x.fillStyle='#fff';x.font='600 150px "Cormorant Garamond", Georgia, serif';
  x.textAlign='center';x.textBaseline='middle';
  x.fillText('G · M',320,105);
  const d=x.getImageData(0,0,640,200).data;
  const samples=[];
  for(let py=0;py<200;py+=2)for(let px=0;px<640;px+=2){
    if(d[(py*640+px)*4+3]>120)samples.push([px,py]);
  }
  if(!samples.length)return;
  gmBuilt=true;
  const n=Math.min(4000,samples.length*2);
  gmFrom=new Float32Array(n*3);gmTo=new Float32Array(n*3);
  const S=64/640;
  for(let i=0;i<n;i++){
    const[px,py]=samples[(Math.random()*samples.length)|0];
    gmTo[i*3]=(px-320)*S+gauss()*.06;gmTo[i*3+1]=(100-py)*S+gauss()*.06;gmTo[i*3+2]=gauss()*.8;
    gmFrom[i*3]=gauss()*40;gmFrom[i*3+1]=gauss()*16;gmFrom[i*3+2]=gauss()*20-10;
  }
  gmRenderer=new THREE.WebGLRenderer({canvas:gmCanvas,antialias:false,alpha:true,powerPreference:'high-performance',stencil:false});
  gmRenderer.setClearColor(0,0);
  gmRenderer.setPixelRatio(Math.min(devicePixelRatio,isMobile?1.5:1.75));
  gmScene=new THREE.Scene();
  gmCam=new THREE.PerspectiveCamera(40,2,.1,200);
  gmCam.position.set(0,0,46);
  gmGeo=new THREE.BufferGeometry();
  gmGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(gmFrom),3).setUsage(THREE.DynamicDrawUsage));
  gmScene.add(new THREE.Points(gmGeo,new THREE.PointsMaterial({size:1.15,map:sprite,transparent:true,opacity:1,
    color:0xf2f7fb,blending:THREE.AdditiveBlending,depthWrite:false})));
  function sizeGM(){
    const r=gmCanvas.getBoundingClientRect();
    gmRenderer.setSize(r.width,r.height,false);
    gmCam.aspect=r.width/r.height;gmCam.updateProjectionMatrix();
  }
  sizeGM();onResize.push(sizeGM);
}
if(gmCanvas)new IntersectionObserver(es=>{
  gmVisible=es.some(e=>e.isIntersecting);
  if(gmVisible)buildGM();
},{threshold:.2}).observe(gmCanvas);


/* ---------- per-frame ---------- */
export function updateMonogram(dt,time){
  if(!gmRenderer||!gmVisible)return;
  gmT=Math.min(1,gmT+dt*.5);
  const arr=gmGeo.attributes.position.array;
  const k=s5(gmT);
  for(let i=0;i<arr.length;i+=3){
    arr[i]  =lerp(gmFrom[i],  gmTo[i],  k)+Math.sin(time*.8+i)*0.04;
    arr[i+1]=lerp(gmFrom[i+1],gmTo[i+1],k)+Math.cos(time*.7+i)*0.04;
    arr[i+2]=lerp(gmFrom[i+2],gmTo[i+2],k);
  }
  gmGeo.attributes.position.needsUpdate=true;
  gmRenderer.render(gmScene,gmCam);
}

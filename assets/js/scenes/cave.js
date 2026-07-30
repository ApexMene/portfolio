/* ============================================================
   G·M · portfolio · SCENE 0 · THE DESCENT
   Scroll-scrubbed cave flythrough. Daylight dies behind you, the headlamp takes over.
============================================================ */
import * as THREE from 'three';
import {sstep,rnd,gauss} from '../core/math.js';
import {isMobile,webgl,glowSprite} from '../core/env.js';
import {onResize,caveSec} from '../core/viewport.js';
import {stage,caveCv} from '../core/stage.js';
import {setCaveLevel} from '../audio.js';

const sprite=glowSprite();
let cvRenderer,cvScene,cvCam,cvVisible=false,cvHead,cvMouth,cvShaft,cvRim,cvMica,cvEgg1,cvEgg2,cvEgg3,cvGlow=null;
const cvBats=[];
const cvMist=[];
const cvLanterns=[];
const caveLbl=document.querySelector('.cave-lbl');
let cavePath=null;
/* Deferred. Building this scene is ~4900 displaced tube vertices, 120 rock meshes,
   three procedural canvas textures and a shadow rig — all of it used to run
   synchronously during module evaluation, before the browser had painted anything. */
export function initCave(){
  if(!webgl||!caveCv)return;
  cvRenderer=new THREE.WebGLRenderer({canvas:caveCv,antialias:!isMobile,powerPreference:'high-performance',stencil:false});
  cvRenderer.setClearColor(0x030405,1);
  cvRenderer.setPixelRatio(Math.min(devicePixelRatio,isMobile?1.5:1.75));
  cvRenderer.toneMapping=THREE.ACESFilmicToneMapping;
  cvRenderer.toneMappingExposure=1.15;
  cvRenderer.outputColorSpace=THREE.SRGBColorSpace;
  cvScene=new THREE.Scene();
  cvScene.fog=new THREE.FogExp2(0x030405,0.048);
  cvCam=new THREE.PerspectiveCamera(58,2,.1,140);

  /* deterministic 3D value noise */
  function h3(x,y,z){let h=(x*374761393+y*668265263+z*1274126177)|0;
    h=((h^(h>>>13))*1103515245)|0;return(((h^(h>>>16))&0x7fffffff)/0x7fffffff);}
  function vn(x,y,z){
    const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);
    const fx=x-ix,fy=y-iy,fz=z-iz;
    const s=t=>t*t*(3-2*t);const sx=s(fx),sy=s(fy),sz=s(fz);
    let acc=0;
    for(let dz=0;dz<2;dz++)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
      const w=(dx?sx:1-sx)*(dy?sy:1-sy)*(dz?sz:1-sz);
      acc+=w*h3(ix+dx,iy+dy,iz+dz);
    }
    return acc;
  }

  /* the path · a slow banking dive into the dark */
  cavePath=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,0),
    new THREE.Vector3(2.5,-3.5,-14),
    new THREE.Vector3(-3,-8,-28),
    new THREE.Vector3(2,-14,-44),
    new THREE.Vector3(-2,-21,-58),
    new THREE.Vector3(0,-28,-72),
  ]);

  /* procedural rock-grain texture · canvas noise, no external assets, gives real stone
     grain under bump lighting instead of a flat single-tone surface */
  function rockTex(size,grains,repU,repV){
    const c=document.createElement('canvas');c.width=c.height=size;
    const x=c.getContext('2d');
    x.fillStyle='#808080';x.fillRect(0,0,size,size);
    for(let i=0;i<grains;i++){
      const r=Math.random()*size*.012+size*.002;
      const v=80+Math.random()*140;
      x.fillStyle=`rgba(${v},${v},${v},${(.3+Math.random()*.4).toFixed(2)})`;
      x.beginPath();x.arc(Math.random()*size,Math.random()*size,r,0,Math.PI*2);x.fill();
    }
    const tex=new THREE.CanvasTexture(c);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(repU,repV);
    return tex;
  }

  /* rock tunnel · noise-displaced tube, smoothed and grained like real hewn stone */
  const SEGS=isMobile?110:170, RADS=isMobile?18:28;
  const tub=new THREE.TubeGeometry(cavePath,SEGS,5.2,RADS,false);
  {
    const pos=tub.attributes.position,nrm=tub.attributes.normal;
    const v=new THREE.Vector3(),n=new THREE.Vector3();
    for(let i=0;i<pos.count;i++){
      v.fromBufferAttribute(pos,i);n.fromBufferAttribute(nrm,i);
      const d=(vn(v.x*.32,v.y*.32,v.z*.32)-.5)*3.4
             +(vn(v.x*1.15,v.y*1.15,v.z*1.15)-.5)*1.1;
      v.addScaledVector(n,d);
      pos.setXYZ(i,v.x,v.y,v.z);
    }
    tub.computeVertexNormals();
  }
  const tubMesh=new THREE.Mesh(tub,new THREE.MeshStandardMaterial({
    color:0x181c21,roughness:.78,metalness:.14,side:THREE.BackSide,
    bumpMap:rockTex(256,1600,10,32),bumpScale:.12}));
  tubMesh.receiveShadow=true;
  cvScene.add(tubMesh);

  /* mica veins · faint mineral flecks embedded in the rock, catch the lamp */
  {
    const pos=tub.attributes.position;
    const pick=[];
    for(let i=0;i<pos.count;i+=3){
      if(Math.random()<.05)pick.push(i);
    }
    const nm=pick.length;
    const mp=new Float32Array(nm*3);
    const mph=new Float32Array(nm);
    for(let i=0;i<nm;i++){
      mp[i*3]=pos.getX(pick[i]);mp[i*3+1]=pos.getY(pick[i]);mp[i*3+2]=pos.getZ(pick[i]);
      mph[i]=Math.random()*Math.PI*2;
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(mp,3));
    const mat=new THREE.PointsMaterial({size:.22,map:sprite,transparent:true,opacity:0,
      color:0xd8e2e8,blending:THREE.AdditiveBlending,depthWrite:false});
    cvMica=new THREE.Points(g,mat);
    cvMica.userData.phases=mph;
    cvScene.add(cvMica);
  }

  /* stalactites & stalagmites · embedded in the walls */
  {
    const coneG=new THREE.ConeGeometry(.5,2.6,14,4);
    {
      const pos=coneG.attributes.position;
      const v=new THREE.Vector3();
      for(let i=0;i<pos.count;i++){
        v.fromBufferAttribute(pos,i);
        const d=(vn(v.x*2.2,v.y*1.4,v.z*2.2)-.5)*.13;
        const r=Math.hypot(v.x,v.z)||1;
        v.x+=v.x/r*d;v.z+=v.z/r*d;
        pos.setXYZ(i,v.x,v.y,v.z);
      }
      coneG.computeVertexNormals();
    }
    const mat=new THREE.MeshStandardMaterial({color:0x181c20,roughness:.7,metalness:.08,
      bumpMap:rockTex(128,900,3,7),bumpScale:.14});
    const up=new THREE.Vector3(0,1,0);
    /* one instanced draw instead of a hundred · identical geometry and material, so
       there was never a reason to pay a draw call and a shadow-pass draw call each */
    const COUNT=isMobile?52:104;
    const im=new THREE.InstancedMesh(coneG,mat,COUNT);
    im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;
    const mtx=new THREE.Matrix4(),qt=new THREE.Quaternion(),
          scv=new THREE.Vector3(),pv=new THREE.Vector3();
    for(let i=0;i<COUNT;i++){
      /* bias deeper · the passage closes in and the formations loom larger */
      const t=.05+Math.pow(Math.random(),.7)*.9;
      const p=cavePath.getPoint(t);
      const tan=cavePath.getTangent(t);
      const side=new THREE.Vector3().crossVectors(tan,up).normalize();
      const vert=new THREE.Vector3().crossVectors(side,tan).normalize();
      const top=Math.random()>.3;
      const dir=vert.clone().multiplyScalar(top?1:-1)
        .applyAxisAngle(tan,(Math.random()-.5)*1.3).normalize();
      const grow=1+t*.55;
      pv.copy(p).addScaledVector(dir,(4.4+Math.random()*.9)*Math.min(grow,1.25));
      qt.setFromUnitVectors(up,dir.clone().negate());
      const s=(.45+Math.random()*1.5)*grow;
      scv.set(s,s*(1+Math.random()*1.2),s);
      im.setMatrixAt(i,mtx.compose(pv,qt,scv));
    }
    im.instanceMatrix.needsUpdate=true;
    cvScene.add(im);
  }

  /* cave-mouth arch · broken rock threshold framing the entrance */
  {
    const rockGeo=new THREE.IcosahedronGeometry(1,3);
    {
      const pos=rockGeo.attributes.position;
      const v=new THREE.Vector3();
      for(let i=0;i<pos.count;i++){
        v.fromBufferAttribute(pos,i);
        const d=1+(vn(v.x*1.8,v.y*1.8,v.z*1.8)-.5)*.28;
        v.multiplyScalar(d);
        pos.setXYZ(i,v.x,v.y,v.z);
      }
      rockGeo.computeVertexNormals();
    }
    const rockMat=new THREE.MeshStandardMaterial({color:0x14181b,roughness:.72,metalness:.08,
      bumpMap:rockTex(128,700,2,2),bumpScale:.16});
    const up=new THREE.Vector3(0,1,0);
    const p0=cavePath.getPoint(.012),tan0=cavePath.getTangent(.012);
    const side0=new THREE.Vector3().crossVectors(tan0,up).normalize();
    const vert0=new THREE.Vector3().crossVectors(side0,tan0).normalize();
    const N=16;
    const im=new THREE.InstancedMesh(rockGeo,rockMat,N);
    im.castShadow=true;im.receiveShadow=true;im.frustumCulled=false;
    const mtx=new THREE.Matrix4(),qt=new THREE.Quaternion(),eu=new THREE.Euler(),
          scv=new THREE.Vector3(),pv=new THREE.Vector3();
    for(let i=0;i<N;i++){
      const a=i/N*Math.PI*2+rnd(-.12,.12);
      const dir=side0.clone().multiplyScalar(Math.cos(a)).addScaledVector(vert0,Math.sin(a));
      const rad=7.4+gauss()*1.1;
      pv.copy(p0).addScaledVector(dir,rad).addScaledVector(tan0,gauss()*1.4);
      const s=1.6+Math.random()*2.4;
      scv.set(s*(.7+Math.random()*.6),s*(.7+Math.random()*.6),s*(.7+Math.random()*.6));
      eu.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
      qt.setFromEuler(eu);
      im.setMatrixAt(i,mtx.compose(pv,qt,scv));
    }
    im.instanceMatrix.needsUpdate=true;
    cvScene.add(im);
  }

  /* easter egg I · a carved steel medallion, flush in the rock — found only if you look */
  {
    const up=new THREE.Vector3(0,1,0);
    const t=.605;
    const p=cavePath.getPoint(t);
    const tan=cavePath.getTangent(t);
    const side=new THREE.Vector3().crossVectors(tan,up).normalize();
    const vert=new THREE.Vector3().crossVectors(side,tan).normalize();
    const dir=side.clone().negate().applyAxisAngle(tan,.15).normalize();

    const sh=new THREE.Shape();
    sh.absarc(0,0,.42,0,Math.PI*2,false);
    const ring=new THREE.Shape();
    ring.absarc(0,0,.42,0,Math.PI*2,false);
    ring.holes.push(new THREE.Path().absarc(0,0,.33,0,Math.PI*2,true));
    const gDiamond=new THREE.Shape();
    gDiamond.moveTo(0,.16);gDiamond.lineTo(.1,0);gDiamond.lineTo(0,-.16);gDiamond.lineTo(-.1,0);gDiamond.closePath();
    const bar=new THREE.Shape();
    bar.moveTo(-.02,.16);bar.lineTo(.02,.16);bar.lineTo(.02,-.16);bar.lineTo(-.02,-.16);bar.closePath();

    const medMat=new THREE.MeshStandardMaterial({color:0x8d979e,metalness:.92,roughness:.28});
    const grp=new THREE.Group();
    const mkPart=(shape,depth)=>new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.012,bevelSize:.012,bevelSegments:2}),
      medMat);
    const base=mkPart(ring,.05);grp.add(base);
    const mark=mkPart(gDiamond,.07);mark.position.z=.01;grp.add(mark);
    const tick=mkPart(bar,.07);tick.position.set(.62,0,.01);tick.rotation.z=Math.PI/2;grp.add(tick);
    const tick2=tick.clone();tick2.position.set(-.62,0,.01);grp.add(tick2);

    grp.position.copy(p).addScaledVector(dir,4.55);
    grp.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir.clone().negate());
    grp.rotation.z+=.4;
    cvScene.add(grp);
    cvEgg1={grp,mat:medMat,pos:grp.position.clone()};
  }

  /* easter egg II · a cluster of crystal shards that pulse like a heartbeat */
  {
    const up=new THREE.Vector3(0,1,0);
    const t=.685;
    const p=cavePath.getPoint(t);
    const tan=cavePath.getTangent(t);
    const side=new THREE.Vector3().crossVectors(tan,up).normalize();
    const dir=side.clone().applyAxisAngle(tan,-.2).normalize();
    const anchor=p.clone().addScaledVector(dir,4.5);

    const shardGeo=new THREE.OctahedronGeometry(.13,0);
    const mats=[];
    const grp=new THREE.Group();
    for(let i=0;i<7;i++){
      const mat=new THREE.MeshStandardMaterial({color:0x0c1013,metalness:.1,roughness:.25,
        emissive:0x9fc2d6,emissiveIntensity:0});
      const m=new THREE.Mesh(shardGeo,mat);
      m.position.set(gauss()*.22,gauss()*.22,gauss()*.22);
      m.scale.set(.6+Math.random()*.9,1.4+Math.random()*1.3,.6+Math.random()*.9);
      m.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
      grp.add(m);mats.push(mat);
    }
    grp.position.copy(anchor);
    cvScene.add(grp);
    cvEgg2={grp,mats,pos:anchor.clone()};
  }

  /* dust motes · catch the lamp */
  {
    const nd=isMobile?300:750;
    const dp=new Float32Array(nd*3);
    for(let i=0;i<nd;i++){
      const p=cavePath.getPoint(Math.random());
      dp[i*3]=p.x+gauss()*3;dp[i*3+1]=p.y+gauss()*3;dp[i*3+2]=p.z+gauss()*3;
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(dp,3));
    cvScene.add(new THREE.Points(g,new THREE.PointsMaterial({size:.16,map:sprite,
      transparent:true,opacity:.4,color:0x8fa0ac,blending:THREE.AdditiveBlending,depthWrite:false})));
  }

  /* god-rays · a cathedral of cold, pale light shafts at the mouth */
  const cvShafts=[];
  {
    const shaftMat=(op)=>new THREE.MeshBasicMaterial({color:0xdfe9f2,transparent:true,opacity:op,
      blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
    const rig=new THREE.Group();
    const specs=[[1.5,4,-6,.22,.12,3.2,14,.05],[-2.2,7,-10,-.15,.22,2.1,17,.032],
                 [3.4,2,-13,.34,.05,1.7,12,.026]];
    for(const[sx,sy,sz,rz,rx,r,h,op]of specs){
      const shaft=new THREE.Mesh(new THREE.ConeGeometry(r,h,24,1,true),shaftMat(op));
      shaft.position.set(sx,sy,sz);shaft.rotation.z=rz;shaft.rotation.x=rx;
      shaft.userData.baseOp=op;
      rig.add(shaft);cvShafts.push(shaft);
    }
    /* the light source itself · a pale, cold core at the brightest shaft's origin */
    const sun=new THREE.Sprite(new THREE.SpriteMaterial({map:sprite,color:0xeef6fb,transparent:true,
      opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false}));
    sun.scale.set(13,13,1);
    sun.position.set(1.2,4.4,-5.2);
    sun.userData.baseOp=.4;
    rig.add(sun);cvShafts.push(sun);
    cvScene.add(rig);cvShaft=rig;
  }

  /* destination light · a cold bloom waiting at the deep end of the dive —
     swells in the last meters, dies into the blackout, hands off to the hero spark */
  {
    cvGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:sprite,color:0xdceaf6,transparent:true,
      opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    cvGlow.scale.set(9,9,1);
    const endP=cavePath.getPoint(.985);
    cvGlow.position.copy(endP);
    cvScene.add(cvGlow);
  }

  /* bats · hinged wings, a real flap instead of a flat card */
  {
    const wingShape=new THREE.Shape();
    wingShape.moveTo(0,0);
    wingShape.quadraticCurveTo(.55,.42,1.05,.18);
    wingShape.quadraticCurveTo(.85,.1,.7,0);
    wingShape.quadraticCurveTo(.85,-.06,.62,-.16);
    wingShape.quadraticCurveTo(.4,-.04,0,0);
    const wingGeo=new THREE.ShapeGeometry(wingShape);
    const wingExtrude=new THREE.ExtrudeGeometry(wingShape,{depth:.02,bevelEnabled:false});
    const bodyGeo=new THREE.ConeGeometry(.07,.32,8);
    /* real materials that catch the headlamp and rim light · not an unlit silhouette cutout */
    const bm=new THREE.MeshStandardMaterial({color:0x1b1712,roughness:.8,metalness:.05});
    const wm=new THREE.MeshStandardMaterial({color:0x100e0c,roughness:.7,metalness:0,
      side:THREE.DoubleSide,depthWrite:true});
    for(let i=0;i<7;i++){
      const g=new THREE.Group();
      const body=new THREE.Mesh(bodyGeo,bm);body.rotation.x=Math.PI/2;g.add(body);
      const wL=new THREE.Mesh(wingExtrude,wm);wL.position.x=-.03;wL.rotation.x=.1;g.add(wL);
      const wR=new THREE.Mesh(wingExtrude,wm);wR.position.x=.03;wR.scale.x=-1;wR.rotation.x=.1;g.add(wR);
      g.userData={t0:Math.random(),sp:.018+Math.random()*.03,ph:Math.random()*7,
        r:1.4+Math.random()*2.4,wL,wR};
      cvScene.add(g);cvBats.push(g);
    }
  }

  /* lights · day dies, the lamp takes over, a cool rim carves the stone —
     kept deliberately contrasty (low ambient floor, punchy key + rim) so the facets
     actually read as lit 3D stone instead of a flat grey wash */
  cvScene.add(new THREE.AmbientLight(0x0d1016,.22));
  cvMouth=new THREE.DirectionalLight(0xdfe9f2,1.4);
  cvMouth.position.set(2,14,16);cvScene.add(cvMouth);
  /* real cast shadows, but only from the sun · a single directional shadow map is one
     extra render pass total, versus a point light's cube-map which is 6 passes each —
     the entrance is also the only place the sun still reaches, so nothing is wasted */
  cvRenderer.shadowMap.enabled=!isMobile;
  cvRenderer.shadowMap.type=THREE.PCFSoftShadowMap;
  /* the caster geometry and the sun are both fixed, so the map is correct forever after
     the first pass · this was re-rendering the entire shadow scene every single frame */
  cvRenderer.shadowMap.autoUpdate=false;
  cvRenderer.shadowMap.needsUpdate=true;
  cvMouth.castShadow=true;
  cvMouth.shadow.mapSize.set(1024,1024);
  cvMouth.shadow.camera.near=1;cvMouth.shadow.camera.far=40;
  cvMouth.shadow.camera.left=-14;cvMouth.shadow.camera.right=14;
  cvMouth.shadow.camera.top=14;cvMouth.shadow.camera.bottom=-14;
  cvMouth.shadow.bias=-.0015;
  /* the lamp rides low and off the shoulder — never on the camera axis: light on-axis
     with the view kills every shadow gradient on curved rock (the on-camera-flash
     look). Offset sideways + slightly ahead so N·L diverges from N·V and the stone
     keeps its modeling. Warm tint against the cool rim for a two-source grade */
  cvHead=new THREE.PointLight(0xf6e3c2,0,64,1.15);
  cvScene.add(cvHead);
  cvRim=new THREE.PointLight(0x6c8898,0,70,1.15);
  cvScene.add(cvRim);

  /* lantern pools · a couple of fixed warm glows staked along the passage, so depth
     down the tunnel reads as lit rounded stone instead of falling flat black the
     instant it's past the headlamp's reach — kept to just two: every dynamic light
     adds a real per-fragment shader cost, more than that noticeably hurt framerate */
  {
    const up=new THREE.Vector3(0,1,0);
    const lanternTs=[.28,.6];
    for(const t of lanternTs){
      const p=cavePath.getPoint(t),tan=cavePath.getTangent(t);
      const side=new THREE.Vector3().crossVectors(tan,up).normalize();
      const off=side.clone().multiplyScalar(Math.random()>.5?3.2:-3.2);
      const lt=new THREE.PointLight(0xffb37a,1.1,14,2);
      lt.position.copy(p).add(off).addScaledVector(up,-1.2);
      lt.userData.ph=Math.random()*7;
      cvScene.add(lt);cvLanterns.push(lt);
    }
  }

  function sizeCv(){
    const w=caveCv.clientWidth||innerWidth,h=caveCv.clientHeight||innerHeight;
    cvRenderer.setSize(w,h,false);
    cvCam.aspect=w/h;cvCam.updateProjectionMatrix();
  }
  sizeCv();onResize.push(sizeCv);
  new IntersectionObserver(es=>{cvVisible=es.some(e=>e.isIntersecting);},{threshold:0})
    .observe(caveSec);
}

/* ---------- per-frame ----------
   Rendered until the piece has fully taken the frame. Reads the shared scrub and
   owns nothing outside this module. */
/* scratch · these were being allocated fresh every frame and handed straight to the
   collector, three per frame for the whole length of the descent */
const _clear=new THREE.Color(),_fwd=new THREE.Vector3(),_side=new THREE.Vector3();
let lastLbl=-1;

export function updateCave(dt,time){
  if(!cvRenderer||!cvVisible||stage.X>=.995){
    if(!stage.live)setCaveLevel(0,.4);        /* scrolled away · hush */
    return;
  }
  const cvP=stage.cvP;
  const t0=cvP*.94;
  const eye=cavePath.getPoint(t0);
  const look=cavePath.getPoint(Math.min(1,t0+.045));
  cvCam.position.set(
    eye.x+Math.sin(time*.5)*.07,
    eye.y+Math.cos(time*.41)*.06,
    eye.z);
  cvCam.lookAt(look);
  cvCam.rotation.z+=Math.sin(time*.24)*.02;      /* slow banking */
  cvCam.fov=58+Math.sin(time*.07)*.6;cvCam.updateProjectionMatrix();  /* faint breathing dolly */
  /* lamp held low off the right shoulder, pushed a touch ahead of the eye —
     surfaces rake across the light and read as round carved stone */
  _fwd.subVectors(look,eye).normalize();
  _side.crossVectors(_fwd,cvCam.up).normalize();
  cvHead.position.copy(eye)
    .addScaledVector(_side,1.9)
    .addScaledVector(cvCam.up,-1.1)
    .addScaledVector(_fwd,2.4);
  cvHead.intensity=sstep((cvP-.05)/.28)*3.6;     /* lamp ramps up */
  /* lantern flames breathe · a live fire, not a frozen bulb */
  for(const lt of cvLanterns){
    lt.intensity=1.1*(.86+.09*Math.sin(time*6.3+lt.userData.ph)+.05*Math.sin(time*11.7+lt.userData.ph*2.3));
  }
  cvMouth.intensity=1.4*(1-sstep(cvP/.42));      /* day dies behind */
  cvRim.position.set(eye.x-2.6,eye.y+2.2,eye.z-9);
  cvRim.intensity=sstep((cvP-.02)/.3)*2.1;       /* cool backlight carves the stone */
  /* ambience · rides the dissolve, so the cave goes quiet exactly as the piece takes
     the frame and the tick takes over. It never bleeds past the handoff. */
  setCaveLevel(1-stage.X,.5);
  /* fog + clear grade · cold moonlit mouth sinking into true black depths */
  const deep=sstep(cvP/.5);
  cvScene.fog.color.setRGB(.10-.088*deep,.12-.10*deep,.15-.126*deep);
  cvRenderer.setClearColor(_clear.setRGB(.04-.032*deep,.05-.04*deep,.065-.051*deep),1);
  if(cvShaft){
    cvShaft.children.forEach((s,i)=>{s.rotation.y=time*.02*(i%2?1:-1);});
    const k=1-sstep(cvP/.4);
    cvShaft.children.forEach(s=>s.material.opacity=s.userData.baseOp!=null?s.userData.baseOp*k:s.material.opacity);
  }
  if(cvMica){
    const ph=cvMica.userData.phases;
    const tw=(sstep((cvP-.05)/.3))*.55;
    cvMica.material.opacity=tw>0?tw*(.4+.6*Math.abs(Math.sin(time*2+ph[0]))):0;
  }
  for(const b of cvBats){
    const bt=((b.userData.t0+time*b.userData.sp)%.9)+.05;
    const bp=cavePath.getPoint(bt);
    b.position.set(
      bp.x+Math.sin(time*1.3+b.userData.ph)*b.userData.r,
      bp.y+1.6+Math.sin(time*2.1+b.userData.ph)*.8,
      bp.z+Math.cos(time*1.1+b.userData.ph)*b.userData.r);
    b.lookAt(cvCam.position);
    const flap=Math.sin(time*11+b.userData.ph);
    b.userData.wL.rotation.y=flap*1.05;
    b.userData.wR.rotation.y=-flap*1.05;
  }
  /* easter eggs · only read up close, exactly like the real thing */
  if(cvEgg1){
    const d=cvCam.position.distanceTo(cvEgg1.pos);
    const k=1-sstep((d-3.2)/5.5);
    cvEgg1.mat.emissive.setRGB(.55*k,.6*k,.66*k);
    cvEgg1.mat.emissiveIntensity=k*.8;
  }
  if(cvEgg2){
    const d=cvCam.position.distanceTo(cvEgg2.pos);
    const near=1-sstep((d-3)/5);
    const pulse=.5+.5*Math.sin(time*1.15);
    for(const m of cvEgg2.mats)m.emissiveIntensity=near*(.15+pulse*.85);
  }
  /* destination bloom · it does not die into a blackout. It swells until it owns the
     frame, and the piece's own halo picks it up on the other side of the dissolve —
     one light source, seen from inside the tunnel and then from the chamber. */
  if(cvGlow){
    const swell=sstep((cvP-.42)/.45);
    cvGlow.material.opacity=swell*(1.15+.2*Math.sin(time*2.2));
    const gs=9+34*Math.pow(sstep((cvP-.55)/.45),1.6);
    cvGlow.scale.set(gs,gs,1);
  }
  if(caveLbl){
    const lo=1-sstep((cvP-.1)/.5);
    if(Math.abs(lo-lastLbl)>.004){lastLbl=lo;caveLbl.style.opacity=lo;}
  }
  cvRenderer.render(cvScene,cvCam);
}

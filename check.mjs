
const THREE={};

/* ============================================================
   G·M · portfolio v5 · WAYNE
   black · grey ceramic · steel. Order over spectacle.
============================================================ */
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sstep=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const s5=t=>{t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const gauss=()=> (Math.random()+Math.random()+Math.random()-1.5)*0.8165*2;
const isMobile=matchMedia('(pointer:coarse)').matches||innerWidth<760;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

let webgl=true;
try{ const t=document.createElement('canvas').getContext('webgl2')||document.createElement('canvas').getContext('webgl'); if(!t)webgl=false; }
catch(e){ webgl=false; }
if(!webgl)document.body.classList.add('no-webgl');

function glowTex(){
  const c=document.createElement('canvas');c.width=c.height=64;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.25,'rgba(255,255,255,.6)');
  g.addColorStop(0.6,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);
  return new THREE.CanvasTexture(c);
}
const sprite=webgl?glowTex():null;

/* ============================================================
   REVEALS / NAV / PROG / MISC
============================================================ */
const io=new IntersectionObserver(es=>{
  for(const e of es)if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}
},{threshold:.15,rootMargin:'0px 0px -8% 0px'});
document.querySelectorAll('.rv').forEach(el=>io.observe(el));

const nav=document.getElementById('nav');
const prog=document.getElementById('prog');
const heroImg=document.querySelector('#hero .photo img');
addEventListener('scroll',()=>{
  const y=scrollY;
  nav.classList.toggle('scrolled',y>40);
  const max=document.body.scrollHeight-innerHeight;
  prog.style.width=(max>0?y/max*100:0)+'%';
  if(y<innerHeight)heroImg.style.transform=`scale(${1.06+y/innerHeight*0.1}) translateY(${y*0.12}px)`;
},{passive:true});

let counted=false;
const ioStats=new IntersectionObserver(es=>{
  if(es.some(e=>e.isIntersecting)&&!counted){
    counted=true;
    document.querySelectorAll('[data-count]').forEach(el=>{
      const target=+el.dataset.count;const t0=performance.now();
      (function step(){
        const k=Math.min(1,(performance.now()-t0)/1200);
        el.textContent=Math.round(target*s5(k))+(target===2?'+':'');
        if(k<1)requestAnimationFrame(step);
      })();
    });
  }
});
const statsEl=document.querySelector('.stats');
if(statsEl)ioStats.observe(statsEl);

setInterval(()=>{
  const el=document.getElementById('milano-time');
  if(el)el.textContent=new Intl.DateTimeFormat('it-IT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'}).format(new Date());
},1000);

/* video: play only in view */
const vid=document.getElementById('moto-vid');
new IntersectionObserver(es=>{
  for(const e of es){ if(e.isIntersecting){vid.play().catch(()=>{});} else vid.pause(); }
},{threshold:.25}).observe(vid);

/* ============================================================
   SCENE 0 · THE DESCENT — scroll-scrubbed cave flythrough
   daylight dies behind you · the headlamp takes over
============================================================ */
let cvRenderer,cvScene,cvCam,cvVisible=false,cvHead,cvMouth,cvShaft,cvP=0;
const cvBats=[];
const caveSec=document.getElementById('cave');
const caveCv=document.getElementById('cavecv');
const caveFade=document.querySelector('.cave-fade');
let cavePath=null;
if(webgl&&caveCv){
  cvRenderer=new THREE.WebGLRenderer({canvas:caveCv,antialias:true});
  cvRenderer.setClearColor(0x030405,1);
  cvRenderer.setPixelRatio(Math.min(devicePixelRatio,2));
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

  /* rock tunnel · noise-displaced tube, faceted like cut stone */
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
  cvScene.add(new THREE.Mesh(tub,new THREE.MeshStandardMaterial({
    color:0x181c21,roughness:.94,metalness:.06,side:THREE.BackSide,flatShading:true})));

  /* stalactites & stalagmites · embedded in the walls */
  {
    const coneG=new THREE.ConeGeometry(.5,2.6,6);
    const mat=new THREE.MeshStandardMaterial({color:0x14181d,roughness:.95,flatShading:true});
    const up=new THREE.Vector3(0,1,0);
    for(let i=0;i<(isMobile?40:78);i++){
      const t=.05+Math.random()*.9;
      const p=cavePath.getPoint(t);
      const tan=cavePath.getTangent(t);
      const side=new THREE.Vector3().crossVectors(tan,up).normalize();
      const vert=new THREE.Vector3().crossVectors(side,tan).normalize();
      const top=Math.random()>.3;
      const dir=vert.clone().multiplyScalar(top?1:-1)
        .applyAxisAngle(tan,(Math.random()-.5)*1.3).normalize();
      const m=new THREE.Mesh(coneG,mat);
      m.position.copy(p).addScaledVector(dir,4.4+Math.random()*.9);
      m.quaternion.setFromUnitVectors(up,dir.clone().negate());
      const s=.45+Math.random()*1.5;
      m.scale.set(s,s*(1+Math.random()*1.2),s);
      cvScene.add(m);
    }
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

  /* god-ray · one shaft of day at the mouth */
  {
    const shaft=new THREE.Mesh(new THREE.ConeGeometry(3.2,14,24,1,true),
      new THREE.MeshBasicMaterial({color:0xdfe9f2,transparent:true,opacity:.05,
        blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    shaft.position.set(1.5,4,-6);
    shaft.rotation.z=.22;shaft.rotation.x=.12;
    cvScene.add(shaft);cvShaft=shaft;
  }

  /* bats · silhouettes that cross the beam */
  {
    const bc=document.createElement('canvas');bc.width=64;bc.height=32;
    const bx=bc.getContext('2d');
    bx.fillStyle='#000';
    bx.beginPath();
    bx.moveTo(2,12);bx.quadraticCurveTo(12,2,26,10);bx.quadraticCurveTo(30,4,32,10);
    bx.quadraticCurveTo(34,4,38,10);bx.quadraticCurveTo(52,2,62,12);
    bx.quadraticCurveTo(50,12,44,20);bx.quadraticCurveTo(38,14,34,22);
    bx.quadraticCurveTo(30,14,26,22);bx.quadraticCurveTo(20,12,2,12);
    bx.fill();
    const bm=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(bc),
      transparent:true,color:0x020304,side:THREE.DoubleSide,depthWrite:false});
    for(let i=0;i<6;i++){
      const b=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.7),bm);
      b.userData={t0:Math.random(),sp:.018+Math.random()*.03,ph:Math.random()*7,r:1.4+Math.random()*2.4};
      cvScene.add(b);cvBats.push(b);
    }
  }

  /* lights · day dies, the lamp takes over */
  cvScene.add(new THREE.AmbientLight(0x11151c,.5));
  cvMouth=new THREE.DirectionalLight(0xdfe9f2,1.15);
  cvMouth.position.set(2,14,16);cvScene.add(cvMouth);
  cvHead=new THREE.PointLight(0xbfd2de,0,36,1.8);
  cvScene.add(cvHead);

  function sizeCv(){
    const w=caveCv.clientWidth||innerWidth,h=caveCv.clientHeight||innerHeight;
    cvRenderer.setSize(w,h,false);
    cvCam.aspect=w/h;cvCam.updateProjectionMatrix();
  }
  sizeCv();addEventListener('resize',sizeCv);
  new IntersectionObserver(es=>{cvVisible=es.some(e=>e.isIntersecting);},{threshold:0})
    .observe(caveSec);
}

/* ============================================================
   SCENE 1 · Cerachrom bezel — grey/black ceramic, steel rehaut
   the GRNR signature · featured, scroll turns the piece in hand
============================================================ */
let bzRenderer,bzScene,bzCam,bzGroup,bzVisible=false,bzKey=null;
const bzGlints=[];
const bezelCanvas=document.getElementById('bezel');
if(webgl&&bezelCanvas){
  bzRenderer=new THREE.WebGLRenderer({canvas:bezelCanvas,antialias:true,alpha:true});
  bzRenderer.setClearColor(0,0);
  bzRenderer.setPixelRatio(Math.min(devicePixelRatio,2));
  bzScene=new THREE.Scene();
  bzCam=new THREE.PerspectiveCamera(40,2,.1,200);
  bzCam.position.set(0,0,21);

  /* cold studio environment · what steel & ceramic reflect */
  {
    const env=new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(50,16,16),
      new THREE.MeshBasicMaterial({color:0x0b0d10,side:THREE.BackSide})));
    const soft=(w,h,x,y,z,col,ry=0,rx=0)=>{
      const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
        new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide}));
      m.position.set(x,y,z);m.rotation.set(rx,ry,0);env.add(m);
    };
    soft(30,8,-18,12,6,0xf4f8fb,.9);       /* key softbox · cold white */
    soft(22,5,16,-6,10,0x8fa0ac,-.8);      /* steel bounce */
    soft(40,3,0,20,-6,0xdde6ec,0,1.2);     /* top strip */
    soft(14,14,4,-16,4,0x14181c,0,-1.1);   /* dark floor card */
    const pm=new THREE.PMREMGenerator(bzRenderer);
    bzScene.environment=pm.fromScene(env,.05).texture;
    pm.dispose();
  }

  const cerBlack=new THREE.MeshPhysicalMaterial({color:0x07090b,metalness:0,roughness:.16,clearcoat:1,clearcoatRoughness:.08});
  const cerGrey =new THREE.MeshPhysicalMaterial({color:0x3a4046,metalness:0,roughness:.18,clearcoat:1,clearcoatRoughness:.1});
  const steel   =new THREE.MeshStandardMaterial({color:0xb9c2c9,metalness:1,roughness:.3});

  bzGroup=new THREE.Group();
  const R=7.2;

  /* bicolor Cerachrom ring · upper half grey, lower half black */
  const mkHalf=(start,mat)=>{
    const g=new THREE.TorusGeometry(R,1.2,48,120,Math.PI);
    const m=new THREE.Mesh(g,mat);m.rotation.z=start;return m;
  };
  bzGroup.add(mkHalf(0,cerGrey));
  bzGroup.add(mkHalf(Math.PI,cerBlack));

  /* engraved markers · steel studs around the rim */
  const N=48;
  const stud=new THREE.BoxGeometry(.16,.7,.35);
  for(let i=0;i<N;i++){
    const a=i/N*Math.PI*2;
    const m=new THREE.Mesh(stud,steel);
    m.position.set(Math.cos(a)*R,Math.sin(a)*R,1.06);
    m.rotation.z=a+Math.PI/2;
    if(i%4===0)m.scale.set(1.5,1.6,1);
    bzGroup.add(m);
  }

  /* polished steel rehaut rings, inner + outer */
  bzGroup.add(new THREE.Mesh(new THREE.TorusGeometry(R-1.32,.16,24,220),steel));
  bzGroup.add(new THREE.Mesh(new THREE.TorusGeometry(R+1.36,.12,24,220),steel));

  /* dial · black sunburst */
  {
    const dc=document.createElement('canvas');dc.width=dc.height=512;
    const dx=dc.getContext('2d');
    dx.fillStyle='#0c0e11';dx.fillRect(0,0,512,512);
    dx.translate(256,256);
    for(let i=0;i<720;i++){
      dx.rotate(Math.PI/360);
      dx.strokeStyle=`rgba(255,255,255,${0.015+0.025*Math.random()})`;
      dx.beginPath();dx.moveTo(0,0);dx.lineTo(256,0);dx.stroke();
    }
    const dialTex=new THREE.CanvasTexture(dc);
    const dial=new THREE.Mesh(new THREE.CircleGeometry(R-1.18,96),
      new THREE.MeshPhysicalMaterial({color:0x191d22,map:dialTex,metalness:.45,roughness:.42,
        clearcoat:.9,clearcoatRoughness:.22}));
    dial.position.z=.5;
    bzGroup.add(dial);
  }

  /* applied indices · brushed steel */
  {
    const idxG=new THREE.BoxGeometry(.3,1.05,.2);
    for(let i=0;i<12;i++){
      const a=i/12*Math.PI*2;
      const m=new THREE.Mesh(idxG,steel);
      m.position.set(Math.cos(a)*(R-2.15),Math.sin(a)*(R-2.15),.72);
      m.rotation.z=a+Math.PI/2;
      bzGroup.add(m);
    }
  }

  /* hands · polished steel at ten past ten */
  {
    const handMat=new THREE.MeshStandardMaterial({color:0xd8dee3,metalness:1,roughness:.2,
      emissive:0x22262a,emissiveIntensity:.4});
    const mkHand=(len,wid,rot,z)=>{
      const h=new THREE.Group();
      const stem=new THREE.Mesh(new THREE.BoxGeometry(wid,len,.12),handMat);
      stem.position.y=len/2;h.add(stem);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(wid*1.9,1.1,3),handMat);
      tip.position.y=len+.4;h.add(tip);
      h.position.z=z;h.rotation.z=rot;
      bzGroup.add(h);
    };
    mkHand(R-3.4,.3,Math.PI/3,.82);      /* hour · 10 */
    mkHand(R-2.2,.22,-Math.PI/3,.94);    /* minute · 2 */
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.24,32),handMat);
    cap.rotation.x=Math.PI/2;cap.position.z=1.02;
    bzGroup.add(cap);
  }

  /* glints · sparks that catch the orbiting key light */
  for(let i=0;i<10;i++){
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:sprite,color:0xffffff,transparent:true,
      opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    s.scale.set(1.7,1.7,1);
    const a=i/10*Math.PI*2;
    s.position.set(Math.cos(a)*(R+.6),Math.sin(a)*(R+.6),1.25);
    s.userData.a=a;
    bzGroup.add(s);bzGlints.push(s);
  }

  /* faint silver dust drifting around the piece */
  const nd=isMobile?240:520;
  const dp=new Float32Array(nd*3);
  for(let i=0;i<nd;i++){
    const a=rnd(Math.PI*2),r=R+gauss()*4;
    dp[i*3]=Math.cos(a)*r;dp[i*3+1]=Math.sin(a)*r;dp[i*3+2]=gauss()*5;
  }
  const dgeo=new THREE.BufferGeometry();
  dgeo.setAttribute('position',new THREE.BufferAttribute(dp,3));
  bzGroup.add(new THREE.Points(dgeo,new THREE.PointsMaterial({size:.5,map:sprite,transparent:true,opacity:.3,
    color:0xaebbc4,blending:THREE.AdditiveBlending,depthWrite:false})));

  /* presentation tilt · a bezel laid on velvet */
  bzGroup.rotation.x=.5;bzGroup.rotation.y=-.25;
  bzScene.add(bzGroup);

  /* direct lights for speculars on top of the env map */
  bzKey=new THREE.DirectionalLight(0xf2f7fb,1.25);bzKey.position.set(-8,6,10);bzScene.add(bzKey);
  const rim=new THREE.DirectionalLight(0x9fb0bc,.55);rim.position.set(7,-5,-6);bzScene.add(rim);
  bzScene.add(new THREE.AmbientLight(0x1a1e24,.4));

  function sizeBz(){
    const r=bezelCanvas.parentElement.getBoundingClientRect();
    bzRenderer.setSize(r.width,r.height,false);
    bzCam.aspect=r.width/r.height;bzCam.updateProjectionMatrix();
  }
  sizeBz();
  addEventListener('resize',sizeBz);
  new IntersectionObserver(es=>{bzVisible=es.some(e=>e.isIntersecting);},{threshold:.05})
    .observe(bezelCanvas.parentElement);
}

/* ============================================================
   SCENE 2 · TT Circuit Assen: track + 3 bikes
============================================================ */
const ASSEN=[
  [-40,8],[-10,10],
  [0,14],[6,10],
  [2,4],[8,0],
  [20,-4],[32,-8],
  [40,-12],[42,-20],[36,-24],
  [28,-20],[22,-26],
  [12,-24],[6,-30],
  [-4,-26],[-12,-30],
  [-24,-26],[-32,-28],
  [-40,-20],[-36,-12],[-42,-4],
];
const circuitBase=new THREE.CatmullRomCurve3(
  ASSEN.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'catmullrom',0.5);
const circuitCurve=new THREE.CatmullRomCurve3(
  circuitBase.getPoints(60).map((p,i)=>{p.y=Math.sin(i/60*Math.PI*4)*0.9;return p;}),true,'catmullrom',0.5);

let tkRenderer,tkScene,tkCam,tkVisible=false;
const RIDERS=[
  {u:0.00,v:0.052,c:new THREE.Color(0xffffff)},
  {u:0.36,v:0.047,c:new THREE.Color(0xdfe6ec)},   /* bright steel, on track */
  {u:0.70,v:0.057,c:new THREE.Color(0x9aa6ad)},
];
const TRAIL=14;
let riderGeo,riderPos;
const trackCanvas=document.getElementById('track');
if(webgl&&trackCanvas){
  tkRenderer=new THREE.WebGLRenderer({canvas:trackCanvas,antialias:true,alpha:true});
  tkRenderer.setClearColor(0,0);
  tkRenderer.setPixelRatio(Math.min(devicePixelRatio,2));
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
  addEventListener('resize',sizeTrack);
  new IntersectionObserver(es=>{tkVisible=es.some(e=>e.isIntersecting);},{threshold:.1})
    .observe(trackCanvas.parentElement);
}

/* ============================================================
   SCENE 3 · GM monogram particles (contact signature)
============================================================ */
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
  gmRenderer=new THREE.WebGLRenderer({canvas:gmCanvas,antialias:false,alpha:true});
  gmRenderer.setClearColor(0,0);
  gmRenderer.setPixelRatio(Math.min(devicePixelRatio,2));
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
  sizeGM();addEventListener('resize',sizeGM);
}
if(gmCanvas)new IntersectionObserver(es=>{
  gmVisible=es.some(e=>e.isIntersecting);
  if(gmVisible)buildGM();
},{threshold:.2}).observe(gmCanvas);

/* ============================================================
   PROJECT MINI-VISUALS · monochrome steel
============================================================ */
const ICE='223,230,236', WHT='238,243,246', GRY='148,158,166';
const vizEls=[...document.querySelectorAll('.pcanvas')];
const vizMap=new Map();
let vizVisible=false;
function vizInit(){
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
new IntersectionObserver(es=>{vizVisible=es.some(e=>e.isIntersecting);},{threshold:.05})
  .observe(document.getElementById('collection'));

/* ============================================================
   MAIN LOOP
============================================================ */
const clock=new THREE.Clock();
function frame(){
  requestAnimationFrame(frame);
  const dt=Math.min(clock.getDelta(),0.05);
  const time=clock.elapsedTime;

  /* the descent · scrub the dive with scroll */
  if(cvRenderer&&cvVisible){
    const rr=caveSec.getBoundingClientRect();
    const scrub=clamp(-rr.top/((rr.height-innerHeight)||1),0,1);
    cvP=lerp(cvP,scrub,.14);
    const t0=cvP*.94;
    const eye=cavePath.getPoint(t0);
    const look=cavePath.getPoint(Math.min(1,t0+.045));
    cvCam.position.set(
      eye.x+Math.sin(time*.5)*.07,
      eye.y+Math.cos(time*.41)*.06,
      eye.z);
    cvCam.lookAt(look);
    cvCam.rotation.z+=Math.sin(time*.24)*.02;      /* slow banking */
    cvHead.position.copy(cvCam.position);
    cvHead.intensity=sstep((cvP-.05)/.28)*2.6;      /* lamp ramps up */
    cvMouth.intensity=1.15*(1-sstep(cvP/.42));      /* day dies behind */
    if(cvShaft)cvShaft.material.opacity=.05*(1-sstep(cvP/.4));
    for(const b of cvBats){
      const bt=((b.userData.t0+time*b.userData.sp)%.9)+.05;
      const bp=cavePath.getPoint(bt);
      b.position.set(
        bp.x+Math.sin(time*1.3+b.userData.ph)*b.userData.r,
        bp.y+1.6+Math.sin(time*2.1+b.userData.ph)*.8,
        bp.z+Math.cos(time*1.1+b.userData.ph)*b.userData.r);
      b.lookAt(cvCam.position);
      b.scale.y=.55+Math.abs(Math.sin(time*11+b.userData.ph))*.75;   /* wing beat */
    }
    if(caveFade)caveFade.style.opacity=sstep((cvP-.82)/.18);
    cvRenderer.render(cvScene,cvCam);
  }

  /* Cerachrom piece · orbiting light sweep, scroll turns it in hand */
  if(bzRenderer&&bzVisible){
    const r=bezelCanvas.parentElement.getBoundingClientRect();
    const p=clamp(1-(r.top+r.height)/(innerHeight+r.height),0,1);
    const spin=(reduced?0:time*.05)+p*1.2;
    bzGroup.rotation.z=spin;
    bzGroup.rotation.x=.48+p*.3+Math.sin(time*.09)*.03;
    bzGroup.rotation.y=-.22+Math.sin(time*.11)*.06;
    bzCam.position.z=21+Math.sin(time*.13)*.5;
    /* key light orbits · speculars sweep across the ceramic */
    const la=time*.32;
    bzKey.position.set(Math.cos(la)*10,5+Math.sin(time*.21)*3,Math.sin(la)*10);
    /* markers glint as they cross the light */
    for(const s of bzGlints){
      const wa=s.userData.a+spin;
      const k=Math.max(0,Math.cos(wa-la+Math.PI/2));
      s.material.opacity=Math.pow(k,26)*.85;
    }
    bzRenderer.render(bzScene,bzCam);
  }

  /* assen */
  if(tkRenderer&&tkVisible){
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

  /* GM monogram */
  if(gmRenderer&&gmVisible){
    gmT=Math.min(1,gmT+dt*.5);
    const arr=gmGeo.attributes.position.array;
    const k=s5(gmT);
    for(let i=0;i<arr.length;i+=3){
      arr[i]=lerp(gmFrom[i],gmTo[i],k)+Math.sin(clock.elapsedTime*.8+i)*0.04;
      arr[i+1]=lerp(gmFrom[i+1],gmTo[i+1],k)+Math.cos(clock.elapsedTime*.7+i)*0.04;
      arr[i+2]=lerp(gmFrom[i+2],gmTo[i+2],k);
    }
    gmGeo.attributes.position.needsUpdate=true;
    gmRenderer.render(gmScene,gmCam);
  }

  /* project visuals */
  if(vizVisible)for(const cv of vizEls){
    const c=vizMap.get(cv);if(!c)continue;
    c.ctx.clearRect(0,0,c.w,c.h);
    VIZ[cv.dataset.viz]?.(c,time);
  }
}

addEventListener('resize',vizInit);

/* ============================================================
   SIGNATURE · seal, cursor, guilloché, cave parallax
============================================================ */
/* steel ring cursor · desktop only */
if(matchMedia('(pointer:fine)').matches){
  const cur=document.getElementById('cursor');
  let mx=innerWidth/2,my=innerHeight/2,cx2=mx,cy2=my;
  addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;cur.classList.add('on');});
  document.addEventListener('mouseover',e=>{
    cur.classList.toggle('big',!!e.target.closest('a,button,.ref,.srow'));});
  (function cf(){
    cx2=lerp(cx2,mx,.16);cy2=lerp(cy2,my,.16);
    cur.style.transform=`translate(${cx2}px,${cy2}px)`;
    requestAnimationFrame(cf);
  })();
}

/* guilloché · engine-turned rosette behind the piece */
function drawGuill(){
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
addEventListener('resize',drawGuill);

/* ---------- boot ---------- */
(function boot(){
  const fill=document.getElementById('l-fill');
  const t0=performance.now(),DUR=reduced?200:1200;
  (function tick(){
    const k=Math.min(1,(performance.now()-t0)/DUR);
    fill.style.width=Math.round(s5(k)*100)+'%';
    if(k<1){requestAnimationFrame(tick);}
    else{
      document.getElementById('loader').classList.add('done');
      vizInit();drawGuill();
    }
  })();
})();
if(webgl)frame();else vizInit();

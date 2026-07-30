/* ============================================================
   G·M · portfolio · SCENE 1 · THE PIECE
   Cerachrom bezel — grey/black ceramic, steel rehaut. The GRNR signature.
   It arrives out of the same light the tunnel was heading for: far and edge-on,
   then dollying in and rolling flat to face you. Drag turns it in hand.
============================================================ */
import * as THREE from 'three';
import {lerp,clamp,s5,rnd,gauss} from '../core/math.js';
import {isMobile,reduced,webgl,glowSprite} from '../core/env.js';
import {onResize} from '../core/viewport.js';
import {stage,bezStage} from '../core/stage.js';
import {rome} from '../ui/chrome.js';

const sprite=glowSprite();
let bzRenderer,bzScene,bzCam,bzGroup,bzKey=null,bzHourHand,bzMinHand,bzSecHand,bzHalo=null;
let bzNear=26,bzFar=55;   /* dolly end-points · recomputed from the viewport in sizeBz() */
let bzDrag=false,bzDX=0,bzDY=0,bzVX=0,bzVY=0,bzPX=0,bzPY=0;
const bzGlints=[];
const bezelCanvas=document.getElementById('bezel');
/* Deferred alongside the cave · a PMREM bake, a 512² canvas dial drawn with 720
   strokes and a clearcoat material set is not work to do before the first paint. */
export function initBezel(){
  if(!webgl||!bezelCanvas)return;
  bzRenderer=new THREE.WebGLRenderer({canvas:bezelCanvas,antialias:true,alpha:true,powerPreference:'high-performance',stencil:false});
  bzRenderer.setClearColor(0,0);
  bzRenderer.setPixelRatio(Math.min(devicePixelRatio,isMobile?1.5:1.75));
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
    /* sigma caps out at .04 for this mip budget · .05 made three.js clip the blur and
       print the same warning eight times into the console on every load */
    bzScene.environment=pm.fromScene(env,.035).texture;
    pm.dispose();
  }

  const cerBlack=new THREE.MeshPhysicalMaterial({color:0x07090b,metalness:0,roughness:.16,clearcoat:1,clearcoatRoughness:.08});
  const cerGrey =new THREE.MeshPhysicalMaterial({color:0x3a4046,metalness:0,roughness:.18,clearcoat:1,clearcoatRoughness:.1});
  const steel   =new THREE.MeshStandardMaterial({color:0xb9c2c9,metalness:1,roughness:.3});

  bzGroup=new THREE.Group();
  const R=7.2;
  bzGroup.userData.R=R;

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
    /* printed minute track · fine serigraphy, bolder every 5 */
    for(let i=0;i<60;i++){
      dx.save();dx.rotate(i/60*Math.PI*2);
      dx.fillStyle=i%5===0?'rgba(214,222,229,.6)':'rgba(214,222,229,.25)';
      dx.fillRect(i%5===0?-1.6:-.8,-238,i%5===0?3.2:1.6,i%5===0?13:7);
      dx.restore();
    }
    /* monogram + rating · platinum ink, whisper quiet */
    dx.textAlign='center';dx.textBaseline='middle';
    dx.fillStyle='rgba(222,229,235,.85)';
    dx.font='600 40px Georgia, "Times New Roman", serif';
    dx.fillText('G · M',0,-118);
    dx.fillStyle='rgba(170,180,188,.55)';
    dx.font='600 15px Inter, Arial, sans-serif';
    dx.fillText('A U T O M A T I C',0,124);
    const dialTex=new THREE.CanvasTexture(dc);
    const dial=new THREE.Mesh(new THREE.CircleGeometry(R-1.18,96),
      new THREE.MeshPhysicalMaterial({color:0x191d22,map:dialTex,metalness:.45,roughness:.42,
        clearcoat:.9,clearcoatRoughness:.22}));
    dial.position.z=.5;
    bzGroup.add(dial);
  }

  /* applied indices · brushed steel, each tipped with a lume pip */
  {
    const idxG=new THREE.BoxGeometry(.3,1.05,.2);
    const lume=new THREE.MeshStandardMaterial({color:0xdfeee6,emissive:0x9fd4b8,
      emissiveIntensity:.55,roughness:.5,metalness:0});
    const pipG=new THREE.CylinderGeometry(.11,.11,.1,14);
    for(let i=0;i<12;i++){
      const a=i/12*Math.PI*2;
      const m=new THREE.Mesh(idxG,steel);
      m.position.set(Math.cos(a)*(R-2.15),Math.sin(a)*(R-2.15),.72);
      m.rotation.z=a+Math.PI/2;
      bzGroup.add(m);
      const pip=new THREE.Mesh(pipG,lume);
      pip.rotation.x=Math.PI/2;
      pip.position.set(Math.cos(a)*(R-1.62),Math.sin(a)*(R-1.62),.72);
      bzGroup.add(pip);
    }
  }

  /* hands · polished steel, live Milano time — ticking, not posed */
  {
    const handMat=new THREE.MeshStandardMaterial({color:0xd8dee3,metalness:1,roughness:.2,
      emissive:0x22262a,emissiveIntensity:.4});
    const mkHand=(len,wid,z)=>{
      const h=new THREE.Group();
      const stem=new THREE.Mesh(new THREE.BoxGeometry(wid,len,.12),handMat);
      stem.position.y=len/2;h.add(stem);
      const tip=new THREE.Mesh(new THREE.ConeGeometry(wid*1.9,1.1,3),handMat);
      tip.position.y=len+.4;h.add(tip);
      h.position.z=z;
      bzGroup.add(h);
      return h;
    };
    bzHourHand=mkHand(R-3.4,.3,.82);
    bzMinHand=mkHand(R-2.2,.22,.94);

    /* seconds hand · thin, red-tipped, with a counterweight tail — sweeps continuously */
    const secMat=new THREE.MeshStandardMaterial({color:0xd23c3c,metalness:.6,roughness:.3,
      emissive:0x3a0f0f,emissiveIntensity:.5});
    bzSecHand=new THREE.Group();
    const secStem=new THREE.Mesh(new THREE.BoxGeometry(.08,R-1.6,.1),secMat);
    secStem.position.y=(R-1.6)/2-.9;bzSecHand.add(secStem);
    const secTail=new THREE.Mesh(new THREE.BoxGeometry(.1,1.3,.1),secMat);
    secTail.position.y=-.9-.65;bzSecHand.add(secTail);
    const secDot=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.14,20),secMat);
    secDot.rotation.x=Math.PI/2;secDot.position.set(0,R-3.4,.1);bzSecHand.add(secDot);
    bzSecHand.position.z=1.06;
    bzGroup.add(bzSecHand);

    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.24,32),handMat);
    cap.rotation.x=Math.PI/2;cap.position.z=1.02;
    bzGroup.add(cap);
  }

  /* sapphire crystal · shallow transparent dome over the dial — one long living glare */
  {
    const dome=new THREE.Mesh(
      new THREE.SphereGeometry(16.5,64,16,0,Math.PI*2,0,.38),
      new THREE.MeshPhysicalMaterial({color:0xffffff,metalness:0,roughness:.03,
        transparent:true,opacity:.07,clearcoat:1,clearcoatRoughness:.04,depthWrite:false,envMapIntensity:1.4}));
    dome.rotation.x=Math.PI/2;
    dome.position.z=1.1-16.5*Math.cos(.38);
    bzGroup.add(dome);
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

  /* the light you arrive into · sits behind the piece and swells across the handoff,
     so the tunnel's destination bloom and the piece's halo are visually the same light
     seen from two sides. This is what carries the cut — the eye never loses the source. */
  bzHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:sprite,color:0xdbe9f6,transparent:true,
    opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false}));
  bzHalo.position.set(0,.6,-9);
  bzScene.add(bzHalo);

  /* direct lights for speculars on top of the env map */
  bzKey=new THREE.DirectionalLight(0xf2f7fb,1.25);bzKey.position.set(-8,6,10);bzScene.add(bzKey);
  const rim=new THREE.DirectionalLight(0x9fb0bc,.55);rim.position.set(7,-5,-6);bzScene.add(rim);
  bzScene.add(new THREE.AmbientLight(0x1a1e24,.4));

  /* how far back the camera has to stand for the whole piece to be in frame.
     A fixed distance cannot do this: at z=21 the 40° lens sees 15.3 units of height,
     and the piece is ~17.4 across, so it was cropped top and bottom on every window —
     and worse the shorter the window. Solve for the distance instead of guessing it. */
  const BZ_HALF=9.4;                                  /* outer edge incl. the glints */
  function fitBz(aspect){
    const t=Math.tan(bzCam.fov*Math.PI/360);
    return Math.max(BZ_HALF/t, BZ_HALF/(t*aspect));   /* whichever axis binds */
  }
  function sizeBz(){
    const r=bezelCanvas.parentElement.getBoundingClientRect();
    bzRenderer.setSize(r.width,r.height,false);
    bzCam.aspect=r.width/r.height;bzCam.updateProjectionMatrix();
    bzNear=fitBz(bzCam.aspect);
    bzFar=bzNear*2.1;                                 /* where it starts, out in the deep */
  }
  sizeBz();
  onResize.push(sizeBz);
  /* visibility is no longer a separate observer · the piece and the cave now share one
     pinned viewport, so the same scrub value that dissolves them also gates the render */

  /* the piece earns its 3D · drag to turn it in hand, inertia on release
     — user-driven, so it stays on even under prefers-reduced-motion (only idle/autoplay drift is gated by `reduced`) */
  bezStage.style.cursor='grab';
  bezStage.addEventListener('pointerdown',e=>{
    bzDrag=true;bzPX=e.clientX;bzPY=e.clientY;bzVX=0;bzVY=0;
    bezStage.setPointerCapture(e.pointerId);bezStage.style.cursor='grabbing';
  });
  bezStage.addEventListener('pointermove',e=>{
    if(!bzDrag)return;
    bzVX=(e.clientX-bzPX)*.0055;bzVY=(e.clientY-bzPY)*.0055;
    bzDX+=bzVX;bzDY=clamp(bzDY+bzVY,-1.1,1.1);
    bzPX=e.clientX;bzPY=e.clientY;
  });
  const drop=()=>{bzDrag=false;bezStage.style.cursor='grab';};
  bezStage.addEventListener('pointerup',drop);
  bezStage.addEventListener('pointercancel',drop);
}


/* ---------- per-frame ---------- */
export function updateBezel(dt,time){
  if(!bzRenderer||stage.X<=.005)return;
  const p=stage.A,e=s5(p);
  if(!bzDrag){const d=Math.exp(-3.7*dt);bzVX*=d;bzVY*=d;bzDX+=bzVX;bzDY=clamp(bzDY+bzVY,-1.1,1.1);}
  const spin=(reduced?0:time*.05)+p*2.2+bzDX;
  bzGroup.rotation.z=spin;
  bzGroup.rotation.x=lerp(1.22,.46,e)+(reduced?0:Math.sin(time*.09)*.03)+bzDY;
  bzGroup.rotation.y=lerp(-.5,-.22,e)+(reduced?0:Math.sin(time*.11)*.06);
  /* a real dolly · the piece comes to you out of the deep, stopping exactly where the
     whole of it is in frame for this window rather than at a fixed distance */
  bzCam.position.z=lerp(bzFar,bzNear,e)+(reduced?0:Math.sin(time*.13)*.5);
  if(!reduced){
    bzCam.position.x=Math.sin(time*.09)*.4;
    bzCam.position.y=Math.cos(time*.07)*.3;
    bzCam.lookAt(0,0,0);
  }
  /* the halo hands the cave's bloom over · wide on arrival, tightening into a glow
     behind the piece as the key light takes over */
  if(bzHalo){
    const h=s5(clamp(p/.55,0,1));
    bzHalo.material.opacity=.55*(1-h);
    const hs=lerp(58,24,e);
    bzHalo.scale.set(hs,hs,1);
  }
  bzKey.intensity=1.25*(.05+.95*e);
  /* key light orbits · speculars sweep across the ceramic */
  const la=time*.32;
  bzKey.position.set(Math.cos(la)*10,5+Math.sin(time*.21)*3,Math.sin(la)*10);
  /* live Milano time · hands counter-rotate inside the spinning group */
  const rd=new Date(Date.now()+rome.offsetMs);
  const secF=rd.getUTCSeconds()+rd.getUTCMilliseconds()/1000;
  const minF=rd.getUTCMinutes()+secF/60;
  const hourF=(rd.getUTCHours()%12)+minF/60;
  if(bzHourHand)bzHourHand.rotation.z=-hourF/12*Math.PI*2;
  if(bzMinHand)bzMinHand.rotation.z=-minF/60*Math.PI*2;
  if(bzSecHand){
    const beatN=Math.floor(secF*12);        /* high-beat step · 12 per second */
    bzSecHand.rotation.z=-(beatN/12)/60*Math.PI*2;
  }
  /* markers glint as they cross the light */
  for(const s of bzGlints){
    const wa=s.userData.a+spin;
    const k=Math.max(0,Math.cos(wa-la+Math.PI/2));
    s.material.opacity=Math.pow(k,26)*.85;
  }
  bzRenderer.render(bzScene,bzCam);
}

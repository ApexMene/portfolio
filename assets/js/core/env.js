/* ============================================================
   G·M · portfolio · environment
   What this device can do, decided once. Everything here has a side effect or
   costs something to build, which is why it is not in math.js.
============================================================ */
import * as THREE from 'three';

export const isMobile=matchMedia('(pointer:coarse)').matches||innerWidth<760;
export const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* probe once · a failed context here is the difference between a degraded page and
   a blank one, so the three WebGL scenes are gated on it rather than assumed */
export const webgl=(()=>{
  try{
    const c=document.createElement('canvas');
    return !!(c.getContext('webgl2')||c.getContext('webgl'));
  }catch{ return false; }
})();
if(!webgl)document.body.classList.add('no-webgl');   /* modules are deferred · body exists */

/* the one soft radial sprite every scene reuses · lanterns, glints, dust, the halo.
   Built lazily so a no-WebGL visitor never pays for it. */
let _sprite=null;
export function glowSprite(){
  if(!webgl)return null;
  if(_sprite)return _sprite;
  const c=document.createElement('canvas');c.width=c.height=64;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(0.25,'rgba(255,255,255,.6)');
  g.addColorStop(0.6,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,64,64);
  return (_sprite=new THREE.CanvasTexture(c));
}

/* ============================================================
   G·M · portfolio · math
   Pure functions only. Importing this file must never touch the DOM, so that
   anything can pull in an easing curve without dragging a canvas probe with it.
============================================================ */

export const lerp=(a,b,t)=>a+(b-a)*t;
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* the two house curves · smoothstep for scrubs, quintic for anything the eye
   follows across the whole screen (it leaves and arrives with zero acceleration) */
export const sstep=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export const s5=t=>{t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};

export const rnd=(a=1,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
export const gauss=()=>(Math.random()+Math.random()+Math.random()-1.5)*0.8165*2;

/* frame-rate independent approach · a fixed-alpha lerp moves a different distance
   per second on a 60Hz panel than on a 144Hz one, so the same page felt heavier or
   twitchier purely as a function of the monitor. This does not. */
export const damp=(a,b,lambda,dt)=>a+(b-a)*(1-Math.exp(-lambda*dt));

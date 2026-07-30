/* ============================================================
   G·M · portfolio · the pinned stage
   THE DESCENT · one continuous move.

   P walks 0→1 across the whole pinned section. The dive owns the first 62% of it,
   the piece owns the last 45%, and they overlap in the middle: for that overlap both
   scenes render and cross-dissolve while both cameras are still travelling. A
   dissolve between two moving shots reads as one continuous move — which is the whole
   point. The version this replaced faded the cave to solid black, ended the section,
   started a second section and opened an iris on a cold canvas: three hard cuts.

   This module owns the scrub and the overlay DOM. The two scenes read from it and
   never from each other.
============================================================ */
import {clamp,sstep,s5,damp} from './math.js';
import {view} from './viewport.js';
import {setWatchAudio} from '../audio.js';

export const caveCv    =document.getElementById('cavecv');
export const bezStage  =document.getElementById('bezel-stage');
const vaultSpot =document.querySelector('.vault-spot');
const vaultFlash=document.querySelector('.vault-flash');
const vaultCap  =document.querySelector('.vault-cap');

/* the whole sequence in five numbers · every scene reads these, nothing writes them
   except update() below */
export const stage={
  P:0,      /* raw scroll through the pin, 0→1                    */
  X:0,      /* the dissolve · raw, never damped                    */
  cvP:0,    /* the dive, damped                                    */
  A:0,      /* the arrival, damped                                 */
  live:false,
};

/* last written values · a style write that changes nothing still costs a style recalc */
const w8={bez:-1,spotO:-1,spotS:-1,flash:-1,capO:-1,pe:''};

export function updateStage(dt){
  const {sy:y,vh,caveTop,caveSpan}=view;

  stage.P=clamp((y-caveTop)/caveSpan,0,1);
  stage.live=y+vh>caveTop&&y<caveTop+caveSpan+vh;
  /* the dissolve is driven by the RAW scroll · it may never lag behind the scrollbar */
  stage.X=sstep((stage.P-.55)/.13);
  /* motion is driven by the DAMPED scroll · weight and follow-through, and identical
     on a 60Hz panel and a 144Hz one, which a fixed-alpha lerp never was */
  stage.cvP=damp(stage.cvP,clamp(stage.P/.62,0,1),9,dt);
  stage.A  =damp(stage.A,  clamp((stage.P-.55)/.45,0,1),9,dt);

  const X=stage.X,A=stage.A;

  if(stage.live){
    /* the two canvases trade places */
    if(Math.abs(X-w8.bez)>.002){
      w8.bez=X;
      if(bezStage)bezStage.style.opacity=X;
      if(caveCv)caveCv.style.opacity=1-X;
      const pe=X>.6?'auto':'none';
      if(pe!==w8.pe&&bezStage){w8.pe=pe;bezStage.style.pointerEvents=pe;}
    }
    /* the light you break out into · peaks across the handoff, then clears.
       Kept deliberately low: at half opacity a full-bleed white layer stops reading as
       a light source and starts reading as fog over the whole frame — the piece
       arrives into milk instead of arriving out of a tunnel. A narrow, brief burst
       (higher exponent, lower peak) carries the handoff without bleaching it. */
    const fl=Math.pow(Math.sin(Math.PI*X),2.1)*.22;
    if(Math.abs(fl-w8.flash)>.004&&vaultFlash){
      w8.flash=fl;
      vaultFlash.style.opacity=fl;
      vaultFlash.style.transform=`scale(${1+.3*X})`;
    }
    /* the vignette closes around the piece, then opens as the light finds it */
    if(vaultSpot){
      const so=X*(1-.55*s5(A)),ss=1+2.4*s5(A);
      if(Math.abs(so-w8.spotO)>.004){w8.spotO=so;vaultSpot.style.opacity=so;}
      if(Math.abs(ss-w8.spotS)>.006){w8.spotS=ss;vaultSpot.style.transform=`scale(${ss})`;}
    }
    /* The words come last, once the piece is fully lit — held back until it has
       essentially stopped moving. They are the last beat of the sequence, not a
       caption riding along with the camera.
       Snapped to whole pixels and un-promoted at rest: a text layer sitting on a
       fractional translate is rasterized off the pixel grid with grayscale AA, and
       `background-clip:text` over that reads as genuinely out of focus. */
    if(vaultCap){
      const capK=sstep((A-.73)/.18);
      if(Math.abs(capK-w8.capO)>.004){
        const settled=capK>.995;
        w8.capO=capK;
        vaultCap.style.opacity=settled?1:capK;
        const ty=Math.round((1-capK)*26);
        vaultCap.style.transform=ty?`translate3d(0,${ty}px,0)`:'none';
        vaultCap.style.willChange=settled?'auto':'opacity,transform';
      }
    }
  }

  /* The tick is scoped to the piece and nothing else · this must be evaluated on
     every frame, not only while the section is live, or leaving the section simply
     stops updating the gain and the movement follows you down the whole page. */
  setWatchAudio(stage.live&&X>.35);
}

/* ============================================================
   G·M · portfolio · viewport
   One clock's worth of measurements, taken once. No layout reads per frame.
============================================================ */

/* every resize consumer lands here · one debounced pass instead of seven handlers
   each re-sizing a renderer and re-rasterizing a canvas on every resize tick */
export const onResize=[];
let rzT=0;

export const caveSec=document.getElementById('cave');

/* Scroll offsets are measured once and reused · the loop then derives every scrubbed
   animation from arithmetic alone. Nothing in this page mutates layout after boot, so
   there is no reason to pay for getBoundingClientRect sixty times a second.
   Exported as one object rather than as separate `let`s: an imported binding is
   read-only at the import site, and a bag of five of them is worse to read than
   `view.sy` anyway. */
export const view={sy:scrollY,vh:innerHeight,docMax:1,caveTop:0,caveSpan:1};

export function measureAll(){
  view.vh=innerHeight;
  view.docMax=Math.max(1,document.documentElement.scrollHeight-view.vh);
  if(caveSec){
    const r=caveSec.getBoundingClientRect();
    view.caveTop=r.top+scrollY;
    view.caveSpan=Math.max(1,r.height-view.vh);
  }
}

addEventListener('scroll',()=>{view.sy=scrollY;},{passive:true});
addEventListener('resize',()=>{
  clearTimeout(rzT);
  rzT=setTimeout(()=>{measureAll();for(const f of onResize)f();},140);
},{passive:true});

measureAll();
addEventListener('load',measureAll);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measureAll);

/* The window is not the only thing that can move these numbers · a late webfont, an
   image finally decoding, a section growing — none of those fire `resize`, and a stale
   caveSpan puts the whole descent out of phase with the scrollbar. Watch the element
   itself, which is what actually matters. */
if(window.ResizeObserver&&caveSec){
  let first=true;
  new ResizeObserver(()=>{
    if(first){first=false;return;}      /* the initial callback is just the current size */
    measureAll();
    for(const f of onResize)f();
  }).observe(caveSec);
}

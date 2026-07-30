/* ============================================================
   G·M · portfolio · type
   Split the masthead, mask the headings. Runs once, at import.
============================================================ */
import {reduced} from '../core/env.js';

/* the name rises letter by letter. `.steel` moves onto the letters themselves:
   background-clip:text on the parent would not follow transformed children. */
const hn=document.querySelector('.hero-name');
if(hn&&!reduced){
  const txt=hn.textContent.trim();
  hn.textContent='';hn.classList.remove('steel');
  [...txt].forEach((ch,i)=>{
    const s=document.createElement('span');
    s.className='hl steel';s.style.setProperty('--i',i);
    s.textContent=ch===' '?' ':ch;
    hn.appendChild(s);
  });
}

/* headings climb out from behind a hard edge instead of just fading up */
document.querySelectorAll('.stitle.rv,.big.rv').forEach(el=>{
  const w=document.createElement('div');
  w.className='lmask';
  el.parentNode.insertBefore(w,el);
  w.appendChild(el);
});

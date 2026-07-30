/* ============================================================
   G·M · portfolio · the console
   Someone will open it. On a page that spends this much effort on what you can see,
   leaving what you can't see as raw stack noise is a loose end. Printed once, after
   boot, so it sits at the top of a clean log rather than buried in library chatter.
============================================================ */

const ink='#c9d4dd',dim='#5c6874',hi='#e8eef4';
const mono='ui-monospace,SFMono-Regular,Menlo,monospace';
const rule='color:'+dim+';font:11px '+mono;

/* raw string · the wings are mostly backslashes and every one of them would need
   escaping in a normal literal */
const bat=String.raw`
       _==/          i     i          \==_
     /XX/            |\___/|            \XX\
   /XXXX\            |XXXXX|            /XXXX\
  |XXXXXX\_         _XXXXXXX_         _/XXXXXX|
 XXXXXXXXXXXxxxxxxxXXXXXXXXXXXxxxxxxxXXXXXXXXXXX
|XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX|
 XXXXXX/^^^^^\XXXXXXXXXXXXXXXXXXXXX/^^^^^\XXXXXX
  |XXX|       \XXX/^^\XXXXX/^^\XXX/       |XXX|
    \XX\       \X/    \XXX/    \X/       /XX/
       ""       "      \X/      "       ""
`;

export function signConsole(){
  console.log('%c'+bat,
    'color:'+hi+';font:11px/1.05 '+mono+';text-shadow:0 0 12px rgba(160,190,220,.45)');
  console.log('%c  G · M\n  ────────────────────────────────\n',
    'color:'+hi+';font:600 13px Georgia,serif;letter-spacing:.22em');
  console.log('%cGianluca Meneghetti  ·  Machine Learning Engineer\n'+
    'Milano  ·  45.4642° N, 9.1900° E','color:'+ink+';font:12px '+mono);
  console.log('%cBuilt by hand. No framework, no build step — ES modules straight to the browser.\n'+
    'three.js for the three scenes, Web Audio for the rest, everything else is CSS.',rule);
  console.log('%cIf you are reading this you are the kind of person I like working with —\n'+
    'linkedin.com/in/gianluca-meneghetti-3b520325b','color:'+ink+';font:12px '+mono);
  console.log('%c ',rule);
}

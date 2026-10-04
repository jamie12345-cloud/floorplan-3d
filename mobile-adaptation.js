const assert=require('assert');
function addMobile(s){
 const css=`
#mobileMore,#mobileHistory{display:none}
@media(max-width:700px){
 .app{grid-template-rows:auto minmax(0,1fr)}
 header{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:4px;padding:5px 8px;z-index:10}
 header .brand,header>.spacer,footer,#hint3d,#modehint,#planMeta{display:none!important}
 header>.grp{min-width:0;gap:0;padding:1px;justify-content:center}
 header .btn{font-size:12px;padding:4px 6px;min-height:44px}
 #paneBtns{grid-column:1;grid-row:1}#viewSeg{grid-column:2;grid-row:1}
 #viewSeg .btn,#viewSeg .pill{width:50%}#viewSeg .pill{left:2px;width:calc(50% - 3px)}body.m3d #viewSeg .pill{transform:translateX(100%)}
 #siteViews{grid-column:1/-1;grid-row:2}#siteViews .btn{flex:1}
 #modes3d{grid-column:1;grid-row:3}#modes3d .btn{flex:1}
 #mobileHistory{display:flex;position:absolute;top:calc(100% + 8px);left:8px;gap:0;z-index:7;border:1px solid var(--line);border-radius:8px;background:var(--panel);box-shadow:0 2px 8px #0002}\n #mobileMore{display:block;grid-column:2;grid-row:3;align-self:stretch}
 #mobileMore>summary{display:flex;align-items:center;justify-content:center;height:48px;list-style:none;border:1px solid var(--line);border-radius:8px;background:#fff;cursor:pointer}
 #mobileMore>summary::-webkit-details-marker{display:none}
 #mobileMore>.mobileControls{position:absolute;top:100%;right:8px;width:min(360px,calc(100vw - 16px));max-height:50dvh;overflow:auto;padding:8px;display:flex;flex-wrap:wrap;gap:6px;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 6px 24px #0003}
 #mobileMore .grp{flex-wrap:wrap;max-width:100%}#mobileMore .menu-pop{position:static}#mobileMore .range input{width:90px!important}
 #wallFinishes .finishMenu{position:static;width:100%}
 #joy{left:18px;bottom:20px;background:rgba(40,35,29,.5);border:2px solid #fff;z-index:8}
 #walkExit{z-index:12;pointer-events:auto;touch-action:none;min-height:44px;bottom:22px;right:16px}
 #view3d canvas{touch-action:none}
}
`;
 s=s.replace('</style>',css+'\n</style>');
 const js=`<script>
(()=>{
 const header=document.querySelector('header'),more=document.createElement('details');
 more.id='mobileMore';more.innerHTML='<summary>More ▾</summary><div class="mobileControls"></div>';
 const history=document.createElement('div');history.id='mobileHistory';history.setAttribute('aria-label','Layout history');header.append(history);\n const core=new Set(['paneBtns','viewSeg','siteViews','modes3d','mobileHistory']);
 const extra=[...header.children].filter(el=>!core.has(el.id)&&!el.classList.contains('brand')&&!el.classList.contains('spacer'));
 const slots=extra.map(el=>{const slot=document.createComment('desktop control position');el.before(slot);return [el,slot];});
 header.append(more);const mq=matchMedia('(max-width:700px)');
 const undo=document.querySelector('#undo'),redo=document.querySelector('#redo'),historyHome=undo.parentElement;\n function arrange(){slots.forEach(([el,slot])=>mq.matches?more.lastElementChild.append(el):slot.after(el));[undo,redo].forEach(el=>mq.matches?history.append(el):historyHome.insertBefore(el,document.querySelector('#clearAll')));more.open=false;}
 arrange();mq.addEventListener('change',arrange);
 more.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#wallFinishes'))more.open=false;});
 document.querySelector('#modes3d').addEventListener('click',()=>more.open=false);
})();
</script>`;
 s=s.replace('</body>',js+'\n</body>');
 const mode="    $('#walkOverlay').style.display = 'flex';\n    syncHint3d();";
 assert(s.includes(mode),'walk mode activation anchor');
 s=s.replace(mode,"    if(COARSE || matchMedia('(max-width:700px)').matches) startTouchWalk();\n    else $('#walkOverlay').style.display = 'flex';\n    syncHint3d();");
 s=s.replace('camera.position.set(wx(OX), 1.6, wz(OY + BOUNDS.h/2 - 900)); camera.lookAt(wx(OX), 1.5, wz(OY));','camera.position.set(wx(1200), 1.6, wz(15500)); camera.lookAt(wx(1200), 1.5, wz(10000));');
 s=s.replace("el.addEventListener('pointercancel', end);","el.addEventListener('pointercancel', end); el.addEventListener('lostpointercapture', end);");
 s=s.replace('let touchWalk = false;', 'let touchWalk = false, resetWalkPointer=()=>{};');
 s=s.replace('const cv = renderer.domElement; let downAt = null, look = null;', 'const cv = renderer.domElement; let downAt = null, look = null; resetWalkPointer=()=>{look=null;downAt=null;};');
 s=s.replace("function setMode(m){\n  if (anim) return;", "function setMode(m){\n  if (anim && m !== 'orbit') return;");
 s=s.replace("  $('#walkExit').onclick = () => setMode('orbit');", `  const exitButton=$('#walkExit');
  function exitWalk(e){
    e?.preventDefault();e?.stopPropagation();
    if(opt.mode!=='walk')return;
    resetWalkPointer();
    const joystick=$('#joy');
    if(joy.id!==null && joystick.hasPointerCapture(joy.id))joystick.releasePointerCapture(joy.id);
    Object.keys(keys).forEach(k=>keys[k]=false);
    setMode('orbit');
  }
  exitButton.addEventListener('pointerup',exitWalk);
  exitButton.addEventListener('click',exitWalk);
  exitButton.addEventListener('pointerdown',e=>{e.stopPropagation();});`);
 s=s.replace("  bindJoystick();","  bindJoystick();\n  addEventListener('blur',()=>{joy.x=joy.y=0;joy.id=null;$('#joy i').style.transform='';});");
 s=s.replace('const d = THREE.MathUtils.clamp(P.p.y, 5, 30), dir = new THREE.Vector3(.3, .82, .49).normalize();', "const narrow=matchMedia('(max-width:700px)').matches; const d = THREE.MathUtils.clamp(P.p.y, 5, narrow?80:30)*(narrow?1.12:1), dir = (narrow?new THREE.Vector3(.08,.96,.27):new THREE.Vector3(.3,.82,.49)).normalize();");
 s=s.replace('const isoWhole = () => pose(new THREE.Vector3(0,0,0),new THREE.Vector3(7,18,12));', "const isoWhole = () => pose(new THREE.Vector3(0,0,0),matchMedia('(max-width:700px)').matches?new THREE.Vector3(2,21,6):new THREE.Vector3(7,18,12));");
 s=s.replace('<div id="joy"><i></i></div>','<div id="joy" role="group" aria-label="Movement joystick"><i></i></div>');
 return s;
}
module.exports={addMobile};

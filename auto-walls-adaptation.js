const assert=require('assert');
function addAutoWalls(s){
 function replace(a,b){assert(s.includes(a),'Auto walls anchor: '+a.slice(0,90));s=s.replace(a,b);}
 replace('<button class="btn chip" data-cut="1.1" data-en="Cut walls">剖切墙</button>', '<button class="btn chip" data-cut="1.1" data-en="Cut walls">剖切墙</button><button class="btn chip" data-cut="auto" data-en="Auto walls" aria-pressed="false">Auto walls</button>');
 replace('furn:true, labels:false','autoWalls:false, furn:true, labels:false');
 const code=`
function tagAutoWall(start,line){
  const plane={x0:wx(line[0]),z0:wz(line[1]),x1:wx(line[2]),z1:wz(line[3])};
  archUp.children.slice(start).forEach(o=>{if(!o.userData.walkOnly){o.userData.autoWall=plane;o.userData.autoWallBase=o.visible;}});
}
function autoWallHidden(line){
  const dx=line.x1-line.x0,dz=line.z1-line.z0,len=Math.hypot(dx,dz);
  if(len<.001)return false;
  const nx=-dz/len,nz=dx/len,mx=(line.x0+line.x1)/2,mz=(line.z0+line.z1)/2;
  const cs=(camera.position.x-mx)*nx+(camera.position.z-mz)*nz;
  let ts=(orbit.target.x-mx)*nx+(orbit.target.z-mz)*nz;
  // If the camera target lies on the wall, use the house centre as reference.
  if(Math.abs(ts)<.03)ts=(-mx)*nx+(-mz)*nz;
  if(Math.abs(ts)<.03)return false;
  return cs*ts<0 && Math.abs(cs)>.12;
}
function updateAutoWalls(){
  const enabled=opt.autoWalls && opt.mode==='orbit';
  const update=o=>{if(o.userData.autoWall)o.visible=o.userData.autoWallBase && !(enabled&&autoWallHidden(o.userData.autoWall));};
  archUp.children.forEach(update);furnG.traverse(update);
  if(roofGroup)roofGroup.visible=opt.roof && opt.cut>=H && !enabled;
}
function wallBox(line,yb,yt,m){const start=archUp.children.length;wallBoxBase(line,yb,yt,m);tagAutoWall(start,line);}
function buildArchOpening(d,top){const start=archUp.children.length;buildArchOpeningBase(d,top);tagAutoWall(start,doorLine(d));}
`;
 replace('function wallBox([x0,y0,x1,y1,k,t=200]',code+'\nfunction wallBoxBase([x0,y0,x1,y1,k,t=200]');
 replace('function buildArchOpening(d,top){\n','function buildArchOpeningBase(d,top){\n');
 // The inserted wrapper must retain its original name.
 s=s.replace('function buildArchOpeningBase(d,top){const start=archUp.children.length;buildArchOpeningBase', 'function buildArchOpening(d,top){const start=archUp.children.length;buildArchOpeningBase');
 replace('  WINS.forEach(win => {\n    const {rect:', '  WINS.forEach(win => {\n    const autoStart=archUp.children.length;\n    const {rect:');
 replace("  });\n  if(STAIRS)buildStairFlight();", "    tagAutoWall(autoStart,line);\n  });\n  if(STAIRS)buildStairFlight();");
 replace("  DOORS.forEach(d => {\n    if(d.kind==='arch'){buildArchOpening(d,top);return;}", "  DOORS.forEach(d => {\n    const autoStart=archUp.children.length;\n    if(d.kind==='arch'){buildArchOpening(d,top);return;}");
 replace('    doors.push(door);archUp.add(pivot);','    doors.push(door);archUp.add(pivot);tagAutoWall(autoStart,doorLine(d));');
 replace("function syncCutBtns(){ document.querySelectorAll('[data-cut]').forEach(b => b.classList.toggle('on', +b.dataset.cut === opt.cut)); }", "function syncCutBtns(){ document.querySelectorAll('[data-cut]').forEach(b => {const on=b.dataset.cut==='auto'?opt.autoWalls:!opt.autoWalls&&+b.dataset.cut===opt.cut;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));}); }");
 replace("document.querySelectorAll('[data-cut]').forEach(b => b.onclick = () => { if (opt.mode === 'walk') return; opt.cut = +b.dataset.cut; syncCutBtns(); sync(); });", "document.querySelectorAll('[data-cut]').forEach(b => b.onclick = () => { if (opt.mode === 'walk') return; opt.autoWalls=b.dataset.cut==='auto'; opt.cut=opt.autoWalls?H:+b.dataset.cut; syncCutBtns(); sync(); updateAutoWalls(); });");
 const decorCode=`
function tagAttachedDecor(g){
  g.children.forEach(o=>{
    const x=o.position.x,z=o.position.z;
    const px=x*1000+OX,py=z*1000+OY;
    if(px>=STAIRS.x&&px<=STAIRS.x+STAIRS.w&&py>=STAIRS.y0&&py<=STAIRS.y1)return;
    let best=null,dist=.4;
    WALLS.forEach((w,i)=>{if(state.demolished.includes('w'+i))return;
      const a=wx(w[0]),b=wz(w[1]),dx=wx(w[2])-a,dz=wz(w[3])-b,l=dx*dx+dz*dz;if(!l)return;
      const t=Math.max(0,Math.min(1,((x-a)*dx+(z-b)*dz)/l)),d=Math.hypot(x-a-t*dx,z-b-t*dz);
      if(d<dist){dist=d;best=w;}
    });
    if(best){o.userData.autoWall={x0:wx(best[0]),z0:wz(best[1]),x1:wx(best[2]),z1:wz(best[3])};o.userData.autoWallBase=o.visible;}
  });
}
`;
 replace('function referenceDecor(){',decorCode+'\nfunction referenceDecor(){');
 replace('  pendant(3650,14350,.32);pendant(1200,12600,.16);pendant(1200,15400,.16);', '  pendant(3650,14350,.32);pendant(1200,12600,.16);pendant(1200,15400,.16);\n  tagAttachedDecor(g);');
 // Banquette art is attached to the wall; keep its seat visible.
 replace('  g.rotation.y = -f.rot * Math.PI/180;', `  if(f.type==='banquette'){
    const w=WALLS.find(w=>Math.abs(w[0]-w[2])<1000 && w[0]>4500 && Math.min(w[1],w[3])<=f.cy && Math.max(w[1],w[3])>=f.cy);
    if(w)g.children.filter(o=>o.position.y>1).forEach(o=>{o.userData.autoWall={x0:wx(w[0]),z0:wz(w[1]),x1:wx(w[2]),z1:wz(w[3])};o.userData.autoWallBase=o.visible;});
  }
  g.rotation.y = -f.rot * Math.PI/180;`);
 replace('function pick(e){',"function effectiveVisible(o){for(;o;o=o.parent)if(!o.visible)return false;return true;}\nfunction pick(e){");
 replace('    let o = h.object;','    let o = h.object;\n    if(!effectiveVisible(o))continue;');
 replace('h.object.material !== glassMat && h.object.visible','h.object.material !== glassMat && effectiveVisible(h.object)');
 replace('  updateSel();\n  renderer.render(scene, camera);','  updateSel();\n  updateAutoWalls();\n  renderer.render(scene, camera);');
 return s;
}
module.exports={addAutoWalls};

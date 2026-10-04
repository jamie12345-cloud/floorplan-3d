#!/usr/bin/env node
/* Generates the two local, measured-plan variants from the upstream single-file app.
 * Geometry is deliberately data-only: metres in PLAN_DATA are converted to the app's mm coordinates.
 * No dimensions are inferred beyond the supplied basis notes. */
const fs = require('fs');
const assert = require('assert');
const {addGarden} = require('./garden-adaptation');
const {addMobile} = require('./mobile-adaptation');
const {addAutoWalls} = require('./auto-walls-adaptation');
const src = fs.readFileSync('index.html', 'utf8');
const mm = n => Math.round(n * 1000);
const p = ([x,y]) => [mm(x),mm(y)];
const wall = (a,b,k='e',t=.2) => [mm(a[0]),mm(a[1]),mm(b[0]),mm(b[1]),k,mm(t)];
const rect = (x0,y0,x1,y1) => [[mm(x0),mm(y0)],[mm(x1),mm(y0)],[mm(x1),mm(y1)],[mm(x0),mm(y1)]];
const doorH = (name,x,y,w,entry=false) => ({name,rect:[mm(x),mm(y)-100,mm(x+w),mm(y)+100],h:[mm(x),mm(y)],c:[1,0],o:[0,-1],len:mm(w),entry});
const doorV = (name,x,y,w,entry=false) => ({name,rect:[mm(x)-100,mm(y),mm(x)+100,mm(y+w)],h:[mm(x),mm(y)],c:[0,1],o:[1,0],len:mm(w),entry});
// Existing traces contain schematic 500-1000 mm gaps. Keep each gap's centre,
// size the leaf explicitly, and move only collinear wall ends that meet it.
function fitDoors(plan){
  for(const d of plan.doors){
    const horizontal=d.c[0]!==0, axis=horizontal?0:1, cross=horizontal?1:0;
    const start=d.h[axis], oldEnd=start+d.len, centre=(start+oldEnd)/2;
    const leaf=d.entry?838:d.name.includes('Pantry')?686:(d.name.includes('Store')||d.name.includes('WC door'))?610:762;
    const opening=leaf+56, a=Math.round(centre-opening/2), b=a+opening;
    const line=d.h[cross];
    let leftEnd=false,rightStart=false;
    for(const w of plan.walls){
      if(w[cross]!==line || w[cross+2]!==line)continue;
      if(w[axis]===start){w[axis]=a;leftEnd=true;}
      if(w[axis+2]===start){w[axis+2]=a;leftEnd=true;}
      if(w[axis]===oldEnd){w[axis]=b;rightStart=true;}
      if(w[axis+2]===oldEnd){w[axis+2]=b;rightStart=true;}
    }
    if(!leftEnd&&a>start)plan.walls.push(horizontal?[start,line,a,line,'n',100]:[line,start,line,a,'n',100]);
    if(!rightStart&&b<oldEnd)plan.walls.push(horizontal?[b,line,oldEnd,line,'n',100]:[line,b,line,oldEnd,'n',100]);
    d.rect=horizontal?[a,line-100,b,line+100]:[line-100,a,line+100,b];
    d.h=horizontal?[a+28,line]:[line,a+28];
    d.len=leaf; d.opening=opening; d.leafH=1981; d.openingH=d.kind==='arch'?2200:2025;
    if(d.kind==='arch')d.archSpring=Math.round(d.openingH-opening/2);
    d.thickness=d.entry?44:35;
  }
}
function checkDoorFit(plan){
  for(const d of plan.doors){
    const horizontal=d.c[0]!==0, axis=horizontal?0:1, cross=horizontal?1:0;
    const line=d.h[cross], a=d.rect[axis], b=d.rect[axis+2];
    assert.strictEqual(b-a,d.len+56,`${plan.id} ${d.name}: opening allowance`);
    assert.strictEqual(d.h[axis],a+28,`${plan.id} ${d.name}: hinge inset`);
    assert.strictEqual(d.h[axis]+d.len,b-28,`${plan.id} ${d.name}: far clearance`);
    if(d.kind==='arch'){
      assert.strictEqual(d.openingH-d.archSpring,d.opening/2,`${plan.id} ${d.name}: semicircular arch profile`);
    }else assert.strictEqual(d.openingH-d.leafH,44,`${plan.id} ${d.name}: vertical allowance`);
    for(const w of plan.walls){
      if(w[cross]!==line||w[cross+2]!==line)continue;
      const wlo=Math.min(w[axis],w[axis+2]),whi=Math.max(w[axis],w[axis+2]);
      assert(wlo>=b||whi<=a,`${plan.id} ${d.name}: opaque wall crosses opening`);
    }
  }
}
const sash = (name,cx,y) => ({name,rect:[mm(cx-.6),mm(y)-100,mm(cx+.6),mm(y)+100],axis:'h',sill:800,height:1400,panels:1,style:'sash'});
const folding = (name,x0,x1,y) => ({name,rect:[mm(x0),mm(y)-100,mm(x1),mm(y)+100],axis:'h',sill:0,height:2300,panels:6,style:'folding'});
const p1SecondLeft = y => 2.5 - (y - 6.5) * .75 / 5.5;
const p1SecondEdge = y => p([p1SecondLeft(y),y]);

const plan1 = {
 id:'plan-1', title:'Plan 1 · traced ground floor', depth:20, width:5.75,
 note:'Source trace: 50 cm grid. Exterior walls 200 mm, internal walls 100 mm and 2.4 m height are illustrative. Door leaves are estimated at 1981 mm high, 762 mm wide internally and 838 mm at the entrance; structural openings include an illustrative 56 mm width allowance and are 2025 mm high. The centred 1.2 m front-lounge sash opening has an approximate 0.8 m sill and 1.4 m height. D4 shared brick fireplace is provisional; the front-room fireplace and missing WC door are unresolved.',
 walls:[
  wall([0,0],[2,0]), wall([0,0],[0,20]), wall([2,0],[2,3.5]), wall([2,3.5],[2.5,3.5]), wall([2.5,3.5],[2.5,6.5]),
  wall([2.5,6.5],[5.5,6.5]), wall([5.5,6.5],[5.75,12]), wall([5.75,12],[5.75,20]),
  wall([0,20],[.25,20]), wall([1,20],[5.75,20]),
  wall([0,3.5],[2,3.5],'n',.1), wall([0,4.5],[1.25,4.5],'n',.1), wall([2,4.5],[2.5,4.5],'n',.1),
  wall([1,4.5],[1,8.5],'n',.1), wall([2,4.5],[2,7.7],'n',.1), wall([2.5,6.5],[2.5,7.7],'n',.1),
  wall([0,5.5],[1,5.5],'n',.1), wall([0,6.5],[1,6.5],'n',.1), wall([0,7.7],[1,7.7],'n',.1), wall([0,8.5],[1,8.5],'n',.1),
  wall([2,7.7],[2.5,7.7],'n',.1), wall([.75,12],[.75,17.3],'n',.1),
  wall([1.75,12],[1.75,18.5],'n',.1), wall([1.75,19.25],[1.75,20],'n',.1), wall([1.75,16],[5.75,16],'n',.1),
  wall([5.75,13.5],[5.5,13.5],'n',.1), wall([5.5,13.5],[5.5,14.5],'n',.1), wall([5.5,14.5],[5.75,14.5],'n',.1)
 ],
 doors:[doorH('Front entrance',.25,20,.75,true),doorH('Rear door A',1.25,4.5,.75),doorH('Rear door D4',1,7.7,1),doorH('Stair / hall',.75,12,1),doorV('Front hall',1.75,18.5,.75)],
 windows:[sash('Front lounge sash · approximate',3.75,20)],
 rooms:[
  ['shed','Outdoor sheds',rect(0,0,2,3.5),'antislip',[1,1.75]], ['wash','Toilet / shower',rect(0,3.5,2.5,4.5),'antislip',[1.25,4]],
  ['rearA','Rear strip A',rect(0,4.5,1,5.5),'terrazzo',[.5,5]], ['rearB','Rear strip B',rect(0,5.5,1,6.5),'terrazzo',[.5,6]],
  ['rearC','Rear strip C',rect(0,6.5,1,7.7),'terrazzo',[.5,7.1]], ['fire','D4 · shared brick fireplace (provisional)',rect(0,7.7,1,8.5),'marble',[.5,8.1]],
  ['rearServiceLower','Unassigned traced floor',rect(1,4.5,2.5,6.5),'terrazzo',null],
  ['rearServiceUpper','Unassigned traced floor',[p([1,6.5]),p1SecondEdge(6.5),p1SecondEdge(7.7),p([1,7.7])],'terrazzo',null],
  ['rearServiceTop','Unassigned traced floor',[p([1,7.7]),p1SecondEdge(7.7),p1SecondEdge(8.5),p([1,8.5])],'terrazzo',null],
  ['secondRear','Second room · rear',[p1SecondEdge(6.5),p([5.5,6.5]),p([5.75,12]),p1SecondEdge(12),p1SecondEdge(8.5),p1SecondEdge(7.7)],'tile800',[3.8,9.3]],
  ['unassigned','Unassigned traced area',[p([0,8.5]),p1SecondEdge(8.5),p1SecondEdge(12),p([0,12])],'terrazzo',[.9,10.2]],
  ['secondFront','Second room · front',rect(1.75,12,5.75,16),'tile800',[3.8,14]],
  ['stairs','Stairs',rect(0,12,.75,17.3),'wood',[.38,14.7]], ['frontStairClear','Unassigned traced floor',rect(0,17.3,.75,20),'tile600',null], ['hall','Hall',rect(.75,12,1.75,20),'tile600',[1.25,17.7]], ['front','Front room',rect(1.75,16,5.75,20),'tile800',[3.75,18]]
 ],
 stairs:{x:0,y0:12,y1:17.3,w:.75}, fireplaces:[{x:0,y:7.7,w:1,h:.8,label:'D4 shared brick fireplace · provisional'}]
};
const plan2 = {
 id:'plan-2', title:'Plan 2 · proposed ground floor', depth:16.5, width:5.8,
 note:'Based on the source trace and its 50 cm grid. The merged 7.95 m² utility, its new hall entry, boxed rear chimney and outward-opening WC door are proposed changes, not traced existing walls. The former utility/store divider and both kitchen doors are removed; the kitchen-side wall is continuous. Exterior walls 200 mm, internal walls 100 mm and 2.4 m height are illustrative. Door leaves are estimated at 1981 mm high, 762 mm wide internally, 610 mm at the WC, and 838 mm at the entrance; structural openings include an illustrative 56 mm width allowance and are 2025 mm high. The hall-to-kitchen and pantry openings retain their measured centres and widths as open semicircular arches with crowns at approximately 2.2 m. The centred 1.2 m front-lounge sash opening has an approximate 0.8 m sill and 1.4 m height; rear folding doors span the traced 5.3 m extension wall at y=0. The front fireplace outline is open-ended. Kitchen, dining, lounge, WC, pantry and utility furnishings are interpreted design presets from the supplied sketch and interior references, not surveyed joinery or construction geometry.',
 walls:[
  wall([0,0],[5.3,0]),wall([0,0],[0,16.5]),wall([5.3,0],[5.8,8.5]),wall([5.8,8.5],[5.8,16.5]),wall([0,16.5],[.5,16.5]),wall([1.2,16.5],[5.8,16.5]),
  wall([0,8.5],[1,8.5],'n',.1),wall([1.5,8.5],[1.7,8.5],'n',.1),wall([1.7,8.5],[1.7,10.7],'n',.1),wall([.75,8.5],[.75,8.65],'n',.1),wall([0,10],[.75,10],'n',.1),
  wall([1.7,9.5],[2,9.5],'n',.1),wall([2.5,9.5],[3,9.5],'n',.1),wall([3,9.5],[3,10.5],'n',.1),
  wall([1.7,10.5],[3.25,10.5],'n',.1),wall([4.068,10.5],[4.8,10.5],'n',.1),wall([5.466,10.5],[5.55,10.5],'n',.1),
  wall([1.7,11.518],[1.7,15],'n',.1),wall([1.7,12.5],[5.8,12.5],'n',.1),
  wall([1.7,15.55],[1.7,16.5],'n',.1),wall([5.8,10],[5.55,10],'n',.1),wall([5.55,10],[5.55,11.5],'n',.1),wall([5.55,11.5],[5.8,11.5],'n',.1),wall([5.8,13.9],[5.55,13.9],'n',.1),wall([5.55,13.9],[5.55,15.35],'n',.1),
  wall([.75,9.316],[.75,10],'n',.1),wall([3.25,10.5],[4.068,10.5],'n',.1),wall([4.8,10.5],[5.466,10.5],'n',.1)
 ],
 doors:[doorH('Front entrance',.5,16.5,.7,true),{...doorH('WC / stair opening',1,8.5,.5),kind:'arch'},{...doorV('WC door · proposed',.75,8.65,.666),o:[1,0]},{...doorH('Pantry opening',2,9.5,.5),kind:'arch'},doorV('Utility hall entry',1.7,10.7,.818),doorV('Hall door',1.7,15,.55)],
 windows:[folding('Rear folding doors · approximate',0,5.3,0),sash('Front lounge sash · approximate',3.75,16.5)],
 rooms:[
  ['rear','Kitchen / rear',[p([0,0]),p([5.3,0]),p([5.8,8.5]),p([5.8,10]),p([5.55,10]),p([5.55,10.5]),p([3,10.5]),p([3,9.5]),p([1.7,9.5]),p([1.5,9.5]),p([1.5,8.5]),p([0,8.5])],'tile800',[3,4.2]],
  ['wc','WC',rect(0,8.5,.75,10),'antislip',[.38,9.2]], ['stairs','Stairs',rect(0,10,.75,14.2),'wood',[.38,12.1]], ['passage','Hall / passage',[p([.75,8.5]),p([1.5,8.5]),p([1.5,9.5]),p([1.7,9.5]),p([1.7,14.2]),p([.75,14.2])],'tile600',[1.22,11.5]],
  ['pantry','Pantry',rect(1.7,9.5,3,10.5),'terrazzo',[2.35,10]], ['utility','Utility',[p([1.7,10.5]),p([5.55,10.5]),p([5.55,11.5]),p([5.8,11.5]),p([5.8,12.5]),p([1.7,12.5])],'terrazzo',[3.9,11.5]],
  ['boxedFireplace','Boxed rear fireplace',rect(5.55,10,5.8,11.5),'terrazzo',null],
  ['front','Front room',rect(1.7,12.5,5.8,16.5),'tile800',[3.75,14.3]], ['frontStairClear','Unassigned traced floor',rect(0,14.2,.75,16.5),'tile600',null], ['entry','Entrance hall',rect(.75,14.2,1.7,16.5),'tile600',[1.2,15.5]]
 ], stairs:{x:0,y0:10,y1:14.2,w:.75}, fireplaces:[{x:5.55,y:13.9,w:.25,h:1.45,label:'Front fireplace outline · open-ended'}],
 rooflights:[{cx:2775,cy:7350,w:2400,d:1200},{cx:2775,cy:4250,w:2400,d:1200},{cx:2775,cy:1150,w:2400,d:1200}]
};

fitDoors(plan1); fitDoors(plan2); checkDoorFit(plan1); checkDoorFit(plan2);
function signedArea(poly){
 return poly.reduce((sum,[x,y],i)=>{const [nx,ny]=poly[(i+1)%poly.length];return sum+x*ny-nx*y;},0)/2e6;
}
function inPoly(poly,x,y){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const [ax,ay]=poly[i], [bx,by]=poly[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
function verifyPlan2(){
 const room=id=>plan2.rooms.find(r=>r[0]===id);
 const utility=signedArea(room('utility')[2]);
 assert(Math.abs(utility-7.95)<.001&&!room('store'),'single merged utility area');
 assert(!room('rightTrace'),'obsolete traced floor removed');
 const chimney=room('boxedFireplace');
 assert(Math.abs(signedArea(chimney[2])-.375)<.001,'boxed chimney footprint');
 assert(!plan2.fireplaces.some(f=>f.label==='Rear fireplace'),'rear fireplace mesh removed');
 assert(plan2.walls.some(w=>w[0]===750&&w[1]===8500&&w[2]===750&&w[3]===8650),'WC wall before door retained');
 assert(plan2.walls.some(w=>w[0]===750&&w[1]===9316&&w[2]===750&&w[3]===10000),'WC wall after door retained');
 const wcDoor=plan2.doors.find(d=>d.name==='WC door · proposed');
 assert(wcDoor&&wcDoor.rect[0]===650&&wcDoor.rect[1]===8650&&wcDoor.rect[2]===850&&wcDoor.rect[3]===9316&&wcDoor.len===610,'proposed 610 mm WC door in 666 mm opening');
 assert(!plan2.walls.some(w=>w[0]===750&&w[2]===750&&Math.max(w[1],w[3])>10000&&Math.min(w[1],w[3])<14200),'stair-side opaque wall removed');
 assert.strictEqual(plan2.rooflights.length,3,'three kitchen rooflights');
 assert(plan2.rooflights.every(r=>r.w===2400&&r.d===1200&&r.cx===2775),'rooflight size/orientation/alignment');
 assert(plan2.rooflights.every((r,i,a)=>i===0||a[i-1].cy-r.cy===3100),'rooflight centre spacing');
 assert(plan2.rooflights.every(r=>[[-r.w/2,-r.d/2],[r.w/2,-r.d/2],[r.w/2,r.d/2],[-r.w/2,r.d/2]].every(([dx,dy])=>inPoly(room('rear')[2],r.cx+dx,r.cy+dy))),'rooflights inside kitchen');
 assert(plan2.rooflights[0].cy+600===7950&&plan2.rooflights[2].cy-600===550,'550 mm end clearances');
 const utilityDoor=plan2.doors.find(d=>d.name==='Utility hall entry');
 assert(utilityDoor&&utilityDoor.rect[0]===1600&&utilityDoor.rect[2]===1800&&utilityDoor.rect[1]===10700&&utilityDoor.rect[3]===11518&&utilityDoor.len===762&&utilityDoor.o[0]===1,'762 mm hall-to-utility leaf in an 818 mm opening, swinging east');
 assert(plan2.walls.some(w=>w[0]===1700&&w[2]===1700&&w[1]===8500&&w[3]===10700),'hall wall before new entry');
 assert(plan2.walls.some(w=>w[0]===1700&&w[2]===1700&&w[1]===11518&&w[3]===14866),'hall wall after new entry');
 assert(!plan2.walls.some(w=>w[0]===4681&&w[2]===4681),'former utility/store divider removed');
 const top=plan2.walls.filter(w=>w[1]===10500&&w[3]===10500&&w[0]>=1700&&w[2]<=5550).sort((a,b)=>a[0]-b[0]);
 assert(top.length===5&&top[0][0]===1700&&top.at(-1)[2]===5550&&top.every((w,i)=>i===0||top[i-1][2]===w[0]),'continuous kitchen-side service wall');
 assert.deepStrictEqual(plan2.doors.map(d=>d.name),['Front entrance','WC / stair opening','WC door · proposed','Pantry opening','Utility hall entry','Hall door'],'door ordering and identities');
 for(const [index,name,a,b] of [[1,'WC / stair opening',841,1659],[3,'Pantry opening',1879,2621]]){
  const d=plan2.doors[index];
  assert(d.name===name&&d.kind==='arch'&&d.rect[0]===a&&d.rect[2]===b,`${name}: stable opening and arch kind`);
  assert(d.openingH===2200&&d.archSpring===2200-d.opening/2,`${name}: arch crown and spring`);
 }
 // A 50 mm grid catches gaps and overlaps throughout the traced building footprint.
 const polys=plan2.rooms.map(r=>[r[0],r[2]]);
 for(let y=25;y<16500;y+=50)for(let x=25;x<5800;x+=50){
  if(y<8500&&x>=5300+500*y/8500-1)continue;
  const covering=polys.filter(([,poly])=>inPoly(poly,x,y));
  assert.strictEqual(covering.length,1,`floor coverage at ${x},${y}: ${covering.map(([id])=>id).join(',')}`);
 }
}
verifyPlan2();
function dataCode(d){
 const rooms = d.rooms.map(([id,name,poly,mat,at]) => ({id,name,poly,mat,at:at && at.map(mm)}));
 const boxed=d.id==='plan-2'?'\nconst BOXED_CHIMNEYS = [{x:5550,y:10000,w:250,d:1500}];':'';
 const rooflights=d.id==='plan-2'?`\nconst ROOFLIGHTS = ${JSON.stringify(d.rooflights)};`:'';
 return `const WALLS = ${JSON.stringify(d.walls)};\nconst WINS = ${JSON.stringify(d.windows)};\nconst DOORS = ${JSON.stringify(d.doors)};\nconst SLIDES = [];\nconst ROOMS = ${JSON.stringify(rooms)};\nconst PLAN_ID = ${JSON.stringify(d.id)};\nconst PLAN_TITLE = ${JSON.stringify(d.title)};\nconst PLAN_NOTE = ${JSON.stringify(d.note)};\nconst STAIRS = ${JSON.stringify({x:mm(d.stairs.x),y0:mm(d.stairs.y0),y1:mm(d.stairs.y1),w:mm(d.stairs.w)})};\nconst FIREPLACES = ${JSON.stringify(d.fireplaces.map(f=>({x:mm(f.x),y:mm(f.y),w:mm(f.w),h:mm(f.h),label:f.label})))};${boxed}${rooflights}`;
}
function addPlan2WallFinishes(s){
 const replaceOnce=(old, next, label)=>{assert(s.includes(old),`Plan 2 wall finishes: missing ${label}`);s=s.replace(old,next);};
 const css=`#wallFinishes{position:relative;z-index:12}#wallFinishes>summary{list-style:none;cursor:pointer;padding:5px 9px;white-space:nowrap}#wallFinishes>summary::-webkit-details-marker{display:none}#wallFinishes .finishMenu{position:absolute;top:calc(100% + 7px);left:0;width:220px;padding:12px;display:grid;gap:9px;background:var(--panel);border:1px solid var(--line);border-radius:10px;box-shadow:0 8px 24px rgba(40,30,20,.18)}#wallFinishes label{display:grid;gap:3px;font-size:12px;color:var(--muted)}#wallFinishes select{width:100%;padding:6px;border:1px solid var(--line);border-radius:6px;background:#fff;color:var(--ink)}@media(max-width:1100px){#wallFinishes .finishMenu{left:auto;right:0}}`;
 replaceOnce('#planMeta{position:fixed;',css+'\n#planMeta{position:fixed;','finish CSS');
 const controls=`<details id="wallFinishes" class="grp only3d"><summary aria-label="Wall finishes">Wall finishes ▾</summary><div class="finishMenu"><label for="wallColour">Wall colour<select id="wallColour"><option value="ivory">Warm ivory</option><option value="greige">Warm greige</option><option value="sage">Sage</option><option value="sand">Sand</option><option value="grey">Light grey</option></select></label><label for="wallTexture">Wall surface<select id="wallTexture"><option value="plaster">Textured plaster</option><option value="smooth">Smooth paint</option></select></label><button class="btn" type="button" id="referenceStyle" title="Apply the supplied hall and front-room references; existing furniture is kept">Apply reference style</button><button class="btn" type="button" id="kitchenLayout" title="Apply the supplied kitchen, dining, lounge and WC layout; existing furniture is kept">Apply kitchen layout</button><button class="btn" type="button" id="kitchenSeating">Adjust island &amp; seating</button><button class="btn" type="button" id="pantryUtility" title="Add the pantry and utility fit-out; existing furniture is kept">Apply pantry &amp; utility</button></div></details>`;
 replaceOnce('<div class="grp only3d" id="toggles3d">',controls+'<div class="grp only3d" id="toggles3d">','finish controls');
 replaceOnce('return {furniture:defaultFurniture(), rooms, demolished:[], measures:[]};','return {furniture:defaultFurniture(), rooms, demolished:[], measures:[], wallFinish:{colour:\'ivory\',texture:\'plaster\'}};','state defaults');
 replaceOnce("wallFinish:{colour:'ivory',texture:'plaster'}};", "wallFinish:{colour:'ivory',texture:'plaster'}, referenceStyle:false, kitchenStyle:false, pantryUtilityStyle:false};",'reference style default');
 const presetCode=`const REFERENCE_FURNITURE=[
 {id:'ref-hall-runner',type:'rug',name:'Woven hall runner',cx:1200,cy:11500,w:2500,d:500,rot:90,color:'#baa482'},
 {id:'ref-hall-console',type:'console',name:'Narrow dark wood console',cx:245,cy:15100,w:800,d:250,rot:90,color:'#574334'},
 {id:'ref-lounge-rug',type:'rug',name:'Woven beige lounge rug',cx:3750,cy:14450,w:2800,d:2900,rot:0,color:'#c7b99f'},
 {id:'ref-lounge-sofa',type:'sofa',name:'Cream linen sofa',cx:2350,cy:13750,w:2100,d:850,rot:270,color:'#e5ded2'},
 {id:'ref-lounge-chair-a',type:'armchair',name:'Cream linen armchair',cx:4850,cy:13350,w:750,d:750,rot:0,color:'#e4ded3'},
 {id:'ref-lounge-chair-b',type:'armchair',name:'Cream linen armchair',cx:3000,cy:15750,w:750,d:750,rot:180,color:'#e4ded3'},
 {id:'ref-lounge-table',type:'coffeetable',name:'Dark wood coffee table',cx:3850,cy:14400,w:1100,d:700,rot:0,color:'#554334'},
 {id:'ref-lounge-sideboard',type:'cabinet',name:'Dark wood sideboard',cx:4300,cy:12750,w:1250,d:350,rot:0,color:'#564333'},
 {id:'ref-lounge-plant',type:'plant',name:'Leafy plant',cx:5350,cy:12950,w:380,d:380,rot:0,color:'#789668'}
];
function referenceBounds(f){const a=f.rot*Math.PI/180,c=Math.abs(Math.cos(a)),s=Math.abs(Math.sin(a));return [f.cx-(f.w*c+f.d*s)/2,f.cy-(f.w*s+f.d*c)/2,f.cx+(f.w*c+f.d*s)/2,f.cy+(f.w*s+f.d*c)/2];}
function referenceCollides(a,b){if(a.type==='rug'||b.type==='rug')return false;const A=referenceBounds(a),B=referenceBounds(b);return A[0]<B[2]-50&&A[2]>B[0]+50&&A[1]<B[3]-50&&A[3]>B[1]+50;}
function applyReferenceStyle(){
  mutate(()=>{
    state.referenceStyle=true;state.wallFinish={colour:'greige',texture:'plaster'};
    ['front','entry','passage','frontStairClear'].forEach(id=>{state.rooms[id].mat='walnutDark';});
    for(const item of REFERENCE_FURNITURE){
      if(state.furniture.some(f=>f.id===item.id))continue;
      if(state.furniture.some(f=>!f.id?.startsWith('ref-')&&referenceCollides(item,f)))continue;
      state.furniture.push({...item});
    }
  });
  $('#wallFinishes').open=false;
}
const KITCHEN_FURNITURE=[
 {id:'kitchen-left-run',type:'kitchenrun',name:'Cream Shaker kitchen run with sink',cx:350,cy:6250,w:4500,d:500,rot:270,color:'#e8e0d2'},
 {id:'kitchen-island',type:'flutedisland',name:'Dark olive fluted marble island with hob',cx:2170,cy:6475,w:2250,d:1100,rot:90,color:'#28362f'},
 {id:'kitchen-stool-a',type:'barstool',name:'Tan leather island stool',cx:2840,cy:5950,w:420,d:420,rot:90,color:'#a86f45'},
 {id:'kitchen-stool-b',type:'barstool',name:'Tan leather island stool',cx:2840,cy:7000,w:420,d:420,rot:90,color:'#a86f45'},
 {id:'kitchen-banquette',type:'banquette',name:'Cream striped dining banquette',cx:5300,cy:6375,w:2750,d:520,rot:90,color:'#e7e0d4'},
 {id:'kitchen-dining-table',type:'table',name:'Timber dining table',cx:4700,cy:6375,w:2150,d:800,rot:90,color:'#96724f'},
 {id:'kitchen-dining-chair-a',type:'canechair',name:'Cane dining chair',cx:4350,cy:5650,w:460,d:480,rot:270,color:'#987553'},
 {id:'kitchen-dining-chair-b',type:'canechair',name:'Cane dining chair',cx:4350,cy:6375,w:460,d:480,rot:270,color:'#987553'},
 {id:'kitchen-dining-chair-c',type:'canechair',name:'Cane dining chair',cx:4350,cy:7100,w:460,d:480,rot:270,color:'#987553'},
 {id:'kitchen-lounge-sofa',type:'sofa',name:'Cream neutral three-seat sofa',cx:4600,cy:2250,w:3000,d:1200,rot:90,color:'#e4ded3'},
 {id:'kitchen-lounge-tv',type:'tv',name:'Wall-mounted television',cx:150,cy:1875,w:2250,d:100,rot:270,color:'#202225'},
 {id:'kitchen-lounge-coffee',type:'coffeetable',name:'Large timber coffee table',cx:3000,cy:2250,w:1000,d:1500,rot:0,color:'#72543c'},
 {id:'kitchen-lounge-side',type:'sidetable',name:'Small round side table',cx:500,cy:500,w:400,d:400,rot:0,color:'#806044'},
 {id:'kitchen-wc-toilet',type:'toilet',name:'Compact ivory WC',cx:375,cy:9650,w:360,d:600,rot:180,color:'#f2efe8'},
 {id:'kitchen-wc-basin',type:'brassbasin',name:'Compact wall basin',cx:175,cy:8750,w:300,d:200,rot:270,color:'#e8e0d2'}
];
const PANTRY_UTILITY_FURNITURE=[
 {id:'pantry-back-run',type:'pantryrun',name:'Cream Shaker pantry with marble worktop and shelves',cx:2350,cy:10210,w:1100,d:450,rot:180,color:'#e8e0d2'},
 {id:'utility-laundry-stack',type:'laundrystack',name:'Stacked washing machine and dryer',cx:2050,cy:12130,w:600,d:600,rot:180,color:'#eeeae3'},
 {id:'utility-sink-base',type:'utilitysink',name:'Cream utility sink cabinet',cx:2750,cy:12130,w:700,d:600,rot:180,color:'#e8e0d2'},
 {id:'utility-tall-storage',type:'utilitycabinet',name:'Tall utility storage cabinet',cx:3450,cy:12130,w:600,d:600,rot:180,color:'#e8e0d2'},
 {id:'utility-cylinder-cupboard',type:'cylindercupboard',name:'Open hot-water cylinder cupboard',cx:5445,cy:11955,w:800,d:600,rot:90,color:'#e8e0d2'}
];
function applyPantryUtility(){
  mutate(()=>{
    state.pantryUtilityStyle=true;state.wallFinish={colour:'greige',texture:'plaster'};
    ['pantry','utility'].forEach(id=>{state.rooms[id].mat='limestone';});
    for(const item of PANTRY_UTILITY_FURNITURE){
      if(state.furniture.some(f=>f.id===item.id))continue;
      if(state.furniture.some(f=>!f.id?.startsWith('pantry-')&&!f.id?.startsWith('utility-')&&referenceCollides(item,f)))continue;
      state.furniture.push({...item});
    }
  });
  $('#wallFinishes').open=false;
}
function adjustKitchenSeating(){
  mutate(()=>{
    for(const f of state.furniture){
      if(f.id==='kitchen-island')f.cx=2170;
      if(f.id==='kitchen-stool-a'||f.id==='kitchen-stool-b'){f.cx=2840;f.rot=90;}
      if(['kitchen-dining-chair-a','kitchen-dining-chair-b','kitchen-dining-chair-c'].includes(f.id)){f.cx=4350;f.rot=270;}
    }
  });
  $('#wallFinishes').open=false;
}
function applyKitchenLayout(){
  mutate(()=>{
    state.kitchenStyle=true;state.wallFinish={colour:'greige',texture:'plaster'};
    ['rear','wc'].forEach(id=>{state.rooms[id].mat='limestone';});
    for(const item of KITCHEN_FURNITURE){
      if(state.furniture.some(f=>f.id===item.id))continue;
      if(state.furniture.some(f=>!f.id?.startsWith('kitchen-')&&referenceCollides(item,f)))continue;
      state.furniture.push({...item});
    }
  });
  $('#wallFinishes').open=false;
}
`;
 replaceOnce('function defaultFurniture(){ return []; }',presetCode+'function defaultFurniture(){ return []; }','reference preset data');
 replaceOnce("$('#exportPng').onclick = exportPNG;","$('#referenceStyle').onclick = applyReferenceStyle;\n$('#kitchenLayout').onclick = applyKitchenLayout;\n$('#kitchenSeating').onclick = adjustKitchenSeating;\n$('#pantryUtility').onclick = applyPantryUtility;\n$('#exportPng').onclick = exportPNG;",'reference preset binding');
 replaceOnce("    case 'coffeetable': return rc(x,y,w,d,c,'rx=\"80\"')", "    case 'console': return rc(x,y,w,d,c,'rx=\"15\"') + rc(x+35,y+35,w-70,d-70,shade(c,1.12),'rx=\"12\"');\n    case 'coffeetable': return rc(x,y,w,d,c,'rx=\"80\"')",'console 2D footprint');
 replaceOnce("    case 'coffeetable': return rc(x,y,w,d,c,'rx=\"80\"')", `    case 'kitchenrun': { let s=rc(x,y,w,d,c,'rx="18"')+rc(x,y+d-70,w,70,'#eee7dc'); for(let px=x+600;px<x+w-40;px+=600)s+=ln(px,y,px,y+d-70,'opacity=".55"'); s+=rc(x+w*.4-210,y+d*.18,420,d*.52,'#f8f5ef','rx="35"')+ec(x+w*.4, y+d*.12,26,26,'#a8874e'); return s+rc(x+w-1000,y,1000,d,shade(c,.94),'opacity=".8"'); }
    case 'flutedisland': { let s=rc(x,y,w,d,c,'rx="120"')+rc(x+30,y+30,w-60,d-60,'#eee7dc','rx="95"'); for(let px=x+45;px<x+w-45;px+=55)s+=ln(px,y+45,px,y+d-45,'opacity=".25"'); const hx=x+w*.55,hy=0; [-1,1].forEach(a=>[-1,1].forEach(b=>s+=ec(hx+a*115,hy+b*115,72,72,'#1d211f'))); return s+rc(hx-28,hy-175,56,350,'#303532','rx="12"'); }
    case 'banquette': { let s=rc(x,y,w,d,shade(c,.82),'rx="70"')+rc(x+45,y+80,w-90,d-120,c,'rx="55"'); for(let px=x+100;px<x+w-60;px+=115)s+=ln(px,y+40,px,y+d-35,'opacity=".22"'); return s+rc(x+w*.18,y+d*.32,w*.2,d*.34,'#b77b50','rx="50"')+rc(x+w*.63,y+d*.32,w*.2,d*.34,'#b77b50','rx="50"'); }
    case 'canechair': { let s=rc(x+25,y+d*.16,w-50,d*.84-10,'#b99670','rx="55"')+rc(x,y,w,d*.2,c,'rx="38"'); for(let px=x+80;px<x+w-60;px+=65)s+=ln(px,y+25,px+80,y+d*.18,'opacity=".45"'); return s; }
    case 'brassbasin': return rc(x,y,w,d,c,'rx="25"')+ec(0,y+d*.57,w*.31,d*.27,'#fff')+ec(0,y+d*.16,25,25,'#a8874e');
    case 'coffeetable': return rc(x,y,w,d,c,'rx="80"')`,'kitchen 2D footprints');
 replaceOnce("    case 'coffeetable': return rc(x,y,w,d,c,'rx=\"80\"')", `    case 'pantryrun': { let s=rc(x,y,w,d,c,'rx="12"')+rc(x,y+d-58,w,58,'#eee7dc');for(let px=x+360;px<x+w-20;px+=360)s+=ln(px,y,px,y+d-58,'opacity=".5"');return s+ln(x+70,y+110,x+w-70,y+110,'stroke="#a8874e" stroke-width="14"'); }
    case 'laundrystack': return rc(x,y,w,d,c,'rx="25"')+ec(0,0,w*.31,d*.31,'#cfdde4')+ec(0,0,w*.22,d*.22,'#7f939a')+ln(x+80,y+70,x+w-80,y+70);
    case 'utilitysink': return rc(x,y,w,d,c,'rx="15"')+rc(x+w*.12,y+d*.18,w*.55,d*.6,'#d2d5d3','rx="45"')+ec(x+w*.82,0,24,24,'#a8874e');
    case 'utilitycabinet': return rc(x,y,w,d,c,'rx="12"')+ln(0,y,0,y+d)+ec(-w*.08,0,18,18,'#a8874e')+ec(w*.08,0,18,18,'#a8874e');
    case 'cylindercupboard': return rc(x,y,w,d,'none','stroke-dasharray="7 5"')+ec(0,0,w*.3,d*.3,'#dadbd7')+ln(x+w*.18,y+d*.15,x+w*.18,y+d*.85,'stroke="#a8874e"');
    case 'coffeetable': return rc(x,y,w,d,c,'rx="80"')`,'pantry and utility 2D footprints');
 replaceOnce("    case 'coffeetable': {\n      const tm",`    case 'console': {
      const timber=woodM(c);legs(g,w,d,.72,timber,.065,.025);
      g.add(rbox(w,.045,d,timber,0,.72,0,.012),box(w-.08,.11,d-.09,woodM(darker(c,.85)),0,.58));
      vase(g,w*.25,.765,0,.065,.22,'#d6c7b2',R,false);
      break;
    }
    case 'coffeetable': {
      const tm`,'console 3D model');
 replaceOnce("    case 'coffeetable': {\n      const tm",`    case 'kitchenrun': {
      const cream=mat(c,{roughness:.62}),stone=veinedMarble(),brass=mat('#a8874e',{metalness:.72,roughness:.3}),marble=stone;
      const workW=w-1.0,front=d/2-.025;
      g.add(box(workW,.08,d-.04,cream,-.5,0,-.01)); fronts(g,-w/2,.08,workW,.72,front,Math.max(1,Math.round(workW/.6)),1,cream,'bar',.5);
      g.add(rbox(workW+.02,.035,d,stone,-.5,.8,0,.008),box(workW,.62,.025,marble,-.5,.84,bz+.018));
      const sx=-.45,bw=.42,bd=.31;g.add(shell(bw,bd,.02,.014,.05,mat('#d0d3d1',{metalness:.65,roughness:.28}),sx,.835,.02));
      g.add(cyl(.018,.02,.04,brass,sx+.17,.855,bz+.07,18),tube([[sx+.17,.895,bz+.07],[sx+.17,1.13,bz+.07],[sx+.14,1.2,bz+.13],[sx+.1,1.16,bz+.19]],.011,brass));
      [-.15,.21].forEach(z=>g.add(box(workW-.16,.035,.18,stone,-.5,1.52,bz+z)));
      [-1.55,-.7,.05,.8].forEach(px=>{vase(g,px,1.555,bz+.21,.045,.14,['#8e765d','#6f745d','#b79d78','#786551'][Math.abs(Math.round(px*10))%4],R,false);});
      const tx=w/2-.5;g.add(box(1.0,2.15,d-.02,cream,tx,0,-.01));fronts(g,tx-.5,.08,1.0,2.02,front,2,1,cream,'bar',1.15);
      break;
    }
    case 'flutedisland': {
      const olive=mat(c,{roughness:.58}),stone=veinedMarble(),dark=mat('#171a19',{roughness:.12,metalness:.25});
      g.add(rbox(w-.05,.82,d-.32,olive,0,.02,.10,.12),rbox(w+.04,.055,d+.04,stone,0,.84,0,.055));
      for(let px=-w/2+.08;px<w/2-.06;px+=.055)g.add(box(.018,.7,.042,mat('#607166',{roughness:.62}),px,.09,-d/2+.25));
      const hx=w*.05;[-1,1].forEach(a=>[-1,1].forEach(b=>g.add(cyl(.085,.085,.012,dark,hx+a*.13,.9,b*.13,28))));
      g.add(box(.055,.014,.38,dark,hx,.9,0));
      break;
    }
    case 'banquette': {
      const base=woodM('#4d4035'),fab=fabric(c),tan=fabric('#b77b50');legs(g,w,d,.18,base,.07,.025);
      g.add(rbox(w,.17,d-.04,fab,0,.18,.02,.055),rbox(w,.72,.14,fab,0,.18,bz+.07,.065));
      for(let px=-w/2+.09;px<w/2-.04;px+=.115)g.add(box(.009,.58,.01,mat('#bcb2a3',{roughness:1}),px,.31,bz+.145));
      [-w*.23,w*.22].forEach(px=>g.add(rot(rbox(.48,.32,.11,tan,px,.43,bz+.19,.06),-.15)));
      const brass=mat('#a8874e',{metalness:.72,roughness:.3}),frame=mat('#332f2a',{roughness:.5}),paper=mat('#efece4',{roughness:1});
      [-.72,0,.72].forEach((px,i)=>{g.add(box(.55,.68,.025,frame,px,1.08,bz+.014),box(.46,.59,.012,paper,px,1.125,bz+.03));g.add(rod([px-.18,2.0,bz+.04],[px+.18,2.0,bz+.04],.008,brass),rod([px,1.98,bz+.04],[px,1.88,bz+.08],.008,brass));});
      break;
    }
    case 'canechair': {
      const timber=woodM(c),cane=mat('#c6a982',{roughness:.8}),sy=.44;
      [-1,1].forEach(a=>[-1,1].forEach(b=>g.add(rod([a*(w/2-.035),0,b*(d/2-.04)],[a*(w/2-.045),b<0?.88:sy,b*(d/2-.055)],.012,timber,.016))));
      g.add(rbox(w-.05,.045,d-.08,timber,0,sy-.025,0,.014),rbox(w-.09,.035,d-.12,cane,0,sy+.02,0,.012));
      g.add(box(w-.07,.04,.025,timber,0,.55,bz+.04),box(w-.07,.04,.025,timber,0,.85,bz+.04));
      for(let px=-w/2+.08;px<w/2-.05;px+=.055)g.add(rod([px,.57,bz+.052],[px,.84,bz+.052],.004,cane,.004,6));
      for(let py=.59;py<.84;py+=.05)g.add(rod([-w/2+.06,py,bz+.052],[w/2-.06,py,bz+.052],.004,cane,.004,6));
      break;
    }
    case 'brassbasin': {
      const cream=mat(c,{roughness:.55}),stone=mat('#f5f1e8',{roughness:.18}),brass=mat('#a8874e',{metalness:.72,roughness:.3});
      g.add(rbox(w,.34,d-.02,cream,0,.42,-.01,.012),rbox(w,.03,d,stone,0,.76,0,.008));
      g.add(shell(w*.62,d*.54,.018,.012,.035,ceramic(),0,.785,.02),cyl(.012,.014,.03,brass,0,.79,bz+.04,16),tube([[0,.82,bz+.04],[0,1.0,bz+.04],[-.03,1.05,bz+.09],[-.05,1.01,bz+.13]],.009,brass));
      g.add(rbox(w*.82,.48,.018,brass,0,1.08,bz+.01,.008),box(w*.75,.42,.006,mirror(),0,1.11,bz+.021));
      break;
    }
    case 'coffeetable': {
      const tm`,'kitchen 3D models');
 replaceOnce("    case 'coffeetable': {\n      const tm",`    case 'pantryrun': {
      const cream=mat(c,{roughness:.62}),stone=veinedMarble(),brass=mat('#a8874e',{metalness:.72,roughness:.3}),front=d/2-.02;
      g.add(box(w,.78,d-.03,cream,0,0,-.01),rbox(w+.025,.035,d,stone,0,.8,0,.008));fronts(g,-w/2,.06,w,.7,front,3,1,cream,'bar',.43);
      g.add(box(w,.36,.022,stone,0,.85,bz+.012));
      [.23,.48].forEach(y=>{g.add(box(w-.08,.025,.23,stone,0,.92+y,bz+.105));g.add(box(.018,y+.12,.22,brass,-w/2+.08,.9,bz+.1),box(.018,y+.12,.22,brass,w/2-.08,.9,bz+.1));});
      [-.35,0,.34].forEach((px,i)=>vase(g,px,1.47,bz+.12,.04,.13,['#8e765d','#6f745d','#b79d78'][i],R,false));
      break;
    }
    case 'laundrystack': {
      const body=mat(c,{roughness:.38}),rim=mat('#999d9c',{metalness:.45,roughness:.3}),glass=mat('#52656b',{metalness:.2,roughness:.12}),front=d/2+.006;
      g.add(rbox(w-.03,1.78,d-.04,body,0,0,0,.025));
      [.46,1.31].forEach((y,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(.2,.025,10,32),rim);ring.position.set(0,y,front);g.add(ring);const pane=new THREE.Mesh(new THREE.CircleGeometry(.175,32),glass);pane.position.set(0,y,front+.012);g.add(pane);g.add(box(w-.13,.065,.018,mat('#d7d4ce',{roughness:.45}),0,y+.34,front));});
      break;
    }
    case 'utilitysink': {
      const cream=mat(c,{roughness:.62}),stone=veinedMarble(),steel=mat('#c2c7c6',{metalness:.7,roughness:.24}),brass=mat('#a8874e',{metalness:.72,roughness:.3}),front=d/2-.02;
      g.add(box(w,.78,d-.03,cream,0,0,-.01),rbox(w+.025,.035,d,stone,0,.8,0,.008));fronts(g,-w/2,.06,w,.7,front,2,1,cream,'bar',.43);
      g.add(shell(w*.58,d*.58,.02,.014,.055,steel,-.05,.835,.015),tube([[w*.28,.86,bz+.05],[w*.28,1.13,bz+.05],[w*.22,1.2,bz+.13],[w*.13,1.13,bz+.19]],.012,brass));
      break;
    }
    case 'utilitycabinet': {
      const cream=mat(c,{roughness:.62}),brass=mat('#a8874e',{metalness:.72,roughness:.3}),front=d/2-.018;
      g.add(box(w,2.18,d-.03,cream,0,0,-.01));fronts(g,-w/2,.05,w,2.08,front,2,2,cream,'bar',1.08);g.add(box(.012,.24,.018,brass,-.045,1.03,front+.014),box(.012,.24,.018,brass,.045,1.03,front+.014));
      break;
    }
    case 'cylindercupboard': {
      const cream=mat(c,{roughness:.64}),brass=mat('#a8874e',{metalness:.68,roughness:.33}),tank=mat('#d8dad6',{metalness:.18,roughness:.42}),back=-d/2+.025;
      g.add(box(.05,2.2,d,cream,-w/2+.025,0,0),box(.05,2.2,d,cream,w/2-.025,0,0),box(w,.05,d,cream,0,2.15,0),box(w,2.2,.035,cream,0,0,back));
      g.add(cyl(.27,.27,1.42,tank,0,.1,.02,40),cyl(.27,.23,.12,tank,0,1.52,.02,40));
      g.add(tube([[-.16,.12,.18],[-.16,1.72,.18],[-.3,1.86,.18]],.014,brass),tube([[.17,.18,.17],[.17,1.65,.17],[.3,1.82,.17]],.012,brass));
      break;
    }
    case 'coffeetable': {
      const tm`,'pantry and utility 3D models');
 replaceOnce("const woodM = c => mat(c, {roughness:.55});", `const woodM = c => mat(c, {roughness:.55});
let kitchenMarbleMat;
function veinedMarble(){
  if(kitchenMarbleMat)return kitchenMarbleMat;
  const cv=document.createElement('canvas');cv.width=cv.height=512;const g=cv.getContext('2d'),R=rng(24017);
  g.fillStyle='#eee7dc';g.fillRect(0,0,512,512);
  for(let i=0;i<2400;i++){const v=225+Math.round(R()*22);g.fillStyle='rgba('+v+','+(v-4)+','+(v-10)+','+(.025+R()*.035)+')';g.fillRect(R()*512,R()*512,1+R()*2,1+R()*2);}
  for(let k=0;k<9;k++){const x=-80+R()*620,y=R()*512;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+80+R()*90,y-120+R()*240,x+180+R()*100,y-120+R()*240,x+300+R()*120,y-80+R()*160);g.strokeStyle=k%3?'rgba(117,105,94,.42)':'rgba(83,78,73,.55)';g.lineWidth=k%3?1.8:3.2;g.stroke();g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=.9;g.stroke();}
  const t=new THREE.CanvasTexture(cv);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.6,1);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
  return kitchenMarbleMat=new THREE.MeshStandardMaterial({map:t,color:'#f1ece3',roughness:.2});
}`,'veined marble material');
 replaceOnce("  walnut:  {name:'胡桃木地板', price:380, sw:'#9b7250'},", "  walnut:  {name:'胡桃木地板', price:380, sw:'#9b7250'},\n  walnutDark: {name:'Dark walnut', price:380, sw:'#604b3b'},\n  limestone: {name:'Cream limestone · 600 × 900 staggered', price:220, sw:'#ddd3c1'},",'dark walnut palette');
 const darkPlank='<pattern id="m-walnutDark" patternUnits="userSpaceOnUse" width="360" height="1800"><rect width="360" height="1800" fill="#604b3b"/><path d="M0 0V1800M180 0V1800M0 600H180M180 1200H360" stroke="#3e3027" stroke-width="7"/><path d="M55 40Q45 450 60 850T56 1720M123 80Q135 550 119 1060T125 1760M235 60Q245 500 232 1000T238 1740M310 30Q295 500 308 950T305 1740" fill="none" stroke="#8b7059" stroke-width="5" opacity=".38"/></pattern>';
 const limestone='<pattern id="m-limestone" patternUnits="userSpaceOnUse" width="1800" height="1200"><rect width="1800" height="1200" fill="#ddd3c1"/><path d="M0 0H1800M0 600H1800M0 1200H1800M0 0V600M900 0V600M450 600V1200M1350 600V1200" stroke="#c4b7a3" stroke-width="9"/><path d="M120 130Q450 70 780 180M1040 410Q1340 330 1690 460M260 860Q570 760 850 900M1100 1040Q1450 930 1700 1060" fill="none" stroke="#eee8dc" stroke-width="13" opacity=".45"/></pattern>';
 replaceOnce("plank('wood','#dcc09a','#bf9d70') + plank('walnut','#a57c56','#80593a') +", "plank('wood','#dcc09a','#bf9d70') + plank('walnut','#a57c56','#80593a') + `"+darkPlank+limestone+"` +",'dark walnut and limestone 2D patterns');
 replaceOnce("walnut:{sx:1.8, sy:.36, base:'#9a6f4b', rough:.5},", "walnut:{sx:1.8, sy:.36, base:'#9a6f4b', rough:.5}, walnutDark:{sx:.36, sy:1.8, base:'#604b3b', rough:.48}, limestone:{sx:1.8,sy:1.2,base:'#ddd3c1',grout:'#c4b7a3',rough:.56},",'dark walnut and limestone 3D materials');
 replaceOnce("const wood = kind === 'wood' || kind === 'walnut';", "const wood = kind === 'wood' || kind === 'walnut' || kind === 'walnutDark';",'dark walnut texture tiling');
 replaceOnce('  cv.width = wood ? 1024 : 512; cv.height = wood ? 205 : 512;', '  cv.width = kind === \'walnutDark\' ? 205 : wood ? 1024 : 512; cv.height = kind === \'walnutDark\' ? 1024 : wood ? 205 : 512;','dark walnut grain axis');
 replaceOnce('  if (wood){\n    const rowH', `  if(kind === 'walnutDark'){
    // Two 180 mm boards per tile, with staggered end joints and long grain along the house.
    const boardW=W/2;
    for(let c=0;c<2;c++){
      const x=c*boardW,join=c===0?Hh/3:Hh*2/3;
      g.fillStyle=rgbK(s.base,c===0?.97:1.05);g.fillRect(x,0,boardW,Hh);
      g.fillStyle=rgbK(s.base,.6);g.fillRect(x,0,2,Hh);g.fillRect(x,join,boardW,2);
      for(let k=0;k<18;k++){
        const gx=x+5+R()*(boardW-10);g.strokeStyle=rgbK(s.base,.72+R()*.55);g.globalAlpha=.12+R()*.2;g.lineWidth=.6+R()*1.4;
        g.beginPath();g.moveTo(gx,0);for(let gy=0;gy<=Hh;gy+=32)g.lineTo(gx+Math.sin(gy*.014+k)*2,gy);g.stroke();
      }
    }
    g.globalAlpha=1;
  } else if (wood){
    const rowH`, 'longitudinal dark walnut grain');
 replaceOnce("  } else if (kind === 'terrazzo'){\n    const cs = ['#b9a58c','#8fa3a0','#c9b7a2','#a88f76','#7e8a86'];\n    for (let k = 0; k < 160; k++){ g.fillStyle = cs[k%5]; g.beginPath(); g.arc(R()*W, R()*Hh, 2 + R()*7, 0, 7); g.fill(); }\n  } else {", `  } else if (kind === 'terrazzo'){
    const cs = ['#b9a58c','#8fa3a0','#c9b7a2','#a88f76','#7e8a86'];
    for (let k = 0; k < 160; k++){ g.fillStyle = cs[k%5]; g.beginPath(); g.arc(R()*W, R()*Hh, 2 + R()*7, 0, 7); g.fill(); }
  } else if(kind === 'limestone'){
    g.strokeStyle=s.grout;g.lineWidth=3;g.beginPath();g.moveTo(0,Hh/2);g.lineTo(W,Hh/2);g.moveTo(W/2,0);g.lineTo(W/2,Hh/2);g.moveTo(W/4,Hh/2);g.lineTo(W/4,Hh);g.moveTo(W*.75,Hh/2);g.lineTo(W*.75,Hh);g.stroke();
    g.strokeStyle='rgba(255,255,255,.25)';g.lineWidth=2;for(let k=0;k<8;k++){g.beginPath();g.moveTo(R()*W,R()*Hh);g.bezierCurveTo(R()*W,R()*Hh,R()*W,R()*Hh,R()*W,R()*Hh);g.stroke();}
  } else {`,'staggered limestone texture');
 replaceOnce('  s.demolished = s.demolished || []; s.measures = s.measures || [];',`  s.demolished = s.demolished || []; s.measures = s.measures || [];
  const finish=s.wallFinish||{}; s.wallFinish={colour:['ivory','greige','sage','sand','grey'].includes(finish.colour)?finish.colour:'ivory',texture:['plaster','smooth'].includes(finish.texture)?finish.texture:'plaster'}; s.referenceStyle=s.referenceStyle===true; s.kitchenStyle=s.kitchenStyle===true; s.pantryUtilityStyle=s.pantryUtilityStyle===true;`,'state migration');
 replaceOnce('function renderAll(){\n  renderGrid();',`function syncWallFinishControls(){ $('#wallColour').value=state.wallFinish.colour; $('#wallTexture').value=state.wallFinish.texture; }
function renderAll(){
  syncWallFinishControls(); renderGrid();`,'control state sync');
 replaceOnce("$('#exportPng').onclick = exportPNG;",`$('#wallFinishes').addEventListener('change',e=>{const key=e.target.id==='wallColour'?'colour':e.target.id==='wallTexture'?'texture':null;if(key&&state.wallFinish[key]!==e.target.value)mutate(()=>{state.wallFinish[key]=e.target.value;});});
$('#exportPng').onclick = exportPNG;`,'control change');
 replaceOnce("  wallMat = mat('#f4f1eb', {roughness:.92});",`  wallMat = mat('#f4f1eb', {roughness:.92}); makePlasterTexture();`,'wall material');
 const materialCode=`const WALL_COLOURS={ivory:'#f4f1eb',greige:'#d5cbbd',sage:'#b8c7b4',sand:'#d9c9ad',grey:'#d6d9d7'};
let plasterTexture,plasterBumpTexture;
// A deterministic half-metre texture tile, reused on every wall. UVs below use metres.
function makePlasterTexture(){
  const size=256,cv=document.createElement('canvas');cv.width=cv.height=size;
  const ctx=cv.getContext('2d'),data=ctx.createImageData(size,size),seed=rng(94651);
  const grids=[8,32,256].map(n=>Array.from({length:n*n},()=>seed()));
  const sample=(grid,n,x,y)=>{const fx=x*n/size,fy=y*n/size,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy;
    const v=(a,b)=>grid[((b+n)%n)*n+(a+n)%n];const a=v(ix,iy)*(1-tx)+v(ix+1,iy)*tx,b=v(ix,iy+1)*(1-tx)+v(ix+1,iy+1)*tx;return a*(1-ty)+b*ty;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const n=(sample(grids[0],8,x,y)-.5)*13+(sample(grids[1],32,x,y)-.5)*10+(sample(grids[2],256,x,y)-.5)*7,v=Math.max(0,Math.min(255,Math.round(245+n))),i=(y*size+x)*4;data.data[i]=data.data[i+1]=data.data[i+2]=v;data.data[i+3]=255;}
  ctx.putImageData(data,0,0);plasterTexture=new THREE.CanvasTexture(cv);plasterTexture.wrapS=plasterTexture.wrapT=THREE.RepeatWrapping;plasterTexture.colorSpace=THREE.SRGBColorSpace;plasterTexture.anisotropy=4;
  plasterBumpTexture=plasterTexture.clone();plasterBumpTexture.colorSpace=THREE.NoColorSpace;plasterBumpTexture.needsUpdate=true;
}
function applyWallFinish(){const finish=state.wallFinish;wallMat.color.set(WALL_COLOURS[finish.colour]||WALL_COLOURS.ivory);const plaster=finish.texture==='plaster';wallMat.map=plaster?plasterTexture:null;wallMat.bumpMap=plaster?plasterBumpTexture:null;wallMat.bumpScale=plaster?.0015:0;wallMat.roughness=plaster?.96:.82;wallMat.needsUpdate=true;}
function metricWallUV(geo,length,height,depth){const uv=geo.attributes.uv,scale=1/.5;for(let face=0;face<6;face++){const width=face<2?depth:length,high=face<2?height:face<4?depth:height;for(let i=face*4;i<face*4+4;i++)uv.setXY(i,uv.getX(i)*width*scale,uv.getY(i)*high*scale);}uv.needsUpdate=true;return geo;}
`;
 replaceOnce('function wallBox([x0,y0,x1,y1,k,t=200]',materialCode+'function wallBox([x0,y0,x1,y1,k,t=200]','wall material helpers');
 const archCode=`function buildArchOpening(d,top){
  const horizontal=d.c[0]!==0,[x0,y0,x1,y1]=d.rect,cx=(x0+x1)/2,cy=(y0+y1)/2;
  const radius=M(d.opening)/2,spring=M(d.archSpring),crown=M(d.openingH),depth=.1,visibleTop=Math.min(top,H);
  if(visibleTop<=spring)return;
  const addFill=pts=>{const shape=new THREE.Shape();shape.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(([x,y])=>shape.lineTo(x,y));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:24});geo.translate(0,0,-depth/2);const mesh=new THREE.Mesh(geo,wallMat);mesh.position.set(wx(cx),0,wz(cy));if(!horizontal)mesh.rotation.y=-Math.PI/2;mesh.castShadow=mesh.receiveShadow=true;archUp.add(mesh);};
  if(visibleTop>=crown){const pts=[];for(let i=0;i<=32;i++){const a=Math.PI-i*Math.PI/32;pts.push([Math.cos(a)*radius,spring+Math.sin(a)*radius]);}pts.push([radius,visibleTop],[-radius,visibleTop]);addFill(pts);}
  else {const a=Math.asin((visibleTop-spring)/radius),left=[[-radius,spring]],right=[];for(let i=1;i<=16;i++){const t=a*i/16;left.push([-Math.cos(t)*radius,spring+Math.sin(t)*radius]);right.unshift([Math.cos(t)*radius,spring+Math.sin(t)*radius]);}left.push([-radius,visibleTop]);right.push([radius,spring],[radius,visibleTop]);addFill(left);addFill(right);}
  const trim=mat('#eee9df',{roughness:.68}),world=(x,y,side)=>horizontal?[wx(cx+x*1000),y,wz(cy)+side*(depth/2+.012)]:[wx(cx)+side*(depth/2+.012),y,wz(cy+x*1000)];
  for(const side of [-1,1]){
    const jambTop=Math.min(spring,visibleTop);if(jambTop>0){archUp.add(rod(world(-radius,0,side),world(-radius,jambTop,side),.018,trim,.018,8),rod(world(radius,0,side),world(radius,jambTop,side),.018,trim,.018,8));}
    const pts=[];for(let i=0;i<=32;i++){const a=Math.PI-i*Math.PI/32,y=spring+Math.sin(a)*radius;if(y<=visibleTop+.001)pts.push(world(Math.cos(a)*radius,y,side));}
    for(let i=1;i<pts.length;i++)archUp.add(rod(pts[i-1],pts[i],.018,trim,.018,8));
  }
}
`;
 replaceOnce('function buildArch(){',archCode+'function buildArch(){','true arch opening geometry');
 replaceOnce("  DOORS.forEach(d => { if(top > 2.025) wallBox(doorLine(d),2.025,top); });", "  DOORS.forEach(d => { if(d.kind!=='arch'&&top > 2.025) wallBox(doorLine(d),2.025,top); });",'no flat header across arch void');
 replaceOnce("  DOORS.forEach(d => {\n    const horizontal=d.c[0]!==0,[x0,y0,x1,y1]=d.rect;", "  DOORS.forEach(d => {\n    if(d.kind==='arch'){buildArchOpening(d,top);return;}\n    const horizontal=d.c[0]!==0,[x0,y0,x1,y1]=d.rect;",'arches have no leaf or interactive door');
 replaceOnce("  DOORS.forEach(d => {\n    const [hx,hy] = d.h, L = d.len, T = 40;", `  DOORS.forEach(d => {
    if(d.kind==='arch'){
      const [x0,y0,x1,y1]=d.rect,horizontal=d.c[0]!==0,mx=(x0+x1)/2,my=(y0+y1)/2;
      s+=\`<rect x="\${x0}" y="\${y0}" width="\${x1-x0}" height="\${y1-y0}" fill="#fff"/><line x1="\${horizontal?x0:mx}" y1="\${horizontal?my:y0}" x2="\${horizontal?x1:mx}" y2="\${horizontal?my:y1}" stroke="#8e7f6c" stroke-width="2" stroke-dasharray="7 5" vector-effect="non-scaling-stroke"/><text x="\${mx}" y="\${my-115}" text-anchor="middle" font-size="90" fill="#6d6255" pointer-events="none">ARCH</text>\`;
      return;
    }
    const [hx,hy] = d.h, L = d.len, T = 40;`,'2D arches have no leaf or swing');
 replaceOnce('new THREE.BoxGeometry(M(L),yt-yb,thick),m||[wallMat', 'metricWallUV(new THREE.BoxGeometry(M(L),yt-yb,thick),M(L),yt-yb,thick),m||[wallMat','wall UV');
 const brickCode=`let exteriorBrickMat;
function brickMaterial(){
  if(exteriorBrickMat)return exteriorBrickMat;
  // 450 x 300 mm repeating stretcher bond: two bricks, four 75 mm courses.
  const cv=document.createElement('canvas'),bump=document.createElement('canvas');cv.width=bump.width=450;cv.height=bump.height=300;
  const ctx=cv.getContext('2d'),bc=bump.getContext('2d'),random=rng(72819);
  ctx.fillStyle='#b7ac99';ctx.fillRect(0,0,450,300);bc.fillStyle='#3d3d3d';bc.fillRect(0,0,450,300);
  for(let row=0;row<4;row++)for(let col=-1;col<3;col++){
    const x=col*225+(row%2?112.5:0)+5,y=row*75+5,tone=Math.floor(random()*22);
    ctx.fillStyle='rgb('+(145+tone)+','+(78+tone)+','+(53+tone)+')';ctx.fillRect(x,y,215,65);
    bc.fillStyle='#c4c4c4';bc.fillRect(x,y,215,65);
    for(let j=0;j<230;j++){const px=x+random()*215,py=y+random()*65;ctx.fillStyle=random()<.5?'rgba(54,30,18,.16)':'rgba(235,194,150,.13)';ctx.fillRect(px,py,1+random()*3,1);}
  }
  const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  const relief=new THREE.CanvasTexture(bump);relief.wrapS=relief.wrapT=THREE.RepeatWrapping;
  exteriorBrickMat=mat('#ffffff',{map:texture,bumpMap:relief,bumpScale:.004,roughness:.96});return exteriorBrickMat;
}
function exteriorWallFace(x0,y0,x1,y1,k){
  if(k!=='e')return -1;
  const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),px=(x0+x1)/2-dy/L*250,py=(y0+y1)/2+dx/L*250;
  // Local +Z is the left-hand side of each directed plan wall.
  const inside=ROOMS.some(r=>{let hit=false;for(let i=0,j=r.poly.length-1;i<r.poly.length;j=i++){
    const [ax,ay]=r.poly[i],[bx,by]=r.poly[j];if((ay>py)!==(by>py)&&px<(bx-ax)*(py-ay)/(by-ay)+ax)hit=!hit;
  }return hit;});return inside?5:4;
}
function exteriorWallMaterials(geo,x0,y0,x1,y1,k,yb,height){
  const materials=[wallMat,wallMat,capMat,wallMat,wallMat,wallMat],face=exteriorWallFace(x0,y0,x1,y1,k);
  if(face<0)return materials;
  const brick=brickMaterial();materials[0]=materials[1]=materials[face]=brick;const uv=geo.attributes.uv;
  const dx=x1-x0,dy=y1-y0,phase=M((x0*dx+y0*dy)/Math.hypot(dx,dy));
  // Convert this face's plaster UVs back to metres, then to brick tile units.
  for(const side of [0,1,face])for(let i=side*4;i<side*4+4;i++){const u=uv.getX(i)/2;const along=side===face?phase+(face===4?M(Math.hypot(dx,dy))-u:u):u;uv.setXY(i,along/.45,(uv.getY(i)/2+yb)/.3);}
  uv.needsUpdate=true;return materials;
}
`;
 replaceOnce('function wallBox([x0,y0,x1,y1,k,t=200]',brickCode+'function wallBox([x0,y0,x1,y1,k,t=200]','exterior brick helpers');
 replaceOnce('const o=new THREE.Mesh(metricWallUV(new THREE.BoxGeometry(M(L),yt-yb,thick),M(L),yt-yb,thick),m||[wallMat,wallMat,capMat,wallMat,wallMat,wallMat]);',
 'const geo=metricWallUV(new THREE.BoxGeometry(M(L),yt-yb,thick),M(L),yt-yb,thick);\n  const o=new THREE.Mesh(geo,m||exteriorWallMaterials(geo,x0,y0,x1,y1,k,yb,yt-yb));','exterior-only brick faces');
 // Preserve the dark rear folding-door frames; only the sash colour changes.
 s=s.replaceAll('#405343','#f5f3ee');
 replaceOnce('  const top = opt.cut;\n  ROOMS.forEach(r => {','  const top = opt.cut; applyWallFinish();\n  ROOMS.forEach(r => {','material update');
 replaceOnce('BOXED_CHIMNEYS.forEach(f => { if(top>0) archUp.add(box(M(f.w),Math.min(top,H),M(f.d),[wallMat,wallMat,capMat,wallMat,wallMat,wallMat],wx(f.x+f.w/2),0,wz(f.y+f.d/2))); });',`BOXED_CHIMNEYS.forEach(f => { if(top>0){const chimney=box(M(f.w),Math.min(top,H),M(f.d),[wallMat,wallMat,capMat,wallMat,wallMat,wallMat],wx(f.x+f.w/2),0,wz(f.y+f.d/2));metricWallUV(chimney.geometry,M(f.w),Math.min(top,H),M(f.d));archUp.add(chimney);} });`,'chimney UV');
 replaceOnce('const a = JSON.stringify([state.rooms, state.demolished, opt.cut])','const a = JSON.stringify([state.rooms, state.demolished, state.wallFinish, opt.cut])','3D sync signature');
 replaceOnce('const a = JSON.stringify([state.rooms, state.demolished, state.wallFinish, opt.cut])','const a = JSON.stringify([state.rooms, state.demolished, state.wallFinish, state.referenceStyle, opt.cut])','reference lamp sync');
 replaceOnce('lampG.clear(); doors.length = 0; colliders = [];','lampG.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();}); lampG.clear(); doors.length = 0; colliders = [];','lamp rebuild disposal');
 replaceOnce('lamp.position.set(wx(lampX), H - .012, wz(lampY));',"lamp.position.set(wx(lampX), H - (r.id==='wc'?.06:.012), wz(lampY));",'WC lamp below landing');
 replaceOnce('lamp.visible = top >= H; lampG.add(lamp);',"lamp.visible = top >= H && !(state.referenceStyle && ['front','entry','passage','frontStairClear','stairs'].includes(r.id)); lampG.add(lamp);",'hide old hall and lounge discs');
 const banisterCode=`function stairTop(i){return H*(i+1)/18;}
function buildStairFlight(){
  const pitch=M(STAIRS.y1-STAIRS.y0)/18,tread=.04,rise=H/18;
  const ivory=mat(state.referenceStyle?'#eee9df':'#8b7f6e');
  for(let i=0;i<18;i++){
    const py=STAIRS.y1-(STAIRS.y1-STAIRS.y0)*(i+.5)/18,level=stairTop(i);
    archUp.add(box(M(STAIRS.w),tread,pitch,ivory,wx(STAIRS.x+STAIRS.w/2),level-tread,wz(py)));
    archUp.add(box(M(STAIRS.w),rise,.02,ivory,wx(STAIRS.x+STAIRS.w/2),level-rise,wz(py+(STAIRS.y1-STAIRS.y0)/36)-.01));
  }
  // Upper-floor landing above the WC, flush with the final tread.
  if(opt.cut>=H){
    const landing=ROOMS.find(r=>r.id==='wc');
    const slab=new THREE.ExtrudeGeometry(shapeOf(landing.poly,true),{depth:.04,bevelEnabled:false});slab.rotateX(Math.PI/2);
    const floor=new THREE.Mesh(slab,[floorMat('walnutDark'),mat('#eee9df')]);floor.position.y=H;floor.receiveShadow=true;archUp.add(floor);
  }
}
function buildStairInfill(){
  // Solid enclosure follows the flight below its treads, never above the guard feet.
  const run=M(STAIRS.y1-STAIRS.y0),low=0,high=H-.04,top=opt.cut;
  if(top<=0)return;
  const profile=new THREE.Shape();profile.moveTo(0,0);profile.lineTo(run,0);
  profile.lineTo(run,Math.min(high,top));
  if(top>low&&top<high)profile.lineTo(run*(top-low)/(high-low),top);
  profile.lineTo(0,Math.min(low,top));profile.closePath();
  const geo=new THREE.ExtrudeGeometry(profile,{depth:M(STAIRS.w),bevelEnabled:false,steps:1,curveSegments:1});
  const enclosure=new THREE.Mesh(geo,wallMat);enclosure.rotation.y=Math.PI/2;
  enclosure.position.set(wx(STAIRS.x),0,wz(STAIRS.y1));
  enclosure.castShadow=true;enclosure.receiveShadow=true;archUp.add(enclosure);
}
function buildStairBanister(){
  buildStairInfill();
  // Plan 2's hall-side guard stays visible when furniture is hidden.
  const x=wx(STAIRS.x+STAIRS.w),white=mat('#eee9df',{roughness:.65}),dark=mat('#352b24',{roughness:.42});
  const stairY=i=>STAIRS.y1-(STAIRS.y1-STAIRS.y0)*(i+.5)/18;
  const treadTop=stairTop;
  const railAt=py=>treadTop(0)+.94+(stairY(0)-py)/(stairY(0)-stairY(17))*(stairTop(17)-stairTop(0));
  // Two slim square balusters per tread, attached to its illustrated top.
  for(let i=0;i<18;i++)for(let j=0;j<2;j++){
    const py=stairY(i)+(j?-.25:.25)*(STAIRS.y1-STAIRS.y0)/18;
    // Let each tip enter the underside of the sloping rail by about 11 mm.
    const foot=treadTop(i),height=railAt(py)-.02-foot;
    archUp.add(box(.028,height,.028,white,x,foot,wz(py)));
    archUp.add(box(.047,.055,.047,white,x,foot+.18,wz(py)));
    archUp.add(box(.039,.035,.039,white,x,foot+height*.78,wz(py)));
  }
  const a=[x,railAt(STAIRS.y1),wz(STAIRS.y1)],b=[x,railAt(STAIRS.y0),wz(STAIRS.y0)];
  archUp.add(rod(a,b,.031,dark,.031,12));
  archUp.add(rod([x,a[1]-.82,a[2]],[x,b[1]-.82,b[2]],.018,white,.018,8));
  for(const [py,i] of [[STAIRS.y1,0],[STAIRS.y0,17]]){
    const foot=treadTop(i),z=wz(py),capBase=railAt(py)+.06;
    archUp.add(box(.11,.13,.11,white,x,foot,z));
    archUp.add(box(.073,capBase-(foot+.13),.073,dark,x,foot+.13,z));
    archUp.add(box(.12,.06,.12,dark,x,capBase,z));
    const finial=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),dark);
    finial.position.set(x,capBase+.105,z);archUp.add(finial);
  }
}
`;
 replaceOnce("  FIREPLACES.forEach(f => archUp.add(box(M(f.w),.9,M(f.h),mat('#9c7054'),wx(f.x+f.w/2),.45,wz(f.y+f.h/2))));", "  buildStairBanister();\n  FIREPLACES.forEach(f => archUp.add(box(M(f.w),.9,M(f.h),mat('#9c7054'),wx(f.x+f.w/2),.45,wz(f.y+f.h/2))));",'architectural banister build');
 replaceOnce("  $('#gOpen').innerHTML = s;", `  if(STAIRS){const x=STAIRS.x+STAIRS.w,y0=STAIRS.y0,y1=STAIRS.y1;s+=\`<line x1="\${x}" y1="\${y0}" x2="\${x}" y2="\${y1}" stroke="#3e3027" stroke-width="30"/><line x1="\${x}" y1="\${y0}" x2="\${x}" y2="\${y1}" stroke="#eee9df" stroke-width="12"/>\`;for(let i=0;i<18;i++)for(let j=0;j<2;j++){const y=y1-(y1-y0)*(i+(j?.7:.3))/18;s+=\`<circle cx="\${x}" cy="\${y}" r="19" fill="#eee9df" stroke="#3e3027" stroke-width="5"/>\`;}for(const y of [y0,y1])s+=\`<rect x="\${x-48}" y="\${y-48}" width="96" height="96" fill="#3e3027" stroke="#eee9df" stroke-width="9"/>\`;}
  $('#gOpen').innerHTML = s;`, '2D banister symbol');
 const decorCode=`function referenceDecor(){
  if(!state.referenceStyle)return;
  const g=new THREE.Group(),cream=mat('#eee9df',{roughness:.86}),brass=mat('#9b7a47',{metalness:.6,roughness:.4}),dark=mat('#3b3028',{roughness:.6});
  const trim=(x0,y0,x1,y1,bottom,height,depth=.12)=>{const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy);if(!L)return;const o=box(M(L),height,depth,cream,wx((x0+x1)/2),bottom,wz((y0+y1)/2));o.rotation.y=-Math.atan2(dy,dx);g.add(o);};
  // Explicit wall runs stop at the actual door and sash openings.
  const runs=[[1700,12500,5800,12500],[1700,15684,1700,16500],[5800,12500,5800,16500],[1700,16500,3150,16500],[4350,16500,5800,16500],[0,14200,0,16500],[1700,8500,1700,10700],[1700,11518,1700,14866]];
  runs.forEach(r=>{trim(...r,.02,.115,.13);trim(...r,.76,.045,.13);if(opt.cut>=H)trim(...r,2.31,.08,.14);});
  // Stair runner follows the existing eighteen steps; the handrail follows their rise.
  for(let i=0;i<18;i++){const py=STAIRS.y1-(STAIRS.y1-STAIRS.y0)*(i+.5)/18,z=wz(py),rise=stairTop(i)-.005;
    g.add(box(.56,.006,M(STAIRS.y1-STAIRS.y0)/18,mat('#9b8971',{roughness:1}),wx(375),rise,z));
    [-1,1].forEach(side=>g.add(box(.017,.006,M(STAIRS.y1-STAIRS.y0)/18,dark,wx(375)+side*.28,rise,z)));
  }
  g.add(rod([wx(680),.9,wz(14100)],[wx(680),2.1,wz(10100)],.018,dark,.019));
  // Entrance console's round brass mirror, picture frames and slim black radiator.
  const mir=new THREE.Mesh(new THREE.CircleGeometry(.27,40),mat('#cbd4d2',{metalness:.45,roughness:.16,side:THREE.DoubleSide}));mir.rotation.y=Math.PI/2;mir.position.set(wx(125),1.55,wz(15100));g.add(mir);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.27,.012,8,48),brass);ring.rotation.y=Math.PI/2;ring.position.copy(mir.position);g.add(ring);
  [12700,13800].forEach(py=>{g.add(box(.034,.55,.38,dark,wx(1625),1.25,wz(py)),box(.038,.46,.29,mat('#e9e2d5',{roughness:1}),wx(1598),1.29,wz(py)));});
  g.add(box(.075,.7,.62,mat('#292a29',{roughness:.7}),wx(1575),.25,wz(13200)));
  for(let i=0;i<8;i++)g.add(box(.09,.6,.045,mat('#232422',{roughness:.6}),wx(1535),.3,wz(12940+i*75)));
  // Frame the existing right-wall fireplace in situ; no hearth or flue is moved.
  [13900,15350].forEach(py=>g.add(box(.18,1.22,.13,cream,wx(5500),0,wz(py))));
  g.add(box(.21,.16,1.58,cream,wx(5500),1.14,wz(14625)),box(.34,.045,1.55,cream,wx(5450),0,wz(14625)));
  g.add(box(.035,.61,.72,dark,wx(5480),1.44,wz(14625)),box(.04,.53,.64,mat('#d8cebe',{roughness:1}),wx(5458),1.48,wz(14625)));
  // Linen panels sit outside the front sash glazing, leaving the glass visible.
  g.add(box(1.47,.018,.018,brass,wx(3750),2.24,wz(16375)));
  [3040,4460].forEach(px=>g.add(box(.22,2.05,.06,mat('#e6dfd3',{roughness:1,side:THREE.DoubleSide}),wx(px),.12,wz(16355))));
  const pendant=(px,py,rad)=>{const x=wx(px),z=wz(py);g.add(rod([x,2.35,z],[x,2.02,z],.006,brass,.007));const hoop=new THREE.Mesh(new THREE.TorusGeometry(rad,.016,8,32),brass);hoop.rotation.x=Math.PI/2;hoop.position.set(x,2.02,z);g.add(hoop);for(let i=0;i<6;i++){const a=i*Math.PI/3,cx=x+Math.cos(a)*rad,cz=z+Math.sin(a)*rad;g.add(box(.024,.11,.024,mat('#fff6de',{emissive:'#f4dfb2',emissiveIntensity:.45}),cx,2.025,cz));}};
  pendant(3650,14350,.32);pendant(1200,12600,.16);pendant(1200,15400,.16);
  furnG.add(g);
}
`;
 replaceOnce("  if(STAIRS){ for(let i=0;i<18;i++){ const y=STAIRS.y1-(STAIRS.y1-STAIRS.y0)*(i+.5)/18; archUp.add(box(M(STAIRS.w),.12,.18,mat('#8b7f6e'),wx(STAIRS.x+STAIRS.w/2),.06+i*.08,wz(y))); } }", "  if(STAIRS)buildStairFlight();", 'full-height continuous stair flight');
 replaceOnce("ceil.position.y = r.id==='rear' ? H-.003 : H; ceil.visible = top >= H;", "ceil.position.y = r.id==='rear' ? H-.003 : r.id==='wc' ? H-.041 : H; ceil.visible = top >= H && r.id!=='stairs';", 'open stairwell ceiling');
 replaceOnce("if (!cuts.length || (!horizontal&&!vertical)) wallBox(w,0,w[4]==='low'?Math.min(1,top):top);", "const stairEnd=horizontal&&w[1]===STAIRS.y0&&Math.min(w[0],w[2])===STAIRS.x&&Math.max(w[0],w[2])===STAIRS.x+STAIRS.w;\n    if (!cuts.length || (!horizontal&&!vertical)) wallBox(w,0,stairEnd?Math.min(top,H-.04):w[4]==='low'?Math.min(1,top):top);", 'WC wall stops beneath landing');
 replaceOnce("mat(d.entry?'#6b4f3a':'#efe6d8'", "mat(d.entry?(state.referenceStyle?'#33342f':'#6b4f3a'):'#efe6d8'", 'reference charcoal entrance door');
 replaceOnce('function buildFurn(){',decorCode+'function buildFurn(){','reference decor');
 replaceOnce('function referenceDecor(){',banisterCode+'function referenceDecor(){','architectural stair banister helper');
 replaceOnce('  g.add(rod([wx(680),.9,wz(14100)],[wx(680),2.1,wz(10100)],.018,dark,.019));', '  // The architectural banister supplies the dark hall-side handrail.','remove old decorative stair rod');
 replaceOnce('  state.furniture.forEach(f => furnG.add(buildFurniture(f)));\n  furnG.visible = opt.furn;', '  state.furniture.forEach(f => furnG.add(buildFurniture(f)));\n  referenceDecor(); furnG.visible = opt.furn;','reference decor render');
 replaceOnce('const a = JSON.stringify([state.rooms, state.demolished, state.wallFinish, state.referenceStyle, opt.cut]), f = JSON.stringify(state.furniture)', 'const a = JSON.stringify([state.rooms, state.demolished, state.wallFinish, state.referenceStyle, opt.cut]), f = JSON.stringify([state.furniture,state.referenceStyle,opt.cut])','reference rebuild signature');
 assert(s.includes('function makePlasterTexture()')&&s.includes('metricWallUV(chimney.geometry'),'wall finish generated output');
 return s;
}
function make(d){
 let s = src;
 s = s.replace(/<html lang="zh-CN">/, '<html lang="en">').replace(/<title>[\s\S]*?<\/title>/, `<title>${d.title}</title>`);
 s = s.replace("let LANG = (() => { try { const l = localStorage.getItem(LANG_KEY); return LANGS.includes(l) ? l : 'zh'; } catch(e) { return 'zh'; } })();", "let LANG = (() => { try { const l = localStorage.getItem(LANG_KEY); return LANGS.includes(l) ? l : 'en'; } catch(e) { return 'en'; } })();");
 s = s.replace(/const WALLS = \[[\s\S]*?const MATS = \{/, dataCode(d) + '\nconst MATS = {');
 s = s.replace(/function defaultFurniture\(\)\{[\s\S]*?\n\nfunction defaultState/, 'function defaultFurniture(){ return []; }\n\nfunction defaultState');
 s = s.replace("const STORE = 'huxing-design-v1';", `const STORE = 'floorplan-3d-${d.id}-v2';`);
 s = s.replace(/const BOUNDS = \{x:[^;]+;/, `const BOUNDS = {x:-700, y:-700, w:${mm(d.width+1.4)}, h:${mm(d.depth+1.4)}};`);
 s = s.replace(/function renderDims\(\)\{[\s\S]*?\n\}\n\nfunction renderGrid/, `function renderDims(){ const g=$('#gDims'), w=BOUNDS.w-1400, h=BOUNDS.h-1400; g.innerHTML=\`<text x="\${w/2}" y="-330" text-anchor="middle" font-size="180" fill="#7d7160">approx. \${(w/1000).toFixed(2)} m maximum width</text><text x="-330" y="\${h/2}" text-anchor="middle" font-size="180" fill="#7d7160" transform="rotate(-90 -330 \${h/2})">approx. \${(h/1000).toFixed(2)} m overall depth</text>\`; g.setAttribute('display',ui.layers.dims?'inline':'none'); }\n\nfunction renderGrid`);
 s = s.replace(/function updateHeader\(\)\{[\s\S]*?\n\}/, `function updateHeader(){ $('#subtitle').textContent=PLAN_TITLE+' · source-trace dimensions in metres · 2.4 m height illustrative'; $('#undo').disabled=!undoStack.length; $('#redo').disabled=!redoStack.length; $('#undo').style.opacity=undoStack.length?1:.4; $('#redo').style.opacity=redoStack.length?1:.4; }`);
 s = s.replace(/function overviewPanel\(\)\{[\s\S]*?\n\}\nfunction bindOverview/, `function overviewPanel(){ const rows=ROOMS.map(r=>\`<tr class="click" data-room="\${r.id}"><td>\${esc(state.rooms[r.id].name)}</td><td class="r">≈ \${fmt(area(r.poly))} m²</td></tr>\`).join(''); return \`<section><h3>Trace polygons <small>Approximate; not a survey or usable-area calculation</small></h3><table>\${rows}</table><p class="muted" style="font-size:11px">\${PLAN_NOTE}</p></section><section><h3>Plan status</h3><div class="stats"><div><small>Furniture placed</small><span class="big">\${state.furniture.length}</span></div><div><small>Walls marked removed</small><span class="big">\${state.demolished.length}</span></div></div><div class="actions"><button class="btn" id="clearMeasure">Clear measures (\${state.measures.length})</button><button class="btn danger" id="clearFurn">Clear layout</button></div></section>\`; }\nfunction bindOverview`);
 s = s.replace(/<div class="brand"><b[\s\S]*?<\/div>\n    <div class="grp seg"/, `<div class="brand"><b>${d.title}</b><span id="subtitle">Approximate grid trace · dimensions in metres</span></div>\n    <div class="grp seg"`);
 s = s.replace('<button class="btn chip" data-lang="en" title="English">EN</button>', '<button class="btn chip on" data-lang="en" title="English">EN</button>');
 s = s.replace('<div id="toast"></div>', `<div id="toast"></div><details id="planMeta" aria-label="Plan assumptions"><summary>${d.title} · assumptions</summary><span>${d.note}</span><a href="${d.id==='plan-1'?'plan-2.html':'plan-1.html'}">Open ${d.id==='plan-1'?'Plan 2':'Plan 1'}</a></details>`);
 s = s.replace('</style>\n<script type="importmap">', '#planMeta{position:fixed;right:14px;bottom:42px;z-index:8;max-width:min(380px,54vw);padding:6px 9px;border:1px solid var(--line);border-radius:8px;background:rgba(255,253,249,.94);font-size:11px;box-shadow:0 4px 18px rgba(40,30,20,.1)}#planMeta summary{cursor:pointer;font-weight:600}#planMeta span{display:block;margin-top:5px;color:var(--muted)}#planMeta a{display:inline-block;margin-top:5px;color:var(--accent);font-weight:600}\n</style>\n<script type="importmap">');
 // Generic tapered-wall drawing and 3D extrusion support.
 s = s.replace(/function renderWalls\(\)\{[\s\S]*?\n\}\n\nfunction renderOpenings/, `function renderWalls(){\n  $('#gWalls').innerHTML = WALLS.map((w,i) => {\n    const [x0,y0,x1,y1,k,t=200] = w, id='w'+i, dem=state.demolished.includes(id), dx=x1-x0, dy=y1-y0, L=Math.hypot(dx,dy)||1, nx=-dy/L*t/2, ny=dx/L*t/2;\n    let fill=k==='b'?(ui.layers.bearing?'#b8412c':'#26241f'):k==='low'?'#e9e3d8':k==='e'?'#8f897d':'#a7a195'; let ex=''; if(dem){fill='rgba(198,91,58,.12)';ex='stroke="#c65b3a" stroke-width="1.2" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"';}\n    return \`<polygon class="wall" data-wall="\${id}" points="\${x0+nx},\${y0+ny} \${x1+nx},\${y1+ny} \${x1-nx},\${y1-ny} \${x0-nx},\${y0-ny}" fill="\${fill}" \${ex}/>\`;\n  }).join('');\n}\n\nfunction renderOpenings`);
 s = s.replace(/  WINS\.forEach\(\(\[x0,y0,x1,y1\]\) => \{[\s\S]*?  \}\);\n  const DS/, `  WINS.forEach(({rect:[x0,y0,x1,y1],style,panels=1}) => { const w=x1-x0,h=y1-y0; s += \`<rect x="\${x0}" y="\${y0}" width="\${w}" height="\${h}" fill="#eaf1f2" \${WS}/>\`; if(style==='folding') for(let i=1;i<panels;i++){const x=x0+w*i/panels;s+=\`<line x1="\${x}" y1="\${y0}" x2="\${x}" y2="\${y1}" stroke="#202524" stroke-width="1.2" vector-effect="non-scaling-stroke"/>\`;} if(style==='sash'){const y=(y0+y1)/2;s+=\`<line x1="\${x0}" y1="\${y}" x2="\${x1}" y2="\${y}" stroke="#405343" stroke-width="1.4" vector-effect="non-scaling-stroke"/>\`;}});\n  const DS`);
 s = s.replace(/  \$\('#gOpen'\)\.innerHTML = s;/, `  if(STAIRS){ const n=18; for(let i=1;i<n;i++){const y=STAIRS.y0+(STAIRS.y1-STAIRS.y0)*i/n;s+=\`<line x1="\${STAIRS.x}" y1="\${y}" x2="\${STAIRS.x+STAIRS.w}" y2="\${y}" stroke="#6f675b" stroke-width="18"/>\`; } s+=\`<text x="\${STAIRS.x+STAIRS.w/2}" y="\${(STAIRS.y0+STAIRS.y1)/2}" text-anchor="middle" font-size="180" fill="#4a443c">STAIRS</text>\`; } FIREPLACES.forEach(f=>{s+=\`<rect x="\${f.x}" y="\${f.y}" width="\${f.w}" height="\${f.h}" fill="#c9b5a3" stroke="#704f3c" stroke-width="28"/><text x="\${f.x+f.w/2}" y="\${f.y+f.h/2}" text-anchor="middle" dominant-baseline="central" font-size="90" fill="#4a3023">FIREPLACE</text>\`;});\n  $('#gOpen').innerHTML = s;`);
 s = s.replace("function snapRects(){ return WALLS.filter((w,i) => !state.demolished.includes('w'+i)).concat(WINS); }", "function snapRects(){ return WALLS.filter((w,i) => !state.demolished.includes('w'+i)).concat(WINS.map(w=>w.rect)); }");
 s = s.replace(/const OX = 6000, OY = 5300, H = 2\.8, FOV = 45;[^\n]*/, `const OX = ${mm(d.width/2)}, OY = ${mm(d.depth/2)}, H = 2.4, FOV = 45; // plan centre; illustrative 2.4 m wall height`);
 s = s.replace("const opt = {cut:2.8, furn:true, labels:true, night:false, hour:10, mode:'orbit'};", "const opt = {cut:2.4, furn:true, labels:false, night:false, hour:10, mode:'orbit'};");
 s = s.replace('data-cut="2.8"', 'data-cut="2.4"').replace('data-cut="1.2"', 'data-cut="1.1"');
 s = s.replace(/function roomPanel\(r\)\{[\s\S]*?\n\}\nfunction bindRoomPanel/, `function roomPanel(r){ const st=state.rooms[r.id],a=area(r.poly),[x0,y0,x1,y1]=bbox(r.poly),inside=state.furniture.filter(f=>f.cx>x0&&f.cx<x1&&f.cy>y0&&f.cy<y1); const mats=Object.entries(MATS).map(([k,m])=>\`<button class="mat \${k===st.mat?'on':''}" data-mat="\${k}"><i style="background:\${m.sw}"></i><span>\${nm(m.name)}</span></button>\`).join(''); return \`<section><h3>Trace polygon</h3><div class="form"><label class="full">Name<input id="rName" value="\${esc(st.name)}"></label></div><div class="stats" style="margin-top:10px"><div><small>Approximate trace area</small><span class="big">≈ \${fmt(a)}</span> m²</div><div><small>Polygon perimeter</small><span class="big">≈ \${fmt(perim(r.poly),1)}</span> m</div></div></section><section><h3>Floor finish</h3><div class="mats">\${mats}</div></section><section><h3>Furniture placed</h3><table>\${inside.map(f=>\`<tr class="click" data-fid="\${f.id}"><td>\${esc(nm(f.name))}</td><td class="r muted">\${f.w}×\${f.d}</td></tr>\`).join('')||'<tr><td class="muted">None</td></tr>'}</table><div class="actions"><button class="btn" id="back">← Back</button></div></section>\`; }\nfunction bindRoomPanel`);
 if(d.id==='plan-2'){
  s=s.replace("s.rooms = Object.assign(d.rooms, s.rooms || {});", "const savedRooms=s.rooms||{}; if(savedRooms.rear?.name==='Rear / second room') savedRooms.rear={...savedRooms.rear,name:'Kitchen / rear'}; s.rooms=Object.fromEntries(ROOMS.map(r=>[r.id,{...d.rooms[r.id],...(savedRooms[r.id]||{})}]));");
 }
 s = s.replace(/function wallBox\(\[x0, y0, x1, y1\], yb, yt, m\)\{[\s\S]*?\n\}/, `function wallBox([x0,y0,x1,y1,k,t=200], yb, yt, m){\n  if(yt-yb<=.001)return; const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy), thick=M(t); if(!L)return;\n  const o=new THREE.Mesh(new THREE.BoxGeometry(M(L),yt-yb,thick),m||[wallMat,wallMat,capMat,wallMat,wallMat,wallMat]);\n  o.position.set(wx((x0+x1)/2),(yb+yt)/2,wz((y0+y1)/2)); o.rotation.y=-Math.atan2(dy,dx); o.castShadow=o.receiveShadow=true;archUp.add(o);\n  const ln=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry),edgeMat);ln.position.copy(o.position);ln.rotation.copy(o.rotation);ln.userData.walkOnly=true;ln.visible=opt.mode==='walk';archUp.add(ln);\n}`);
 s = s.replace(/    colliders\.push\(\[wx\(w\[0\]\), wz\(w\[1\]\), wx\(w\[2\]\), wz\(w\[3\]\)\]\);/, `    colliders.push([Math.min(wx(w[0]),wx(w[2])),Math.min(wz(w[1]),wz(w[3])),Math.max(wx(w[0]),wx(w[2])),Math.max(wz(w[1]),wz(w[3]))]);`);
 s = s.replace(/  WALLS\.forEach\(\(w, i\) => \{\n    if \(state\.demolished\.includes\('w'\+i\)\) return;\n    wallBox\(w, 0, w\[4\] === 'low' \? Math\.min\(1, top\) : top\);\n    colliders\.push\([^\n]+\);\n  \}\);/, `  WALLS.forEach((w, i) => {
    if (state.demolished.includes('w'+i)) return;
    const horizontal=Math.abs(w[1]-w[3])<.01, vertical=Math.abs(w[0]-w[2])<.01;
    const cuts=WINS.filter(win => { const r=win.rect,midX=(r[0]+r[2])/2,midY=(r[1]+r[3])/2,along=horizontal?Math.max(Math.min(w[0],w[2]),Math.min(r[0],r[2]))<Math.min(Math.max(w[0],w[2]),Math.max(r[0],r[2])):Math.max(Math.min(w[1],w[3]),Math.min(r[1],r[3]))<Math.min(Math.max(w[1],w[3]),Math.max(r[1],r[3])); return ((horizontal&&Math.abs(midY-w[1])<=(w[5]||200)/2+100)||(vertical&&Math.abs(midX-w[0])<=(w[5]||200)/2+100))&&along; }).map(win=>win.rect).sort((a,b)=>(horizontal?a[0]:a[1])-(horizontal?b[0]:b[1]));
    if (!cuts.length || (!horizontal&&!vertical)) wallBox(w,0,w[4]==='low'?Math.min(1,top):top);
    else { let cursor=horizontal?w[0]:w[1], end=horizontal?w[2]:w[3], dir=end>=cursor?1:-1; cuts.forEach(r=>{const a=horizontal?r[0]:r[1],b=horizontal?r[2]:r[3],lo=dir>0?Math.min(end,Math.max(cursor,a)):Math.max(end,Math.min(cursor,b)); if((dir>0&&lo>cursor)||(dir<0&&lo<cursor)) wallBox(horizontal?[cursor,w[1],lo,w[3],w[4],w[5]]:[w[0],cursor,w[2],lo,w[4],w[5]],0,w[4]==='low'?Math.min(1,top):top); cursor=dir>0?Math.min(end,Math.max(cursor,b)):Math.max(end,Math.min(cursor,a));}); if((dir>0&&cursor<end)||(dir<0&&cursor>end)) wallBox(horizontal?[cursor,w[1],end,w[3],w[4],w[5]]:[w[0],cursor,w[2],end,w[4],w[5]],0,w[4]==='low'?Math.min(1,top):top); }
    colliders.push([Math.min(wx(w[0]),wx(w[2])),Math.min(wz(w[1]),wz(w[3])),Math.max(wx(w[0]),wx(w[2])),Math.max(wz(w[1]),wz(w[3]))]);
  });`);
 s = s.replace(/  WINS\.forEach\(\(r, i\) => \{[\s\S]*?  \}\);\n  DOORS\.forEach/, `  WINS.forEach(win => {
    const {rect:[x0,y0,x1,y1],sill:mmSill,height:mmHeight,panels=1,style}=win,sill=M(mmSill),height=M(mmHeight),head=sill+height,hz=(x1-x0)>=(y1-y0),line=hz?[x0,(y0+y1)/2,x1,(y0+y1)/2,'e',200]:[(x0+x1)/2,y0,(x0+x1)/2,y1,'e',200];
    wallBox(line,0,Math.min(sill,top)); if(top>head)wallBox(line,head,top);
    const gTop=Math.min(head,top); if(gTop<=sill)return; const L=M(hz?x1-x0:y1-y0),gh=gTop-sill,cx=wx((x0+x1)/2),cz=wz((y0+y1)/2),fm=mat(style==='sash'?'#405343':'#202524',{roughness:.45,metalness:.35});
    const pane=new THREE.Mesh(new THREE.BoxGeometry(hz?L:.01,gh,hz?.01:L),glassMat);pane.position.set(cx,sill+gh/2,cz);archUp.add(pane);
    for(let k=0;k<=panels;k++){const t=-L/2+k*L/panels,mu=new THREE.Mesh(new THREE.BoxGeometry(hz?.04:.06,gh,hz?.06:.04),fm);mu.position.set(cx+(hz?t:0),sill+gh/2,cz+(hz?0:t));archUp.add(mu);}
    [sill+.02,gTop-.02].forEach(y=>{const tr=new THREE.Mesh(new THREE.BoxGeometry(hz?L:.06,.04,hz?.06:L),fm);tr.position.set(cx,y,cz);archUp.add(tr);}); if(style==='sash'){const rail=new THREE.Mesh(new THREE.BoxGeometry(hz?L:.06,.045,hz?.06:L),fm);rail.position.set(cx,sill+gh/2,cz);archUp.add(rail);}
  });
  DOORS.forEach`);
 s = s.replace(`  [...DOORS.map(d => [d.rect, 2.1]), ...SLIDES.map(s => [s.rect, s.v ? 2.4 : 2.1]), [[10270,800,10510,2600], 2.4], [[10270,4260,10510,5740], 2.4]]\n    .forEach(([r, h]) => { if (top > h) wallBox(r, h, top); });`, `  DOORS.forEach(d => { if(top > 2.025) wallBox(doorLine(d),2.025,top); });`);
 s = s.replace(/function buildArch\(\)\{/, `function doorLine(d){const [x0,y0,x1,y1]=d.rect;return d.c[0]!==0?[x0,(y0+y1)/2,x1,(y0+y1)/2,d.entry?'e':'n',d.entry?200:100]:[(x0+x1)/2,y0,(x0+x1)/2,y1,d.entry?'e':'n',d.entry?200:100];}\nfunction buildArch(){`);
 // Decorative walk-mode edge lines have a generous raycaster line threshold;
 // they must not mask a selectable door in either mode. Wall meshes still block.
 s = s.replace('    if (o.material === glassMat) continue;\n    if (o.userData.door)', '    if (o.userData.walkOnly || o.material === glassMat) continue;\n    if (o.userData.door)');
 s = s.replace('  DOORS.forEach(d => {\n    const pivot', `  if(STAIRS){ for(let i=0;i<18;i++){ const y=STAIRS.y1-(STAIRS.y1-STAIRS.y0)*(i+.5)/18; archUp.add(box(M(STAIRS.w),.12,.18,mat('#8b7f6e'),wx(STAIRS.x+STAIRS.w/2),.06+i*.08,wz(y))); } }\n  FIREPLACES.forEach(f => archUp.add(box(M(f.w),.9,M(f.h),mat('#9c7054'),wx(f.x+f.w/2),.45,wz(f.y+f.h/2))));\n  DOORS.forEach(d => {\n    const pivot`);
 if(d.id==='plan-2'){
  const fireplaceLine="  FIREPLACES.forEach(f => archUp.add(box(M(f.w),.9,M(f.h),mat('#9c7054'),wx(f.x+f.w/2),.45,wz(f.y+f.h/2))));";
  assert(s.includes(fireplaceLine),'Plan 2 boxed-chimney insertion point');
  s=s.replace(fireplaceLine,`${fireplaceLine}\n  BOXED_CHIMNEYS.forEach(f => { if(top>0) archUp.add(box(M(f.w),Math.min(top,H),M(f.d),[wallMat,wallMat,capMat,wallMat,wallMat,wallMat],wx(f.x+f.w/2),0,wz(f.y+f.d/2))); });`);
 }
 s = s.replace(/  DOORS\.forEach\(d => \{\n    const pivot = new THREE\.Group\(\), L = M\(d\.len\), dh = Math\.min\(2\.05, top\);[\s\S]*?    doors\.push\(door\); archUp\.add\(pivot\);\n  \}\);/, `  DOORS.forEach(d => {
    const horizontal=d.c[0]!==0,[x0,y0,x1,y1]=d.rect;
    const centreX=(x0+x1)/2,centreY=(y0+y1)/2;
    const opening=M(d.opening),leafLength=M(d.len),frameWidth=.025,frameDepth=d.entry?.065:.05;
    const jambTop=Math.min(1.987,top),frameTop=Math.min(2.025,top);
    const fm=mat(d.entry?'#5b4838':'#ded5c7',{roughness:.55});
    const placeFrame=(distance,bottom,height,width)=>{
      if(height<=0)return;
      const f=box(horizontal?width:frameDepth,height,horizontal?frameDepth:width,fm,
        wx(horizontal?centreX+distance*1000:centreX),bottom,wz(horizontal?centreY:centreY+distance*1000));
      archUp.add(f);
    };
    placeFrame(-opening/2+frameWidth/2,0,jambTop,frameWidth);
    placeFrame(opening/2-frameWidth/2,0,jambTop,frameWidth);
    placeFrame(0,1.987,frameTop-1.987,opening);
    const pivot=new THREE.Group(),dh=Math.min(1.981,Math.max(0,top-.003));
    pivot.position.set(wx(d.h[0]),0,wz(d.h[1]));
    const leaf=box(leafLength,dh,M(d.thickness),mat(d.entry?'#6b4f3a':'#efe6d8',{roughness:.5}),leafLength/2,.003);
    const knob=new THREE.Mesh(new THREE.SphereGeometry(.03,12,8),metal());
    knob.position.set(leafLength-.07,Math.min(1,dh-.05),0);knob.scale.z=2.2;
    pivot.add(leaf,knob);
    const ang=v=>Math.atan2(-v[1],v[0]),door={pivot,a0:ang(d.c),a1:ang(d.o),open:false};
    if(door.a1-door.a0>Math.PI)door.a1-=Math.PI*2;if(door.a0-door.a1>Math.PI)door.a1+=Math.PI*2;
    door.cur=door.a0;pivot.rotation.y=door.cur;leaf.userData.door=knob.userData.door=door;
    doors.push(door);archUp.add(pivot);
  });`);
 s = s.replace(/const isoWhole = \(\) => pose\([^;]+;\nconst topWhole = \(\) => pose\([^;]+;/, `const isoWhole = () => pose(new THREE.Vector3(0,0,0),new THREE.Vector3(7,18,12));\nconst topWhole = () => pose(new THREE.Vector3(0,0,0),new THREE.Vector3(0,23,.0001));`);
 s = s.replace(/  s \+= `<path d="M3350 8755H4350[\s\S]*?`;/, `  const entry=DOORS.find(d=>d.entry); if(entry){ const [x0,y0,x1,y1]=entry.rect; s += \`<text x="\${(x0+x1)/2}" y="\${Math.max(y0,y1)+260}" text-anchor="middle" font-size="150" fill="#b5653a">ENTRY</text>\`; }`);
 s = s.replace("camera.position.set(wx(4200), 1.6, wz(8755)); camera.lookAt(wx(7000), 1.5, wz(8755));   // 入户门外", "camera.position.set(wx(OX), 1.6, wz(OY + BOUNDS.h/2 - 900)); camera.lookAt(wx(OX), 1.5, wz(OY));");
 if(d.id==='plan-2'){
  s=s.replace("  $('#gOpen').innerHTML = s;", `  if(ui.layers.rooflights) ROOFLIGHTS.forEach(r=>{const x=r.cx-r.w/2,y=r.cy-r.d/2;s+=\`<rect x="\${x}" y="\${y}" width="\${r.w}" height="\${r.d}" rx="35" fill="rgba(194,222,226,.18)" stroke="#548494" stroke-width="2" stroke-dasharray="9 6" vector-effect="non-scaling-stroke"/><text x="\${r.cx}" y="\${y-120}" text-anchor="middle" font-size="125" fill="#345b69" pointer-events="none">ROOFLIGHT · 2.4 × 1.2 m</text>\`;});
  $('#gOpen').innerHTML = s;`);
  s=s.replace('<div class="grp only3d" id="toggles3d">', '<div class="grp only3d" id="toggles3d"><button class="btn chip on" data-t="roof" data-en="Kitchen roof" aria-label="Kitchen roof" aria-pressed="true" title="Show or hide the kitchen roof for an interior view">厨房屋顶</button>');
  s=s.replace("const opt = {cut:2.4, furn:true, labels:false, night:false, hour:10, mode:'orbit'};", "const opt = {cut:2.4, roof:true, furn:true, labels:false, night:false, hour:10, mode:'orbit'};");
  s=s.replace('let archFloor, archUp, furnG, labelG, lampG, colliders', 'let archFloor, archUp, roofGroup, furnG, labelG, lampG, colliders');
  s=s.replace('function buildArch(){\n  clearGroup(archFloor); clearGroup(archUp); lampG.clear(); doors.length = 0; colliders = [];', 'function buildArch(){\n  clearGroup(archFloor); clearGroup(archUp); roofGroup = new THREE.Group(); archUp.add(roofGroup); lampG.clear(); doors.length = 0; colliders = [];');
  const oldCeiling=`    const cg = new THREE.ShapeGeometry(shapeOf(r.poly, true)); cg.rotateX(Math.PI/2);
    const ceil = new THREE.Mesh(cg, mat('#fbfaf7', {roughness:1})); ceil.position.y = H; ceil.visible = top >= H; archUp.add(ceil);`;
  assert(s.includes(oldCeiling),'Plan 2 kitchen ceiling insertion point');
  s=s.replace(oldCeiling,`    const cg = new THREE.ShapeGeometry(r.id==='rear' ? kitchenRoofShape(r.poly) : shapeOf(r.poly, true)); cg.rotateX(Math.PI/2);
    const ceil = new THREE.Mesh(cg, mat('#fbfaf7', {roughness:1})); ceil.position.y = r.id==='rear' ? H-.003 : H; ceil.visible = top >= H; (r.id==='rear' ? roofGroup : archUp).add(ceil);`);
  const oldLamp=`      lamp.position.set(wx(r.at[0]), H - .012, wz(r.at[1])); lamp.visible = top >= H; lampG.add(lamp);
      const pl = new THREE.PointLight(0xffd9a8, 0, 7, 1.6); pl.position.set(wx(r.at[0]), H - .25, wz(r.at[1])); lampG.add(pl);`;
  assert(s.includes(oldLamp),'Plan 2 ceiling fixture insertion point');
  s=s.replace(oldLamp,`      const lampX=r.id==='rear'?900:r.at[0],lampY=r.id==='rear'?4250:r.at[1];
      lamp.position.set(wx(lampX), H - .012, wz(lampY)); lamp.visible = top >= H; lampG.add(lamp);
      const pl = new THREE.PointLight(0xffd9a8, 0, 7, 1.6); pl.position.set(wx(lampX), H - .25, wz(lampY)); lampG.add(pl);`);
  const roofCode=`// The ceiling and the raised slab share the same three cut-outs; glazing spans each void.
function kitchenRoofShape(poly){
  const shape=shapeOf(poly,true);
  ROOFLIGHTS.forEach(r=>{
    const x0=wx(r.cx-r.w/2),x1=wx(r.cx+r.w/2),z0=wz(r.cy-r.d/2),z1=wz(r.cy+r.d/2);
    const hole=new THREE.Path();hole.moveTo(x0,z0);hole.lineTo(x0,z1);hole.lineTo(x1,z1);hole.lineTo(x1,z0);hole.closePath();shape.holes.push(hole);
  });
  return shape;
}
function buildKitchenRoof(){
  const outer=[[0,0],[5300,0],[5800,8500],[0,8500]];
  const slab=new THREE.ExtrudeGeometry(kitchenRoofShape(outer),{depth:.12,bevelEnabled:false});
  slab.rotateX(Math.PI/2);
  const roof=new THREE.Mesh(slab,[mat('#d9d8d1',{roughness:.95}),mat('#e8e5dc',{roughness:.95})]);
  roof.position.y=H+.12;roof.castShadow=roof.receiveShadow=true;roofGroup.add(roof);
  const fm=mat('#51616a',{metalness:.45,roughness:.4});
  ROOFLIGHTS.forEach(r=>{
    const x=wx(r.cx),z=wz(r.cy),w=M(r.w),d=M(r.d),edge=.075;
    const pane=box(w-edge*2,.012,d-edge*2,glassMat,x,H+.108,z);pane.castShadow=false;roofGroup.add(pane);
    [-1,1].forEach(side=>{
      roofGroup.add(box(w,.055,edge,fm,x,H+.12,z+side*(d-edge)/2));
      roofGroup.add(box(edge,.055,d-edge*2,fm,x+side*(w-edge)/2,H+.12,z));
    });
  });
  roofGroup.visible=opt.roof && opt.cut>=H;
}
`;
  s=s.replace('function buildArch(){',roofCode+'function buildArch(){');
  s=s.replace('  [...DOORS, ...SLIDES].forEach(d => {', '  buildKitchenRoof();\n  [...DOORS, ...SLIDES].forEach(d => {');
  s=s.replace("    if (k === 'furn'){ furnG.visible = opt.furn;", "    if (k === 'roof'){ roofGroup.visible=opt.roof && opt.cut>=H; b.setAttribute('aria-pressed',String(opt.roof)); }\n    if (k === 'furn'){ furnG.visible = opt.furn;");
  assert(s.includes('buildKitchenRoof();')&&s.includes('const ROOFLIGHTS =')&&s.includes('aria-pressed="true"'),'Plan 2 rooflight transformations');
 }
 const required = [
   'function defaultFurniture(){ return []; }', `floorplan-3d-${d.id}-v2`, `const opt = {cut:2.4, ${d.id==='plan-2'?'roof:true, ':''}furn:true, labels:false`,
   'Approximate; not a survey or usable-area calculation', 'function wallBox([x0,y0,x1,y1,k,t=200]', 'const FIREPLACES =',
   'wallBox(doorLine(d),2.025,top)', 'frameTop-1.987', 'door.cur=door.a0',
   'if (o.userData.walkOnly || o.material === glassMat) continue;'
 ];
 for (const marker of required) if (!s.includes(marker)) throw new Error(`${d.id}: required transformation missing: ${marker}`);
 if(d.id==='plan-2'){
  assert(s.includes(`const PLAN_NOTE = ${JSON.stringify(d.note)};`),'Plan 2 generated note matches source');
  assert(s.includes('const BOXED_CHIMNEYS = [{x:5550,y:10000,w:250,d:1500}];'),'Plan 2 boxed-chimney geometry');
  s=addPlan2WallFinishes(s);
  // Both localStorage load and JSON import pass through fixState. Versioning
  // avoids moving user-edited furniture or remapping new wall IDs twice.
  s=s.replace("pantryUtilityStyle:false};", "pantryUtilityStyle:false, planRevision:2};");
  const migration=`  if(s.planRevision!==2){
    const oldUtility=savedRooms.utility,oldStore=savedRooms.store;
    if(oldUtility?.mat==='terrazzo'&&oldStore?.mat&&oldStore.mat!=='terrazzo')s.rooms.utility.mat=oldStore.mat;
    s.demolished=(Array.isArray(s.demolished)?s.demolished:[]).flatMap(id=>id==='w8'?['w8','w17']:id==='w17'?[]:[id]);
    s.furniture.forEach(f=>{if(f.id==='utility-cylinder-cupboard'&&f.cx===4326&&f.cy===11655&&f.rot===90){f.cx=5445;f.cy=11955;}});
    s.planRevision=2;
  }
  if(s.diningSeatingRevision!==1){
    s.furniture.forEach(f=>{if(['kitchen-dining-chair-a','kitchen-dining-chair-b','kitchen-dining-chair-c'].includes(f.id)){f.rot=270;f.cx=4350;}});
    s.diningSeatingRevision=1;
  }
  s.demolished=[...new Set((Array.isArray(s.demolished)?s.demolished:[]).filter(id=>/^w(?:[0-9]|1[0-9]|2[0-7])$/.test(id)))];`;
  s=s.replace('  s.demolished = s.demolished || []; s.measures = s.measures || [];',migration+'\n  s.measures = s.measures || [];');
  assert(s.includes('box(M(f.w),Math.min(top,H),M(f.d),[wallMat,wallMat,capMat,wallMat,wallMat,wallMat]'),'Plan 2 full-height solid chimney');
  s=addGarden(s);
  // 2D rooflight visibility uses the existing layer controls, independently of the 3D roof.
  s=s.replace('<div class="grp only2d" id="layers">', '<div class="grp only2d" id="layers"><button class="btn chip on" data-layer="rooflights" data-en="Roof lights" aria-pressed="true" title="Show or hide roof light outlines and labels on the 2D plan">Roof lights</button>');
  assert(s.includes('layers:{dims:true,'),'2D layer state anchor');
  s=s.replace('layers:{dims:true,','layers:{rooflights:true, dims:true,');
  const layerAnchor="  if (k === 'dims') $('#gDims').setAttribute('display', ui.layers.dims ? 'inline' : 'none');";
  assert(s.includes(layerAnchor),'2D layer handler anchor');
  s=s.replace(layerAnchor,"  if(k==='rooflights'){b.setAttribute('aria-pressed',String(ui.layers.rooflights));renderOpenings();}\n  else "+layerAnchor.trim());
  assert(s.includes('if(ui.layers.rooflights) ROOFLIGHTS.forEach'),'conditional 2D rooflight rendering');
  s=s.replace('let state = load() || defaultState();', `let state = load() || defaultState();
// Requested one-off restoration of the kitchen bench; future moves remain editable.
if(state.benchRestoreRevision!==1){
 const bench=state.furniture.find(f=>f.id==='kitchen-banquette');
 if(bench)Object.assign(bench,{cx:5300,cy:6375,w:2750,d:520,rot:90});
 state.benchRestoreRevision=1;save();
}`);
  s=addMobile(s);
  s=addAutoWalls(s);
 }
 const forbidden = ['huxing-design-v1', 'camera.position.set(wx(4200)', '¥${Math.round(a*MATS[st.mat].price', '2.8 m wall height'];
 for (const marker of forbidden) if (s.includes(marker)) throw new Error(`${d.id}: forbidden inherited output remains: ${marker}`);
 // English-only viewer: ignore older saved language preferences and remove switch.
 s=s.replace(/let LANG = \(\(\) => \{[^\n]*\}\)\(\);/, "let LANG = 'en';");
 s=s.replace(/    <div class="grp" id="langSel"[\s\S]*?<\/div>/, '');
 s=s.replace(/^\$\('#langSel'\)\.onclick = [^\n]*\n/m, '');
 s=s.replace(/function setLang\(l\)\{[\s\S]*?\n\}/, '');
 assert(s.includes("let LANG = 'en';")&&!s.includes('id="langSel"'),'English-only viewer');
 fs.writeFileSync(`${d.id}.html`, s);
}
make(plan1); make(plan2);
function verifyGeneratedPlan2(){
 const html=fs.readFileSync('plan-2.html','utf8'),m=html.match(/const PANTRY_UTILITY_FURNITURE=(\[[\s\S]*?\n\]);/);
 assert(m,'generated pantry and utility preset data');
 const items=Function(`return ${m[1]}`)();
 assert.strictEqual(items.length,5,'five pantry and utility items');
 const actualSize={pantryrun:[1125,470],laundrystack:[600,636],utilitysink:[725,600],utilitycabinet:[600,628],cylindercupboard:[800,600]};
 const bounds=f=>{const [aw,ad]=actualSize[f.type],q=Math.abs(Math.round(f.rot/90))%2;return [f.cx-(q?ad:aw)/2,f.cy-(q?aw:ad)/2,f.cx+(q?ad:aw)/2,f.cy+(q?aw:ad)/2];};
 const boxes=items.map(f=>[f.id,bounds(f)]),within=(b,r)=>b[0]>=r[0]&&b[1]>=r[1]&&b[2]<=r[2]&&b[3]<=r[3];
 assert(within(boxes.find(([id])=>id==='pantry-back-run')[1],[1750,9550,2950,10450]),'pantry model clears inner wall faces');
 boxes.filter(([id])=>id.startsWith('utility-')).forEach(([id,b])=>assert(within(b,id==='utility-cylinder-cupboard'?[5145,11550,5750,12450]:[1750,11550,4631,12450]),`${id} clears merged utility inner wall faces`));
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const [ai,a]=boxes[i],[bi,b]=boxes[j];if(ai.startsWith('utility-')&&bi.startsWith('utility-'))assert(a[2]<=b[0]||b[2]<=a[0]||a[3]<=b[1]||b[3]<=a[1],`${ai} and ${bi} do not overlap`);}
 const clear=[1700,10700,2500,11750];boxes.filter(([id])=>id.startsWith('utility-')).forEach(([id,b])=>assert(b[2]<=clear[0]||clear[2]<=b[0]||b[3]<=clear[1]||clear[3]<=b[1],`${id} keeps hall-entry approach clear`));
 assert(items.filter(f=>f.rot===180).every(f=>f.cy>=10210)&&items.find(f=>f.id==='utility-cylinder-cupboard').rot===90,'cabinet and appliance fronts face into rooms');
 assert(!html.includes('ring.rotation.x=Math.PI/2')&&!html.includes('pane.rotation.x=-Math.PI/2'),'laundry doors face local +z into the room');
 assert(html.includes("if(d.kind==='arch'){buildArchOpening(d,top);return;}")&&html.includes("if(d.kind!=='arch'&&top > 2.025)"),'arches replace leaf and flat header');
 assert(html.includes("if(state.furniture.some(f=>f.id===item.id))continue;"),'preset remains idempotent');
}
verifyGeneratedPlan2();

// Portable viewing copy: furnishings are included for browsers without local saves.
const phoneFurniture=JSON.parse(fs.readFileSync('phone-furniture.json','utf8'));
let phoneHtml=fs.readFileSync('plan-2.html','utf8');
phoneHtml=phoneHtml.replace('function defaultFurniture(){ return []; }',`function defaultFurniture(){ return ${JSON.stringify(phoneFurniture)}; }`);
phoneHtml=phoneHtml.replace("referenceStyle:false, kitchenStyle:false, pantryUtilityStyle:false, planRevision:2", "referenceStyle:true, kitchenStyle:true, pantryUtilityStyle:true, planRevision:2, diningSeatingRevision:1");
phoneHtml=phoneHtml.replace("wallFinish:{colour:'ivory',texture:'plaster'}", "wallFinish:{colour:'greige',texture:'plaster'}");
phoneHtml=phoneHtml.replace('return {furniture:defaultFurniture(), rooms,', "['front','entry','passage','frontStairClear'].forEach(id=>rooms[id].mat='walnutDark'); ['rear','wc','pantry','utility'].forEach(id=>rooms[id].mat='limestone');\n  return {furniture:defaultFurniture(), rooms,");
phoneHtml=phoneHtml.replace("floorplan-3d-plan-2-v2", "floorplan-3d-phone-view-v1");
fs.writeFileSync('phone.html',phoneHtml);

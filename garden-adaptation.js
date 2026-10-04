const assert = require('assert');

// Millimetres. Photo-affine house basis: front 5.8 m; old shared wing 20 m.
// y=0 is the proposed bathroom/extension end (line 7). Far end is cropped.
const GARDEN_CONFIG = Object.freeze({
  status: 'Photo-derived concept — cropped far end estimated; not a boundary survey',
  plot: [[0,0],[5300,0],[5592.847446549315,1443.6045665986862],[5224.40231459899, -5586.747358073513], [5500,-8600],[6250,-33000],[-450,-33000],[-1400,-9000],[-1969,-3770],[0,-3500]],
  patio: [0,-5500,5000,0],
  crossPath: [[-1771.3187380497131,-5587],[5224.40231459899, -5586.747358073513],[5371.9533987317, -7200],[-1595.831739961759,-7200]],
  garage: [5470,-5665,10630,1245], garageAngle: -3, wallThickness:130,
  garageDoor: {start:-5159,end:-4341,leaf:762,opening:818,leafHeight:1981,openingHeight:2025},
  garageWidth: 3300, studioWidth: 1600, studioDepth: 5380, wcDepth: 1270,
  neighbour: [[0,-3500],[-1969,-3770],[-2130,1000],[0,1000]],
  lawn: [[-500,-9300],[4700,-9300],[5050,-24100],[0,-24100]],
  gardenRoom: [2000,-29000,6000,-25600],
  gardenRoomTerrace: [2000,-25600,5900,-23900],
  pathWidth: 1000,
  gardenPath: [[4400,-5600],[4400,-6600],[4700,-8600],[5200,-18500],[5200,-23900]],
  gates: { left: [[-1726.3862332695985,-6000],[-1595.831739961759,-7200]], right: [[5224.40231459899, -5586.747358073513],[5333.700342495814, -6781.759467258129]] },
  cooking: [110,-3100,910,-900], seating: [1650,-5050,4650,-3200],
  largeTree: [5350,-31600], canopyRadius: 1750,
  lights:[[3600,-5800],[3900,-9200],[4250,-16000],[4300,-22000],[1600,-24500]],
  beds: [[-500,-30200,1000,-29500],[-400,-31600,1100,-30900]],
  source: {front:[[253,997],[357,971]], oldShared:[[253,997],[202,639]], redEdge:[[166,643],[202,639]], garage:[[292,584],[372,559],[394,675],[315,699]]}
});
const width=r=>r[2]-r[0],depth=r=>r[3]-r[1];
const rectPoly=r=>[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]];
function rotatePoint(p,r,angle){const a=angle*Math.PI/180,cx=(r[0]+r[2])/2,cy=(r[1]+r[3])/2,x=p[0]-cx,y=p[1]-cy;return [cx+x*Math.cos(a)-y*Math.sin(a),cy+x*Math.sin(a)+y*Math.cos(a)];}
const garagePoly=c=>rectPoly([c.garage[0]-c.wallThickness/2,c.garage[1]-c.wallThickness/2,c.garage[2]+c.wallThickness/2,c.garage[3]+c.wallThickness/2]).map(p=>rotatePoint(p,c.garage,c.garageAngle));
function pointInside(p,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[j],b=poly[i],dx=b[0]-a[0],dy=b[1]-a[1];if(Math.abs(dx*(p[1]-a[1])-dy*(p[0]-a[0]))<1&&p[0]>=Math.min(a[0],b[0])-1&&p[0]<=Math.max(a[0],b[0])+1&&p[1]>=Math.min(a[1],b[1])-1&&p[1]<=Math.max(a[1],b[1])+1)return true;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function distanceToPoly(p,poly){if(pointInside(p,poly))return 0;return Math.min(...poly.map((a,i)=>{const b=poly[(i+1)%poly.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}));}
function distanceToPath(p,path){return Math.min(...path.slice(1).map((b,i)=>{const a=path[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);}));}
function plantClear(p,radius,c=GARDEN_CONFIG){return [p,[p[0]+radius,p[1]],[p[0]-radius,p[1]],[p[0],p[1]+radius],[p[0],p[1]-radius]].every(q=>pointInside(q,c.plot))&&[garagePoly(c),rectPoly(c.gardenRoom),c.neighbour,rectPoly([0,0,5800,16500])].every(poly=>distanceToPoly(p,poly)>radius+180)&&[c.crossPath,rectPoly(c.gardenRoomTerrace),rectPoly(c.cooking),rectPoly(c.seating)].every(poly=>distanceToPoly(p,poly)>radius+180)&&distanceToPath(p,c.gardenPath)>radius+c.pathWidth/2+180&&Math.hypot(p[0]-c.largeTree[0],p[1]-c.largeTree[1])>c.canopyRadius+radius;}
function plantSchedule(c=GARDEN_CONFIG){const plants=[];for(let y=-8200;y>-32200;y-=1300){for(let x=-1300;x<6500;x+=550){if(x<0||x>5100||y<-29200){const radius=320;if(plantClear([x,y],radius,c))plants.push({p:[x,y],radius,kind:(x+y)%3===0?'grass':'shrub'});}}}for(let y=-3650;y>-5100;y-=450)if(plantClear([1250,y],220,c))plants.push({p:[1250,y],radius:220,kind:'lavender'});return plants;}
function siteBounds(c=GARDEN_CONFIG){const points=[...c.plot,...garagePoly(c),...c.neighbour,c.largeTree.map((v,i)=>v-c.canopyRadius),c.largeTree.map((v,i)=>v+c.canopyRadius),...Object.entries(c.gates).map(([k,v])=>[v[0][0]+(k==='left'?-1000:1000),v[0][1]-300])];const x=Math.min(...points.map(p=>p[0]))-1000,y=Math.min(...points.map(p=>p[1]))-1000,right=Math.max(...points.map(p=>p[0]))+1000,bottom=Math.max(...points.map(p=>p[1]))+1000;return {garden:{x,y,w:right-x,h:bottom-y},whole:{x,y,w:right-x,h:17500-y}};}
function fenceSegments(c=GARDEN_CONFIG){const list=[];for(let i=3;i<c.plot.length-1;i++){const a=c.plot[i],b=c.plot[i+1];if(i===3)list.push([c.gates.right[1],b]);else if(i===7)list.push([a,c.gates.left[1]],[c.gates.left[0],b]);else list.push([a,b]);}return list;}

function verifyGardenConfig(c=GARDEN_CONFIG){
  assert.deepStrictEqual(c.plot.slice(-2),[[-1969,-3770],[0,-3500]],'shared wall to red neighbour edge retained');
  assert.deepStrictEqual(c.plot[0],[0,0],'garden starts exactly at line 7');
  assert.deepStrictEqual([width(c.garage),depth(c.garage)],[5160,6910],'garage wall centrelines' );
  assert.strictEqual(c.garageWidth+c.studioWidth+2*c.wallThickness,width(c.garage));assert.strictEqual(c.studioDepth+c.wcDepth+2*c.wallThickness,depth(c.garage));
  for(const poly of [rectPoly(c.patio),c.crossPath,c.lawn,rectPoly(c.gardenRoom),rectPoly(c.gardenRoomTerrace),...c.beds.map(rectPoly)])for(const p of poly)assert(pointInside(p,c.plot),'feature corner inside stepped site');
  assert(Math.abs(Math.hypot(c.gates.right[1][0]-c.gates.right[0][0],c.gates.right[1][1]-c.gates.right[0][1])-1200)<.001,'garage gate clear width');assert(Math.hypot(c.gates.right[0][0]-garagePoly(c)[0][0],c.gates.right[0][1]-garagePoly(c)[0][1])<1,'gate begins at garage top-left corner');assert(!pointInside([(c.garage[0]+c.garage[2])/2,(c.garage[1]+c.garage[3])/2],c.plot),'garage excluded from garden');assert(!pointInside([8000,-6500],c.plot),'old triangular land excluded');assert(c.garageDoor.start>c.garage[1]&&c.garageDoor.end<c.garage[3],'side door is within left garage wall');assert.strictEqual(c.garageDoor.end-c.garageDoor.start,c.garageDoor.opening,'side door frame fits opening');assert(!('garageForecourt' in c)&&!('accessPath' in c),'no invented garage front space or access route');
  const houseOuter=[[-100,-100],[5394,-100],[5900,8500],[5900,16600],[-100,16600]];for(const p of garagePoly(c))assert(distanceToPoly(p,houseOuter)>=100,'garage exterior face at least100mm clear of200mm house wall');
  for(const path of [{points:c.gardenPath,w:c.pathWidth}])for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/200);for(let j=0;j<=n;j++){const p=[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n];for(let k=0;k<12;k++)assert(pointInside([p[0]+path.w/2*Math.cos(k*Math.PI/6),p[1]+path.w/2*Math.sin(k*Math.PI/6)],c.plot),'full path corridor inside site');assert(distanceToPoly(p,garagePoly(c))>path.w/2,'full path clears garage exterior');}}
  for(const p of [...c.gates.left,...c.gates.right])assert(pointInside(p,c.crossPath),'cross path reaches both gates');
  assert(c.cooking[2]-c.cooking[0]<c.cooking[3]-c.cooking[1],'cooking runs lengthways along neighbour wall');
  for(const r of [c.cooking,c.seating]){for(const p of rectPoly(r))assert(pointInside(p,rectPoly(c.patio)),'furniture on patio');assert(r[3]<=-900,'rear doors remain clear');}
  assert(c.cooking[2]<c.seating[0],'cooking and seats clear');
  assert(distanceToPoly(c.largeTree,rectPoly(c.gardenRoom))>c.canopyRadius+400,'tree canopy clears room');
  for(const p of c.lights){assert(pointInside(p,c.plot),'light inside site');assert(distanceToPath(p,c.gardenPath)>c.pathWidth/2+42.5+180,'bollard clears full garden path plus180mm');}
  const bounds=siteBounds(c);for(const p of [...c.plot,...c.neighbour])assert(p[0]>=bounds.garden.x&&p[0]<=bounds.garden.x+bounds.garden.w&&p[1]>=bounds.garden.y&&p[1]<=bounds.garden.y+bounds.garden.h,'site view includes final boundary');
  const plants=plantSchedule(c);assert(plants.length>20,'meaningful mixed planting');for(const q of plants){assert(plantClear(q.p,q.radius,c),'plant canopy clears every building, furniture and route');assert(distanceToPath(q.p,c.gardenPath)>q.radius+c.pathWidth/2+180,'canopy plus180mm clears full path width');}
  return {plants:plants.length,mainWidthAtFarEnd:6700,estimatedDepth:33000};
}

function addGarden(s) {
  verifyGardenConfig();
  const houseBefore=['WALLS','DOORS','SLIDES','ROOMS'].map(k=>s.match(new RegExp('const '+k+' = ([\\s\\S]*?);'))?.[0]);
  const replaceOnce = (old, next, label) => {
    assert(s.includes(old), `Garden adaptation: missing ${label}`);
    assert.strictEqual(s.indexOf(old), s.lastIndexOf(old), `Garden adaptation: ambiguous ${label}`);
    s = s.replace(old, next);
  };
  const configCode = `const GARDEN = Object.freeze(${JSON.stringify({...GARDEN_CONFIG,plants:plantSchedule(),fences:fenceSegments(),bounds:siteBounds()})});`;
  replaceOnce('const MATS = {', `${configCode}\nconst MATS = {`, 'garden configuration insertion');

  replaceOnce('<g id="gGrid"></g>', '<g id="gGrid"></g>\n      <g id="gGarden" pointer-events="none"></g>', 'garden SVG layer');
  replaceOnce('<div class="grp only3d" id="modes3d">', '<div class="grp" id="siteViews" role="group" aria-label="Site view"><button class="btn chip on" data-site="home" data-en="Home">Home</button><button class="btn chip" data-site="garden" data-en="Garden">Garden</button><button class="btn chip" data-site="whole" data-en="Whole site">Whole site</button></div>\n    <div class="grp only3d" id="modes3d">', 'site view controls');
  replaceOnce('<div class="grp only3d" id="toggles3d"><button class="btn chip on" data-t="roof"', '<div class="grp only3d" id="toggles3d"><button class="btn chip on" data-t="garden" data-en="Garden" aria-pressed="true">Garden</button><button class="btn chip on" data-t="roof"', 'garden visibility control');
  replaceOnce('</span><a href="plan-1.html">', '</span><span><b>Garden concept:</b> photo-derived stepped plot: retained neighbour on the left, garage beside the house, one garden-side garage door; the garage and adjacent triangle lie outside the garden, with the gate on the new boundary. Main garden approx. 6–7 m wide; far end estimated at 33 m from the extension because the photo is cropped. Not a boundary survey.</span><a href="plan-1.html">', 'garden assumption note');
  replaceOnce('#planMeta{position:fixed;', '#gardenBadge{display:none;position:absolute;right:14px;top:14px;z-index:7;padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:rgba(255,253,249,.94);font-size:11px;color:var(--muted);box-shadow:0 4px 18px rgba(40,30,20,.1)}#gardenBadge.show{display:block}\n#planMeta{position:fixed;', 'garden assumption badge CSS');
  replaceOnce('<div class="scalebar" id="scalebar">', '<div id="gardenBadge">Stepped garden · photo-derived · far end estimated</div>\n    <div class="scalebar" id="scalebar">', 'garden assumption badge');

  const garden2D = String.raw`
function renderGarden(){
 const c=GARDEN,pts=p=>p.map(q=>q.join(',')).join(' '),rect=(r,fill,stroke='#b8aa94')=>'<rect x="'+r[0]+'" y="'+r[1]+'" width="'+(r[2]-r[0])+'" height="'+(r[3]-r[1])+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="35"/>',poly=(p,f,st='#796b58')=>'<polygon points="'+pts(p)+'" fill="'+f+'" stroke="'+st+'" stroke-width="55"/>',label=(x,y,t,size=250,col='#3e4938')=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="'+size+'" fill="'+col+'">'+t+'</text>';
 let s=poly(c.plot,'#dbe3cc','none')+poly(c.lawn,'#a6c588')+rect(c.patio,'#d9d0c0')+poly(c.crossPath,'#cfbea4')+rect(c.gardenRoomTerrace,'#c6ae8c');
 s+='<path d="M'+c.gardenPath.map(p=>p.join(' ')).join(' L')+'" fill="none" stroke="#cfbea4" stroke-width="'+c.pathWidth+'" stroke-linecap="round" stroke-linejoin="round"/>';
 s+=poly(c.neighbour,'#aa735b')+label(-950,-1850,'NEIGHBOUR',210,'#fff')+label(-950,-1400,'RETAINED',200,'#fff');
 const g=c.garage,cx=(g[0]+g[2])/2,cy=(g[1]+g[3])/2;
 s+='<g transform="rotate('+c.garageAngle+' '+cx+' '+cy+')">'+rect(g,'#b97858','#654d3c')+'<path d="M'+(g[0]+c.garageWidth+c.wallThickness)+' '+g[1]+'V'+g[3]+'M'+(g[0]+c.garageWidth+c.wallThickness)+' '+(g[1]+c.wcDepth+c.wallThickness)+'H'+g[2]+'" stroke="#654d3c" stroke-width="50"/>'+'<rect x="'+(g[0]-85)+'" y="'+c.garageDoor.start+'" width="170" height="'+c.garageDoor.opening+'" fill="#f3eee4" stroke="#454c43" stroke-width="22"/><path d="M'+g[0]+' '+(c.garageDoor.start+28)+'v'+c.garageDoor.leaf+'M'+g[0]+' '+(c.garageDoor.start+28)+'h'+c.garageDoor.leaf+'" stroke="#454c43" stroke-width="25" fill="none"/>'+label(g[0]+c.wallThickness/2+1650,cy,'GARAGE',250,'#fff')+label(g[0]+c.wallThickness/2+1650,cy+450,'3.30 × 6.78 m',210,'#fff')+label(g[2]-c.wallThickness/2-800,cy,'STUDIO',200,'#fff')+label(g[2]-c.wallThickness/2-800,g[1]+850,'WC',210,'#fff')+'</g>';
 s+=rect(c.gardenRoom,'#ac8059','#654d3c')+rect([2200,-25730,5800,-25600],'#bfd9da','#293d3c')+label(4000,-27450,'TIMBER / GLAZED ROOM',230,'#fff');
 for(let x=2100;x<5950;x+=250)s+='<path d="M'+x+' -29000V-25750" stroke="#765839" stroke-width="20" opacity=".55"/>';
 s+=rect(c.cooking,'#b76f4c')+label(510,-1730,'OVEN + BBQ',160,'#fff')+rect(c.seating,'#e7ddd0','#876d4f');
 s+='<path d="M1800 -4800H4100V-4300H2400V-3550H1800Z" fill="#d5c7b7" stroke="#756b5e" stroke-width="45"/><rect x="2850" y="-4250" width="1050" height="650" rx="100" fill="#8e7051"/>';
 for(const b of c.beds)s+=rect(b,'#856d4d');
 for(const p of c.lights)s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="65" fill="#edc36b" stroke="#514b41" stroke-width="22"/>';
 for(const q of c.plants)s+='<circle cx="'+q.p[0]+'" cy="'+q.p[1]+'" r="'+q.radius+'" fill="'+(q.kind==='lavender'?'#8c7a9d':'#7d9866')+'" opacity=".82"/>';
 s+='<circle cx="'+c.largeTree[0]+'" cy="'+c.largeTree[1]+'" r="'+c.canopyRadius+'" fill="#6f8d5c" opacity=".65"/><circle cx="'+c.largeTree[0]+'" cy="'+c.largeTree[1]+'" r="180" fill="#78543a"/>';
 for(const pair of c.fences)s+='<path d="M'+pair[0].join(' ')+'L'+pair[1].join(' ')+'" fill="none" stroke="#796b58" stroke-width="100"/>';
 for(const k of ['left','right']){const a=c.gates[k][0],b=c.gates[k][1];s+='<path d="M'+a.join(' ')+'L'+b.join(' ')+'" stroke="#554631" stroke-width="70" stroke-dasharray="65 30"/>';}
 s+=label(1700,-6650,'NEIGHBOUR GATE ← CROSS PATH → GARAGE GATE',175)+label(2700,-32500,'FAR END ESTIMATED · PHOTO CROPPED',205)+label(5600,-4100,'GARAGE SIDE DOOR',150)+label(2500,-200,'EXTENSION / BATHROOM END',155)+label(1200,-3950,'FORMER SHEDS REMOVED',160);
 $('#gGarden').innerHTML=s;
}
`;
  replaceOnce('function renderRooms(){', garden2D + '\nfunction renderRooms(){', '2D garden renderer');
  replaceOnce('syncWallFinishControls(); renderGrid();', 'syncWallFinishControls(); renderGrid(); renderGarden();', '2D garden render call');

  replaceOnce('const BOUNDS = {x:-700, y:-700, w:7200, h:17900};', "const BOUNDS = {x:-700, y:-700, w:7200, h:17900};\nconst SITE_VIEWS={home:BOUNDS,garden:GARDEN.bounds.garden,whole:GARDEN.bounds.whole};\nlet siteView='home';", 'site bounds');
  replaceOnce('function fitView(){\n  const W = svg.clientWidth, H = svg.clientHeight;\n  view.s = Math.min(W/BOUNDS.w, H/BOUNDS.h);\n  view.x0 = BOUNDS.x - (W/view.s - BOUNDS.w)/2; view.y0 = BOUNDS.y - (H/view.s - BOUNDS.h)/2;\n  applyView();\n}', "function fitBounds(b){\n  const W=svg.clientWidth,H=svg.clientHeight;\n  view.s=Math.min(W/b.w,H/b.h);view.x0=b.x-(W/view.s-b.w)/2;view.y0=b.y-(H/view.s-b.h)/2;applyView();\n}\nfunction fitView(){fitBounds(SITE_VIEWS[siteView]);}\nfunction setSiteView(name){siteView=name;document.querySelectorAll('#siteViews [data-site]').forEach(b=>b.classList.toggle('on',b.dataset.site===name));$('#gardenBadge').classList.toggle('show',name!=='home');fitBounds(SITE_VIEWS[name]);if(is3D())window.View3D?.viewSite(name);}", 'named 2D views');
  replaceOnce("$('#zoomIn').onclick = () => zoomCenter(1.25);", "document.querySelectorAll('#siteViews [data-site]').forEach(b=>b.onclick=()=>setSiteView(b.dataset.site));\n$('#zoomIn').onclick = () => zoomCenter(1.25);", 'site view binding');
  replaceOnce("const clone = svg.cloneNode(true), W = 3200, H = Math.round(W*BOUNDS.h/BOUNDS.w);\n  clone.setAttribute('viewBox', `${BOUNDS.x} ${BOUNDS.y} ${BOUNDS.w} ${BOUNDS.h}`);", "const clone=svg.cloneNode(true),b=SITE_VIEWS[siteView],W=3200,H=Math.round(W*b.h/b.w);\n  clone.setAttribute('viewBox',b.x+' '+b.y+' '+b.w+' '+b.h);", 'view-aware 2D export');

  const garden3D = String.raw`
function gardenRect(r,h,m,y=0){const o=box(M(r[2]-r[0]),h,M(r[3]-r[1]),m,wx((r[0]+r[2])/2),y,wz((r[1]+r[3])/2));gardenGroup.add(o);return o;}
function gardenPoly(p,h,m,y=0){const shape=new THREE.Shape();p.forEach((q,i)=>i?shape.lineTo(wx(q[0]),-wz(q[1])):shape.moveTo(wx(q[0]),-wz(q[1])));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);const o=mesh(geo,m);o.position.y=y;gardenGroup.add(o);return o;}
function gardenWall(a,b,h,m,bottom=.02,thick=.13){const dx=b[0]-a[0],dy=b[1]-a[1],o=box(M(Math.hypot(dx,dy)),h,thick,m,wx((a[0]+b[0])/2),bottom,wz((a[1]+b[1])/2));o.rotation.y=-Math.atan2(dy,dx);gardenGroup.add(o);return o;}
function gardenTree(x,y){const bark=mat('#76583c',{roughness:1}),leaf=mat('#66845a',{roughness:.95});for(const a of [-.12,.05,.13])gardenGroup.add(cyl(.08,.12,3.8,bark,wx(x)+a,.02,wz(y)+a,9));[[0,3.8,0,1.05],[.8,3.45,.2,.86],[-.8,3.5,-.1,.88],[.2,4.35,-.55,.8],[-.3,4.2,.55,.74]].forEach(q=>gardenGroup.add(blob(q[3],q[3]*.75,q[3],leaf,wx(x)+q[0],q[1],wz(y)+q[2],10)));}
function buildGardenPlants(){const dummy=new THREE.Object3D();for(const kind of ['shrub','grass','lavender']){const data=GARDEN.plants.filter(q=>q.kind===kind);if(!data.length)continue;const geo=kind==='grass'?new THREE.ConeGeometry(1,2,5):new THREE.SphereGeometry(1,8,6),im=new THREE.InstancedMesh(geo,mat(kind==='lavender'?'#89769d':kind==='grass'?'#97a379':'#718d62',{roughness:1}),data.length);data.forEach((q,i)=>{const r=M(q.radius);dummy.position.set(wx(q.p[0]),r*.7,wz(q.p[1]));dummy.scale.set(r,r*.7,r);dummy.rotation.y=i*.83;dummy.updateMatrix();im.setMatrixAt(i,dummy.matrix);});im.castShadow=im.receiveShadow=true;im.instanceMatrix.needsUpdate=true;gardenGroup.add(im);}}
function buildGarden(){
 gardenGroup=new THREE.Group();gardenGroup.name='Photo-derived stepped garden';archUp.add(gardenGroup);const c=GARDEN,soil=mat('#88745d',{roughness:1}),lawn=mat('#9ab97e',{roughness:1}),stone=mat('#d8cfbf',{roughness:.95}),path=mat('#cdbb9e',{roughness:1}),timber=mat('#a47a50',{roughness:.9}),dark=mat('#303834',{roughness:.85}),cream=mat('#ded7cc',{roughness:.95}),brick=brickMaterial();
 gardenPoly(c.plot,.035,soil,-.025);gardenPoly(c.lawn,.045,lawn,.005);gardenRect(c.patio,.055,stone,.01);gardenPoly(c.crossPath,.06,path,.015);gardenRect(c.gardenRoomTerrace,.065,timber,.01);
 for(let i=1;i<c.gardenPath.length;i++)gardenWall(c.gardenPath[i-1],c.gardenPath[i],.04,path,.025,M(c.pathWidth));for(const p of c.gardenPath)gardenGroup.add(cyl(M(c.pathWidth/2),M(c.pathWidth/2),.04,path,wx(p[0]),.025,wz(p[1]),24));
 // Continuous stepped fence; the shared neighbour wall remains until line 8.
 const fence=(a,b)=>gardenWall(a,b,1.7,mat('#837159',{roughness:1}),.02,.08);
 for(const pair of c.fences)fence(...pair);for(const k of ['left','right']){const a=c.gates[k][0],b=c.gates[k][1];gardenWall(a,b,1.55,mat('#6b5940',{roughness:1}),.02,.065);for(const p of [a,b])gardenGroup.add(box(.09,1.85,.09,timber,wx(p[0]),.02,wz(p[1])));}
 const gate=c.gates.right;for(const h of [.22,1.31])gardenWall(gate[0],gate[1],.065,timber,h,.09);gardenGroup.add(box(.09,.04,.09,dark,wx(gate[1][0]),1.08,wz(gate[1][1])+.05));
 // Retained neighbour extension: full wall and half pitched roof; height illustrative.
 gardenPoly(c.neighbour,.05,stone,.01);for(let i=0;i<c.neighbour.length;i++)gardenWall(c.neighbour[i],c.neighbour[(i+1)%c.neighbour.length],2.6,brick);
 // Close every gap under the retained half-pitched roof, including its
 // angled rear gable. The roof underside and brick infill share one plane.
 const neighbourRoofHeight=x=>3.65+Math.tan(.45)*M(x),roofVerts=[];
 for(const rise of [0,.1555])for(const p of c.neighbour)roofVerts.push(wx(p[0]),neighbourRoofHeight(p[0])+rise,wz(p[1]));
 const roofGeo=new THREE.BufferGeometry();roofGeo.setAttribute('position',new THREE.Float32BufferAttribute(roofVerts,3));roofGeo.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);roofGeo.computeVertexNormals();const neighbourRoofMat=dark.clone();neighbourRoofMat.side=THREE.DoubleSide;gardenGroup.add(mesh(roofGeo,neighbourRoofMat));
 for(let i=0;i<c.neighbour.length;i++){const a=c.neighbour[i],b=c.neighbour[(i+1)%c.neighbour.length],L=M(Math.hypot(b[0]-a[0],b[1]-a[1])),shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(L,0);shape.lineTo(L,neighbourRoofHeight(b[0])-2.62);shape.lineTo(0,neighbourRoofHeight(a[0])-2.62);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false});geo.translate(0,0,-.09);const uv=geo.attributes.uv,pos=geo.attributes.position;for(let j=0;j<uv.count;j++)uv.setXY(j,pos.getX(j)/.45,(pos.getY(j)+2.62)/.3);uv.needsUpdate=true;const infill=mesh(geo,brick);infill.position.set(wx(a[0]),2.62,wz(a[1]));infill.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);gardenGroup.add(infill);}
 // Garage placement is taken from orange photo trace, house-side of cross passage.
 const garageGroup=new THREE.Group(),g=c.garage,cx=(g[0]+g[2])/2,cy=(g[1]+g[3])/2;const original=gardenGroup;gardenGroup=garageGroup;
 gardenRect(g,.06,mat('#aaa295',{roughness:.95}),.01);const door=c.garageDoor;gardenWall([g[0],g[3]],[g[0],door.end],2.45,brick);gardenWall([g[0],door.start],[g[0],g[1]],2.45,brick);gardenWall([g[0],door.start],[g[0],door.end],2.45-.07-M(door.openingHeight),brick,.07+M(door.openingHeight));gardenWall([g[2],g[3]],[g[2],g[1]],2.45,brick);gardenWall([g[0],g[1]],[g[2],g[1]],2.45,brick);gardenWall([g[0],g[3]],[g[2],g[3]],2.45,brick);
 const part=g[0]+c.garageWidth+c.wallThickness;gardenWall([part,g[1]],[part,g[3]],2.45,brick);gardenWall([part,g[1]+c.wcDepth+c.wallThickness],[g[2],g[1]+c.wcDepth+c.wallThickness],2.45,brick);
 // One garden-facing side door; the house-facing garage wall is solid.
 const doorY=(door.start+door.end)/2,frame=mat('#eee9df'),leaf=mat('#526052',{roughness:.8});gardenGroup.add(box(.15,2.025,.028,frame,wx(g[0]),.07,wz(door.start+14)),box(.15,2.025,.028,frame,wx(g[0]),.07,wz(door.end-14)),box(.15,.041,M(door.opening),frame,wx(g[0]),2.054,wz(doorY)),box(.035,M(door.leafHeight),M(door.leaf),leaf,wx(g[0])-.045,.073,wz(doorY)),box(.018,.025,.12,mat('#b59a63',{metalness:.65}),wx(g[0])-.075,1,wz(door.end-155)));

 const half=M(g[2]-g[0])/2,roofDepth=M(g[3]-g[1])+.24,rl=box(half+.12,.13,roofDepth,dark,wx(g[0]+(g[2]-g[0])/4),2.67,wz(cy)),rr=box(half+.12,.13,roofDepth,dark,wx(g[0]+3*(g[2]-g[0])/4),2.67,wz(cy));rl.rotation.z=.17;rr.rotation.z=-.17;gardenGroup.add(rl,rr);
 gardenGroup=original;const pivot=new THREE.Group();pivot.position.set(wx(cx),0,wz(cy));garageGroup.position.set(-wx(cx),0,-wz(cy));pivot.add(garageGroup);pivot.rotation.y=-c.garageAngle*Math.PI/180;gardenGroup.add(pivot);
 // Warm timber cladding, glazed frontage, roof overhang, deck and interior fittings.
 const roomGlass=new THREE.MeshStandardMaterial({color:'#bddde3',transparent:true,opacity:.14,roughness:.08,depthWrite:false,side:THREE.DoubleSide});const roomLight=new THREE.PointLight('#fff0d8',9,7,2);roomLight.position.set(wx(4000),2.18,wz(-27200));gardenGroup.add(roomLight);
 const r=c.gardenRoom,rx=(r[0]+r[2])/2,ry=(r[1]+r[3])/2;gardenRect(r,.075,timber,.02);gardenGroup.add(box(4.25,.15,3.65,dark,wx(rx),2.7,wz(ry)),box(4,2.65,.12,timber,wx(rx),.05,wz(r[1])),box(.12,2.65,3.4,timber,wx(r[0]),.05,wz(ry)),box(.12,2.65,3.4,timber,wx(r[2]),.05,wz(ry)));
 const cladding=mat('#795631',{roughness:1});for(let x=r[0]+50;x<r[2];x+=160)gardenGroup.add(box(.028,2.6,.025,cladding,wx(x),.05,wz(r[1])-.065));for(const x of [r[0],r[2]])for(let y=r[1]+50;y<r[3];y+=160)gardenGroup.add(box(.025,2.6,.028,cladding,wx(x)+(x===r[0]?-.07:.07),.05,wz(y)));
 for(let i=0;i<4;i++){gardenGroup.add(box(.93,2.32,.025,roomGlass,wx(r[0]+500+i*1000),.1,wz(r[3])+.01),box(.045,2.43,.08,dark,wx(r[0]+i*1000),.06,wz(r[3])+.045));}gardenGroup.add(box(.045,2.43,.08,dark,wx(r[2]),.06,wz(r[3])+.045),box(4,.08,.08,dark,wx(rx),2.43,wz(r[3])+.045));
 for(let y=c.gardenRoomTerrace[1];y<c.gardenRoomTerrace[3];y+=180)gardenGroup.add(box(4,.012,.015,cladding,wx(rx),.077,wz(y)));
 gardenGroup.add(rbox(2.1,.62,.8,cream,wx(3400),.12,wz(-28200),.08),box(1.1,.06,.55,timber,wx(5250),.76,wz(-28150)),box(.05,.7,.05,dark,wx(4810),.07,wz(-28150)),box(.05,.7,.05,dark,wx(5690),.07,wz(-28150)),rbox(.6,.7,.65,cream,wx(5350),.08,wz(-27000),.05));
 // Lengthways cooking run against retained neighbour wall; loose seating/pergola.
 const cook=c.cooking,cookX=(cook[0]+cook[2])/2,cookY=(cook[1]+cook[3])/2,cookW=M(cook[2]-cook[0]),cookD=M(cook[3]-cook[1]),ovenY=cook[1]+450,bbqY=cook[3]-480;
 gardenGroup.add(box(cookW-.05,.82,cookD,brick,wx(cookX),.04,wz(cookY)),box(cookW,.07,cookD+.05,stone,wx(cookX),.86,wz(cookY)));const dome=new THREE.Mesh(new THREE.SphereGeometry(.36,16,10,0,Math.PI*2,0,Math.PI/2),brick);dome.position.set(wx(cookX),.94,wz(ovenY));gardenGroup.add(dome,box(.15,.55,.15,brick,wx(cookX),1.22,wz(ovenY)),box(.5,.06,.58,dark,wx(cookX),.95,wz(bbqY)));

 for(const x of [1650,4650])for(const y of [-5050,-3200])gardenGroup.add(box(.1,2.35,.1,timber,wx(x),.02,wz(y)));for(const x of [1650,2250,2850,3450,4050,4650])gardenGroup.add(box(.065,.12,2.05,timber,wx(x),2.28,wz(-4125)));for(const y of [-5050,-3200])gardenGroup.add(box(3.15,.12,.1,timber,wx(3150),2.28,wz(y)));
 gardenGroup.add(rbox(2.3,.62,.65,cream,wx(3000),.06,wz(-4700),.08),rbox(.65,.62,1.25,cream,wx(2000),.06,wz(-4025),.08),rbox(1.05,.33,.65,timber,wx(3375),.06,wz(-3975),.08));
 for(const b of c.beds){gardenRect(b,.32,timber,.02);gardenRect([b[0]+90,b[1]+90,b[2]-90,b[3]-90],.34,soil,.02);}gardenTree(...c.largeTree);buildGardenPlants();
 const glow=mat('#f2c977',{emissive:'#f2b84b',emissiveIntensity:.65});for(const p of c.lights)gardenGroup.add(box(.085,.4,.085,dark,wx(p[0]),.02,wz(p[1])),box(.12,.1,.12,glow,wx(p[0]),.42,wz(p[1])));
 // Keep the shared brick material unchanged; scale garden box UVs to its
 // physical 450 x 300 mm tile rather than stretching one tile over each wall.
 gardenGroup.traverse(o=>{if(o.material!==brick||o.geometry?.type!=='BoxGeometry')return;const g=o.geometry,p=g.parameters,uv=g.attributes.uv;for(let face=0;face<6;face++){const w=face<2?p.depth:p.width,h=face<2?p.height:face<4?p.depth:p.height;for(let i=face*4;i<face*4+4;i++)uv.setXY(i,uv.getX(i)*w/.45,uv.getY(i)*h/.3+(face<2||face>3?(o.position.y-p.height/2)/.3:0));}uv.needsUpdate=true;});
 gardenGroup.visible=opt.garden;
}
`;
  replaceOnce('function buildArch(){', garden3D + '\nfunction buildArch(){', '3D garden builder');
  replaceOnce('let archFloor, archUp, roofGroup, furnG, labelG, lampG, colliders = []', 'let archFloor, archUp, roofGroup, gardenGroup, furnG, labelG, lampG, colliders = []', 'garden 3D group declaration');
  replaceOnce('const opt = {cut:2.4, roof:true, furn:true, labels:false', 'const opt = {cut:2.4, roof:true, garden:true, furn:true, labels:false', 'garden option');
  replaceOnce('orbit.enableDamping = true; orbit.maxPolarAngle = Math.PI*.495; orbit.minDistance = 1.5; orbit.maxDistance = 45;', 'orbit.enableDamping = true; orbit.maxPolarAngle = Math.PI*.495; orbit.minDistance = 1.5; orbit.maxDistance = 90;', 'long-site orbit range');
  replaceOnce('Object.assign(sun.shadow.camera, {left:-11, right:11, top:11, bottom:-11, near:1, far:60});', 'Object.assign(sun.shadow.camera, {left:-48, right:48, top:48, bottom:-48, near:1, far:100});', 'whole-site shadow range');
  replaceOnce('  buildKitchenRoof();\n  [...DOORS, ...SLIDES].forEach(d => {', '  buildKitchenRoof();\n  buildGarden();\n  [...DOORS, ...SLIDES].forEach(d => {', 'garden architecture build call');
  replaceOnce("if (k === 'roof'){ roofGroup.visible=opt.roof && opt.cut>=H;", "if (k === 'garden' && gardenGroup){gardenGroup.visible=opt.garden;b.setAttribute('aria-pressed',String(opt.garden));buildLabels();}\n    if (k === 'roof'){ roofGroup.visible=opt.roof && opt.cut>=H;", 'garden visibility behaviour');

  const view3D = String.raw`
let pendingSite=null;
function viewSite(name){
  if(!active)return;if(anim){pendingSite=name;return;}pendingSite=null; if(opt.mode==='walk')setMode('orbit');
  if(name==='home')return flyTo(isoWhole());
  const b=GARDEN.bounds[name],cy=b.y+b.h/2,t=new THREE.Vector3(wx(b.x+b.w/2),0,wz(cy));
  flyTo(name==='garden'?pose(t,t.clone().add(new THREE.Vector3(20,32,26))):pose(t,t.clone().add(new THREE.Vector3(34,58,48))),1100);
}
function flyToGardenZone(id,zones){const z=zones.find(q=>q.id===id);if(!z)return;const r=z.rect,cx=(r[0]+r[2])/2,cy=(r[1]+r[3])/2,size=M(Math.max(r[2]-r[0],r[3]-r[1])),t=new THREE.Vector3(wx(cx),.45,wz(cy)),dir=camera.position.clone().sub(orbit.target).setY(0);if(dir.lengthSq()<.01)dir.set(.65,0,.75);dir.normalize();const dist=size*1.05+2.5;flyTo(pose(t,new THREE.Vector3(t.x+dir.x*dist*.72,dist*.82,t.z+dir.z*dist*.72)));}
`;
  replaceOnce('function setMode(m){', view3D + '\nfunction setMode(m){', '3D named views');
  replaceOnce("window.View3D = {enter, exit, relang, sync:() => sync(), shot, groundAt, flyToRoom:id => active && !anim && flyToRoom(id), walking:() => active && opt.mode === 'walk'};", "window.View3D = {enter, exit, relang, sync:() => sync(), shot, groundAt, viewSite, flyToRoom:id => active && !anim && flyToRoom(id), walking:() => active && opt.mode === 'walk'};", '3D view API');
  replaceOnce("const counted = ROOMS.filter(r => r.counted !== false);", "const gardenZones=opt.garden?[{id:'__garden_patio',name:'Patio',rect:GARDEN.patio},{id:'__garden_garage',name:'Garage & studio',rect:GARDEN.garage},{id:'__garden_room',name:'Garden room',rect:[2000,-29000,6000,-23900]}]:[];gardenZones.forEach(q=>{const cx=(q.rect[0]+q.rect[2])/2,cy=(q.rect[1]+q.rect[3])/2,el=document.createElement('div');el.className='rlabel';el.textContent=q.name;const o=new CSS2DObject(el);o.position.set(wx(cx),2.85,wz(cy));o.visible=labelG.visible;labelG.add(o);});\n  const counted = ROOMS.filter(r => r.counted !== false);", 'garden 3D labels and fly-to zones');
  replaceOnce("    + `<button data-room=\"__all\"><span>${tr('全屋', 'Whole home')}</span><small>${counted.reduce((a, r) => a + area(r.poly), 0).toFixed(2)} m²</small></button>`;", "    + `<button data-room=\"__all\"><span>${tr('全屋', 'Whole home')}</span><small>${counted.reduce((a, r) => a + area(r.poly), 0).toFixed(2)} m²</small></button>`\n    + (gardenZones.length?`<h4 style=\"margin:10px 2px 4px\">Garden · outdoor views</h4>${gardenZones.map(z=>`<button data-room=\"${z.id}\"><span>${z.name}</span><small>Outdoor</small></button>`).join('')}`:'');", 'outdoor room-list entries');
  replaceOnce("    b.dataset.room === '__all' ? flyTo(isoWhole()) : flyToRoom(b.dataset.room);", "    const id=b.dataset.room;id==='__all'?flyTo(isoWhole()):id.startsWith('__garden_')?flyToGardenZone(id,gardenZones):flyToRoom(id);", 'outdoor fly-to binding');

  replaceOnce("  stage.classList.remove('animating');\n}\nasync function exit(){", "  stage.classList.remove('animating');\n  if(siteView!=='home')viewSite(siteView);\n}\nasync function exit(){", 'selected site on 3D enter');
  replaceOnce("anim = null; r();", "anim = null; r(); if(pendingSite){const name=pendingSite;pendingSite=null;viewSite(name);}", 'queued site camera change');
  replaceOnce("$('#fit').onclick = fitView;", "$('#fit').onclick=()=>{fitView();if(is3D())window.View3D?.viewSite(siteView);};", '3D fit selected site');
  const must = ['const GARDEN = Object.freeze(', 'function renderGarden()', 'function buildGarden()', 'function viewSite(name)', "data-site=\"whole\"", "data-t=\"garden\""];
  for (const marker of must) assert(s.includes(marker), `Garden adaptation: missing generated marker ${marker}`);
  for(const [i,k] of ['WALLS','DOORS','SLIDES','ROOMS'].entries())assert.strictEqual(s.match(new RegExp('const '+k+' = ([\\s\\S]*?);'))?.[0],houseBefore[i],'house declaration unchanged: '+k);
  return s;
}

module.exports = {GARDEN_CONFIG, verifyGardenConfig, addGarden, plantSchedule, plantClear, garagePoly, pointInside};

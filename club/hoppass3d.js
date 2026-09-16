import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const host = document.getElementById('hoppass-3d-host');
const world = document.querySelector('.hoppass-world');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse = window.matchMedia('(pointer: coarse)');
const levelButtons = [...document.querySelectorAll('[data-hop-level]')];
const leftButton = document.querySelector('[data-hop-rotate="-1"]');
const rightButton = document.querySelector('[data-hop-rotate="1"]');
const resetButton = document.querySelector('[data-hop-reset]');
const syncButton = document.querySelector('[data-hop-sync]');
const stageIndex = document.getElementById('hoppass-stage-index');
const stageName = document.getElementById('hoppass-stage-name');
const stageCopy = document.getElementById('hoppass-stage-copy');
const tokenName = document.getElementById('hoppass-token-name');
const tokenCopy = document.getElementById('hoppass-token-copy');

const stageMeta = [
  ['EMPTY GLASS','Il viaggio parte da qui: vetro, luce e spazio.'],
  ['FIRST POUR','Il primo timbro accende il volume ambrato.'],
  ['CRAFT REGULAR','La materia cresce e i primi token orbitano.'],
  ['TAP EXPLORER','La collezione prende forma intorno al vessel.'],
  ['HOP SEEKER','La luce si fa più calda e il sistema più vivo.'],
  ['BEER HOPS INSIDER','Il vessel è quasi completo: chrome, amber, depth.'],
  ['FULL POUR','Ciclo completo: il segno Beer Hops si ricompone.']
];
const tokenMeta = [
  ['FIRST POUR','Primo passaggio nel percorso HOPPASS.'],
  ['HOP SEEKER','Un token dedicato alla curiosità craft.'],
  ['TAP EXPLORER','Il percorso entra nella fase di esplorazione.'],
  ['CRAFT REGULAR','La presenza diventa abitudine.'],
  ['BEER HOPS INSIDER','Quasi al completamento del ciclo demo.'],
  ['FULL POUR','Stato finale della simulazione HOPPASS.']
];

if (!host || !world) {
  throw new Error('HOPPASS host missing');
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true, powerPreference: coarse.matches ? 'low-power' : 'high-performance' });
} catch (error) {
  world.dataset.render = 'fallback';
}

if (!renderer) {
  world.classList.add('is-fallback');
} else {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080a08, 0.045);
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 60);
  camera.position.set(0, 0.15, 9.8);

  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse.matches ? 1.25 : 1.6));
  host.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffe2ac,0x0d1511,2.2);
  scene.add(hemi);
  const key = new THREE.PointLight(0xf2a43a,42,18,2);
  key.position.set(-3.4,3.8,4.6);
  scene.add(key);
  const cool = new THREE.DirectionalLight(0xb8d5d2,2.5);
  cool.position.set(4.4,1.4,4.2);
  scene.add(cool);
  const rim = new THREE.PointLight(0xb5d334,18,14,2);
  rim.position.set(3.2,-2.8,-1.8);
  scene.add(rim);

  const artifact = new THREE.Group();
  artifact.rotation.set(-0.08,0.35,-0.02);
  scene.add(artifact);

  const profile = [
    new THREE.Vector2(0.92,-2.55),new THREE.Vector2(1.08,-2.35),new THREE.Vector2(1.16,-1.65),
    new THREE.Vector2(1.12,-0.6),new THREE.Vector2(1.02,0.55),new THREE.Vector2(0.86,1.4),
    new THREE.Vector2(0.88,2.2),new THREE.Vector2(0.97,2.42),new THREE.Vector2(0.98,2.55)
  ];
  const vesselGeo = new THREE.LatheGeometry(profile,80);
  vesselGeo.computeVertexNormals();
  const glassMat = new THREE.MeshPhysicalMaterial({
    color:0xdde4da, roughness:0.07, metalness:0.02, transmission:0.9, transparent:true, opacity:0.66,
    thickness:0.72, ior:1.46, clearcoat:1, clearcoatRoughness:0.08, side:THREE.DoubleSide
  });
  const vessel = new THREE.Mesh(vesselGeo,glassMat);
  artifact.add(vessel);

  const beerProfile = [
    new THREE.Vector2(0.82,-2.36),new THREE.Vector2(0.96,-2.12),new THREE.Vector2(1.01,-1.4),
    new THREE.Vector2(0.99,-0.3),new THREE.Vector2(0.92,0.95),new THREE.Vector2(0.82,1.95)
  ];
  const beer = new THREE.Mesh(
    new THREE.LatheGeometry(beerProfile,72),
    new THREE.MeshPhysicalMaterial({color:0xd67f17,roughness:0.22,metalness:0.04,transparent:true,opacity:0.82,transmission:0.06,clearcoat:.55,clearcoatRoughness:.18})
  );
  artifact.add(beer);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05,1.18,.24,64),
    new THREE.MeshStandardMaterial({color:0xc7cbc4,roughness:.2,metalness:.92})
  );
  base.position.y=-2.48;
  artifact.add(base);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(.97,.055,18,96),
    new THREE.MeshStandardMaterial({color:0xd7dad4,roughness:.16,metalness:.95})
  );
  collar.rotation.x=Math.PI/2;collar.position.y=2.46;artifact.add(collar);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(1.78,.018,8,160),
    new THREE.MeshBasicMaterial({color:0xd79023,transparent:true,opacity:.2})
  );
  halo.rotation.x=.62;halo.rotation.y=.14;halo.position.z=-.4;artifact.add(halo);

  const foam = new THREE.Group();artifact.add(foam);
  const foamMat = new THREE.MeshPhysicalMaterial({color:0xfff1d0,roughness:.46,transparent:true,opacity:.9});
  for(let i=0;i<18;i++){
    const sphere=new THREE.Mesh(new THREE.SphereGeometry(.08+Math.random()*.075,14,10),foamMat);
    const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*.76;
    sphere.position.set(Math.cos(a)*r,1.8+Math.random()*.13,Math.sin(a)*r);
    foam.add(sphere);
  }

  const tokenGroup = new THREE.Group();artifact.add(tokenGroup);
  const tokens=[];
  const tokenLocked=new THREE.MeshStandardMaterial({color:0x3b403b,roughness:.42,metalness:.72,transparent:true,opacity:.5});
  const tokenLive=new THREE.MeshStandardMaterial({color:0xd9dad4,roughness:.18,metalness:.96,emissive:0x2b1b05,emissiveIntensity:.2});
  const amberCore=new THREE.MeshPhysicalMaterial({color:0xe19727,roughness:.2,metalness:.05,transparent:true,opacity:.88,transmission:.12});
  for(let i=0;i<6;i++){
    const g=new THREE.Group();g.userData.tokenIndex=i;
    const coin=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.075,32),tokenLocked.clone());
    coin.rotation.x=Math.PI/2;g.add(coin);
    const core=new THREE.Mesh(new THREE.OctahedronGeometry(.115,0),amberCore.clone());core.scale.y=1.45;g.add(core);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.195,.018,8,32),new THREE.MeshBasicMaterial({color:0xb5d334,transparent:true,opacity:.24}));ring.rotation.x=Math.PI/2;g.add(ring);
    tokenGroup.add(g);tokens.push({g,coin,core,ring,index:i});
  }

  const bubbleGeo=new THREE.SphereGeometry(.025,8,6);
  const bubbleMat=new THREE.MeshPhysicalMaterial({color:0xffd891,transparent:true,opacity:.6,roughness:.05,transmission:.4});
  const bubbles=[];
  const bubbleCount=coarse.matches?18:32;
  for(let i=0;i<bubbleCount;i++){
    const b=new THREE.Mesh(bubbleGeo,bubbleMat);
    const a=Math.random()*Math.PI*2,r=Math.random()*.72;
    b.userData.baseX=Math.cos(a)*r;b.userData.baseZ=Math.sin(a)*r;b.userData.speed=.18+Math.random()*.24;b.userData.offset=Math.random()*4.2;
    b.position.set(b.userData.baseX,-2.1+b.userData.offset,b.userData.baseZ);artifact.add(b);bubbles.push(b);
  }

  const raycaster=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  let drag=false,dragStart=0,lastX=0,targetRotY=.35,targetRotX=-.08,actualLevel=0,previewLevel=null,currentLevel=0,visible=true,raf=0,lastTime=0;
  let pointerMoved=false;

  function selectedLevel(){return previewLevel===null?actualLevel:previewLevel;}
  function updateCopy(level){
    const safe=Math.max(0,Math.min(6,Number(level)||0));
    stageIndex.textContent=String(safe).padStart(2,'0')+' / 06';
    stageName.textContent=stageMeta[safe][0];
    stageCopy.textContent=stageMeta[safe][1];
    levelButtons.forEach((button)=>button.setAttribute('aria-pressed',String(Number(button.dataset.hopLevel)===safe)));
    if(syncButton) syncButton.hidden=previewLevel===null;
  }
  function setActual(level){actualLevel=Math.max(0,Math.min(6,Number(level)||0));if(previewLevel===null)updateCopy(actualLevel);requestRender();}
  function setPreview(level){previewLevel=Math.max(0,Math.min(6,Number(level)||0));updateCopy(previewLevel);requestRender();}
  function syncActual(){previewLevel=null;updateCopy(actualLevel);requestRender();}

  function layoutTokens(level,time){
    tokens.forEach((token,i)=>{
      const unlocked=i<level;
      const angle=(i/6)*Math.PI*2+time*.00011*(i%2?1:-1);
      const radius=2.15+(i%2)*.18;
      const y=-1.35+i*.54;
      token.g.position.set(Math.cos(angle)*radius,y,Math.sin(angle)*radius*.62);
      token.g.rotation.set(.16, -angle+.5, Math.sin(angle)*.14);
      token.g.scale.setScalar(unlocked?1:.78);
      token.coin.material.color.setHex(unlocked?0xd9dad4:0x343a34);
      token.coin.material.opacity=unlocked?1:.42;
      token.core.material.opacity=unlocked?.92:.18;
      token.ring.material.opacity=unlocked?.5:.09;
    });
  }

  function resize(){
    const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;
    renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();requestRender();
  }
  function requestRender(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(draw);}
  function draw(time){
    raf=0;const dt=Math.min((time-lastTime)/1000||.016,.05);lastTime=time;const ease=reduced.matches?1:1-Math.exp(-dt*6.2);
    const target=selectedLevel();currentLevel+=(target-currentLevel)*ease;
    artifact.rotation.y+=(targetRotY-artifact.rotation.y)*ease;artifact.rotation.x+=(targetRotX-artifact.rotation.x)*ease;
    const fill=.055+.89*(currentLevel/6);beer.scale.y=fill;beer.position.y=-2.28+2.15*fill;
    foam.visible=currentLevel>.22;foam.position.y=-.15+4.15*fill;foam.scale.setScalar(.72+.28*Math.min(currentLevel/2,1));
    glassMat.opacity=.48+.18*(currentLevel/6);halo.material.opacity=.12+.32*(currentLevel/6);halo.scale.setScalar(1+.06*Math.sin(time*.0012)*(currentLevel/6));
    base.rotation.y=time*.00016;collar.rotation.z=time*.0001;
    layoutTokens(currentLevel,time);
    const beerTop=-2.2+4.12*fill;
    bubbles.forEach((b,i)=>{const span=Math.max(.25,beerTop+2.15);const p=((time*.001*b.userData.speed+b.userData.offset+i*.09)%span);b.position.y=-2.1+p;b.visible=currentLevel>.4&&b.position.y<beerTop-.05;b.position.x=b.userData.baseX+Math.sin(time*.001+i)*.025;});
    key.position.x=-3.2+Math.sin(time*.0003)*.55;
    renderer.render(scene,camera);
    const moving=Math.abs(target-currentLevel)>.002||Math.abs(targetRotY-artifact.rotation.y)>.002||drag||(!reduced.matches&&currentLevel>0);
    if(moving)requestRender();
  }

  function tokenFromEvent(event){
    const rect=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-rect.left)/rect.width)*2-1;pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(tokens.map(t=>t.coin),false);if(!hits.length)return null;
    return tokens.find(t=>t.coin===hits[0].object)||null;
  }
  function showToken(token){
    if(!token)return;const unlocked=token.index<selectedLevel();tokenName.textContent=tokenMeta[token.index][0];tokenCopy.textContent=unlocked?tokenMeta[token.index][1]:'Questo token si illumina al prossimo passaggio del percorso demo.';
  }

  renderer.domElement.addEventListener('pointerdown',(event)=>{if(event.button!==0)return;drag=true;pointerMoved=false;dragStart=event.clientX;lastX=event.clientX;renderer.domElement.setPointerCapture(event.pointerId);host.classList.add('is-dragging');});
  renderer.domElement.addEventListener('pointermove',(event)=>{
    if(drag){const dx=event.clientX-lastX;if(Math.abs(event.clientX-dragStart)>4)pointerMoved=true;targetRotY+=dx*.0075;lastX=event.clientX;requestRender();return;}
    if(!coarse.matches&&!reduced.matches){const rect=renderer.domElement.getBoundingClientRect();const nx=(event.clientX-rect.left)/rect.width-.5;const ny=(event.clientY-rect.top)/rect.height-.5;targetRotX=-.08+ny*.13;cool.position.x=4+nx*2.2;requestRender();}
  },{passive:true});
  function endDrag(event){if(!drag)return;drag=false;host.classList.remove('is-dragging');if(!pointerMoved){const token=tokenFromEvent(event);showToken(token);}requestRender();}
  renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',()=>{drag=false;host.classList.remove('is-dragging');});

  leftButton?.addEventListener('click',()=>{targetRotY-=.46;requestRender();});
  rightButton?.addEventListener('click',()=>{targetRotY+=.46;requestRender();});
  resetButton?.addEventListener('click',()=>{targetRotY=.35;targetRotX=-.08;syncActual();requestRender();});
  syncButton?.addEventListener('click',syncActual);
  levelButtons.forEach(button=>button.addEventListener('click',()=>setPreview(button.dataset.hopLevel)));

  function readProgress(){
    const wallet=document.getElementById('stamp-count');const staff=document.getElementById('staff-stamps');
    const walletVisible=wallet&&!wallet.closest('.hidden');const staffVisible=staff&&!staff.closest('.hidden');
    const value=walletVisible?wallet?.textContent:staffVisible?staff?.textContent:wallet?.textContent||staff?.textContent||0;
    const n=parseInt(value,10);setActual(Number.isFinite(n)?n:0);
  }
  const observer=new MutationObserver(readProgress);
  ['stamp-count','staff-stamps'].forEach(id=>{const node=document.getElementById(id);if(node)observer.observe(node,{childList:true,subtree:true,characterData:true});});
  const viewObserver=new MutationObserver(readProgress);['landing-view','wallet-view','staff-view'].forEach(id=>{const node=document.getElementById(id);if(node)viewObserver.observe(node,{attributes:true,attributeFilter:['class']});});

  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)requestRender();else{cancelAnimationFrame(raf);raf=0;}},{threshold:0}).observe(world);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else requestRender();});
  reduced.addEventListener('change',requestRender);
  renderer.domElement.addEventListener('webglcontextlost',(event)=>{event.preventDefault();world.classList.remove('is-webgl');world.classList.add('is-fallback');cancelAnimationFrame(raf);raf=0;});

  world.classList.add('is-webgl');world.dataset.render='webgl';
  readProgress();updateCopy(0);resize();requestRender();
}

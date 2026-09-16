import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const host=document.getElementById('hoppass-3d-host');
const world=document.querySelector('.hoppass-world');
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse=window.matchMedia('(pointer: coarse)');
const levelButtons=[...document.querySelectorAll('[data-hop-level]')];
const rotateLeft=document.querySelector('[data-hop-rotate="-1"]');
const rotateRight=document.querySelector('[data-hop-rotate="1"]');
const resetButton=document.querySelector('[data-hop-reset]');
const syncButton=document.querySelector('[data-hop-sync]');
const stageIndex=document.getElementById('hoppass-stage-index');
const stageName=document.getElementById('hoppass-stage-name');
const stageCopy=document.getElementById('hoppass-stage-copy');
const tokenName=document.getElementById('hoppass-token-name');
const tokenCopy=document.getElementById('hoppass-token-copy');

const stages=[
  ['EMPTY GLASS','Il viaggio parte da qui: vetro, luce e spazio.'],
  ['FIRST POUR','Il primo timbro accende il volume ambrato.'],
  ['CRAFT REGULAR','La materia cresce e i primi token orbitano.'],
  ['TAP EXPLORER','La collezione prende forma intorno al vessel.'],
  ['HOP SEEKER','La luce si fa più calda e il sistema più vivo.'],
  ['BEER HOPS INSIDER','Il vessel è quasi completo: chrome, amber, depth.'],
  ['FULL POUR','Ciclo completo: il segno Beer Hops si ricompone.']
];
const tokenStages=[
  ['FIRST POUR','Primo passaggio nel percorso HOPPASS.'],
  ['HOP SEEKER','Un token dedicato alla curiosità craft.'],
  ['TAP EXPLORER','Il percorso entra nella fase di esplorazione.'],
  ['CRAFT REGULAR','La presenza diventa abitudine.'],
  ['BEER HOPS INSIDER','Quasi al completamento del ciclo demo.'],
  ['FULL POUR','Stato finale della simulazione HOPPASS.']
];

if(host&&world){
  let renderer=null;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:!coarse.matches,powerPreference:coarse.matches?'low-power':'high-performance'});}catch(error){world.dataset.render='fallback';}

  if(!renderer){
    window.__HOPPASS3D_READY__=false;
    world.classList.remove('is-webgl');
    world.classList.add('is-fallback');
    world.dataset.render='fallback';
  }else{
    const scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x080a08,.045);
    const camera=new THREE.PerspectiveCamera(31,1,.1,60);camera.position.set(0,.1,9.8);
    renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse.matches?1.2:1.6));host.appendChild(renderer.domElement);

    const hemi=new THREE.HemisphereLight(0xffe2ac,0x0d1511,2.1);scene.add(hemi);
    const key=new THREE.PointLight(0xf2a43a,42,18,2);key.position.set(-3.4,3.8,4.6);scene.add(key);
    const cool=new THREE.DirectionalLight(0xb8d5d2,2.4);cool.position.set(4.4,1.4,4.2);scene.add(cool);
    const rim=new THREE.PointLight(0xb5d334,16,14,2);rim.position.set(3.2,-2.8,-1.8);scene.add(rim);

    const artifact=new THREE.Group();artifact.rotation.set(-.08,.35,-.02);scene.add(artifact);
    const vesselProfile=[new THREE.Vector2(.92,-2.55),new THREE.Vector2(1.08,-2.35),new THREE.Vector2(1.16,-1.65),new THREE.Vector2(1.12,-.6),new THREE.Vector2(1.02,.55),new THREE.Vector2(.86,1.4),new THREE.Vector2(.88,2.2),new THREE.Vector2(.97,2.42),new THREE.Vector2(.98,2.55)];
    const glassMat=new THREE.MeshPhysicalMaterial({color:0xdde4da,roughness:.07,metalness:.02,transmission:.9,transparent:true,opacity:.62,thickness:.72,ior:1.46,clearcoat:1,clearcoatRoughness:.08,side:THREE.DoubleSide});
    artifact.add(new THREE.Mesh(new THREE.LatheGeometry(vesselProfile,72),glassMat));

    const beerProfile=[new THREE.Vector2(.82,-2.36),new THREE.Vector2(.96,-2.12),new THREE.Vector2(1.01,-1.4),new THREE.Vector2(.99,-.3),new THREE.Vector2(.92,.95),new THREE.Vector2(.82,1.95)];
    const beer=new THREE.Mesh(new THREE.LatheGeometry(beerProfile,64),new THREE.MeshPhysicalMaterial({color:0xd67f17,roughness:.22,metalness:.04,transparent:true,opacity:.84,transmission:.05,clearcoat:.55,clearcoatRoughness:.18}));artifact.add(beer);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.18,.24,56),new THREE.MeshStandardMaterial({color:0xc7cbc4,roughness:.2,metalness:.92}));base.position.y=-2.48;artifact.add(base);
    const collar=new THREE.Mesh(new THREE.TorusGeometry(.97,.055,16,80),new THREE.MeshStandardMaterial({color:0xd7dad4,roughness:.16,metalness:.95}));collar.rotation.x=Math.PI/2;collar.position.y=2.46;artifact.add(collar);
    const halo=new THREE.Mesh(new THREE.TorusGeometry(1.78,.018,8,120),new THREE.MeshBasicMaterial({color:0xd79023,transparent:true,opacity:.2}));halo.rotation.x=.62;halo.rotation.y=.14;halo.position.z=-.4;artifact.add(halo);

    const foam=new THREE.Group();artifact.add(foam);const foamMat=new THREE.MeshPhysicalMaterial({color:0xfff1d0,roughness:.46,transparent:true,opacity:.9});
    for(let i=0;i<16;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.07+Math.random()*.07,12,8),foamMat);const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*.76;s.position.set(Math.cos(a)*r,Math.random()*.11,Math.sin(a)*r);foam.add(s);}

    const tokens=[];const tokenGroup=new THREE.Group();artifact.add(tokenGroup);
    const amberCore=new THREE.MeshPhysicalMaterial({color:0xe19727,roughness:.2,transparent:true,opacity:.88,transmission:.12});
    for(let i=0;i<6;i++){
      const group=new THREE.Group();group.userData.tokenIndex=i;
      const coin=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.075,28),new THREE.MeshStandardMaterial({color:0x343a34,roughness:.34,metalness:.86,transparent:true,opacity:.45}));coin.rotation.x=Math.PI/2;group.add(coin);
      const core=new THREE.Mesh(new THREE.OctahedronGeometry(.115,0),amberCore.clone());core.scale.y=1.45;group.add(core);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.195,.018,8,28),new THREE.MeshBasicMaterial({color:0xb5d334,transparent:true,opacity:.09}));ring.rotation.x=Math.PI/2;group.add(ring);
      tokenGroup.add(group);tokens.push({group,coin,core,ring,index:i});
    }

    const bubbles=[];const bubbleGeo=new THREE.SphereGeometry(.024,7,5);const bubbleMat=new THREE.MeshPhysicalMaterial({color:0xffd891,transparent:true,opacity:.62,roughness:.05,transmission:.35});
    for(let i=0;i<(coarse.matches?16:28);i++){const b=new THREE.Mesh(bubbleGeo,bubbleMat);const a=Math.random()*Math.PI*2,r=Math.random()*.7;b.userData.x=Math.cos(a)*r;b.userData.z=Math.sin(a)*r;b.userData.speed=.18+Math.random()*.24;b.userData.offset=Math.random()*4;b.position.set(b.userData.x,-2,b.userData.z);artifact.add(b);bubbles.push(b);}

    let actualLevel=0,previewLevel=null,currentLevel=0,targetRotY=.35,targetRotX=-.08,drag=false,lastX=0,dragStart=0,pointerMoved=false,visible=true,raf=0,lastTime=0;
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
    const selectedLevel=()=>previewLevel===null?actualLevel:previewLevel;
    const clampLevel=value=>Math.max(0,Math.min(6,Number(value)||0));
    function updateCopy(level){const n=clampLevel(level);stageIndex.textContent=String(n).padStart(2,'0')+' / 06';stageName.textContent=stages[n][0];stageCopy.textContent=stages[n][1];levelButtons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.hopLevel)===n)));if(syncButton)syncButton.hidden=previewLevel===null;}
    function setActual(value){const next=clampLevel(value);const changed=next!==actualLevel;actualLevel=next;if(changed)previewLevel=null;if(previewLevel===null)updateCopy(actualLevel);requestRender();}
    function setPreview(value){previewLevel=clampLevel(value);updateCopy(previewLevel);requestRender();}
    function syncActual(){previewLevel=null;updateCopy(actualLevel);requestRender();}

    function layoutTokens(level,time){tokens.forEach((token,i)=>{const unlocked=i<level;const angle=(i/6)*Math.PI*2+time*.00011*(i%2?1:-1);const radius=2.15+(i%2)*.18;token.group.position.set(Math.cos(angle)*radius,-1.35+i*.54,Math.sin(angle)*radius*.62);token.group.rotation.set(.16,-angle+.5,Math.sin(angle)*.14);token.group.scale.setScalar(unlocked?1:.78);token.coin.material.color.setHex(unlocked?0xd9dad4:0x343a34);token.coin.material.opacity=unlocked?1:.42;token.core.material.opacity=unlocked?.92:.16;token.ring.material.opacity=unlocked?.5:.08;});}
    function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();requestRender();}
    function requestRender(){if(!raf&&visible&&!document.hidden)raf=requestAnimationFrame(draw);}
    function draw(time){raf=0;const dt=Math.min((time-lastTime)/1000||.016,.05);lastTime=time;const ease=reduced.matches?1:1-Math.exp(-dt*6.2);const target=selectedLevel();currentLevel+=(target-currentLevel)*ease;artifact.rotation.y+=(targetRotY-artifact.rotation.y)*ease;artifact.rotation.x+=(targetRotX-artifact.rotation.x)*ease;
      const fill=.045+.91*(currentLevel/6);beer.scale.y=fill;beer.position.y=-2.28+2.15*fill;const beerTop=-2.16+4.05*fill;foam.visible=currentLevel>.2;foam.position.y=beerTop;foam.scale.setScalar(.72+.28*Math.min(currentLevel/2,1));glassMat.opacity=.48+.18*(currentLevel/6);halo.material.opacity=.1+.34*(currentLevel/6);halo.scale.setScalar(1+.045*Math.sin(time*.0012)*(currentLevel/6));base.rotation.y=time*.00016;collar.rotation.z=time*.0001;layoutTokens(currentLevel,time);
      bubbles.forEach((b,i)=>{const span=Math.max(.35,beerTop+2.15);const p=(time*.001*b.userData.speed+b.userData.offset+i*.08)%span;b.position.y=-2.08+p;b.visible=currentLevel>.35&&b.position.y<beerTop-.05;b.position.x=b.userData.x+Math.sin(time*.001+i)*.022;});key.position.x=-3.2+Math.sin(time*.0003)*.5;renderer.render(scene,camera);
      if(Math.abs(target-currentLevel)>.002||Math.abs(targetRotY-artifact.rotation.y)>.002||drag||(!reduced.matches&&currentLevel>0))requestRender();}

    function hitToken(event){const r=renderer.domElement.getBoundingClientRect();pointer.x=((event.clientX-r.left)/r.width)*2-1;pointer.y=-((event.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(tokens.map(t=>t.coin),false);return hits.length?tokens.find(t=>t.coin===hits[0].object):null;}
    function describeToken(token){if(!token)return;const unlocked=token.index<selectedLevel();tokenName.textContent=tokenStages[token.index][0];tokenCopy.textContent=unlocked?tokenStages[token.index][1]:'Questo token si illumina al prossimo passaggio del percorso demo.';}
    renderer.domElement.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag=true;pointerMoved=false;dragStart=event.clientX;lastX=event.clientX;renderer.domElement.setPointerCapture(event.pointerId);host.classList.add('is-dragging');});
    renderer.domElement.addEventListener('pointermove',event=>{if(drag){const dx=event.clientX-lastX;if(Math.abs(event.clientX-dragStart)>4)pointerMoved=true;targetRotY+=dx*.0075;lastX=event.clientX;requestRender();return;}if(!coarse.matches&&!reduced.matches){const r=renderer.domElement.getBoundingClientRect();const nx=(event.clientX-r.left)/r.width-.5,ny=(event.clientY-r.top)/r.height-.5;targetRotX=-.08+ny*.13;cool.position.x=4+nx*2.2;requestRender();}},{passive:true});
    renderer.domElement.addEventListener('pointerup',event=>{if(!drag)return;drag=false;host.classList.remove('is-dragging');if(!pointerMoved)describeToken(hitToken(event));requestRender();});
    renderer.domElement.addEventListener('pointercancel',()=>{drag=false;host.classList.remove('is-dragging');});
    rotateLeft?.addEventListener('click',()=>{targetRotY-=.46;requestRender();});rotateRight?.addEventListener('click',()=>{targetRotY+=.46;requestRender();});resetButton?.addEventListener('click',()=>{targetRotY=.35;targetRotX=-.08;syncActual();});syncButton?.addEventListener('click',syncActual);levelButtons.forEach(b=>b.addEventListener('click',()=>setPreview(b.dataset.hopLevel)));

    function readProgress(){const wallet=document.getElementById('stamp-count'),staff=document.getElementById('staff-stamps');const walletVisible=wallet&&!wallet.closest('.hidden'),staffVisible=staff&&!staff.closest('.hidden');const raw=walletVisible?wallet.textContent:staffVisible?staff.textContent:wallet?.textContent||staff?.textContent||0;const n=parseInt(raw,10);setActual(Number.isFinite(n)?n:0);}
    const valueObserver=new MutationObserver(readProgress);['stamp-count','staff-stamps'].forEach(id=>{const node=document.getElementById(id);if(node)valueObserver.observe(node,{childList:true,subtree:true,characterData:true});});
    const viewObserver=new MutationObserver(readProgress);['landing-view','wallet-view','staff-view'].forEach(id=>{const node=document.getElementById(id);if(node)viewObserver.observe(node,{attributes:true,attributeFilter:['class']});});
    new ResizeObserver(resize).observe(host);new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)requestRender();else{cancelAnimationFrame(raf);raf=0;}},{threshold:0}).observe(world);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else requestRender();});reduced.addEventListener('change',requestRender);
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();visible=false;window.__HOPPASS3D_READY__=false;world.dataset.render='fallback';world.classList.remove('is-webgl');world.classList.add('is-fallback');cancelAnimationFrame(raf);raf=0;});
    world.classList.remove('is-fallback');world.classList.add('is-webgl');world.dataset.render='webgl';window.__HOPPASS3D_READY__=true;readProgress();resize();requestRender();
  }
}

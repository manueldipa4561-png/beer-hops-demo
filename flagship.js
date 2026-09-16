import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.168.0/build/three.module.js';

const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer:fine)').matches;

const header=$('.site-header');
const syncHeader=()=>header?.classList.toggle('scrolled',scrollY>24);
syncHeader();addEventListener('scroll',syncHeader,{passive:true});

const toggle=$('.menu-toggle'),nav=$('.main-nav');
function closeMenu(){toggle?.classList.remove('open');nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Apri menu');document.body.style.overflow=''}
toggle?.addEventListener('click',()=>{const open=!nav?.classList.contains('open');toggle.classList.toggle('open',open);nav?.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Chiudi menu':'Apri menu');document.body.style.overflow=open?'hidden':''});
$$('.main-nav a').forEach(a=>a.addEventListener('click',closeMenu));addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});

const reveals=$$('.reveal,.image-reveal');
if('IntersectionObserver'in window&&!reduced){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -30px'});reveals.forEach(el=>io.observe(el))}else reveals.forEach(el=>el.classList.add('visible'));

if(fine&&!reduced){$$('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;el.style.transform=`translate(${x*.055}px,${y*.055}px)`});el.addEventListener('pointerleave',()=>el.style.transform='')})}

const kinetic=$('.kinetic-line'),pourLab=$('.pour-lab'),vessel=$('.pour-vessel');
let scrollTick=false,lastY=scrollY,scrollVelocity=0;
function onScrollFrame(){scrollTick=false;const y=scrollY;scrollVelocity+=(y-lastY-scrollVelocity)*.18;lastY=y;if(kinetic){const r=kinetic.parentElement.getBoundingClientRect(),p=(innerHeight-r.top)/(innerHeight+r.height);kinetic.style.setProperty('--kinetic',`${(p-.5)*-220}px`)}if(pourLab&&vessel){const r=pourLab.getBoundingClientRect(),mobilePour=innerWidth<=600,stickyTravel=Math.max(1,r.height-innerHeight),p=mobilePour?Math.max(0,Math.min(1,-r.top/stickyTravel)):Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));vessel.style.setProperty('--pour',`${34+p*48}%`)}}
addEventListener('scroll',()=>{if(!scrollTick){requestAnimationFrame(onScrollFrame);scrollTick=true}},{passive:true});onScrollFrame();

const token=$('#hoppass-token'),level=$('#token-level');
$$('[data-level]').forEach(btn=>btn.addEventListener('click',()=>{const n=Number(btn.dataset.level);$$('[data-level]').forEach(b=>b.classList.toggle('active',b===btn));if(level)level.textContent=String(n).padStart(2,'0');token?.setAttribute('aria-label',`Collectible HOPPASS, livello ${n} su 6`);if(token){token.style.filter=`saturate(${.72+n*.09}) brightness(${.86+n*.035})`;token.style.setProperty('--token-y',`${8+n*2}deg`)}}));
if(token&&fine&&!reduced){token.addEventListener('pointermove',e=>{const r=token.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;token.style.setProperty('--token-y',`${x*28}deg`);token.style.setProperty('--token-x',`${-y*22}deg`)});token.addEventListener('pointerleave',()=>{token.style.setProperty('--token-y','14deg');token.style.setProperty('--token-x','-6deg')})}

const canvas=$('#hero-canvas');
if(canvas&&window.WebGLRenderingContext){try{
  const renderer=new THREE.WebGLRenderer({canvas,antialias:innerWidth>720,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.1:1.5));renderer.setSize(innerWidth,innerHeight,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(innerWidth<700?44:37,innerWidth/innerHeight,.1,100);camera.position.set(0,0,7.2);
  const group=new THREE.Group();scene.add(group);
  const amber=new THREE.MeshPhysicalMaterial({color:0xc95b06,metalness:.08,roughness:.14,transmission:.5,thickness:1.4,ior:1.43,transparent:true,opacity:.96,clearcoat:1,clearcoatRoughness:.08});
  const dark=new THREE.MeshStandardMaterial({color:0x111611,metalness:.78,roughness:.3});
  const acid=new THREE.MeshStandardMaterial({color:0xb6d94c,metalness:.05,roughness:.35,emissive:0x1a2208,emissiveIntensity:.28});
  const knot=new THREE.Mesh(new THREE.TorusKnotGeometry(1.72,.56,180,28,2,3),amber);group.add(knot);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.25,.035,12,150),dark);ring.rotation.x=Math.PI*.5;ring.rotation.z=.35;group.add(ring);
  const inner=new THREE.Mesh(new THREE.IcosahedronGeometry(.78,2),acid);inner.scale.set(.78,1.18,.78);group.add(inner);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(2.85,.012,8,180),new THREE.MeshBasicMaterial({color:0xf2e9d7,transparent:true,opacity:.22}));halo.rotation.set(.9,.35,.15);group.add(halo);
  const key=new THREE.PointLight(0xff7a12,52,14);key.position.set(3.8,2.2,4.2);scene.add(key);const rim=new THREE.PointLight(0xc9ff66,16,11);rim.position.set(-4,-1,2);scene.add(rim);scene.add(new THREE.AmbientLight(0xf2e9d7,1.15));
  const place=()=>{if(innerWidth<700){group.position.set(.82,.75,0);group.scale.setScalar(.78)}else{group.position.set(2.42,.05,0);group.scale.setScalar(1)}};place();
  let targetX=-.12,targetY=.38,drag=false,px=0,py=0,visible=true;
  const hero=$('.hero');if('IntersectionObserver'in window&&hero){new IntersectionObserver(([e])=>visible=e.isIntersecting,{threshold:.02}).observe(hero)}
  function pointer(e){if(!fine||reduced)return;targetY=(e.clientX/innerWidth-.5)*.55+.38;targetX=(e.clientY/innerHeight-.5)*.32-.12}addEventListener('pointermove',pointer,{passive:true});
  canvas.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;canvas.setPointerCapture?.(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag)return;targetY+=(e.clientX-px)*.008;targetX+=(e.clientY-py)*.006;px=e.clientX;py=e.clientY});canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);
  const clock=new THREE.Clock();function render(){requestAnimationFrame(render);if(!visible&&!reduced)return;const t=clock.getElapsedTime();group.rotation.x+=(targetX-group.rotation.x)*.045;group.rotation.y+=(targetY-group.rotation.y)*.045;if(!reduced){knot.rotation.z=t*.09+scrollVelocity*.0008;inner.rotation.y=-t*.19;ring.rotation.z=.35+Math.sin(t*.38)*.14;group.position.y+=(Math.sin(t*.7)*.07+(innerWidth<700?.75:.05)-group.position.y)*.035}renderer.render(scene,camera);if(reduced)return}render();
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?44:37;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.1:1.5));renderer.setSize(innerWidth,innerHeight,false);place()},{passive:true});
}catch(err){document.documentElement.classList.add('webgl-fallback')}}else document.documentElement.classList.add('webgl-fallback');

const year=$('#year');if(year)year.textContent=new Date().getFullYear();
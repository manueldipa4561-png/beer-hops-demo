const mount=document.getElementById('app');
try{
  const response=await fetch('./flagship-shell.html',{cache:'no-cache'});
  if(!response.ok)throw new Error(`Shell ${response.status}`);
  mount.outerHTML=await response.text();
  await import('./flagship.js?v=20260916-2');
}catch(error){
  console.error('Beer Hops flagship bootstrap failed',error);
  mount.innerHTML='<main style="min-height:100vh;padding:40px;background:#090b0a;color:#f2e9d7;font-family:system-ui"><h1>Beer Hops</h1><p>La demo interattiva non è disponibile in questo momento.</p><p><a href="club/" style="color:#b6d94c">Apri HOPPASS</a></p></main>';
}
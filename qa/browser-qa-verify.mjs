import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'https://joyful-sprinkles-4b402e.netlify.app';
const OUT = path.resolve('qa-results-verify');
fs.mkdirSync(OUT,{recursive:true});
const cases=[
  ['1440+',1600,1000,false],['1200',1200,900,false],['1024',1024,900,false],['768',768,900,false],
  ['430',430,932,true],['390',390,844,true],['375',375,812,true],['320',320,720,true]
];
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--disable-dev-shm-usage']});
const report={baseUrl:BASE,browser:'Chromium / Playwright',results:[],failures:[]};

for(const [label,width,height,touch] of cases){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,deviceScaleFactor:1,locale:'it-IT'});
  const page=await context.newPage();
  page.setDefaultTimeout(8000);
  page.setDefaultNavigationTimeout(20000);
  const errors=[]; const pageErrors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
  const row={label,width,touch,assertions:[],consoleErrors:errors,pageErrors,passed:true};
  const ok=(name,detail='')=>row.assertions.push({name,ok:true,detail});
  const bad=(name,detail='')=>{row.passed=false;row.assertions.push({name,ok:false,detail});report.failures.push(`${label}: ${name}: ${detail}`)};
  const act=async loc=>touch?loc.tap():loc.click();
  const noOverflow=async name=>{const d=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));d.sw<=d.cw+1?ok(name,JSON.stringify(d)):bad(name,JSON.stringify(d));};
  try{
    console.log(`QA ${label}: homepage`);
    await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'}); await page.waitForTimeout(700); await noOverflow('homepage overflow');
    if(width<=640){
      const bar=page.locator('.mobile-bar'),count=await bar.locator('a').count(),visible=await bar.isVisible();
      const boxes=[];for(let i=0;i<count;i++)boxes.push(await bar.locator('a').nth(i).boundingBox());
      const within=boxes.every(b=>b&&b.x>=-.5&&b.x+b.width<=width+.5);
      visible&&count===3&&within?ok('mobile action bar'):bad('mobile action bar',JSON.stringify({visible,count,boxes}));
    }
    await page.screenshot({path:path.join(OUT,`${label.replace('+','plus')}-home.png`)});

    console.log(`QA ${label}: HOPPASS`);
    await page.goto(`${BASE}/club/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>['webgl','fallback'].includes(document.querySelector('.hoppass-world')?.dataset.render||''),null,{timeout:9000});
    row.renderState=await page.locator('.hoppass-world').getAttribute('data-render'); ok('render state',row.renderState||''); await noOverflow('club overflow');
    if(row.renderState==='webgl'){
      await act(page.locator('[data-hop-level="6"]')); await page.waitForFunction(()=>document.querySelector('#hoppass-stage-index')?.textContent?.includes('06 / 06')); ok('3D level 06');
      const sync=page.locator('[data-hop-sync]'); if(await sync.isVisible())await act(sync);
      if(touch){
        const canvas=page.locator('#hoppass-3d-host canvas'),box=await canvas.boundingBox();
        if(!box)bad('native touch drag','missing canvas bounds');
        else{
          const client=await context.newCDPSession(page); const y=box.y+box.height*.5,x1=box.x+box.width*.4,x2=box.x+box.width*.68;
          await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y}]});
          await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x2,y}]});
          await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          await page.waitForTimeout(200); ok('native touch drag');
        }
      }
    }

    console.log(`QA ${label}: loyalty + QR`);
    await act(page.locator('#demo-member-btn')); await page.locator('#wallet-view').waitFor({state:'visible'});
    (await page.locator('#stamp-count').textContent())?.trim()==='4'?ok('loyalty starts 4'):bad('loyalty starts 4');
    await act(page.locator('#present-qr')); await page.locator('#qr-present-overlay').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.activeElement?.id==='qr-present-close');
    const code=(await page.locator('#present-member-code').textContent())?.trim(),qr=await page.locator('#present-qr-box canvas,#present-qr-box img,#present-qr-box strong').count();
    code==='BH-DEMO01'&&qr>0?ok('QR presentation + focus'):bad('QR presentation + focus',JSON.stringify({code,qr,focus:await page.evaluate(()=>document.activeElement?.id)}));
    await act(page.locator('#qr-present-close'));
    await act(page.locator('#staff-switch')); await act(page.locator('#open-scanner')); await act(page.locator('#simulate-scan')); await page.locator('#staff-member').waitFor({state:'visible',timeout:6000});
    (await page.locator('#staff-stamps').textContent())?.trim()==='4'?ok('simulated QR scan'):bad('simulated QR scan');
    await act(page.locator('#add-stamp'));await act(page.locator('#add-stamp'));await page.waitForFunction(()=>document.querySelector('#staff-stamps')?.textContent?.trim()==='6');
    !(await page.locator('#redeem-reward').isDisabled())?ok('reward unlock 6'):bad('reward unlock 6');
    await act(page.locator('#redeem-reward'));((await page.locator('#staff-message').textContent())||'').includes('riscattato')?ok('reward redemption'):bad('reward redemption');
    await act(page.locator('#add-stamp'));await page.waitForFunction(()=>document.querySelector('#staff-stamps')?.textContent?.trim()==='1');ok('new cycle 1');
    await act(page.locator('#customer-switch'));await page.locator('#wallet-view').waitFor({state:'visible'});(await page.locator('#stamp-count').textContent())?.trim()==='1'?ok('wallet/staff sync'):bad('wallet/staff sync');
    if(row.renderState==='webgl'){await page.waitForFunction(()=>document.querySelector('#hoppass-stage-index')?.textContent?.includes('01 / 06'));ok('3D loyalty sync 01')}
    await noOverflow('club overflow after flow'); await page.screenshot({path:path.join(OUT,`${label.replace('+','plus')}-wallet.png`)});
    if(pageErrors.length)bad('page errors',pageErrors.join(' | ')); if(errors.length)bad('console errors',errors.join(' | '));
  }catch(e){bad('uncaught browser exception',String(e?.stack||e));try{await page.screenshot({path:path.join(OUT,`${label.replace('+','plus')}-failure.png`)})}catch{}}
  report.results.push(row); await context.close();
}
await browser.close(); report.passed=report.failures.length===0;
fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
const lines=['# Beer Hops browser verification','',`Overall: **${report.passed?'PASS':'FAIL'}**`,'','| Width | Touch | Render | Result | Console | Page errors |','|---:|:---:|:---:|:---:|---:|---:|'];
for(const r of report.results)lines.push(`| ${r.width} | ${r.touch?'yes':'no'} | ${r.renderState||'n/a'} | ${r.passed?'PASS':'FAIL'} | ${r.consoleErrors.length} | ${r.pageErrors.length} |`);
if(report.failures.length){lines.push('','## Failures',...report.failures.map(f=>`- ${f}`));}
fs.writeFileSync(path.join(OUT,'summary.md'),lines.join('\n'));console.log(lines.join('\n'));if(!report.passed)process.exit(1);

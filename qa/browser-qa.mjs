import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE_URL || 'https://joyful-sprinkles-4b402e.netlify.app';
const outDir = path.resolve('qa-results');
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { label: '1440-plus', width: 1600, height: 1000, touch: false },
  { label: '1200', width: 1200, height: 900, touch: false },
  { label: '1024', width: 1024, height: 900, touch: false },
  { label: '768', width: 768, height: 900, touch: false },
  { label: '430', width: 430, height: 932, touch: true },
  { label: '390', width: 390, height: 844, touch: true },
  { label: '375', width: 375, height: 812, touch: true },
  { label: '320', width: 320, height: 720, touch: true }
];

const browser = await chromium.launch({
  headless: true,
  args: [
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--use-angle=swiftshader',
    '--disable-dev-shm-usage'
  ]
});

const report = {
  startedAt: new Date().toISOString(),
  baseUrl: BASE,
  browser: 'Chromium / Playwright',
  viewports: [],
  fallbackTests: [],
  failures: []
};

function safeName(value) {
  return value.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
}

function collector(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => pageErrors.push(String(err?.stack || err)));
  page.on('requestfailed', req => {
    const failure = req.failure();
    failedRequests.push(`${req.method()} ${req.url()} :: ${failure?.errorText || 'request failed'}`);
  });
  return { consoleErrors, pageErrors, failedRequests };
}

async function assertNoHorizontalOverflow(page, scope = 'document') {
  return page.evaluate((scopeName) => {
    const el = scopeName === 'document' ? document.documentElement : document.querySelector(scopeName);
    if (!el) return { ok: false, reason: `missing ${scopeName}` };
    const overflow = el.scrollWidth - el.clientWidth;
    return { ok: overflow <= 1, overflow, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
  }, scope);
}

async function waitRenderState(page) {
  await page.waitForFunction(() => {
    const world = document.querySelector('.hoppass-world');
    return world && ['webgl', 'fallback'].includes(world.dataset.render || '');
  }, { timeout: 9000 });
  return page.locator('.hoppass-world').getAttribute('data-render');
}

async function interact(locator, touch) {
  if (touch) await locator.tap();
  else await locator.click();
}

async function testTouchDrag(page) {
  const canvas = page.locator('#hoppass-3d-host canvas');
  if (!(await canvas.count()) || !(await canvas.isVisible())) return { attempted: false, reason: 'no visible WebGL canvas' };
  const box = await canvas.boundingBox();
  if (!box) return { attempted: false, reason: 'no canvas bounding box' };
  const y = box.y + box.height * 0.52;
  const x1 = box.x + box.width * 0.42;
  const x2 = box.x + box.width * 0.68;
  await canvas.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 11, isPrimary: true, button: 0, buttons: 1, clientX: x1, clientY: y });
  await canvas.dispatchEvent('pointermove', { pointerType: 'touch', pointerId: 11, isPrimary: true, button: 0, buttons: 1, clientX: x2, clientY: y });
  await canvas.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 11, isPrimary: true, button: 0, buttons: 0, clientX: x2, clientY: y });
  await page.waitForTimeout(250);
  return { attempted: true, ok: true };
}

async function runViewport(vp) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    hasTouch: vp.touch,
    isMobile: vp.touch,
    deviceScaleFactor: 1,
    locale: 'it-IT'
  });
  const page = await context.newPage();
  const logs = collector(page);
  const result = {
    ...vp,
    homepage: {},
    club: {},
    loyalty: {},
    touch: {},
    consoleErrors: logs.consoleErrors,
    pageErrors: logs.pageErrors,
    failedRequests: logs.failedRequests,
    assertions: [],
    passed: true
  };
  const fail = (name, detail) => {
    result.passed = false;
    result.assertions.push({ name, ok: false, detail });
    report.failures.push(`${vp.label}: ${name}: ${detail}`);
  };
  const pass = (name, detail = '') => result.assertions.push({ name, ok: true, detail });

  try {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);
    const homeOverflow = await assertNoHorizontalOverflow(page);
    result.homepage.overflow = homeOverflow;
    homeOverflow.ok ? pass('homepage overflow') : fail('homepage overflow', JSON.stringify(homeOverflow));

    if (vp.width <= 640) {
      const bar = page.locator('.mobile-bar');
      const visible = await bar.isVisible();
      const count = await bar.locator('a').count();
      const bounds = [];
      for (let i = 0; i < count; i++) bounds.push(await bar.locator('a').nth(i).boundingBox());
      const allWithin = bounds.every(b => b && b.x >= -0.5 && b.x + b.width <= vp.width + 0.5);
      result.homepage.mobileBar = { visible, count, allWithin, bounds };
      (visible && count === 3 && allWithin) ? pass('mobile action bar') : fail('mobile action bar', JSON.stringify(result.homepage.mobileBar));
    }

    await page.screenshot({ path: path.join(outDir, `${safeName(vp.label)}-home.png`), fullPage: false });

    await page.goto(`${BASE}/club/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const renderState = await waitRenderState(page);
    result.club.renderState = renderState;
    pass('HOPPASS render state', renderState);
    await page.waitForTimeout(350);

    const clubOverflow = await assertNoHorizontalOverflow(page);
    result.club.overflow = clubOverflow;
    clubOverflow.ok ? pass('club overflow') : fail('club overflow', JSON.stringify(clubOverflow));

    if (renderState === 'webgl') {
      const level6 = page.locator('[data-hop-level="6"]');
      await interact(level6, vp.touch);
      await page.waitForFunction(() => document.querySelector('#hoppass-stage-index')?.textContent?.includes('06 / 06'));
      const name6 = await page.locator('#hoppass-stage-name').textContent();
      result.club.previewLevel6 = name6;
      name6?.includes('FULL POUR') ? pass('3D preview state 06') : fail('3D preview state 06', String(name6));
      const sync = page.locator('[data-hop-sync]');
      if (await sync.isVisible()) await interact(sync, vp.touch);
      await page.waitForFunction(() => document.querySelector('#hoppass-stage-index')?.textContent?.includes('00 / 06'));
      if (vp.touch) result.touch.drag = await testTouchDrag(page);
    } else {
      result.club.previewLevel6 = 'skipped: static fallback';
    }

    await page.screenshot({ path: path.join(outDir, `${safeName(vp.label)}-club-landing.png`), fullPage: false });

    await interact(page.locator('#demo-member-btn'), vp.touch);
    await page.locator('#wallet-view').waitFor({ state: 'visible' });
    const initialStamps = (await page.locator('#stamp-count').textContent())?.trim();
    result.loyalty.initialStamps = initialStamps;
    initialStamps === '4' ? pass('demo loyalty starts at 4') : fail('demo loyalty starts at 4', String(initialStamps));

    if (renderState === 'webgl') {
      await page.waitForFunction(() => document.querySelector('#hoppass-stage-index')?.textContent?.includes('04 / 06'));
      pass('3D syncs to wallet level 04');
    }

    await interact(page.locator('#present-qr'), vp.touch);
    await page.locator('#qr-present-overlay').waitFor({ state: 'visible' });
    const qrCodeText = (await page.locator('#present-member-code').textContent())?.trim();
    const qrChildren = await page.locator('#present-qr-box').locator('canvas,img,strong').count();
    const focusId = await page.evaluate(() => document.activeElement?.id || '');
    result.loyalty.qrOverlay = { qrCodeText, qrChildren, focusId };
    (qrCodeText === 'BH-DEMO01' && qrChildren > 0 && focusId === 'qr-present-close') ? pass('QR presentation flow') : fail('QR presentation flow', JSON.stringify(result.loyalty.qrOverlay));
    await interact(page.locator('#qr-present-close'), vp.touch);
    await page.locator('#qr-present-overlay').waitFor({ state: 'hidden' });

    await interact(page.locator('#staff-switch'), vp.touch);
    await page.locator('#staff-view').waitFor({ state: 'visible' });
    await interact(page.locator('#open-scanner'), vp.touch);
    await page.locator('#scan-view').waitFor({ state: 'visible' });
    await interact(page.locator('#simulate-scan'), vp.touch);
    await page.locator('#staff-member').waitFor({ state: 'visible', timeout: 5000 });
    const scanned = (await page.locator('#staff-stamps').textContent())?.trim();
    result.loyalty.scannedStamps = scanned;
    scanned === '4' ? pass('simulated QR scan resolves member') : fail('simulated QR scan resolves member', String(scanned));

    await interact(page.locator('#add-stamp'), vp.touch);
    await interact(page.locator('#add-stamp'), vp.touch);
    await page.waitForFunction(() => document.querySelector('#staff-stamps')?.textContent?.trim() === '6');
    const redeemDisabled = await page.locator('#redeem-reward').isDisabled();
    !redeemDisabled ? pass('reward unlocks at 6') : fail('reward unlocks at 6', 'redeem remained disabled');

    await interact(page.locator('#redeem-reward'), vp.touch);
    const redeemedMessage = (await page.locator('#staff-message').textContent())?.trim() || '';
    result.loyalty.redeemedMessage = redeemedMessage;
    redeemedMessage.includes('riscattato') ? pass('reward redemption') : fail('reward redemption', redeemedMessage);

    await interact(page.locator('#add-stamp'), vp.touch);
    await page.waitForFunction(() => document.querySelector('#staff-stamps')?.textContent?.trim() === '1');
    pass('post-redemption cycle restarts at 1');

    await interact(page.locator('#customer-switch'), vp.touch);
    await page.locator('#wallet-view').waitFor({ state: 'visible' });
    const finalWallet = (await page.locator('#stamp-count').textContent())?.trim();
    result.loyalty.finalWalletStamps = finalWallet;
    finalWallet === '1' ? pass('wallet/staff synchronization') : fail('wallet/staff synchronization', String(finalWallet));

    if (renderState === 'webgl') {
      await page.waitForFunction(() => document.querySelector('#hoppass-stage-index')?.textContent?.includes('01 / 06'));
      pass('3D syncs after loyalty mutation');
    }

    await page.screenshot({ path: path.join(outDir, `${safeName(vp.label)}-wallet.png`), fullPage: false });

    const clubOverflowAfter = await assertNoHorizontalOverflow(page);
    result.club.overflowAfterFlow = clubOverflowAfter;
    clubOverflowAfter.ok ? pass('club overflow after loyalty flow') : fail('club overflow after loyalty flow', JSON.stringify(clubOverflowAfter));

    if (logs.pageErrors.length) fail('page errors', logs.pageErrors.join(' | '));
    if (logs.consoleErrors.length) fail('console errors', logs.consoleErrors.join(' | '));
  } catch (err) {
    fail('uncaught QA exception', String(err?.stack || err));
    try { await page.screenshot({ path: path.join(outDir, `${safeName(vp.label)}-failure.png`), fullPage: false }); } catch {}
  } finally {
    await context.close();
  }
  report.viewports.push(result);
}

async function runFallback(name, setup) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const logs = collector(page);
  const result = { name, passed: true, assertions: [], consoleErrors: logs.consoleErrors, pageErrors: logs.pageErrors, failedRequests: logs.failedRequests };
  const fail = (n, d) => { result.passed = false; result.assertions.push({ name: n, ok: false, detail: d }); report.failures.push(`fallback ${name}: ${n}: ${d}`); };
  const pass = (n, d='') => result.assertions.push({ name: n, ok: true, detail: d });
  try {
    await setup(page);
    await page.goto(`${BASE}/club/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (name === 'three-blocked') {
      await page.waitForFunction(() => document.querySelector('.hoppass-world')?.dataset.render === 'fallback', { timeout: 8000 });
      const live = (await page.locator('.world-live').textContent())?.trim();
      const disabled = await page.locator('[data-hop-level="0"]').isDisabled();
      const fallbackVisible = await page.locator('.hoppass-fallback').isVisible();
      (live === 'STATIC FALLBACK' && disabled && fallbackVisible) ? pass('static 3D fallback') : fail('static 3D fallback', JSON.stringify({ live, disabled, fallbackVisible }));
      await page.locator('#demo-member-btn').tap();
      await page.locator('#wallet-view').waitFor({ state: 'visible' });
      const count = (await page.locator('#stamp-count').textContent())?.trim();
      count === '4' ? pass('loyalty usable without Three.js') : fail('loyalty usable without Three.js', String(count));
    }
    if (name === 'qr-library-blocked') {
      await page.locator('#demo-member-btn').tap();
      await page.locator('#wallet-view').waitFor({ state: 'visible' });
      const fallback = page.locator('#member-qr.qr-fallback');
      await fallback.waitFor({ state: 'visible' });
      const text = (await fallback.textContent()) || '';
      text.includes('BH-DEMO01') && text.includes('QR non disponibile') ? pass('QR text fallback') : fail('QR text fallback', text);
      await page.locator('#present-qr').tap();
      const overlayText = (await page.locator('#present-qr-box').textContent()) || '';
      overlayText.includes('BH-DEMO01') ? pass('present QR fallback') : fail('present QR fallback', overlayText);
    }
    await page.screenshot({ path: path.join(outDir, `fallback-${safeName(name)}.png`), fullPage: false });
    if (logs.pageErrors.length) fail('page errors', logs.pageErrors.join(' | '));
  } catch (err) {
    fail('uncaught fallback exception', String(err?.stack || err));
  } finally {
    await context.close();
  }
  report.fallbackTests.push(result);
}

for (const vp of viewports) await runViewport(vp);

await runFallback('three-blocked', async page => {
  await page.route('**/three@0.180.0/**', route => route.abort());
  await page.route('**/three.module.js', route => route.abort());
});

await runFallback('qr-library-blocked', async page => {
  await page.route('**/qrcode.min.js', route => route.abort());
});

report.finishedAt = new Date().toISOString();
report.passed = report.failures.length === 0;
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

const md = [];
md.push('# Beer Hops real-browser QA');
md.push('');
md.push(`- Base: ${BASE}`);
md.push(`- Browser: ${report.browser}`);
md.push(`- Overall: **${report.passed ? 'PASS' : 'FAIL'}**`);
md.push('');
md.push('| Width | Touch | Render | Result | Console errors | Page errors |');
md.push('|---:|:---:|:---:|:---:|---:|---:|');
for (const r of report.viewports) md.push(`| ${r.width} | ${r.touch ? 'yes' : 'no'} | ${r.club.renderState || 'n/a'} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.consoleErrors.length} | ${r.pageErrors.length} |`);
md.push('');
md.push('## Fallback tests');
for (const f of report.fallbackTests) md.push(`- ${f.name}: **${f.passed ? 'PASS' : 'FAIL'}**`);
if (report.failures.length) {
  md.push('');
  md.push('## Failures');
  for (const f of report.failures) md.push(`- ${f}`);
}
fs.writeFileSync(path.join(outDir, 'summary.md'), md.join('\n'));

await browser.close();
console.log(md.join('\n'));
if (!report.passed) process.exit(1);

// Touch commit: workflow-trigger marker for real-browser QA.

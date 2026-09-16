(() => {
  const STORAGE_KEY = 'beerHopsClubMembersV1';
  const ACTIVE_KEY = 'beerHopsClubActiveV1';
  const MAX_STAMPS = 6;
  const DEMO_ID = 'BH-DEMO01';
  const $ = (id) => document.getElementById(id);

  const views = {
    landing: $('landing-view'),
    signup: $('signup-view'),
    wallet: $('wallet-view'),
    staff: $('staff-view'),
    scan: $('scan-view')
  };

  let cameraStream = null;
  let detector = null;
  let scanning = false;
  let activeMember = null;
  let scanSuccessTimer = null;

  const memory = new Map();
  const storage = {
    getItem(key) { try { return localStorage.getItem(key) ?? memory.get(key) ?? null; } catch { return memory.get(key) ?? null; } },
    setItem(key,value) { memory.set(key,value); try { localStorage.setItem(key,value); } catch { $('storage-status').textContent='Salvataggio locale non disponibile: la prova dura fino alla chiusura della pagina.'; } },
    removeItem(key) { memory.delete(key); try { localStorage.removeItem(key); } catch {} }
  };
  function members() {
    try { return JSON.parse(storage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function save(all) {
    storage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  function ensureDemo() {
    const all = members();
    if (!all[DEMO_ID]) {
      all[DEMO_ID] = { id: DEMO_ID, name: 'Mario', stamps: 4, rewardRedeemed: false };
      save(all);
    }
    return all[DEMO_ID];
  }

  function stopCamera() {
    scanning = false;
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    const video = $('scanner-video');
    if (video) video.srcObject = null;
  }

  function resetScanSuccess() {
    if (scanSuccessTimer) clearTimeout(scanSuccessTimer);
    scanSuccessTimer = null;
    const success = $('scan-success');
    success?.classList.add('hidden');
    success?.classList.remove('success-active', 'success-exit');
  }

  function show(name) {
    if (name !== 'scan') stopCamera();
    Object.values(views).forEach((node) => node?.classList.add('hidden'));
    views[name]?.classList.remove('hidden');
    document.body.classList.toggle('scanner-open', name === 'scan');
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function makeId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let value = 'BH-';
    for (let i = 0; i < 6; i += 1) value += chars[Math.floor(Math.random() * chars.length)];
    return value;
  }

  function qrUrl(member) {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('member', member.id);
    return url.toString();
  }

  function renderQrInto(target, member, size = 240) {
    if (!target) return;
    target.innerHTML = '';
    target.classList.remove('qr-fallback');
    if (window.QRCode) {
      new QRCode(target, {
        text: qrUrl(member), width: size, height: size,
        colorDark: '#0a0c0a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      target.classList.add('qr-fallback');
      const code = document.createElement('strong');
      const note = document.createElement('small');
      code.textContent = member.id;
      note.textContent = 'QR non disponibile · usa il codice tessera';
      target.append(code, note);
    }
  }

  function renderQr(member) {
    renderQrInto($('member-qr'), member, 240);
  }

  function renderStamps(count) {
    const target = $('stamps');
    target.innerHTML = '';
    for (let i = 1; i <= MAX_STAMPS; i += 1) {
      const el = document.createElement('span');
      el.className = `stamp${i <= count ? ' active' : ''}`;
      el.textContent = i <= count ? '✓' : i;
      el.setAttribute('aria-label', i <= count ? `Timbro ${i} ottenuto` : `Timbro ${i} da ottenere`);
      target.appendChild(el);
    }
  }

  function renderWallet(member) {
    activeMember = member;
    $('wallet-name').textContent = member.name.toUpperCase();
    $('member-id').textContent = member.id;
    $('stamp-count').textContent = member.stamps;
    renderStamps(member.stamps);
    renderQr(member);
    const remaining = Math.max(0, MAX_STAMPS - member.stamps);
    const reward = $('reward-status');
    if (member.rewardRedeemed) {
      $('progress-copy').textContent = 'Premio riscattato. Il prossimo ciclo può ripartire da zero.';
      reward.classList.remove('unlocked');
    } else if (member.stamps >= MAX_STAMPS) {
      $('progress-copy').textContent = 'Premio sbloccato. Mostra il QR allo staff per riscattarlo.';
      reward.classList.add('unlocked');
    } else {
      $('progress-copy').textContent = remaining === 1 ? 'Ti manca 1 visita per sbloccare il premio.' : `Ti mancano ${remaining} visite per sbloccare il premio.`;
      reward.classList.remove('unlocked');
    }
  }

  function openMember(id) {
    const member = members()[id];
    if (!member) return false;
    storage.setItem(ACTIVE_KEY, id);
    renderWallet(member);
    show('wallet');
    return true;
  }

  function renderStaff(member) {
    $('staff-member').classList.remove('hidden');
    $('staff-member').dataset.memberId = member.id;
    $('staff-name').textContent = member.name;
    $('staff-id').textContent = member.id;
    $('staff-stamps').textContent = member.stamps;
    $('staff-code').value = member.id;
    $('redeem-reward').disabled = member.stamps < MAX_STAMPS || member.rewardRedeemed;
    $('staff-message').textContent = member.rewardRedeemed
      ? 'Premio già riscattato nella simulazione.'
      : member.stamps >= MAX_STAMPS ? 'Premio disponibile.' : `${MAX_STAMPS - member.stamps} timbri al premio.`;
  }

  function updateMember(mutator) {
    const id = $('staff-member').dataset.memberId;
    const all = members();
    const member = all[id];
    if (!member) return;
    mutator(member);
    all[id] = member;
    save(all);
    renderStaff(member);
    if (storage.getItem(ACTIVE_KEY) === id) renderWallet(member);
  }

  function parseMemberId(raw) {
    if (!raw) return null;
    const value = String(raw).trim();
    try {
      const url = new URL(value);
      const fromQuery = url.searchParams.get('member');
      if (fromQuery) return fromQuery.toUpperCase();
    } catch {}
    const match = value.toUpperCase().match(/BH-[A-Z0-9]{6,8}/);
    return match ? match[0] : null;
  }

  function scannerStatus(message) {
    $('scanner-status').textContent = message;
  }

  function openScanner() {
    resetScanSuccess();
    $('scanner-manual').classList.add('hidden');
    scannerStatus('Allinea il QR personale del cliente all\'interno del riquadro.');
    show('scan');
  }

  function completeScan(id) {
    const member = members()[id];
    if (!member) {
      scannerStatus('QR letto, ma questa tessera non è presente nel browser demo. Prova BH-DEMO01.');
      return false;
    }

    stopCamera();
    const success = $('scan-success');
    $('scan-success-name').textContent = member.name;
    $('scan-success-code').textContent = member.id;
    success.classList.remove('hidden', 'success-exit');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => success.classList.add('success-active'));
    });

    if ('vibrate' in navigator) navigator.vibrate?.([35, 45, 70]);

    scanSuccessTimer = setTimeout(() => {
      success.classList.add('success-exit');
      setTimeout(() => {
        success.classList.add('hidden');
        success.classList.remove('success-active', 'success-exit');
        renderStaff(member);
        show('staff');
        $('staff-member')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      }, 290);
    }, 1750);

    return true;
  }

  async function scanLoop() {
    if (!scanning || !detector || !$('scanner-video')?.srcObject) return;
    try {
      const results = await detector.detect($('scanner-video'));
      if (results?.length) {
        const id = parseMemberId(results[0].rawValue);
        if (id && completeScan(id)) return;
      }
    } catch {}
    if (scanning) requestAnimationFrame(scanLoop);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      scannerStatus('Fotocamera non disponibile in questo browser. Usa il codice manuale o la scansione demo.');
      return;
    }
    stopCamera();
    scannerStatus('Richiesta accesso alla fotocamera…');
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false
      });
      const video = $('scanner-video');
      video.srcObject = cameraStream;
      await video.play();
      $('scanner-placeholder').style.opacity = '0';

      if ('BarcodeDetector' in window) {
        const supported = await BarcodeDetector.getSupportedFormats?.();
        if (!supported || supported.includes('qr_code')) {
          detector = new BarcodeDetector({ formats: ['qr_code'] });
          scanning = true;
          scannerStatus('Fotocamera attiva. Inquadra il QR del cliente.');
          requestAnimationFrame(scanLoop);
          return;
        }
      }
      scannerStatus('Anteprima attiva. La lettura QR automatica non è supportata qui: usa il codice manuale o “Simula QR demo”.');
    } catch {
      scannerStatus('Accesso fotocamera non disponibile. Usa il codice manuale o “Simula QR demo”.');
    }
  }

  function showPresentedQr() {
    if (!activeMember) return;
    $('present-member-code').textContent = activeMember.id;
    renderQrInto($('present-qr-box'), activeMember, 340);
    $('qr-present-overlay').classList.remove('hidden');
    document.body.classList.add('qr-presenting');
  }

  function hidePresentedQr() {
    $('qr-present-overlay').classList.add('hidden');
    document.body.classList.remove('qr-presenting');
  }

  function installHoppassFallbackGuard() {
    const world = document.querySelector('.hoppass-world');
    if (!world) return;
    const live = world.querySelector('.world-live');
    const controls = [...world.querySelectorAll('[data-hop-level],[data-hop-rotate],[data-hop-reset]')];
    const syncUi = () => {
      const fallback = world.classList.contains('is-fallback') || world.dataset.render === 'fallback';
      controls.forEach((button) => {
        button.disabled = fallback;
        button.setAttribute('aria-disabled', String(fallback));
      });
      if (live) live.textContent = fallback ? 'STATIC FALLBACK' : 'REAL-TIME 3D';
    };
    new MutationObserver(syncUi).observe(world, { attributes: true, attributeFilter: ['class', 'data-render'] });
    syncUi();
    setTimeout(() => {
      if (window.__HOPPASS3D_READY__) return;
      world.classList.remove('is-webgl');
      world.classList.add('is-fallback');
      world.dataset.render = 'fallback';
      syncUi();
    }, 4500);
  }

  $('join-btn')?.addEventListener('click', () => show('signup'));
  $('demo-member-btn')?.addEventListener('click', () => { ensureDemo(); openMember(DEMO_ID); });
  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => show('landing')));

  $('signup-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!$('member-name').value.trim()) { $('member-name').setCustomValidity('Inserisci un nome fittizio.'); $('member-name').reportValidity(); return; }
    const id = makeId();
    const all = members();
    all[id] = {
      id,
      name: $('member-name').value.trim(),
      stamps: 0,
      rewardRedeemed: false
    };
    save(all);
    openMember(id);
  });

  $('new-member-btn')?.addEventListener('click', () => {
    $('signup-form').reset();
    show('signup');
  });

  $('present-qr')?.addEventListener('click', showPresentedQr);
  $('qr-present-close')?.addEventListener('click', hidePresentedQr);
  $('qr-present-overlay')?.addEventListener('click', (event) => {
    if (event.target === $('qr-present-overlay')) hidePresentedQr();
  });

  $('staff-switch')?.addEventListener('click', () => show('staff'));
  $('customer-switch')?.addEventListener('click', () => {
    const id = storage.getItem(ACTIVE_KEY);
    if (!id || !openMember(id)) show('landing');
  });

  $('open-scanner')?.addEventListener('click', openScanner);
  $('close-scanner')?.addEventListener('click', () => show('staff'));
  $('start-camera')?.addEventListener('click', startCamera);
  $('simulate-scan')?.addEventListener('click', () => {
    ensureDemo();
    scannerStatus('QR demo rilevato…');
    setTimeout(() => completeScan(DEMO_ID), 420);
  });
  $('scanner-manual-toggle')?.addEventListener('click', () => $('scanner-manual').classList.toggle('hidden'));
  $('scanner-open-code')?.addEventListener('click', () => {
    const id = parseMemberId($('scanner-code').value);
    if (!id || !completeScan(id)) scannerStatus('Codice non trovato. Prova BH-DEMO01 oppure usa una tessera creata in questo browser.');
  });
  $('scanner-code')?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') $('scanner-open-code').click();
  });

  $('staff-find')?.addEventListener('click', () => {
    const id = $('staff-code').value.trim().toUpperCase();
    const member = members()[id];
    if (member) renderStaff(member);
    else {
      $('staff-member').classList.add('hidden');
      $('staff-code').setCustomValidity('Tessera non trovata in questo browser demo.');
      $('staff-code').reportValidity();
      $('staff-code').setCustomValidity('');
    }
  });

  $('staff-demo')?.addEventListener('click', () => renderStaff(ensureDemo()));
  $('add-stamp')?.addEventListener('click', () => updateMember((member) => {
    if (member.rewardRedeemed) { member.stamps = 0; member.rewardRedeemed = false; }
    member.stamps = Math.min(MAX_STAMPS, member.stamps + 1);
  }));
  $('remove-stamp')?.addEventListener('click', () => updateMember((member) => {
    member.stamps = Math.max(0, member.stamps - 1);
    member.rewardRedeemed = false;
  }));
  $('redeem-reward')?.addEventListener('click', () => updateMember((member) => {
    if (member.stamps >= MAX_STAMPS) member.rewardRedeemed = true;
  }));

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!$('qr-present-overlay').classList.contains('hidden')) hidePresentedQr();
    else if (!views.scan.classList.contains('hidden')) {
      resetScanSuccess();
      show('staff');
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopCamera(); });
  window.addEventListener('pagehide', stopCamera);

  $('member-name').addEventListener('input',()=> $('member-name').setCustomValidity(''));
  $('reset-demo').addEventListener('click',()=>{stopCamera();storage.removeItem(STORAGE_KEY);storage.removeItem(ACTIVE_KEY);activeMember=null;ensureDemo();$('signup-form').reset();$('staff-member').classList.add('hidden');show('landing');$('storage-status').textContent='Simulazione azzerata. La tessera esempio riparte da 4 timbri.';});
  installHoppassFallbackGuard();
  ensureDemo();
  const requested = new URLSearchParams(window.location.search).get('member');
  if (requested && openMember(requested.toUpperCase())) return;
  show('landing');
})();

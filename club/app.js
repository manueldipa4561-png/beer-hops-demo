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
    staff: $('staff-view')
  };

  function members() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function save(all) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  function ensureDemo() {
    const all = members();
    if (!all[DEMO_ID]) {
      all[DEMO_ID] = { id: DEMO_ID, name: 'Mario', email: 'demo@beerhops.club', stamps: 4, rewardRedeemed: false };
      save(all);
    }
    return all[DEMO_ID];
  }

  function show(name) {
    Object.values(views).forEach((node) => node?.classList.add('hidden'));
    views[name]?.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  function renderQr(member) {
    const target = $('member-qr');
    target.innerHTML = '';
    if (window.QRCode) {
      new QRCode(target, {
        text: qrUrl(member), width: 240, height: 240,
        colorDark: '#0a0c0a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      target.textContent = member.id;
    }
  }

  function renderStamps(count) {
    const target = $('stamps');
    target.innerHTML = '';
    for (let i = 1; i <= MAX_STAMPS; i += 1) {
      const el = document.createElement('span');
      el.className = `stamp${i <= count ? ' active' : ''}`;
      el.textContent = i <= count ? '✓' : i;
      target.appendChild(el);
    }
  }

  function renderWallet(member) {
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
    localStorage.setItem(ACTIVE_KEY, id);
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
    if (localStorage.getItem(ACTIVE_KEY) === id) renderWallet(member);
  }

  $('join-btn')?.addEventListener('click', () => show('signup'));
  $('demo-member-btn')?.addEventListener('click', () => { ensureDemo(); openMember(DEMO_ID); });
  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => show('landing')));

  $('signup-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = makeId();
    const all = members();
    all[id] = {
      id,
      name: $('member-name').value.trim(),
      email: $('member-email').value.trim(),
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

  $('staff-switch')?.addEventListener('click', () => show('staff'));
  $('customer-switch')?.addEventListener('click', () => {
    const id = localStorage.getItem(ACTIVE_KEY);
    if (!id || !openMember(id)) show('landing');
  });

  $('staff-find')?.addEventListener('click', () => {
    const id = $('staff-code').value.trim().toUpperCase();
    const member = members()[id];
    if (member) renderStaff(member);
    else {
      $('staff-member').classList.add('hidden');
      alert('Tessera non trovata in questo browser demo.');
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

  ensureDemo();
  const requested = new URLSearchParams(window.location.search).get('member');
  if (requested && openMember(requested.toUpperCase())) return;
  show('landing');
})();

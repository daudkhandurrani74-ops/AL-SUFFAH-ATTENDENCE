/* perm.js: اجازت، ماڈیول لاک، ٹیچر کا پاس ورڈ (مشترک) */
(function () {
  const SUFFIX = 'suffah';
  const PAGE_FEES = !!document.getElementById('tab-gen');
  const TAB_MOD = { gen: 'fees', pay: 'fees', bills: 'bills', def: 'defaulters', exp: 'expenses', set: 'settings' };
  const ACT_MOD = {
    pay: ['fees', 1], editPay: ['fees', 1], savePay: ['fees', 1], reactivate: ['fees', 1],
    qFind: ['fees', 0], recOpen: ['fees', 0], recRun: ['fees', 0], pd: ['fees', 0], pdPrint: ['fees', 0],
    rPrint: ['fees', 0], rImg: ['fees', 0], rWa: ['fees', 0], rSms: ['fees', 0], rePrint: ['fees', 0],
    pImg: ['fees', 0], pWa: ['fees', 0], pSms: ['fees', 0], plPrint: ['fees', 0], plSendAll: ['fees', 0], pl: ['fees', 0],
    editBill: ['bills', 1], saveBill: ['bills', 1], prB: ['bills', 0], imgB: ['bills', 0], waB: ['bills', 0],
    bAll: ['bills', 0], bSel: ['bills', 0],
    dWa: ['defaulters', 0], dSms: ['defaulters', 0], dCall: ['defaulters', 0], cWa: ['defaulters', 0],
    cSim: ['defaulters', 0], dPrint: ['defaulters', 0], dSendTick: ['defaulters', 0],
    remOpen: ['defaulters', 1], saveRem: ['defaulters', 1], rApply: ['defaulters', 0],
    eSave: ['expenses', 1], eDel: ['expenses', 1],
    noteOpen: ['settings', 1], saveNote: ['settings', 1], saveCls: ['settings', 1], pct: ['settings', 1],
    pctCustom: ['settings', 1], sSave: ['settings', 1], bSelAll: ['settings', 0], bSelNone: ['settings', 0], sPick: ['settings', 0],
    reportOpen: ['reports', 0], runReport: ['reports', 0], printReport: ['reports', 0],
    status: ['attendance', 1], call: ['attendance', 0], wa: ['attendance', 0], sms: ['attendance', 0],
    copy: ['attendance', 0], file: ['attendance', 0], face: ['attendance', 1], profile: ['attendance', 0],
    form: ['admission', 0], edit: ['admission', 1], del: ['admission', 1], exit: ['records', 1]
  };
  const ID_MOD = {
    genBtn: ['fees', 1], reportBtn: ['reports', 0],
    addBtn: ['admission', 1], markAllBtn: ['attendance', 1], faceCheckBtn: ['attendance', 1],
    resetDayBtn: ['attendance', 1], restoreBtn: ['attendance', 1], recordsBtn: ['records', 0],
    sendAbsentBtn: ['attendance', 0], showAbsentBtn: ['attendance', 0],
    csvBtn: ['reports', 0], dailyBtn: ['reports', 0], weeklyBtn: ['reports', 0], monthlyBtn: ['reports', 0],
    backupBtn: ['settings', 0]
  };
  const FEE_MODS = ['fees', 'bills', 'defaulters', 'expenses', 'settings'];

  let PERM = null, CLIENT = null, firstDone = false;

  const css = document.createElement('style');
  css.textContent = '.locked{opacity:.35!important;filter:grayscale(1)!important;cursor:not-allowed!important}' +
    '#permNote{position:fixed;top:14px;left:50%;transform:translateX(-50%);background:#dc2626;color:#fff;padding:10px 16px;border-radius:10px;font-weight:bold;z-index:90;display:none;max-width:92vw;text-align:center}';
  document.head.appendChild(css);

  function note(msg) {
    let el = document.getElementById('permNote');
    if (!el) { el = document.createElement('div'); el.id = 'permNote'; document.body.appendChild(el); }
    el.textContent = msg; el.style.display = 'block';
    clearTimeout(note.t); note.t = setTimeout(() => { el.style.display = 'none'; }, 2600);
  }
  const can = (mod, edit) => (PERM ? PERM.can(mod, edit) : false);

  async function loadPerms(client) {
    const { data: { session } } = await client.auth.getSession();
    if (!session) return null;
    const uid = session.user.id;
    const { data: prof } = await client.from('user_profiles').select('role,is_active').eq('user_id', uid).maybeSingle();
    if (!prof || !prof.is_active) {
      note('یہ اکاؤنٹ فعال نہیں یا ایڈمن نے ابھی جوڑا نہیں');
      await client.auth.signOut();
      return null;
    }
    if (prof.role === 'admin') return { admin: true };
    const { data: rows } = await client.from('user_module_permissions').select('module,can_view,can_edit').eq('user_id', uid);
    const map = {};
    (rows || []).forEach(r => { map[r.module] = { v: !!r.can_view, e: !!r.can_edit }; });
    return {
      admin: false,
      can(mod, edit) { const p = map[mod]; if (!p) return false; return edit ? p.e : (p.v || p.e); }
    };
  }

  function lockEl(el, msg) { el.disabled = true; el.classList.add('locked'); el.title = msg; }

  function addBlock(name) {
    const d = document.createElement('div');
    d.id = 'permBlock';
    d.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.94);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;z-index:95;padding:20px;text-align:center;font-size:18px;font-weight:bold';
    d.innerHTML = '<div>⛔ ' + name + ' کے لیے آپ کو اجازت نہیں دی گئی</div>' +
      '<div style="font-size:14px;font-weight:normal">ایڈمن سے اجازت لیں</div>' +
      '<button id="permOut" style="border:none;border-radius:10px;padding:10px 16px;background:#dc2626;color:#fff;font-weight:bold;cursor:pointer">لاگ آؤٹ</button>';
    document.body.appendChild(d);
    document.getElementById('permOut').onclick = () => CLIENT.auth.signOut();
  }

  function applyLocks() {
    if (!PERM || PERM.admin) return;
    document.querySelectorAll('[data-tab]').forEach(b => {
      const m = TAB_MOD[b.dataset.tab];
      b.style.display = (m && !can(m, false)) ? 'none' : '';
    });
    document.querySelectorAll('[data-act]').forEach(b => {
      const m = ACT_MOD[b.dataset.act];
      if (m && !can(m[0], !!m[1])) lockEl(b, m[1] ? 'تبدیلی کی اجازت نہیں' : 'دیکھنے کی اجازت نہیں');
    });
    Object.keys(ID_MOD).forEach(id => {
      const el = document.getElementById(id);
      const m = ID_MOD[id];
      if (el && !can(m[0], !!m[1])) lockEl(el, m[1] ? 'تبدیلی کی اجازت نہیں' : 'دیکھنے کی اجازت نہیں');
    });
    document.querySelectorAll('[data-dst]').forEach(b => { if (!can('defaulters', false)) lockEl(b, 'اجازت نہیں'); });
    document.querySelectorAll('[data-k]').forEach(b => { if (!can('fees', false)) lockEl(b, 'اجازت نہیں'); });

    const needBlock = PAGE_FEES ? !FEE_MODS.some(m => can(m, false)) : !can('attendance', false);
    const existing = document.getElementById('permBlock');
    if (needBlock && !existing) addBlock(PAGE_FEES ? 'فیس' : 'حاضری');
    if (!needBlock && existing) existing.remove();
  }

  function firstTab() {
    if (firstDone || !PAGE_FEES || can('fees', false)) return;
    const vis = [...document.querySelectorAll('[data-tab]')].find(b => b.style.display !== 'none');
    firstDone = true;
    if (vis) vis.click();
  }

  function addPwBtn(client) {
    if (document.getElementById('permPw')) return;
    const b = document.createElement('button');
    b.id = 'permPw';
    b.textContent = '🔑 پاس ورڈ بدلیں';
    b.style.cssText = 'position:fixed;bottom:12px;left:12px;z-index:80;border:none;border-radius:10px;padding:9px 12px;font-weight:bold;color:#fff;background:linear-gradient(135deg,#f59e0b,#b45309);box-shadow:0 4px 0 rgba(0,0,0,.25);cursor:pointer';
    b.onclick = async () => {
      const d = prompt('نیا پاس ورڈ (1 سے 6 ہندسے):', '');
      if (d === null) return;
      const v = d.trim();
      if (!/^[0-9]{1,6}$/.test(v)) return note('صرف 1 سے 6 ہندسے لکھیں');
      const { error } = await client.auth.updateUser({ password: v + SUFFIX });
      note(error ? 'ناکام: ' + error.message : '✅ پاس ورڈ بدل گیا');
    };
    document.body.appendChild(b);
  }

  async function refresh(client) {
    try { PERM = await loadPerms(client); } catch (e) { PERM = null; }
    if (!PERM) {
      const b = document.getElementById('permPw'); if (b) b.remove();
      const k = document.getElementById('permBlock'); if (k) k.remove();
      firstDone = false;
      return;
    }
    if (!PERM.admin) addPwBtn(client);
    applyLocks();
    firstTab();
  }

  // کلک روکنے والا (لاک بٹن پر کلک نہ ہو)
  document.addEventListener('click', e => {
    if (!PERM || PERM.admin) return;
    const t = e.target.closest('[data-tab],[data-act],[data-dst],[data-k]');
    let bad = false;
    if (t) {
      if (t.dataset.tab) { const m = TAB_MOD[t.dataset.tab]; if (m && !can(m, false)) bad = true; }
      if (t.dataset.act) { const m = ACT_MOD[t.dataset.act]; if (m && !can(m[0], !!m[1])) bad = true; }
      if (t.dataset.dst && !can('defaulters', false)) bad = true;
      if (t.dataset.k && !can('fees', false)) bad = true;
    }
    const idEl = e.target.closest('button[id]');
    if (idEl && ID_MOD[idEl.id]) { const m = ID_MOD[idEl.id]; if (!can(m[0], !!m[1])) bad = true; }
    if (bad) { e.stopImmediatePropagation(); e.preventDefault(); note('اس ماڈیول کی اجازت آپ کے پاس نہیں'); }
  }, true);

  window.initPerms = function (client) {
    if (window.__permInit) return;
    window.__permInit = true;
    CLIENT = client;
    // لاگ اِن: پہلے پاس ورڈ کے ساتھ suffah، ناکامی پر سادہ پاس ورڈ (ایڈمن کے لیے)
    const orig = client.auth.signInWithPassword.bind(client.auth);
    client.auth.signInWithPassword = async cred => {
      const r = await orig({ email: cred.email, password: cred.password + SUFFIX });
      return r.error ? orig(cred) : r;
    };
    client.auth.onAuthStateChange(() => setTimeout(() => refresh(client), 0));
    let timer = null;
    new MutationObserver(() => { clearTimeout(timer); timer = setTimeout(applyLocks, 80); })
      .observe(document.body, { childList: true, subtree: true });
    refresh(client);
  };
})();

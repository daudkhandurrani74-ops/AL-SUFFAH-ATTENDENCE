/* nav.js: تمام صفحات کا مشترک مینو */
(function () {
  const PAGES = [
    { href: 'index.html', label: '🏫 حاضری', mod: 'attendance' },
    { href: 'fees.html', label: '💰 فیس', mod: 'fees' },
    { href: 'admin.html', label: '🛠 ایڈمن', mod: 'admin' }
  ];
  const here = (location.pathname.split('/').pop() || 'index.html');

  const css = document.createElement('style');
  css.textContent =
    '#siteNav{position:sticky;top:0;z-index:70;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;' +
    'background:linear-gradient(90deg,#4c1d95,#1d4ed8,#0891b2);padding:8px;margin:0 0 10px;}' +
    '#siteNav a{padding:8px 12px;border-radius:10px;color:#fff;font-weight:bold;text-decoration:none;' +
    'background:rgba(255,255,255,.2);border:2px solid #fff;font-size:14px}' +
    '#siteNav a.on{background:#fff;color:#4c1d95}';
  document.head.appendChild(css);

  const nav = document.createElement('div');
  nav.id = 'siteNav';
  nav.innerHTML = PAGES.map(p =>
    `<a href="${p.href}" data-mod="${p.mod}" class="${p.href === here ? 'on' : ''}">${p.label}</a>`
  ).join('');
  document.body.insertBefore(nav, document.body.firstChild);
})();

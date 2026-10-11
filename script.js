/* SBI Digital Banking — demo front-end behaviour */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var inr = function (n) { return '₹ ' + Math.round(n).toLocaleString('en-IN'); };

  /* ---------- greeting ---------- */
  var greet = $('#greet');
  if (greet) {
    var h = new Date().getHours();
    greet.textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  /* ---------- navbar: close on click, scroll-spy ---------- */
  var navCollapse = $('#mainNav');
  $$('#mainNav .nav-link').forEach(function (a) {
    a.addEventListener('click', function () {
      if (navCollapse && navCollapse.classList.contains('show') && window.bootstrap) {
        window.bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
      }
    });
  });

  var links = $$('#mainNav .nav-link');
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  var spyIds = Object.keys(map);
  function setActive(id) {
    links.forEach(function (a) { a.classList.remove('active'); });
    if (map[id]) map[id].classList.add('active');
  }
  function spy() {
    var y = window.scrollY + 140, current = 'home';
    spyIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= y) current = id;
    });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = spyIds[spyIds.length - 1];
    setActive(current);
  }
  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', spy);
  spy();

  /* ---------- help widget ---------- */
  var helpToggle = $('#helpToggle'), helpPanel = $('#helpPanel'), helpClose = $('#helpClose');
  function setHelp(open) {
    if (!helpPanel) return;
    helpPanel.classList.toggle('show', open);
    if (helpToggle) helpToggle.setAttribute('aria-expanded', String(open));
  }
  if (helpToggle) helpToggle.addEventListener('click', function (e) { e.stopPropagation(); setHelp(!helpPanel.classList.contains('show')); });
  if (helpClose) helpClose.addEventListener('click', function () { setHelp(false); });
  document.addEventListener('click', function (e) {
    if (helpPanel && helpPanel.classList.contains('show') && !e.target.closest('.help-widget')) setHelp(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setHelp(false); });
  var helpAction = $('.help-action');
  if (helpAction) helpAction.addEventListener('click', function () { setHelp(false); });

  /* ---------- toast ---------- */
  var toast = document.createElement('div');
  toast.className = 'demo-toast';
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  var tt;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(tt);
    tt = setTimeout(function () { toast.classList.remove('show'); }, 3600);
  }

  /* ---------- demo login (never sends anything anywhere) ---------- */
  var demoLogin = $('#demoLogin');
  if (demoLogin) {
    demoLogin.addEventListener('click', function () {
      $$('#loginModal input').forEach(function (i) { i.value = ''; });
      var m = window.bootstrap && window.bootstrap.Modal.getInstance($('#loginModal'));
      if (m) m.hide();
      showToast('Demo only — nothing was submitted. Use the official OnlineSBI link to log in.');
    });
  }

  /* ---------- partners marquee: duplicate set for seamless loop ---------- */
  var track = $('#marqueeTrack');
  if (track && !track.dataset.cloned) {
    $$('.plogo', track).forEach(function (n) {
      var c = n.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.setAttribute('tabindex', '-1');
      track.appendChild(c);
    });
    track.dataset.cloned = '1';
  }

  /* ---------- calculator ---------- */
  var cfg = {
    sip: { l1: 'Monthly investment', min: 500, max: 100000, step: 500, val: 10000, r: [1, 20, 12], t: [1, 30, 10] },
    fd:  { l1: 'Deposit amount',     min: 10000, max: 5000000, step: 10000, val: 200000, r: [3, 9, 6.5], t: [1, 10, 5] }
  };
  var mode = 'sip';
  var r1 = $('#r1'), r2 = $('#r2'), r3 = $('#r3');

  function fill(el) {
    var p = (el.value - el.min) / (el.max - el.min) * 100;
    el.style.setProperty('--p', p + '%');
  }
  function calc() {
    var P = +r1.value, rate = +r2.value, yrs = +r3.value;
    var invested, total;
    if (mode === 'sip') {
      var i = rate / 100 / 12, n = yrs * 12;
      total = i === 0 ? P * n : P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      invested = P * n;
    } else {
      total = P * Math.pow(1 + rate / 100 / 4, 4 * yrs); /* quarterly compounding */
      invested = P;
    }
    var gain = total - invested;
    $('#v1').textContent = inr(P) + (mode === 'sip' ? ' / mo' : '');
    $('#v2').textContent = rate.toFixed(1).replace('.0', '') + '%';
    $('#v3').textContent = yrs + (yrs === 1 ? ' year' : ' years');
    $('#resTotal').textContent = inr(total);
    $('#resInvested').textContent = inr(invested);
    $('#resGain').textContent = inr(gain);
    $('#barInvested').style.width = Math.max(4, invested / total * 100) + '%';
    [r1, r2, r3].forEach(fill);
  }
  function setMode(m) {
    mode = m;
    var c = cfg[m];
    $('#l1').textContent = c.l1;
    r1.min = c.min; r1.max = c.max; r1.step = c.step; r1.value = c.val;
    r2.min = c.r[0]; r2.max = c.r[1]; r2.value = c.r[2];
    r3.min = c.t[0]; r3.max = c.t[1]; r3.value = c.t[2];
    $$('.calc-tabs button').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === m); });
    calc();
  }
  if (r1 && r2 && r3) {
    $$('.calc-tabs button').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
    [r1, r2, r3].forEach(function (el) { el.addEventListener('input', calc); });
    r2.step = 0.5;
    setMode('sip');
  }
})();

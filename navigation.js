/* NINJA GLITCH - navigation.js : hash router for the dashboard */
(function () {
  var NG = window.NG = window.NG || {};

  var PAGES = {
    home: 'pages/home.html', glitch: 'pages/glitch.html', ninja: 'pages/ninja.html',
    tools: 'pages/tools.html', lab: 'pages/lab.html', rat: 'pages/rat.html',
    history: 'pages/history.html', settings: 'pages/settings.html'
  };
  var TITLES = {
    home: 'HOME', glitch: 'GLITCH LAB', ninja: 'NINJA CORE', tools: 'TOOLS',
    lab: 'LAB', rat: 'RAT SIM', history: 'HISTORY', settings: 'SETTINGS'
  };
  var NAVS = ['home', 'glitch', 'tools', 'settings'];
  var view, token = 0;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function current() {
    var n = (location.hash || '').replace('#/', '').replace('#', '');
    return PAGES[n] ? n : 'home';
  }

  async function load(name) {
    var my = ++token;
    view.classList.add('leaving');
    await sleep(140);
    if (my !== token) return;
    NG.runCleanups();
    var html;
    try {
      var ctl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var to = setTimeout(function () { if (ctl) ctl.abort(); }, 7000);
      var res = await fetch(PAGES[name], { cache: 'no-cache', signal: ctl ? ctl.signal : undefined });
      clearTimeout(to);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      html = await res.text();
    } catch (e) {
      html = '<section class="page"><div class="glass"><h2 class="neon-p">LOAD ERROR</h2>' +
        '<p class="mono mut">Tidak bisa memuat halaman. Jalankan project lewat server statis ' +
        '(mis. Vercel atau <b>python -m http.server</b>), bukan file://.</p>' +
        '<button class="btn alt" style="margin-top:12px" onclick="location.reload()">RETRY</button></div></section>';
    }
    if (my !== token) return;
    view.innerHTML = html;
    view.classList.remove('leaving');
    Array.prototype.forEach.call(view.querySelectorAll('.page > .glass'), function (el, i) {
      el.style.setProperty('--i', i);
    });
    if (NG.pages && NG.pages[name]) {
      try { NG.pages[name](view); } catch (err) { console.error(err); }
    }
    mark(name);
    window.scrollTo(0, 0);
  }

  function mark(name) {
    Array.prototype.forEach.call(document.querySelectorAll('.nav button'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-nav') === name);
    });
    var t = document.getElementById('top-title');
    if (t) t.textContent = TITLES[name];
    var back = document.getElementById('back');
    if (back) back.hidden = NAVS.indexOf(name) !== -1;
  }

  NG.Nav = {
    go: function (name) { if (PAGES[name]) location.hash = '#/' + name; },
    init: function (v) {
      view = v;
      Array.prototype.forEach.call(document.querySelectorAll('[data-nav]'), function (b) {
        b.addEventListener('click', function () { NG.beep(520, 0.05); NG.Nav.go(b.getAttribute('data-nav')); });
      });
      var back = document.getElementById('back');
      if (back) back.addEventListener('click', function () { NG.Nav.go('home'); });
      document.addEventListener('click', function (e) {
        var el = e.target.closest ? e.target.closest('[data-go]') : null;
        if (el) { NG.beep(520, 0.05); NG.Nav.go(el.getAttribute('data-go')); }
      });
      window.addEventListener('hashchange', function () { load(current()); });
      load(current());
    }
  };
})();

/* NINJA GLITCH - app.js : screen controllers + dashboard pages (all local simulation) */
(function () {
  var NG = window.NG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- page lifecycle helpers ---------- */
  var cleanups = [];
  NG.onLeave = function (fn) { cleanups.push(fn); };
  NG.runCleanups = function () {
    while (cleanups.length) { try { cleanups.pop()(); } catch (e) {} }
  };
  NG.every = function (fn, ms) {
    var id = setInterval(fn, ms);
    NG.onLeave(function () { clearInterval(id); });
    return id;
  };
  NG.loop = function (fn) {
    var on = true, last = 0;
    function f(t) {
      if (!on) return;
      requestAnimationFrame(f);
      if (document.hidden) return;
      var slow = document.body.classList.contains('no-anim');
      if (slow && t - last < 500) return;
      last = t; fn(t);
    }
    requestAnimationFrame(f);
    var stop = function () { on = false; };
    NG.onLeave(stop);
    return stop;
  };
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  NG.applySettings();
  NG.addSweep();

  /* ====================== INTRO ====================== */
  function intro() {
    /* progress, SKIP and auto-continue live in the inline script of index.html
       (independent of this file); here we only add the particles. */
    Particles.start($('#fx'));
  }

  /* ====================== LOGIN / FINGERPRINT / LOADING ====================== */
  function login() {
    Particles.start($('#fx'));
    var stages = ['login', 'scan', 'load'];
    function show(n) {
      stages.forEach(function (s) { $('#stage-' + s).hidden = (s !== n); });
      var el = $('#stage-' + n);
      el.classList.remove('stage-in'); void el.offsetWidth; el.classList.add('stage-in');
    }
    /* ---- session: already logged in -> continue the flow, never ask twice ---- */
    if (NG.session.isVerified()) { location.replace('dashboard.html'); return; }
    var resumeScan = NG.session.isLoggedIn();

    /* ---- exact-match credentials (case-sensitive). Client-side only. ---- */
    var VALID_USER = 'Ninja67';
    var VALID_PASS = 'Glitch76';

    var form = $('#login-form'), err = $('#login-err');
    var inUser = $('#username'), inPass = $('#password');

    function deny() {
      err.textContent = 'ACCESS DENIED - INVALID CREDENTIALS';
      inPass.value = '';                 /* user can retry; inputs stay enabled */
      NG.glitchBurst(form, 500);
      NG.beep(180, 0.15);
      try { inPass.focus(); } catch (x) {}
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();                /* never reload the page */
      var username = inUser.value;
      var password = inPass.value;
      if (username === VALID_USER && password === VALID_PASS) {
        err.textContent = '';
        inPass.value = '';
        NG.session.login(VALID_USER);
        if (!NG.session.isLoggedIn()) { err.textContent = 'STORAGE BLOCKED - ENABLE BROWSER STORAGE'; return; }
        NG.history.add('Login completed');
        NG.beep(740, 0.1);
        show('scan');
      } else {
        deny();
      }
    });

    NG.Fingerprint.init({
      btn: $('#fp'), status: $('#fp-status'), pct: $('#fp-pct'), fill: $('#fp-fill'),
      onDone: function () { NG.session.verify(); show('load'); startLoad(); }
    });

    if (resumeScan) show('scan');       /* logged in but fingerprint not finished */

    var loadTimer, went = false;
    function goDash() {
      if (went) return; went = true;
      if (loadTimer) loadTimer.cancel();
      location.href = 'dashboard.html';
    }
    function startLoad() {
      NG.history.add('Ninja Core initialized');
      var msgs = ['BOOTING CORE', 'CALIBRATING ORBIT', 'LOADING MODULES', 'CORE ONLINE'];
      loadTimer = NG.progress({
        bar: $('#load-bar'), label: $('#load-pct'), duration: 5000,
        onTick: function (p) { $('#load-sub').textContent = msgs[Math.min(3, Math.floor(p / 26))]; },
        onDone: function () { setTimeout(goDash, 300); }
      });
      setTimeout(goDash, 9000); /* hard fallback: never stuck on loading */
    }
    NG.tap($('#load-skip'), goDash);
  }

  /* ====================== DASHBOARD SHELL ====================== */
  var t0 = Date.now();
  function dash() {
    var u = NG.store.get('user');
    if (!NG.session.isVerified() || !u || !u.codename) { location.replace('login.html'); return; }
    $('#top-code').textContent = u.codename;
    Particles.start($('#fx'), { count: 28 });
    try {
      if (!sessionStorage.getItem('ngf_dash')) { sessionStorage.setItem('ngf_dash', '1'); NG.history.add('Dashboard opened'); }
    } catch (e) {}
    NG.Nav.init($('#view'));
  }

  /* ====================== PAGES ====================== */
  NG.pages = {};

  /* ---- HOME ---- */
  NG.pages.home = function (root) {
    var u = NG.store.get('user') || { codename: 'AGENT' };
    $('#h-code', root).textContent = u.codename;

    var core = 92;
    NG.every(function () {
      core = Math.max(86, Math.min(100, core + Math.round(rnd(-3, 3))));
      $('#h-core', root).textContent = core + '%';
      $('#h-ring', root).style.setProperty('--v', core);
      var up = Math.floor((Date.now() - t0) / 1000);
      $('#h-up', root).textContent = pad(Math.floor(up / 3600)) + ':' + pad(Math.floor(up % 3600 / 60)) + ':' + pad(up % 60);
      [['cpu', 18, 70], ['mem', 35, 65], ['sig', 60, 95], ['shd', 94, 100]].forEach(function (s) {
        var v = Math.round(rnd(s[1], s[2]));
        $('#s-' + s[0], root).textContent = v + '%';
        $('#sb-' + s[0], root).style.width = v + '%';
      });
    }, 2000);

    function renderLogs() {
      var box = $('#h-logs', root), l = NG.history.list().slice(0, 5);
      box.innerHTML = '';
      if (!l.length) { box.innerHTML = '<div class="item mut">Belum ada aktivitas.</div>'; return; }
      l.forEach(function (x) {
        var d = document.createElement('div'); d.className = 'item';
        var a = document.createElement('span'); a.textContent = x.text;
        var b = document.createElement('span'); b.className = 't'; b.textContent = NG.fmtDate(x.t);
        d.appendChild(a); d.appendChild(b); box.appendChild(d);
      });
    }
    renderLogs();

    var con = $('#h-con', root);
    var lines = [['boot sequence started', 'info'], ['core: online', ''], ['modules mounted: 7/7', ''],
      ['mode: LOCAL SIMULATION', 'warn'], ['awaiting command...', 'dim']];
    lines.forEach(function (l, i) { setTimeout(function () { if (con.isConnected) NG.logLine(con, l[0], l[1]); }, 300 + i * 450); });
    var beats = ['heartbeat ok', 'orbit stable', 'shield nominal', 'signal sync ok'];
    NG.every(function () { NG.logLine(con, beats[Math.floor(Math.random() * beats.length)], 'dim'); }, 4500);

    $('#h-clear', root).addEventListener('click', function () { con.innerHTML = ''; NG.logLine(con, 'console cleared', 'info'); });
  };

  /* ---- GLITCH LAB ---- */
  NG.pages.glitch = function (root) {
    NG.history.add('Glitch Lab opened');
    var term = $('#g-term', root), panel = $('#g-panel', root);
    var run = $('#g-run', root), bar = $('#g-bar', root), pct = $('#g-pct', root), state = $('#g-state', root);
    var running = false, handle = null, step = 0;
    var script = [
      [5, 'allocating virtual buffer...', ''], [20, 'injecting visual noise layer', 'info'],
      [38, 'desync scanlines (sim)', 'warn'], [55, 'rendering chromatic shift', 'info'],
      [72, 'stabilizing frame output', ''], [90, 'flushing buffer', ''], [100, 'glitch cycle complete (simulation)', 'info']
    ];
    function ind(i, on, txt) {
      var d = $('#gi' + i, root); d.className = 'dot' + (on === 1 ? '' : on === 2 ? ' warn' : ' off');
      $('#gv' + i, root).textContent = txt;
    }
    function reset() {
      if (handle) handle.cancel(); running = false; step = 0;
      bar.style.width = '0'; pct.textContent = '0%'; state.textContent = 'IDLE'; run.disabled = false;
      ind(1, 0, 'IDLE'); ind(2, 0, 'IDLE'); ind(3, 0, 'IDLE');
    }
    NG.logLine(term, 'glitch lab ready', 'info');
    run.addEventListener('click', function () {
      if (running) return;
      running = true; step = 0; run.disabled = true; state.textContent = 'PROCESSING';
      NG.logLine(term, 'start glitch simulation', 'info');
      ind(1, 1, 'ACTIVE'); ind(2, 2, 'NOISY'); ind(3, 1, 'ACTIVE');
      handle = NG.progress({
        bar: bar, label: pct, duration: 6000,
        onTick: function (p) {
          while (step < script.length && p >= script[step][0]) {
            NG.logLine(term, script[step][1], script[step][2]);
            if (script[step][2] === 'warn') NG.glitchBurst(panel, 700);
            NG.beep(400 + p * 4, 0.05); step++;
          }
        },
        onDone: function () {
          running = false; run.disabled = false; state.textContent = 'COMPLETE';
          ind(1, 1, 'CLEAN'); ind(2, 1, 'STABLE'); ind(3, 1, 'DONE');
          NG.history.add('Glitch simulation completed');
        }
      });
      NG.onLeave(function () { if (handle) handle.cancel(); });
    });
    $('#g-reset', root).addEventListener('click', function () { reset(); term.innerHTML = ''; NG.logLine(term, 'reset', 'dim'); });
  };

  /* ---- NINJA CORE ---- */
  NG.pages.ninja = function (root) {
    NG.history.add('Ninja Core opened');
    var pf = Particles.start($('#n-canvas', root), { count: 24 });
    NG.onLeave(function () { pf.stop(); });
    var e = 40, bar = $('#n-bar', root), val = $('#n-val', root), st = $('#n-state', root);
    function draw() {
      e = Math.max(0, Math.min(100, e));
      bar.style.width = e + '%'; val.textContent = Math.round(e) + '%';
      st.textContent = e > 90 ? 'OVERCHARGED' : e < 15 ? 'LOW' : 'STABLE';
      st.className = 'mono ' + (e > 90 ? 'neon-p' : e < 15 ? 'mut' : 'neon-c');
    }
    draw();
    $('#n-charge', root).addEventListener('click', function () { e += 15; NG.beep(500 + e * 3, 0.06); draw(); });
    $('#n-vent', root).addEventListener('click', function () { e -= 25; draw(); });
    NG.every(function () { e -= 1; draw(); }, 1200);
  };

  /* ---- TOOLS ---- */
  NG.pages.tools = function (root) {
    var stops = [];
    function stopAll() { stops.forEach(function (s) { s(); }); stops = []; }
    NG.onLeave(stopAll);

    var tabs = $$('#t-tabs button', root);
    var map = { scan: '#t-scan', signal: '#t-signal', device: '#t-device', net: '#t-net' };
    tabs.forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-tool');
        tabs.forEach(function (x) { x.classList.toggle('active', x === b); });
        Object.keys(map).forEach(function (m) { $(map[m], root).hidden = (m !== k); });
        stopAll();
        if (k === 'signal') signal();
        if (k === 'device') device();
        if (k === 'net') net();
      });
    });

    /* system scan (local checks) */
    var scanning = false;
    $('#ts-run', root).addEventListener('click', function () {
      if (scanning) return; scanning = true;
      var list = $('#ts-list', root); list.innerHTML = '';
      var storageOk = true; try { localStorage.setItem('ngf_t', '1'); localStorage.removeItem('ngf_t'); } catch (x) { storageOk = false; }
      var checks = [
        ['Display ' + screen.width + 'x' + screen.height, true],
        ['Animation engine', !document.body.classList.contains('no-anim')],
        ['Local storage', storageOk],
        ['Network status', navigator.onLine],
        ['Canvas renderer', !!document.createElement('canvas').getContext]
      ];
      var shown = 0;
      var h = NG.progress({
        bar: $('#ts-bar', root), label: $('#ts-pct', root), duration: 3500,
        onTick: function (p) {
          while (shown < checks.length && p >= (shown + 1) * 18) {
            var c = checks[shown++], d = document.createElement('div'); d.className = 'item';
            d.innerHTML = '<span></span><b class="mono"></b>';
            d.firstChild.textContent = c[0];
            d.lastChild.textContent = c[1] ? 'OK' : 'WARN';
            d.lastChild.className = 'mono ' + (c[1] ? 'neon-g' : 'neon-p');
            list.appendChild(d);
          }
        },
        onDone: function () { scanning = false; NG.history.add('System scan completed'); NG.toast('SCAN COMPLETE'); }
      });
      NG.onLeave(function () { h.cancel(); });
    });

    function signal() {
      var c = $('#sg-canvas', root), s = NG.sizeCanvas(c), t = 0;
      stops.push(NG.loop(function () {
        t += 0.06; var ctx = s.ctx; ctx.clearRect(0, 0, s.w, s.h);
        ctx.strokeStyle = 'rgba(0,240,255,.12)'; ctx.lineWidth = 1;
        for (var gy = 0; gy < s.h; gy += 25) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(s.w, gy); ctx.stroke(); }
        var amp = 0.5 + 0.4 * Math.sin(t * 0.3), f = 2 + Math.sin(t * 0.1);
        ctx.lineWidth = 2; ctx.strokeStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 8;
        ctx.beginPath();
        for (var x = 0; x < s.w; x += 3) {
          var y = s.h / 2 + Math.sin(x * 0.03 * f + t) * s.h * 0.3 * amp + Math.sin(x * 0.11 + t * 2) * s.h * 0.06;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.shadowBlur = 0;
        $('#sg-f', root).textContent = (f * 100).toFixed(0) + ' Hz';
        $('#sg-a', root).textContent = amp.toFixed(2);
      }));
    }

    function device() {
      var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (x) {}
      var rows = [
        ['Platform', navigator.platform || '-'], ['Language', navigator.language || '-'],
        ['Screen', screen.width + 'x' + screen.height], ['Viewport', innerWidth + 'x' + innerHeight],
        ['Pixel ratio', String(window.devicePixelRatio || 1)], ['CPU threads', String(navigator.hardwareConcurrency || '-')],
        ['Online', navigator.onLine ? 'yes' : 'no'], ['Timezone', tz || '-'], ['Touch points', String(navigator.maxTouchPoints || 0)]
      ];
      var kv = $('#td-kv', root); kv.innerHTML = '';
      rows.forEach(function (r) {
        var a = document.createElement('span'), b = document.createElement('span');
        a.textContent = r[0]; b.textContent = r[1]; kv.appendChild(a); kv.appendChild(b);
      });
      NG.history.add('Device info viewed');
    }

    function net() {
      var c = $('#nv-canvas', root), s = NG.sizeCanvas(c), nodes = [];
      for (var i = 0; i < 14; i++) nodes.push({ x: rnd(10, s.w - 10), y: rnd(10, s.h - 10), vx: rnd(-.3, .3), vy: rnd(-.3, .3) });
      var pulse = 0;
      stops.push(NG.loop(function () {
        var ctx = s.ctx; ctx.clearRect(0, 0, s.w, s.h); pulse = (pulse + 0.02) % 1;
        nodes.forEach(function (n) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 6 || n.x > s.w - 6) n.vx *= -1; if (n.y < 6 || n.y > s.h - 6) n.vy *= -1;
        });
        for (var a = 0; a < nodes.length; a++) for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 95) {
            ctx.strokeStyle = 'rgba(180,77,255,' + (1 - d / 95) * 0.7 + ')'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
            if (a % 3 === 0) {
              var px = nodes[a].x + (nodes[b].x - nodes[a].x) * pulse, py = nodes[a].y + (nodes[b].y - nodes[a].y) * pulse;
              ctx.fillStyle = '#39ff88'; ctx.beginPath(); ctx.arc(px, py, 2, 0, 6.3); ctx.fill();
            }
          }
        }
        nodes.forEach(function (n, i) {
          ctx.fillStyle = i % 2 ? '#00f0ff' : '#b44dff'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(n.x, n.y, 3, 0, 6.3); ctx.fill();
        });
        ctx.shadowBlur = 0;
      }));
    }
  };

  /* ---- LAB ---- */
  NG.pages.lab = function (root) {
    NG.history.add('Lab console opened');
    var term = $('#l-term', root), bar = $('#l-bar', root), pct = $('#l-pct', root), state = $('#l-state', root);
    var busy = false;
    NG.logLine(term, 'lab console ready. type "help"', 'info');
    function experiment(name) {
      if (busy) { NG.logLine(term, 'experiment already running', 'warn'); return; }
      busy = true; state.textContent = 'RUNNING';
      NG.logLine(term, 'experiment "' + name + '" started (simulation)', 'info');
      var h = NG.progress({
        bar: bar, label: pct, duration: 4500,
        onDone: function () { busy = false; state.textContent = 'DONE'; NG.logLine(term, 'experiment "' + name + '" finished', 'info'); }
      });
      NG.onLeave(function () { h.cancel(); });
    }
    var cmds = {
      help: function () { ['help, status, scan, run <name>, whoami, credits, clear'].forEach(function (x) { NG.logLine(term, x); }); },
      status: function () { NG.logLine(term, 'core online | mode SIM | threads ' + (navigator.hardwareConcurrency || 4)); },
      scan: function () { NG.logLine(term, 'scanning local sandbox...', 'info'); setTimeout(function () { NG.logLine(term, 'no anomalies (simulated)'); }, 900); },
      whoami: function () { var u = NG.store.get('user'); NG.logLine(term, u ? u.codename : 'guest'); },
      credits: function () { ['DEVELOPER ZAKSS', 'DEVELOPER DAKA', 'DEVELOPER NATHAN'].forEach(function (x) { NG.logLine(term, x, 'info'); }); },
      clear: function () { term.innerHTML = ''; }
    };
    $('#l-form', root).addEventListener('submit', function (ev) {
      ev.preventDefault();
      var inp = $('#l-in', root), raw = inp.value.trim(); inp.value = '';
      if (!raw) return;
      NG.logLine(term, '> ' + raw, 'dim');
      var parts = raw.split(/\s+/), c = parts[0].toLowerCase();
      if (c === 'run') experiment(parts.slice(1).join(' ') || 'default');
      else if (cmds[c]) cmds[c]();
      else NG.logLine(term, 'unknown command: ' + c, 'err');
    });
    NG.every(function () {
      $('#lc-1', root).textContent = rnd(.2, .9).toFixed(2);
      $('#lc-2', root).textContent = Math.round(rnd(8, 30)) + 'ms';
      $('#lc-3', root).textContent = String(Math.round(rnd(2, 8)));
    }, 1800);
  };

  /* ---- RAT SIM (fictional UI only) ---- */
  NG.pages.rat = function (root) {
    NG.history.add('RAT Sim opened (simulation)');
    var devices = [['SIM-DEVICE-ALPHA', 'Fictional Phone A1'], ['SIM-DEVICE-BRAVO', 'Fictional Tablet B2'], ['SIM-DEVICE-CHARLIE', 'Fictional Laptop C3']];
    var list = $('#r-list', root), term = $('#r-term', root);
    var dot = $('#r-dot', root), stat = $('#r-status', root), bar = $('#r-bar', root), pct = $('#r-pct', root);
    var handle = null;
    NG.logLine(term, 'SIMULATION ONLY - no real devices', 'warn');
    devices.forEach(function (d) {
      var it = document.createElement('div'); it.className = 'item';
      var l = document.createElement('span'); l.innerHTML = '<b></b><br><small class="mut"></small>';
      l.querySelector('b').textContent = d[0]; l.querySelector('small').textContent = d[1];
      var b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm alt'; b.textContent = 'CONNECT (SIM)';
      b.addEventListener('click', function () {
        if (handle) handle.cancel();
        dot.className = 'dot warn'; stat.textContent = 'SIMULATING ' + d[0];
        NG.logLine(term, 'sim connect -> ' + d[0], 'info');
        var seq = [[25, 'handshake (fake)'], [55, 'fake telemetry stream'], [85, 'fake status packet']], i = 0;
        handle = NG.progress({
          bar: bar, label: pct, duration: 3500,
          onTick: function (p) { while (i < seq.length && p >= seq[i][0]) NG.logLine(term, seq[i++][1]); },
          onDone: function () { dot.className = 'dot'; stat.textContent = 'SIMULATED LINK (FICTIONAL)'; NG.logLine(term, 'simulation complete - nothing was connected', 'warn'); }
        });
        NG.onLeave(function () { if (handle) handle.cancel(); });
      });
      it.appendChild(l); it.appendChild(b); list.appendChild(it);
    });
  };

  /* ---- HISTORY ---- */
  NG.pages.history = function (root) {
    var box = $('#hi-list', root);
    function render() {
      box.innerHTML = '';
      var l = NG.history.list();
      if (!l.length) { box.innerHTML = '<div class="item mut">Riwayat kosong.</div>'; return; }
      l.forEach(function (x) {
        var d = document.createElement('div'); d.className = 'item';
        var a = document.createElement('span'); a.textContent = x.text;
        var b = document.createElement('span'); b.className = 't'; b.textContent = NG.fmtDate(x.t);
        d.appendChild(a); d.appendChild(b); box.appendChild(d);
      });
    }
    render();
    $('#hi-clear', root).addEventListener('click', function () { NG.history.clear(); render(); NG.toast('HISTORY CLEARED'); });
  };

  /* ---- SETTINGS ---- */
  NG.pages.settings = function (root) {
    var s = NG.settings.get();
    var map = { 'st-anim': 'animation', 'st-fx': 'effects', 'st-snd': 'sound' };
    Object.keys(map).forEach(function (id) {
      var el = $('#' + id, root); el.checked = !!s[map[id]];
      el.addEventListener('change', function () { NG.settings.set(map[id], el.checked); NG.toast(map[id].toUpperCase() + (el.checked ? ' ON' : ' OFF')); });
    });
    var who = NG.store.get('user');
    var sUser = $('#st-user', root);
    if (sUser) sUser.textContent = who && who.codename ? who.codename : '-';

    /* logout: ends the session only (history and settings are kept) */
    NG.tap($('#st-logout', root), function () {
      NG.session.logout();
      location.href = 'login.html';
    });

    /* reset: two-step confirm (window.confirm is unreliable in some Android webviews) */
    var resetBtn = $('#st-reset', root), armed = false, armTimer = null;
    NG.tap(resetBtn, function () {
      if (!armed) {
        armed = true; resetBtn.textContent = 'TAP AGAIN TO CONFIRM RESET';
        armTimer = setTimeout(function () { armed = false; resetBtn.textContent = 'RESET LOCAL DATA'; }, 4000);
        return;
      }
      clearTimeout(armTimer);
      NG.store.clearAll();
      location.href = 'login.html';
    });
    NG.onLeave(function () { clearTimeout(armTimer); });
  };

  /* ====================== BOOT ====================== */
  function boot() {
    var screenName = document.body.getAttribute('data-screen');
    try {
      if (screenName === 'intro') intro();
      else if (screenName === 'login') login();
      else if (screenName === 'dashboard') dash();
    } catch (err) {
      console.error('NINJA GLITCH boot error', err);
      if (screenName === 'login') { /* keep the page usable */ }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

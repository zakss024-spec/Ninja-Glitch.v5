/* NINJA GLITCH - storage.js : localStorage helpers (settings, history, user) */
(function () {
  var NG = window.NG = window.NG || {};
  var P = 'ngf_';

  NG.store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(P + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(P + k); } catch (e) {} },
    clearAll: function () {
      try {
        Object.keys(localStorage).filter(function (k) { return k.indexOf(P) === 0; })
          .forEach(function (k) { localStorage.removeItem(k); });
        sessionStorage.clear();
      } catch (e) {}
      NG.session.logout();
    }
  };

  /* ---- login session (local only) ---- */
  var LOGIN_KEY = 'ninjaLoggedIn', VERIFY_KEY = 'ninjaVerified';
  function rawGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function rawSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function rawDel(k) { try { localStorage.removeItem(k); } catch (e) {} }

  NG.session = {
    isLoggedIn: function () { return rawGet(LOGIN_KEY) === 'true'; },
    /* fingerprint finished for the current login */
    isVerified: function () { return rawGet(LOGIN_KEY) === 'true' && rawGet(VERIFY_KEY) === 'true'; },
    login: function (name) {
      rawSet(LOGIN_KEY, 'true'); rawDel(VERIFY_KEY);
      NG.store.set('user', { codename: name, at: Date.now() });
    },
    verify: function () { rawSet(VERIFY_KEY, 'true'); },
    logout: function () {
      rawDel(LOGIN_KEY); rawDel(VERIFY_KEY); NG.store.del('user');
      try { sessionStorage.removeItem('ngf_dash'); } catch (e) {}
    }
  };

  NG.settings = {
    defaults: { animation: true, effects: true, sound: false },
    get: function () { return Object.assign({}, this.defaults, NG.store.get('settings', {})); },
    set: function (k, v) {
      var s = this.get(); s[k] = v; NG.store.set('settings', s);
      if (NG.applySettings) NG.applySettings();
    }
  };

  NG.history = {
    add: function (text) {
      var l = NG.store.get('history', []);
      l.unshift({ t: Date.now(), text: text });
      NG.store.set('history', l.slice(0, 100));
    },
    list: function () { return NG.store.get('history', []); },
    clear: function () { NG.store.set('history', []); }
  };

  NG.fmtDate = function (ts) {
    var d = new Date(ts), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  };
})();

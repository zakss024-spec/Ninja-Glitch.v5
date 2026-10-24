/* NINJA GLITCH - fingerprint.js : interactive (simulated) fingerprint scan */
(function () {
  var NG = window.NG = window.NG || {};

  NG.Fingerprint = {
    init: function (o) {
      var busy = false;

      function run() {
        if (busy) return;
        busy = true;
        o.btn.classList.add('scanning');
        o.status.textContent = 'SCANNING...';
        o.pct.textContent = '0%';
        var p = 0;
        var t = setInterval(function () {
          p += 10;
          o.pct.textContent = p + '%';
          if (o.fill) o.fill.style.height = p + '%';
          NG.beep(300 + p * 6, 0.05);
          if (p >= 100) {
            clearInterval(t);
            o.btn.classList.remove('scanning');
            o.btn.classList.add('granted');
            o.status.textContent = 'ACCESS GRANTED';
            NG.beep(990, 0.18);
            NG.history.add('Fingerprint scan completed');
            setTimeout(function () { if (o.onDone) o.onDone(); }, 1000);
          }
        }, 280);
      }

      NG.tap(o.btn, run);
      return { run: run };
    }
  };
})();

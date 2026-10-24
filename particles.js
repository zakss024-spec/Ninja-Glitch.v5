/* NINJA GLITCH - particles.js : lightweight neon particle canvas */
(function () {
  window.Particles = {
    start: function (canvas, opt) {
      if (!canvas) return { stop: function () {} };
      opt = opt || {};
      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var colors = ['#b44dff', '#00f0ff', '#39ff88'];
      var w = 0, h = 0, parts = [], alive = true, cleared = false;

      function size() {
        w = canvas.clientWidth || window.innerWidth;
        h = canvas.clientHeight || window.innerHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      function init() {
        var n = opt.count || (w < 500 ? 32 : 56);
        parts = [];
        for (var i = 0; i < n; i++) {
          parts.push({
            x: Math.random() * w, y: Math.random() * h,
            r: Math.random() * 1.8 + 0.6,
            vx: (Math.random() - 0.5) * 0.35, vy: -(Math.random() * 0.5 + 0.1),
            c: colors[i % 3], a: Math.random() * 0.6 + 0.3
          });
        }
      }
      function frame() {
        if (!alive) return;
        requestAnimationFrame(frame);
        if (document.hidden) return;
        var b = document.body.classList;
        if (b.contains('no-fx') || b.contains('no-anim')) {
          if (!cleared) { ctx.clearRect(0, 0, w, h); cleared = true; }
          return;
        }
        cleared = false;
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.x += p.vx; p.y += p.vy;
          if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
          if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
          ctx.globalAlpha = p.a;
          ctx.fillStyle = p.c; ctx.shadowColor = p.c; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      }
      size(); init(); frame();
      var onResize = function () { size(); init(); };
      window.addEventListener('resize', onResize);
      return { stop: function () { alive = false; window.removeEventListener('resize', onResize); } };
    }
  };
})();

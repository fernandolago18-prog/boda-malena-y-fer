/* ============================================================================
   MOTOR LIGERO DE PARTÍCULAS (CONFETI, ARROZ NUPCIAL, DESTELLOS Y GOTAS)
   ============================================================================ */

(function () {
  var canvas = null;
  var ctx = null;
  var particles = [];
  var rafId = null;
  var dpr = 1;

  function ensureCanvas() {
    if (!canvas) {
      canvas = document.getElementById('global-particles');
      if (!canvas) return false;
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
    }
    return Boolean(ctx);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  }

  function spawn(count, factory) {
    if (!ensureCanvas()) return;
    for (var i = 0; i < count; i++) {
      particles.push(factory(i, count));
    }
    if (!rafId) {
      rafId = requestAnimationFrame(tick);
    }
  }

  function tick() {
    if (!ctx || !canvas) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    var next = [];
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.age += 1;
      if (p.age >= p.life) continue;

      p.vx *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;

      var alpha = 1 - Math.pow(p.age / p.life, 1.8);
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.shape === 'rice') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.48, p.size * 1.15, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'gold-heart') {
        var hs = p.size;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, hs * 0.35);
        ctx.bezierCurveTo(hs * 0.6, -hs * 0.45, hs * 1.35, hs * 0.35, 0, hs * 1.2);
        ctx.bezierCurveTo(-hs * 1.35, hs * 0.35, -hs * 0.6, -hs * 0.45, 0, hs * 0.35);
        ctx.fill();
      } else if (p.shape === 'sad-drop') {
        var ds = p.size;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -ds);
        ctx.quadraticCurveTo(ds * 0.9, ds * 0.3, 0, ds);
        ctx.quadraticCurveTo(-ds * 0.9, ds * 0.3, 0, -ds);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      }

      ctx.restore();
      next.push(p);
    }

    particles = next;
    if (particles.length > 0) {
      rafId = requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      rafId = null;
    }
  }

  function defaultOrigin(x, y) {
    return {
      x: typeof x === 'number' ? x : window.innerWidth * 0.5,
      y: typeof y === 'number' ? y : window.innerHeight * 0.45
    };
  }

  function celebrate(x, y) {
    var o = defaultOrigin(x, y);
    var colors = ['#C5A059', '#E5C886', '#4A5A42', '#FAF7F2', '#B97A5E'];
    spawn(68, function () {
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
      var speed = 4 + Math.random() * 9;
      return {
        x: o.x,
        y: o.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        gravity: 0.22,
        drag: 0.985,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.24,
        size: 4 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.random() > 0.22 ? 'confetti' : 'rice',
        life: 95 + Math.random() * 45,
        age: 0
      };
    });
  }

  function riceShower(x, y) {
    var o = defaultOrigin(x, y);
    spawn(36, function () {
      var angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      var speed = 3 + Math.random() * 6.5;
      var isHeart = Math.random() > 0.78;
      return {
        x: o.x + (Math.random() - 0.5) * 32,
        y: o.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        gravity: 0.2,
        drag: 0.988,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.18,
        size: isHeart ? 6.5 : 4.5 + Math.random() * 2,
        color: isHeart ? '#C5A059' : '#FFFDF8',
        shape: isHeart ? 'gold-heart' : 'rice',
        life: 75 + Math.random() * 35,
        age: 0
      };
    });
  }

  function sadRain(x, y) {
    var o = defaultOrigin(x, y);
    spawn(24, function () {
      return {
        x: o.x + (Math.random() - 0.5) * 140,
        y: o.y - 20 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 1.6,
        vy: 1.5 + Math.random() * 2.5,
        gravity: 0.08,
        drag: 0.995,
        rot: (Math.random() - 0.5) * 0.3,
        vRot: (Math.random() - 0.5) * 0.04,
        size: 6.5,
        color: Math.random() > 0.45 ? '#8E3F33' : '#7E8E74',
        shape: 'sad-drop',
        life: 70 + Math.random() * 30,
        age: 0
      };
    });
  }

  function sparkles(x, y) {
    var o = defaultOrigin(x, y);
    var colors = ['#E5C886', '#C5A059', '#FFFDF8'];
    spawn(28, function () {
      var angle = Math.random() * Math.PI * 2;
      var speed = 1.8 + Math.random() * 5.2;
      return {
        x: o.x,
        y: o.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.04,
        drag: 0.96,
        rot: 0,
        vRot: 0,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: 'spark',
        life: 48 + Math.random() * 22,
        age: 0
      };
    });
  }

  window.BodaParticles = {
    celebrate: celebrate,
    riceShower: riceShower,
    sadRain: sadRain,
    sparkles: sparkles
  };
})();

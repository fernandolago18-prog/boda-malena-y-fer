/* ============================================================================
   MOTOR VIDEO-SCROLL CINEMATOGRÁFICO (TRANSICIONES FLUIDAS + FUNDIDO FINAL)
   ============================================================================ */

(function () {
  var cfg = null;
  var sectionEl = null;
  var trackEl = null;
  var stageEl = null;
  var bgContainer = null;
  var chaptersContainer = null;
  var dotsContainer = null;
  var progressFill = null;
  var goldThread = null;
  var goldLength = 0;
  var exitVeilEl = null;
  var hudEl = null;

  var particleCanvas = null;
  var particleCtx = null;
  var motes = [];

  var videoCanvas = null;
  var videoCanvasCtx = null;
  var loadedFrames = [];
  var lastDrawnFrame = -1;

  var videoEl = null;
  var bgLayers = [];
  var chapterEls = [];
  var dotEls = [];

  var targetProgress = 0;
  var currentProgress = 0;
  var prevProgress = 0;
  var scrollVelocity = 0;
  var lastFrameTs = 0;
  var lastRenderedProgress = -1;

  // Altura de viewport estable: en móvil la barra del navegador cambia innerHeight al hacer scroll
  var isTouch = Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  var stableViewportH = window.innerHeight;
  var lastViewportW = window.innerWidth;
  var canvasDpr = 1;

  function updateViewportMetrics(force) {
    var w = window.innerWidth;
    var h = window.innerHeight;
    if (force || w !== lastViewportW || Math.abs(h - stableViewportH) > 140) {
      stableViewportH = h;
      lastViewportW = w;
      return true;
    }
    return false;
  }

  // Rango narrativo con meseta final cómoda antes del fundido de salida (0.84 -> 1.00)
  var STORY_START = 0.02;
  var STORY_END = 0.84;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function smootherstep(edge0, edge1, x) {
    var span = edge1 - edge0;
    if (Math.abs(span) < 0.0001) return x >= edge1 ? 1 : 0;
    var t = clamp((x - edge0) / span, 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function buildDOM() {
    var chapters = cfg.cinema.chapters || [];
    bgContainer.innerHTML = '';
    chaptersContainer.innerHTML = '';
    dotsContainer.innerHTML = '';
    bgLayers = [];
    chapterEls = [];
    dotEls = [];

    chapters.forEach(function (ch, idx) {
      if (cfg.cinema.mode === 'storyboard') {
        var bg = document.createElement('div');
        bg.className = 'cinema-bg-layer';
        bg.style.backgroundImage = "url('" + ch.image + "')";
        bg.style.zIndex = String(idx + 1);
        bgContainer.appendChild(bg);
        bgLayers.push(bg);
      }

      var panel = document.createElement('article');
      panel.className = 'cinema-chapter';
      panel.setAttribute('data-chapter-index', String(idx));
      panel.innerHTML =
        '<span class="cinema-eyebrow">' + ch.eyebrow + '</span>' +
        '<h2 class="cinema-title">' + ch.title + '</h2>' +
        '<p class="cinema-text">' + ch.text + '</p>' +
        '<div class="cinema-polaroid">✦ ' + ch.polaroidCaption + '</div>';
      chaptersContainer.appendChild(panel);
      chapterEls.push({
        root: panel,
        eyebrow: panel.querySelector('.cinema-eyebrow'),
        title: panel.querySelector('.cinema-title'),
        text: panel.querySelector('.cinema-text'),
        polaroid: panel.querySelector('.cinema-polaroid')
      });

      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'cinema-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Escena ' + (idx + 1) + ' de ' + chapters.length);
      dot.addEventListener('click', function () {
        scrollToChapter(idx);
      });
      dotsContainer.appendChild(dot);
      dotEls.push(dot);
    });
  }

  function initMediaMode() {
    var mode = cfg.cinema.mode || 'storyboard';

    if (mode === 'video-frames' && videoCanvas) {
      bgContainer.classList.add('is-hidden');
      videoCanvas.classList.remove('is-hidden');
      videoCanvasCtx = videoCanvas.getContext('2d');
      preloadVideoFrames();
    } else if (mode === 'video-direct' && videoEl) {
      bgContainer.classList.add('is-hidden');
      videoEl.classList.remove('is-hidden');
      videoEl.src = cfg.cinema.videoDirect.src;
      if (cfg.cinema.videoDirect.poster) {
        videoEl.poster = cfg.cinema.videoDirect.poster;
      }
      videoEl.load();
    }
  }

  function preloadVideoFrames() {
    var vf = cfg.cinema.videoFrames;
    if (!vf || !vf.frameCount) return;
    loadedFrames = new Array(vf.frameCount);

    for (var i = 1; i <= vf.frameCount; i++) {
      (function (index) {
        var num = String(index).padStart(vf.padLength || 4, '0');
        var img = new Image();
        img.src = vf.folder + vf.prefix + num + '.' + vf.extension;
        img.onload = function () {
          loadedFrames[index - 1] = img;
          if (index === 1 && lastDrawnFrame === -1) {
            drawFrame(0);
          }
        };
      })(i);
    }
  }

  function drawFrame(frameIdx) {
    if (!videoCanvasCtx || !videoCanvas) return;
    var img = loadedFrames[frameIdx];
    if (!img) return;

    var w = videoCanvas.width;
    var h = videoCanvas.height;
    var imgRatio = img.width / img.height;
    var canvasRatio = w / h;
    var drawW, drawH, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      drawH = h;
      drawW = h * imgRatio;
      offsetX = (w - drawW) / 2;
      offsetY = 0;
    } else {
      drawW = w;
      drawH = w / imgRatio;
      offsetX = 0;
      offsetY = (h - drawH) / 2;
    }

    videoCanvasCtx.clearRect(0, 0, w, h);
    videoCanvasCtx.drawImage(img, offsetX, offsetY, drawW, drawH);
    lastDrawnFrame = frameIdx;
  }

  function initMotes() {
    if (!particleCanvas) return;
    particleCtx = particleCanvas.getContext('2d');
    motes = [];
    var moteCount = isTouch ? 18 : 34;
    for (var i = 0; i < moteCount; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: 1.2 + Math.random() * 2.6,
        vx: (Math.random() - 0.5) * 0.00042,
        vy: -0.00022 - Math.random() * 0.00045,
        alpha: 0.22 + Math.random() * 0.46
      });
    }
    resizeCanvases();
  }

  function resizeCanvases() {
    var dpr = Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2);
    canvasDpr = dpr;
    var w = window.innerWidth;
    var h = stableViewportH;

    if (particleCanvas) {
      particleCanvas.width = Math.floor(w * dpr);
      particleCanvas.height = Math.floor(h * dpr);
    }

    if (videoCanvas && cfg && cfg.cinema.mode === 'video-frames') {
      videoCanvas.width = Math.floor(w * dpr);
      videoCanvas.height = Math.floor(h * dpr);
      if (lastDrawnFrame >= 0) {
        drawFrame(lastDrawnFrame);
      }
    }
  }

  function renderMotes(dt) {
    if (!particleCtx || !particleCanvas) return;
    var w = particleCanvas.width;
    var h = particleCanvas.height;
    particleCtx.clearRect(0, 0, w, h);

    var frameScale = clamp(dt * 60, 0.35, 2.2);
    var boost = (1 + Math.min(Math.abs(scrollVelocity) * 145, 5.5)) * frameScale;
    var exitSoft = 1 - smootherstep(0.88, 1.0, currentProgress);

    for (var i = 0; i < motes.length; i++) {
      var m = motes[i];
      m.x += m.vx * boost;
      m.y += m.vy * boost;

      if (m.y < -0.02) m.y = 1.02;
      if (m.y > 1.02) m.y = -0.02;
      if (m.x < -0.02) m.x = 1.02;
      if (m.x > 1.02) m.x = -0.02;

      var px = m.x * w;
      var py = m.y * h;
      particleCtx.fillStyle = 'rgba(229, 200, 134, ' + (m.alpha * exitSoft).toFixed(3) + ')';
      particleCtx.beginPath();
      particleCtx.arc(px, py, m.r * canvasDpr, 0, Math.PI * 2);
      particleCtx.fill();
    }
  }

  function getStageHeight() {
    return (stageEl && stageEl.offsetHeight) || stableViewportH;
  }

  function computeTargetProgress() {
    if (!trackEl) return;
    var rect = trackEl.getBoundingClientRect();
    var scrollable = rect.height - getStageHeight();
    if (scrollable <= 0) {
      targetProgress = 0;
      return;
    }
    targetProgress = clamp(-rect.top / scrollable, 0, 1);
  }

  function renderAtProgress(p) {
    var count = chapterEls.length;
    if (!count) return;

    var storyP = clamp((p - STORY_START) / (STORY_END - STORY_START), 0, 1);
    var scaled = storyP * (count - 1);
    var activeIdx = Math.round(scaled);

    // Fundido de salida suave al final del cinema (p: 0.87 -> 1.00)
    var exitVeil = smootherstep(0.87, 0.995, p);
    var hudFade = 1 - smootherstep(0.86, 0.96, p);
    var finalChapterFade = 1 - smootherstep(0.90, 0.99, p);

    if (progressFill) {
      progressFill.style.width = (storyP * 100).toFixed(2) + '%';
    }

    if (goldThread && goldLength > 0) {
      goldThread.style.strokeDashoffset = String(goldLength * (1 - storyP));
    }

    if (exitVeilEl) {
      exitVeilEl.style.opacity = exitVeil.toFixed(3);
    }

    if (hudEl) {
      hudEl.style.opacity = hudFade.toFixed(3);
      hudEl.style.transform = 'translate3d(0, ' + ((1 - hudFade) * 14).toFixed(1) + 'px, 0)';
    }

    // 1. Storyboard: fundido cinematográfico largo (1 capítulo completo de solapamiento suave)
    if (cfg.cinema.mode === 'storyboard') {
      for (var i = 0; i < bgLayers.length; i++) {
        var layerOpacity = i === 0 ? 1 : smootherstep(i - 0.86, i + 0.14, scaled);
        var rel = clamp(scaled - i, -1.4, 1.4);
        var scale = 1.03 + (rel + 1.4) * 0.026 + (i === count - 1 ? exitVeil * 0.035 : 0);
        var shiftY = rel * -11;
        bgLayers[i].style.opacity = layerOpacity.toFixed(3);
        bgLayers[i].style.transform =
          'scale(' + scale.toFixed(4) + ') translate3d(0, ' + shiftY.toFixed(1) + 'px, 0)';
      }
    } else if (cfg.cinema.mode === 'video-frames' && loadedFrames.length) {
      var frameIdx = Math.min(
        loadedFrames.length - 1,
        Math.max(0, Math.floor(storyP * (loadedFrames.length - 1)))
      );
      if (frameIdx !== lastDrawnFrame) {
        drawFrame(frameIdx);
      }
    } else if (cfg.cinema.mode === 'video-direct' && videoEl && videoEl.duration) {
      var targetTime = storyP * videoEl.duration;
      if (Math.abs(videoEl.currentTime - targetTime) > 0.04) {
        videoEl.currentTime = targetTime;
      }
    }

    // 2. Capítulos editoriales: relevo limpio sin pisarse (saliente -> respiro visual -> entrante en cascada)
    for (var j = 0; j < count; j++) {
      var ch = chapterEls[j];
      var d = scaled - j; // negativo = entrando, 0 = centro, positivo = saliendo
      var absD = Math.abs(d);
      var sign = d >= 0 ? 1 : -1;

      // Meseta de lectura nítida (0..0.18), disolución completa en 0.49 para relevo sin solape de textos
      var chOpacity = 1 - smootherstep(0.18, 0.49, absD);
      var motionEase = smootherstep(0.10, 0.52, absD);
      var chY = -sign * motionEase * 24;
      var chScale = 1 - motionEase * 0.032;

      if (j === count - 1) {
        chOpacity *= finalChapterFade;
        chY -= (1 - finalChapterFade) * 18;
      }

      ch.root.style.opacity = chOpacity.toFixed(3);
      ch.root.style.transform =
        'translate3d(0, ' + chY.toFixed(1) + 'px, 0) scale(' + chScale.toFixed(4) + ')';
      ch.root.classList.toggle('is-active', j === activeIdx && chOpacity > 0.25);

      // Micro-cascada sutil entre ceja, título, texto y etiqueta para sensación cinematográfica líquida
      if (chOpacity > 0.005) {
        var subShift = -sign * motionEase;
        if (ch.eyebrow) {
          ch.eyebrow.style.transform = 'translate3d(0, ' + (subShift * 8).toFixed(1) + 'px, 0)';
        }
        if (ch.title) {
          ch.title.style.transform = 'translate3d(0, ' + (subShift * 4).toFixed(1) + 'px, 0)';
        }
        if (ch.text) {
          ch.text.style.transform = 'translate3d(0, ' + (subShift * -4).toFixed(1) + 'px, 0)';
        }
        if (ch.polaroid) {
          ch.polaroid.style.transform =
            'translate3d(0, ' + (subShift * -10).toFixed(1) + 'px, 0) rotate(-1.5deg)';
        }
      }

      if (dotEls[j]) {
        dotEls[j].classList.toggle('is-active', j === activeIdx);
      }
    }
  }

  function animateLoop(ts) {
    if (!lastFrameTs) lastFrameTs = ts;
    var dt = clamp((ts - lastFrameTs) / 1000, 0.001, 0.05);
    lastFrameTs = ts;

    // Amortiguación aterciopelada (3.3): convierte cada muesca de rueda en un deslizamiento continuo
    // En táctil el scroll ya tiene inercia nativa: amortiguación más ágil y pegada al dedo
    var damping = 1 - Math.exp(-(isTouch ? 10.5 : 3.3) * dt);
    currentProgress += (targetProgress - currentProgress) * damping;
    if (Math.abs(targetProgress - currentProgress) < 0.00008) {
      currentProgress = targetProgress;
    }

    scrollVelocity = (currentProgress - prevProgress) / Math.max(0.008, dt) * 0.016;
    prevProgress = currentProgress;

    // Solo se repinta cuando el progreso cambia (gran ahorro de batería y fluidez en móvil)
    if (Math.abs(currentProgress - lastRenderedProgress) > 0.00002) {
      renderAtProgress(currentProgress);
      lastRenderedProgress = currentProgress;
    }

    if (sectionEl) {
      var rect = sectionEl.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        renderMotes(dt);
      }
    }

    requestAnimationFrame(animateLoop);
  }

  function scrollToChapter(index) {
    if (!trackEl) return;
    var count = chapterEls.length;
    if (count < 2) return;
    var ratio = STORY_START + clamp(index / (count - 1), 0, 1) * (STORY_END - STORY_START);
    var scrollable = trackEl.offsetHeight - getStageHeight();
    var top = trackEl.getBoundingClientRect().top + window.scrollY + ratio * scrollable;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function init(config) {
    cfg = config;
    sectionEl = document.getElementById('historia-cinema');
    trackEl = sectionEl ? sectionEl.querySelector('.cinema-track') : null;
    stageEl = sectionEl ? sectionEl.querySelector('.cinema-stage') : null;
    bgContainer = document.getElementById('cinema-bg-layers');
    chaptersContainer = document.getElementById('cinema-chapters');
    dotsContainer = document.getElementById('cinema-dots');
    progressFill = document.getElementById('cinema-progress-fill');
    goldThread = document.getElementById('cinema-gold-thread');
    exitVeilEl = document.getElementById('cinema-exit-veil');
    hudEl = sectionEl ? sectionEl.querySelector('.cinema-hud') : null;
    particleCanvas = document.getElementById('cinema-particles');
    videoCanvas = document.getElementById('cinema-video-canvas');
    videoEl = document.getElementById('cinema-video-el');

    if (!sectionEl || !bgContainer || !chaptersContainer) return;

    if (goldThread && typeof goldThread.getTotalLength === 'function') {
      goldLength = goldThread.getTotalLength();
      goldThread.style.strokeDasharray = String(goldLength);
      goldThread.style.strokeDashoffset = String(goldLength);
    }

    buildDOM();
    initMediaMode();
    initMotes();
    computeTargetProgress();
    currentProgress = targetProgress;
    renderAtProgress(currentProgress);

    window.addEventListener('scroll', computeTargetProgress, { passive: true });
    // Ignora los micro-redimensionados de la barra de direcciones móvil (evita saltos y parpadeos)
    window.addEventListener('resize', function () {
      if (updateViewportMetrics(false)) {
        resizeCanvases();
      }
      computeTargetProgress();
    });
    window.addEventListener('orientationchange', function () {
      setTimeout(function () {
        updateViewportMetrics(true);
        resizeCanvases();
        computeTargetProgress();
        lastRenderedProgress = -1;
      }, 260);
    });

    var skipBtn = document.getElementById('cinema-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', function () {
        var next = document.getElementById('cuenta-atras');
        if (next) next.scrollIntoView({ behavior: 'smooth' });
      });
    }

    requestAnimationFrame(animateLoop);
  }

  window.BodaCinema = {
    init: init,
    scrollToChapter: scrollToChapter
  };
})();

/* ============================================================================
   MOTOR FÍSICO Y TEXTURA TEJIDA REALISTA DEL LAZO DEL SOBRE (CANVAS 60FPS)
   - Textura procedural de alta resolución de cinta tejida de seda/lino rústico
     con hilos de urdimbre y trama, orillos pespunteados y pliegues 3D en el nudo.
   - Cinemática física real: al tocar o tirar del extremo derecho del lazo, ese
     extremo se tensa y se alarga mientras la lazada derecha corre a través del
     nudo, el nudo corredizo se suelta y ambas cintas se deslizan fuera del sobre.
   ============================================================================ */

(function () {
  var TEX_W = 512;
  var TEX_H = 128;

  var flatWeaveCanvas = null;
  var pleatedWeaveCanvas = null;
  var darkShadeCanvas = null;
  var specSheenCanvas = null;

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(edge0, edge1, x) {
    var span = edge1 - edge0;
    if (Math.abs(span) < 0.0001) return x >= edge1 ? 1 : 0;
    var t = clamp((x - edge0) / span, 0, 1);
    return t * t * (3 - 2 * t);
  }

  /* Generador determinista ligero para micro-fibras naturales de seda/lino */
  function mulberry32(seed) {
    return function () {
      var t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* --------------------------------------------------------------------------
     PRE-HORNEADO DE LA TEXTURA TEJIDA DE SEDA/LINO Y PLIEGUES 3D EN EL NUDO
     -------------------------------------------------------------------------- */
  function ensureTextures() {
    if (flatWeaveCanvas) return;

    flatWeaveCanvas = document.createElement('canvas');
    flatWeaveCanvas.width = TEX_W;
    flatWeaveCanvas.height = TEX_H;
    var fCtx = flatWeaveCanvas.getContext('2d');

    pleatedWeaveCanvas = document.createElement('canvas');
    pleatedWeaveCanvas.width = TEX_W;
    pleatedWeaveCanvas.height = TEX_H;
    var pCtx = pleatedWeaveCanvas.getContext('2d');

    var fImg = fCtx.createImageData(TEX_W, TEX_H);
    var pImg = pCtx.createImageData(TEX_W, TEX_H);
    var fData = fImg.data;
    var pData = pImg.data;

    var rand = mulberry32(20270918);
    var twoPi = Math.PI * 2;

    // Precomputamos términos dependientes solo de X o de Y para arranque instantáneo (<5ms)
    var sinWeft = new Float32Array(TEX_W);
    var sinStitch = new Float32Array(TEX_W);
    var sinX035 = new Float32Array(TEX_W);
    for (var x = 0; x < TEX_W; x++) {
      // Periodos divisores exactos de 512 (3.2 -> 160 ciclos, 3.2 -> repetición perfecta sin costura)
      sinWeft[x] = Math.sin((x * twoPi) / 3.2) * 0.5 + 0.5;
      sinStitch[x] = Math.sin((x * twoPi) / 3.2) * 0.45 + 0.55;
      sinX035[x] = Math.sin((x * twoPi) / 128.0) * 1.8;
    }

    for (var y = 0; y < TEX_H; y++) {
      var v = y / (TEX_H - 1);
      var vm = (v - 0.5) * 2.0; // -1..+1 a lo ancho de la cinta
      var ed = Math.min(v, 1.0 - v);

      var warpThread = Math.sin((y * twoPi) / 2.4) * 0.5 + 0.5;
      var selvedgeRidge = Math.exp(-Math.pow((ed - 0.055) / 0.026, 2));
      var innerGroove = Math.exp(-Math.pow((ed - 0.105) / 0.018, 2));
      var outerRim = 1.0 - Math.exp(-Math.pow(ed / 0.016, 2)) * 0.26;

      // Volumen cilíndrico transversal de cinta de doble cara + 3 pliegues fruncidos 3D
      var pillow = 1.04 - 0.14 * Math.pow(vm - 0.14, 2);
      var pleatWave = Math.cos(vm * Math.PI * 2.65);
      var pleatLit = 1.0 + 0.31 * pleatWave;
      var pleatSpec = Math.max(0, pleatWave) * 18.0;

      for (var ix = 0; ix < TEX_W; ix++) {
        var twill = Math.sin(((ix + y) * twoPi) / 4.0) * 0.5 + 0.5;
        var slub1 =
          Math.sin(y * 0.55 + sinX035[ix]) *
          Math.cos((ix * twoPi) / 256.0 + y * 0.13);
        var slub2 = Math.sin(y * 1.32 + (ix * twoPi) / 256.0) * 0.5;
        var micro = (rand() - 0.5) * 1.3;

        var weave =
          sinWeft[ix] * 0.38 +
          warpThread * 0.30 +
          twill * 0.22 +
          slub1 * 0.16 +
          slub2 * 0.08 +
          micro * 0.05;

        // Tono verde olivo-salvia tejido editorial (a juego con las pajaritas y la paleta nupcial)
        var stitch = sinStitch[ix] * selvedgeRidge;
        var r0 = (103 + (weave - 0.45) * 35 + stitch * 40 - innerGroove * 24) * outerRim;
        var g0 = (119 + (weave - 0.45) * 38 + stitch * 42 - innerGroove * 26) * outerRim;
        var b0 = (81 + (weave - 0.45) * 29 + stitch * 30 - innerGroove * 19) * outerRim;

        var idx = (y * TEX_W + ix) * 4;
        fData[idx] = clamp(Math.round(r0 * pillow), 0, 255);
        fData[idx + 1] = clamp(Math.round(g0 * pillow), 0, 255);
        fData[idx + 2] = clamp(Math.round(b0 * pillow), 0, 255);
        fData[idx + 3] = 255;

        var pFactor = pillow * pleatLit;
        pData[idx] = clamp(Math.round(r0 * pFactor + pleatSpec * 1.06), 0, 255);
        pData[idx + 1] = clamp(Math.round(g0 * pFactor + pleatSpec * 1.02), 0, 255);
        pData[idx + 2] = clamp(Math.round(b0 * pFactor + pleatSpec * 0.76), 0, 255);
        pData[idx + 3] = 255;
      }
    }

    fCtx.putImageData(fImg, 0, 0);
    pCtx.putImageData(pImg, 0, 0);

    // Capas 1x64 para oclusión ambiental (interior de lazadas/bajo el nudo) y brillo satinado
    darkShadeCanvas = document.createElement('canvas');
    darkShadeCanvas.width = 2;
    darkShadeCanvas.height = 64;
    var dCtx = darkShadeCanvas.getContext('2d');
    dCtx.fillStyle = '#192113';
    dCtx.fillRect(0, 0, 2, 64);

    specSheenCanvas = document.createElement('canvas');
    specSheenCanvas.width = 2;
    specSheenCanvas.height = 64;
    var sCtx = specSheenCanvas.getContext('2d');
    var sGrad = sCtx.createLinearGradient(0, 0, 0, 64);
    sGrad.addColorStop(0.0, 'rgba(246, 238, 212, 0.12)');
    sGrad.addColorStop(0.38, 'rgba(250, 243, 220, 0.95)');
    sGrad.addColorStop(0.62, 'rgba(248, 240, 215, 0.88)');
    sGrad.addColorStop(1.0, 'rgba(246, 238, 212, 0.10)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 2, 64);
  }

  /* --------------------------------------------------------------------------
     TRAZADO SUAVE DE SILUETA Y TIRA TEXTURIZADA 3D CON SOMBRA PROYECTADA
     -------------------------------------------------------------------------- */
  function traceRibbonOutline(ctx, samples) {
    var n = samples.length;
    if (n < 2) return;

    var lx0 = samples[0].x - samples[0].bx;
    var ly0 = samples[0].y - samples[0].by;
    ctx.beginPath();
    ctx.moveTo(lx0, ly0);

    for (var i = 1; i < n - 1; i++) {
      var lxi = samples[i].x - samples[i].bx;
      var lyi = samples[i].y - samples[i].by;
      var lxn = samples[i + 1].x - samples[i + 1].bx;
      var lyn = samples[i + 1].y - samples[i + 1].by;
      ctx.quadraticCurveTo(lxi, lyi, (lxi + lxn) * 0.5, (lyi + lyn) * 0.5);
    }
    var lxLast = samples[n - 1].x - samples[n - 1].bx;
    var lyLast = samples[n - 1].y - samples[n - 1].by;
    ctx.lineTo(lxLast, lyLast);

    var rxLast = samples[n - 1].x + samples[n - 1].bx;
    var ryLast = samples[n - 1].y + samples[n - 1].by;
    ctx.lineTo(rxLast, ryLast);

    for (var j = n - 2; j > 0; j--) {
      var rxj = samples[j].x + samples[j].bx;
      var ryj = samples[j].y + samples[j].by;
      var rxp = samples[j - 1].x + samples[j - 1].bx;
      var ryp = samples[j - 1].y + samples[j - 1].by;
      ctx.quadraticCurveTo(rxj, ryj, (rxj + rxp) * 0.5, (ryj + ryp) * 0.5);
    }
    ctx.lineTo(samples[0].x + samples[0].bx, samples[0].y + samples[0].by);
    ctx.closePath();
  }

  function drawCastShadow(ctx, dpr, samples, shadowAlpha) {
    if (samples.length < 2 || shadowAlpha <= 0.01) return;

    // Calculamos altura media Z sobre el papel para desplazar y difuminar la sombra
    var sumZ = 0;
    for (var i = 0; i < samples.length; i++) {
      sumZ += Math.max(0, samples[i].z || 0);
    }
    var avgZ = sumZ / samples.length;
    var offX = (2.0 + avgZ * 0.26) * dpr;
    var offY = (4.2 + avgZ * 0.52) * dpr;
    var blurPx = (6.5 + avgZ * 0.45) * dpr;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Desplazamos la figura lejos fuera del lienzo para pintar únicamente su sombra pura
    var hideShift = 4000;
    ctx.translate(-hideShift, 0);
    traceRibbonOutline(ctx, samples);
    ctx.shadowColor = 'rgba(28, 22, 14, ' + clamp(shadowAlpha, 0, 0.5).toFixed(3) + ')';
    ctx.shadowBlur = blurPx;
    ctx.shadowOffsetX = hideShift * dpr + offX;
    ctx.shadowOffsetY = offY;
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();
  }

  function drawRibbonStrip(ctx, dpr, samples, uOffset, shadowStrength) {
    var n = samples.length;
    if (n < 2) return;

    if (shadowStrength > 0.01) {
      drawCastShadow(ctx, dpr, samples, shadowStrength);
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    traceRibbonOutline(ctx, samples);
    ctx.clip();

    var arc = 0;
    for (var i = 0; i < n - 1; i++) {
      var s0 = samples[i];
      var s1 = samples[i + 1];

      var dx = s1.x - s0.x;
      var dy = s1.y - s0.y;
      var dz = (s1.z || 0) - (s0.z || 0);
      var seg3d = Math.sqrt(dx * dx + dy * dy + dz * dz);

      var cx = (s0.x + s1.x) * 0.5;
      var cy = (s0.y + s1.y) * 0.5;
      var bx = (s0.bx + s1.bx) * 0.5;
      var by = (s0.by + s1.by) * 0.5;
      var hw = Math.hypot(bx, by);
      if (hw < 0.4) {
        arc += seg3d;
        continue;
      }

      // Evitamos determinante nulo justo en el giro 3D exterior de las lazadas (dx -> 0)
      var det = dx * by - dy * bx;
      var ux = dx;
      var uy = dy;
      if (Math.abs(det) < hw * 0.75) {
        var nx = by / hw;
        var ny = -bx / hw;
        var sign = det >= 0 ? 1 : -1;
        ux = nx * 0.95 * sign;
        uy = ny * 0.95 * sign;
      }

      var pinch = clamp((s0.pinch + s1.pinch) * 0.5, 0, 1);
      var shade = (s0.shade + s1.shade) * 0.5;
      var spec = (s0.spec + s1.spec) * 0.5;

      var uPx = (arc + uOffset) * 1.65;
      var tu = ((uPx % TEX_W) + TEX_W) % TEX_W;
      var sliceTexW = clamp(seg3d * 1.65 + 3.0, 3.0, 42.0);
      if (tu + sliceTexW > TEX_W) {
        tu = TEX_W - sliceTexW;
      }

      // Matriz afín exacta: eje U a lo largo de (ux, uy), eje V [-1..+1] a lo largo de (bx, by)
      ctx.setTransform(
        ux * dpr,
        uy * dpr,
        bx * dpr,
        by * dpr,
        cx * dpr,
        cy * dpr
      );

      // Solapamiento longitudinal (-0.68..+0.68 -> ancho 1.36) para cero costuras entre segmentos
      ctx.globalAlpha = 1;
      ctx.drawImage(flatWeaveCanvas, tu, 0, sliceTexW, TEX_H, -0.68, -1.03, 1.36, 2.06);

      if (pinch > 0.03) {
        ctx.globalAlpha = pinch;
        ctx.drawImage(pleatedWeaveCanvas, tu, 0, sliceTexW, TEX_H, -0.68, -1.03, 1.36, 2.06);
      }

      if (shade < 0.99) {
        ctx.globalAlpha = clamp(1.0 - shade, 0, 0.72);
        ctx.drawImage(darkShadeCanvas, 0, 0, 2, 64, -0.68, -1.04, 1.36, 2.08);
      } else if (shade > 1.02) {
        spec += (shade - 1.02) * 0.85;
      }

      if (spec > 0.03) {
        ctx.globalAlpha = clamp(spec * 0.36, 0, 0.44);
        ctx.drawImage(specSheenCanvas, 0, 0, 2, 64, -0.68, -1.0, 1.36, 2.0);
      }

      arc += seg3d;
    }

    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     CONSTRUCTORES GEOMÉTRICOS 3D (LAZADAS, CAÍDAS CON CORTE EN BISEL Y NUDO)
     -------------------------------------------------------------------------- */
  function buildPlumpLoop(kx, ky, side, scaleX, hwBase, S) {
    var reach = 102.0 * S * scaleX;
    var M = 52;
    var all = [];

    for (var i = 0; i <= M; i++) {
      var u = i / M;
      var th = u * Math.PI;
      var arch = Math.pow(Math.sin(th), 0.76);
      var x = kx + side * reach * arch;
      var y =
        ky +
        S *
          (-13.5 * Math.sin(th) * (1.0 - 0.35 * u) +
            8.5 * Math.sin(th) * u -
            3.5 * Math.sin(2.0 * th));
      var z = (4.0 + 19.0 * (0.5 - 0.5 * Math.cos(th))) * S;

      var knotProx = Math.pow(Math.cos(th), 2);
      var pinch = Math.pow(knotProx, 1.25);
      var hw =
        hwBase *
        (0.40 + 0.94 * (1.0 - 0.72 * pinch)) *
        (0.52 + 0.48 * Math.min(1.0, scaleX * 1.5));

      var tilt = side * (-0.16 * Math.sin(th) + 0.08 * Math.cos(th));
      var bx = Math.sin(tilt) * hw;
      var by = Math.cos(tilt) * hw;

      var shade, spec;
      if (u < 0.45) {
        var ub = u / 0.45;
        shade = 0.44 + 0.52 * Math.pow(ub, 1.35);
        spec = 0.10 * ub * ub;
      } else {
        var uf = (u - 0.45) / 0.55;
        var turnGlow = Math.exp(-Math.pow((uf - 0.22) / 0.28, 2));
        var knotAo = 0.24 * Math.pow(uf, 3.0);
        shade = 1.05 + 0.15 * turnGlow - knotAo;
        spec = 0.68 * turnGlow + 0.24 * Math.sin(uf * Math.PI);
      }

      all.push({
        x: x,
        y: y,
        z: z,
        bx: bx,
        by: by,
        pinch: pinch,
        shade: shade,
        spec: spec
      });
    }

    var split = Math.floor(M * 0.45);
    return {
      back: all.slice(0, split + 2),
      front: all.slice(split)
    };
  }

  function buildCubicSplineRibbon(p0, p1, p2, p3, steps, evalProps) {
    var pts = [];
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var mt = 1.0 - t;
      var mt2 = mt * mt;
      var t2 = t * t;
      pts.push({
        x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
        y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
      });
    }

    var out = [];
    for (var j = 0; j <= steps; j++) {
      var tj = j / steps;
      var pp = pts[Math.max(0, j - 1)];
      var pn = pts[Math.min(steps, j + 1)];
      var tx = pn.x - pp.x;
      var ty = pn.y - pp.y;
      var tl = Math.hypot(tx, ty) || 1;
      var nx = -ty / tl;
      var ny = tx / tl;

      var pr = evalProps(tj);
      // Ligero corte en bisel de sastrería en la punta libre (bevel)
      var bevel = pr.bevel || 0;
      out.push({
        x: pts[j].x,
        y: pts[j].y,
        z: pr.z,
        bx: nx * pr.hw + (tx / tl) * bevel,
        by: ny * pr.hw + (ty / tl) * bevel,
        pinch: pr.pinch,
        shade: pr.shade,
        spec: pr.spec
      });
    }
    return out;
  }

  /* --------------------------------------------------------------------------
     INSTANCIA INTERACTIVA SOBRE EL SOBRE
     -------------------------------------------------------------------------- */
  function attachEnvelopeBow(options) {
    var canvas = options.canvas;
    var triggerBtn = options.triggerBtn;
    var onUntied = options.onUntied;
    var onStartPull = options.onStartPull;
    if (!canvas) return null;

    ensureTextures();

    var ctx = canvas.getContext('2d');
    var dpr = 1;
    var W = 480;
    var H = 325;

    var progress = 0; // 0 = atado -> 1 = completamente desatado y fuera del sobre
    var isAutoPlaying = false;
    var isDragging = false;
    var dragStartX = 0;
    var dragStartY = 0;
    var dragBaseProgress = 0;
    var hasFiredStart = false;
    var hasFiredUntied = false;
    var isFinished = false;

    var hoverBoost = 0;
    var targetHover = 0;
    var rafId = null;
    var startTime = performance.now();
    var lastTs = startTime;

    var reducedMotion = Boolean(
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    function resize() {
      var rect = canvas.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      renderFrame(performance.now());
    }

    function renderFrame(now) {
      if (!ctx || isFinished) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (progress >= 0.995) {
        return;
      }

      var elapsedSec = (now - startTime) * 0.001;
      var S = W / 480.0;
      var hw = 15.5 * S;

      // Posición vertical de la cinta (38% desktop, 37% móvil)
      var kyRatio = W <= 380 ? 0.37 : 0.38;
      var kx0 = W * 0.5;
      var ky0 = H * kyRatio;

      // Brisa orgánica suave mientras el lazo espera a ser tocado
      var idleAmt = clamp(1.0 - progress * 8.0, 0, 1) * (reducedMotion ? 0 : 1);
      var breezeL = Math.sin(elapsedSec * 1.65) * 3.2 * S * idleAmt;
      var breezeR = Math.sin(elapsedSec * 1.65 + 0.9) * 3.6 * S * idleAmt;
      var hoverLift = hoverBoost * 2.2 * S * idleAmt;

      /* CINEMÁTICA FÍSICA EN 3 ETAPAS CONTINUAS (100% OPACAS):
         - e1 [0.00 -> 0.48]: Se tira del extremo derecho hacia abajo-derecha; la lazada
                              derecha corre a través del nudo hasta desaparecer.
         - e2 [0.45 -> 0.74]: El nudo corredizo cede y se desenrolla; la lazada izquierda
                              se suelta y el extremo se libera del enganche.
         - e3 [0.66 -> 1.00]: Ambas cintas ya desanudadas se abren y deslizan por los bordes. */
      var e1 = smoothstep(0.0, 0.48, progress);
      var e2 = smoothstep(0.45, 0.74, progress);
      var e3 = smoothstep(0.66, 1.0, progress);

      var kx = kx0 + e1 * 10.5 * S * (1.0 - e2 * 0.35);
      var ky = ky0 + e1 * 4.5 * S * (1.0 - e2 * 0.35) - hoverLift * 0.35;

      var slideL = Math.pow(e3, 1.32) * (W * 0.68);
      var slideR = Math.pow(e3, 1.18) * (W * 0.76);

      // 1. CINTA HORIZONTAL IZQUIERDA (se suelta y cae ligeramente al deshacerse el nudo)
      var lTipX = kx + 2 * S - e2 * 18 * S - slideL;
      var lTipY = ky + e2 * 24 * S;
      var lWrap = buildCubicSplineRibbon(
        { x: -12 * S - slideL, y: ky },
        { x: W * 0.19 - slideL, y: ky - 1.5 * S * e2 },
        { x: kx - 44 * S - slideL, y: ky + 9 * S * e2 },
        { x: lTipX, y: lTipY },
        34,
        function (t) {
          var pinch = Math.pow(t, 2.3) * (1.0 - e2);
          var edgeAo = t < 0.08 ? (1.0 - t / 0.08) * 0.22 : 0;
          var knotAo = 0.22 * Math.pow(t, 3) * (1.0 - e2);
          return {
            hw: hw * (1.0 - 0.52 * pinch),
            pinch: pinch,
            z: (2.2 + 4.0 * e2 * Math.sin(t * Math.PI)) * S,
            shade: 1.02 - edgeAo - knotAo,
            spec: 0.16 + 0.16 * e2 * Math.sin(t * Math.PI),
            bevel: t > 0.94 ? e2 * 5.0 * S : 0
          };
        }
      );
      drawRibbonStrip(ctx, dpr, lWrap, slideL / S, 0.26);

      // 2. CAÍDA IZQUIERDA (se recoge a través del nudo flojo al desanudarse en e2)
      var ltRetract = smoothstep(0.45, 0.70, progress);
      if (ltRetract < 0.98) {
        var ltBaseX = kx - 4 * S - ltRetract * 14 * S - slideL * 0.4;
        var ltBaseY = ky + 4 * S + ltRetract * 16 * S;
        var ltEndX = lerp(kx - 88 * S + breezeL, lTipX, ltRetract);
        var ltEndY = lerp(ky + 112 * S - hoverLift, lTipY, ltRetract);
        var lTail = buildCubicSplineRibbon(
          { x: ltBaseX, y: ltBaseY },
          { x: lerp(ltBaseX, ltEndX, 0.34), y: lerp(ltBaseY, ltEndY, 0.26) },
          { x: lerp(ltBaseX, ltEndX, 0.70), y: lerp(ltBaseY, ltEndY, 0.64) },
          { x: ltEndX, y: ltEndY },
          32,
          function (t) {
            var kProx = 1.0 - Math.min(1.0, t * 2.4);
            var pinch = Math.pow(kProx, 1.8) * (1.0 - ltRetract);
            return {
              hw: hw * (0.45 + 0.61 * (1.0 - 0.65 * pinch)) * (1.0 - 0.22 * ltRetract),
              pinch: pinch,
              z: (9.5 * (1.0 - t) * (1.0 - ltRetract) + 3.0) * S,
              shade:
                0.94 +
                0.15 * Math.sin(t * Math.PI) -
                0.25 * Math.pow(1.0 - Math.min(1.0, t * 3.2), 2) * (1.0 - ltRetract),
              spec: 0.32 * Math.max(0, Math.sin(t * Math.PI)),
              bevel: t > 0.92 ? -4.5 * S * (1.0 - ltRetract) : 0
            };
          }
        );
        drawRibbonStrip(ctx, dpr, lTail, 30.0 + ltRetract * 68.0, 0.26 * (1.0 - ltRetract * 0.5));
      }

      // 3. LAZADA IZQUIERDA (se abre y absorbe cuando el nudo se suelta en e2)
      var remL = (1.0 - e2) * (1.0 - 0.06 * e1) * (1.0 + hoverBoost * 0.028 * idleAmt);
      if (remL > 0.045) {
        var loopL = buildPlumpLoop(
          kx - e2 * 20 * S - slideL * 0.35,
          ky + e2 * 5 * S,
          -1,
          remL,
          hw,
          S
        );
        drawRibbonStrip(ctx, dpr, loopL.back, 15.0 + e2 * 92.0, 0.20);
        drawRibbonStrip(ctx, dpr, loopL.front, 95.0 + e2 * 92.0, 0.30);
      }

      // 4. CINTA DERECHA Y EXTREMO DEL QUE SE TIRA (curva continua con efecto polea al soltarse)
      var bendX = kx + e2 * 44 * S + slideR * 1.08;
      var bendY = ky + e2 * 12 * S;

      if (bendX < W + 24 * S) {
        var rWrap = buildCubicSplineRibbon(
          { x: W + 14 * S + slideR * 0.35, y: ky },
          { x: lerp(W + 14 * S, bendX, 0.35), y: ky + 2 * S * e2 },
          { x: lerp(W + 14 * S, bendX, 0.72), y: lerp(ky, bendY, 0.75) },
          { x: bendX, y: bendY },
          32,
          function (t) {
            var pinch = Math.pow(t, 2.3) * (1.0 - e2);
            var edgeAo = t < 0.08 ? (1.0 - t / 0.08) * 0.22 : 0;
            var knotAo = 0.22 * Math.pow(t, 3) * (1.0 - e2);
            return {
              hw: hw * (1.0 - 0.50 * pinch),
              pinch: pinch,
              z: (2.2 + 4.5 * e2 * t) * S,
              shade: 1.02 - edgeAo - knotAo,
              spec: 0.16 + 0.16 * e2 * t,
              bevel: 0
            };
          }
        );
        drawRibbonStrip(ctx, dpr, rWrap, -e1 * 132.0 - slideR / S, 0.26);
      }

      // Extremo derecho del que se tira: se tensa y alarga hacia abajo-derecha en e1 y sale por la derecha en e3
      var pullDx = (e1 * 88.0 + hoverBoost * 5.5 * idleAmt) * S + slideR * 1.12;
      var pullDy = (e1 * 34.0 + hoverBoost * 3.0 * idleAmt) * S - e3 * 52.0 * S;
      var rtBaseX = lerp(kx + 5 * S, bendX - 4 * S, e2);
      var rtBaseY = lerp(ky + 4 * S, bendY, e2);
      var rtEndX = kx + 90 * S + breezeR + pullDx;
      var rtEndY = ky + 112 * S + pullDy;

      // Destello sutil de seda deslizándose por el extremo derecho para invitar a tirar de él
      var pullCuePos = ((elapsedSec * 0.58) % 1.4) - 0.2;

      var rTail = buildCubicSplineRibbon(
        { x: rtBaseX, y: rtBaseY },
        {
          x: lerp(rtBaseX, rtEndX, 0.32) + e2 * 14 * S,
          y: lerp(rtBaseY, rtEndY, lerp(0.25, 0.14, e2))
        },
        {
          x: lerp(rtBaseX, rtEndX, 0.68),
          y: lerp(rtBaseY, rtEndY, 0.66)
        },
        { x: rtEndX, y: rtEndY },
        38,
        function (t) {
          var kProx = 1.0 - Math.min(1.0, t * 2.4);
          var pinch = Math.pow(kProx, 1.8) * (1.0 - e2);
          var cueGlow =
            idleAmt > 0.05
              ? Math.exp(-Math.pow((t - pullCuePos) / 0.16, 2)) * 0.42 * idleAmt
              : 0;
          var tensionSheen = e1 * (1.0 - e3) * 0.25 * Math.sin(t * Math.PI);
          return {
            hw: hw * lerp(0.46 + 0.60 * (1.0 - 0.65 * pinch), 1.0, e2),
            pinch: pinch,
            z: (11.5 * Math.pow(1.0 - t, 1.4) * (1.0 - e2 * 0.55) + 3.0) * S,
            shade:
              0.96 +
              0.16 * Math.sin(t * Math.PI * 1.1) -
              0.24 * Math.pow(1.0 - Math.min(1.0, t * 3.2), 2) * (1.0 - e2),
            spec: 0.40 * Math.max(0, Math.sin(t * Math.PI * 1.1)) + cueGlow + tensionSheen,
            bevel: t > 0.92 ? 4.8 * S : 0
          };
        }
      );
      drawRibbonStrip(ctx, dpr, rTail, -e1 * 132.0 - slideR / S, 0.28);

      // 5. LAZADA DERECHA (se encoge físicamente dentro del nudo a medida que se tira del extremo derecho!)
      var remR = Math.max(0, 1.0 - Math.pow(e1, 1.06)) * (1.0 + hoverBoost * 0.028 * idleAmt);
      if (remR > 0.045) {
        var loopR = buildPlumpLoop(kx, ky, 1, remR, hw, S);
        drawRibbonStrip(ctx, dpr, loopR.back, -e1 * 132.0, 0.20);
        drawRibbonStrip(ctx, dpr, loopR.front, 85.0 - e1 * 132.0, 0.30);
      }

      // 6. NUDO CENTRAL FRUNCIDO (se inclina con la tensión en e1 y gira/desenrolla en e2)
      var knotUnwrap = smoothstep(0.45, 0.72, progress);
      if (knotUnwrap < 0.96) {
        var rotRad = ((e1 * 11.0 + knotUnwrap * 70.0) * Math.PI) / 180.0;
        var kLen = 16.8 * S * (1.0 - 0.10 * e1) * (1.0 - 0.58 * knotUnwrap);
        var kHw = 13.8 * S * (1.0 - 0.06 * e1) * (1.0 - 0.26 * knotUnwrap);
        var cxK = kx + knotUnwrap * 16.0 * S;
        var cyK = ky + knotUnwrap * 6.0 * S;
        var dxK = Math.sin(rotRad);
        var dyK = Math.cos(rotRad);
        var nxK = Math.cos(rotRad);
        var nyK = -Math.sin(rotRad);

        var kSamples = [];
        var kSteps = 20;
        for (var ki = 0; ki <= kSteps; ki++) {
          var kt = ki / kSteps;
          var ang = (kt - 0.5) * Math.PI;
          var along = Math.sin(ang) * kLen;
          var pillowK = Math.cos(ang * 0.88);
          var curW = kHw * (0.90 + 0.12 * pillowK);
          kSamples.push({
            x: cxK + dxK * along,
            y: cyK + dyK * along,
            z: (18.0 + Math.cos(ang) * 7.0) * S * (1.0 - 0.65 * knotUnwrap),
            bx: nxK * curW,
            by: nyK * curW,
            pinch: 0.48 * (1.0 - knotUnwrap),
            shade: 0.74 + 0.42 * Math.cos((kt - 0.32) * Math.PI * 0.95),
            spec: 0.52 * Math.exp(-Math.pow((kt - 0.28) / 0.22, 2)) * (1.0 - knotUnwrap * 0.5)
          });
        }
        drawRibbonStrip(
          ctx,
          dpr,
          kSamples,
          52.0 + knotUnwrap * 32.0,
          0.38 * (1.0 - knotUnwrap)
        );
      }
    }

    function notifyStarted() {
      if (hasFiredStart) return;
      hasFiredStart = true;
      if (typeof onStartPull === 'function') {
        var S = W / 480.0;
        var kyRatio = W <= 380 ? 0.37 : 0.38;
        var rect = canvas.getBoundingClientRect();
        // Coordenadas en pantalla de la punta del extremo derecho del que se tira
        onStartPull({
          knotX: rect.left + W * 0.5,
          knotY: rect.top + H * kyRatio,
          tailX: rect.left + W * 0.5 + 72 * S,
          tailY: rect.top + H * kyRatio + 85 * S
        });
      }
    }

    function triggerUntie() {
      if (isFinished) return;
      notifyStarted();
      isDragging = false;
      isAutoPlaying = true;
      ensureLoop();
    }

    function tick(now) {
      var dt = Math.min(0.05, Math.max(0.001, (now - lastTs) * 0.001));
      lastTs = now;

      hoverBoost += (targetHover - hoverBoost) * Math.min(1, dt * 10);

      if (isAutoPlaying) {
        // Duración total del tirón + desanudado + deslizamiento (~1.62s; rápido si reducedMotion)
        var speed = reducedMotion ? 3.2 : 0.62;
        // Ligera aceleración orgánica una vez que el nudo cede (progress > 0.50)
        var phaseBoost = progress > 0.50 ? 1.22 : 1.0;
        progress = Math.min(1.0, progress + dt * speed * phaseBoost);
      }

      if (!hasFiredUntied && progress >= 0.86) {
        hasFiredUntied = true;
        if (typeof onUntied === 'function') {
          onUntied();
        }
      }

      renderFrame(now);

      if (progress >= 1.0) {
        isFinished = true;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafId = null;
        return;
      }

      if (isAutoPlaying || isDragging || !reducedMotion || Math.abs(targetHover - hoverBoost) > 0.01) {
        rafId = requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    function ensureLoop() {
      if (!rafId && !isFinished) {
        lastTs = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }

    // Interacción táctil y con ratón: permite TANTO tocar directamente como arrastrar/tirar del extremo
    if (triggerBtn) {
      triggerBtn.addEventListener('pointerenter', function () {
        targetHover = 1;
        ensureLoop();
      });

      triggerBtn.addEventListener('pointerleave', function () {
        targetHover = 0;
      });

      triggerBtn.addEventListener('pointerdown', function (e) {
        if (isFinished || isAutoPlaying) return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragBaseProgress = progress;
        if (triggerBtn.setPointerCapture) {
          try {
            triggerBtn.setPointerCapture(e.pointerId);
          } catch (err) {}
        }
        ensureLoop();
      });

      triggerBtn.addEventListener('pointermove', function (e) {
        if (!isDragging || isAutoPlaying || isFinished) return;
        var dx = e.clientX - dragStartX;
        var dy = e.clientY - dragStartY;
        // Proyección sobre el vector diagonal de tirón del extremo derecho (+0.78, +0.62) o distancia general
        var pullDist = Math.max(dx * 0.75 + dy * 0.66, Math.hypot(dx, dy) * 0.55);
        if (pullDist > 6) {
          notifyStarted();
          progress = clamp(dragBaseProgress + pullDist / Math.max(140, W * 0.36), 0, 0.98);
          if (progress >= 0.46) {
            // En cuanto la lazada derecha pasa por el nudo, el lazo termina de soltarse solo
            triggerUntie();
          }
        }
      });

      var finishPointer = function () {
        if (!isDragging) return;
        isDragging = false;
        // Tanto si el invitado hizo un toque corto como si tiró un poco y soltó, completamos el desanudado
        triggerUntie();
      };

      triggerBtn.addEventListener('pointerup', finishPointer);
      triggerBtn.addEventListener('pointercancel', finishPointer);

      // Soporte completo para teclado (Enter / Espacio)
      triggerBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerUntie();
        }
      });
    }

    window.addEventListener('resize', resize);
    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(resize);
      ro.observe(canvas);
    }
    resize();
    ensureLoop();

    return {
      untie: triggerUntie,
      resize: resize
    };
  }

  window.BodaRibbonBow = {
    attach: attachEnvelopeBow
  };
})();

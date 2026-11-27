/* ============================================================================
   MOTOR DE ANIMACIÓN ESQUELÉTICA PIXAR 3D EN CANVAS DE ALTA DENSIDAD (60FPS)
   Renderiza las texturas 3D Pixar reales de los dos perros con articulación
   anatómica: andar/trotar con ciclo cuadrúpedo real, transición física de
   sentarse e incorporarse, respiración, meneo de cola, parpadeo natural,
   física elástica en orejas, saltos y entrega de respuestas en la boca.
   ============================================================================ */

(function () {
  var LOGICAL_W = 280;
  var LOGICAL_H = 260;
  var GROUND_Y = 242;
  var CENTER_X = 140;

  // Escalas normalizadas para coherencia anatómica exacta entre todos los renders
  var POSE_SCALES = {
    husky: {
      walk: 0.58,
      welcome: 0.48,
      food: 0.45,
      party: 0.48,
      sad: 0.43,
      celebrate: 0.48
    },
    terrier: {
      walk: 0.58,
      welcome: 0.50,
      food: 0.46,
      party: 0.50,
      sad: 0.44,
      celebrate: 0.50
    }
  };

  var cfg = null;
  var rigData = null;
  var imageCache = {};

  var stageEl = null;
  var bannerEl = null;
  var bannerSlipEl = null;
  var bannerCaptionEl = null;

  var rafId = null;
  var lastTs = 0;
  var isVisible = false;
  var isDocked = false;
  var isCourierBusy = false;
  var reducedMotion = false;

  var pointerNormX = 0;
  var pointerNormY = 0;

  var dogs = {};

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function lerp(a, b, t) {
    return a + (b - a) * clamp(t, 0, 1);
  }

  function smoothstep(edge0, edge1, x) {
    var span = edge1 - edge0;
    if (Math.abs(span) < 0.0001) return x >= edge1 ? 1 : 0;
    var t = clamp((x - edge0) / span, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  /* --------------------------------------------------------------------------
     PRECARGA ASÍNCRONA DE TEXTURAS PIXAR RGBA (SEGURA EN FILE:// Y GITHUB PAGES)
     -------------------------------------------------------------------------- */
  function getOrLoadImage(src) {
    if (!src) return null;
    if (imageCache[src]) return imageCache[src];
    var img = new Image();
    img.decoding = 'async';
    var entry = { img: img, loaded: false };
    img.onload = function () {
      entry.loaded = true;
      if (isVisible && reducedMotion) {
        if (dogs.husky) stepAndRenderDog(dogs.husky, 0.016, 0);
        if (dogs.terrier) stepAndRenderDog(dogs.terrier, 0.016, 0);
      }
    };
    img.src = src;
    imageCache[src] = entry;
    return entry;
  }

  function preloadRigTree(node) {
    if (!node || typeof node !== 'object') return;
    if (typeof node.src === 'string') {
      getOrLoadImage(node.src);
    }
    var keys = Object.keys(node);
    for (var i = 0; i < keys.length; i++) {
      var val = node[keys[i]];
      if (val && typeof val === 'object') {
        preloadRigTree(val);
      }
    }
  }

  /* --------------------------------------------------------------------------
     CINEMÁTICA DIRECTA PADRE -> HIJO Y RENDERIZADO DE CAPAS PIXAR
     -------------------------------------------------------------------------- */
  function childPivotPos(parentMeta, childMeta, parentX, parentY, parentAngleRad) {
    var dx = childMeta.worldPivot[0] - parentMeta.worldPivot[0];
    var dy = childMeta.worldPivot[1] - parentMeta.worldPivot[1];
    var c = Math.cos(parentAngleRad);
    var s = Math.sin(parentAngleRad);
    return {
      x: parentX + dx * c - dy * s,
      y: parentY + dx * s + dy * c
    };
  }

  function drawPart(ctx, partMeta, destX, destY, angleRad, afterDrawLocal) {
    if (!partMeta || !partMeta.src) return;
    var entry = getOrLoadImage(partMeta.src);
    if (!entry || !entry.loaded) return;

    ctx.save();
    ctx.translate(destX, destY);
    if (angleRad) ctx.rotate(angleRad);
    ctx.drawImage(entry.img, -partMeta.pivot[0], -partMeta.pivot[1], partMeta.w, partMeta.h);
    if (typeof afterDrawLocal === 'function') {
      afterDrawLocal(ctx, partMeta);
    }
    ctx.restore();
  }

  function drawPixarBlinkAndHappyEyes(ctx, headMeta, blinkAmount, happyAmount) {
    var eyes = headMeta.eyes;
    if (!eyes || !eyes.length) return;
    var closeAmt = Math.max(blinkAmount, happyAmount);
    if (closeAmt <= 0.03) return;

    var lidColor = headMeta.lidColor || '#2C2F36';
    var px = headMeta.pivot[0];
    var py = headMeta.pivot[1];

    for (var i = 0; i < eyes.length; i++) {
      var e = eyes[i];
      var cx = e[0] - px;
      var cy = e[1] - py;
      var rx = e[2] * 1.12;
      var ry = e[3] * 1.12;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.clip();

      var topY = cy - ry * 1.25;
      var sweepH = ry * 2.35 * clamp(closeAmt, 0, 1);

      ctx.fillStyle = lidColor;
      ctx.fillRect(cx - rx - 2, topY, rx * 2 + 4, sweepH);

      // Sombreado suave de volumen 3D en el párpado
      var grad = ctx.createLinearGradient(cx, topY, cx, topY + sweepH);
      grad.addColorStop(0, 'rgba(255,255,255,0.14)');
      grad.addColorStop(1, 'rgba(0,0,0,0.24)');
      ctx.fillStyle = grad;
      ctx.fillRect(cx - rx - 2, topY, rx * 2 + 4, sweepH);

      ctx.restore();

      // Línea de pestañas Pixar (curva feliz ^ ^ al acariciar o curva suave al parpadear)
      if (happyAmount > 0.35) {
        ctx.save();
        ctx.strokeStyle = '#1B1613';
        ctx.lineWidth = Math.max(2.0, rx * 0.22);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - rx * 0.78, cy + ry * 0.12);
        ctx.quadraticCurveTo(cx, cy - ry * 0.65, cx + rx * 0.78, cy + ry * 0.12);
        ctx.stroke();
        ctx.restore();
      } else if (blinkAmount > 0.25) {
        var lashY = topY + sweepH - 0.5;
        ctx.save();
        ctx.strokeStyle = 'rgba(24, 18, 15, 0.85)';
        ctx.lineWidth = Math.max(1.6, rx * 0.17);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - rx * 0.82, cy + (lashY - cy) * 0.72);
        ctx.quadraticCurveTo(cx, lashY + ry * 0.16 * blinkAmount, cx + rx * 0.82, cy + (lashY - cy) * 0.72);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  /* --------------------------------------------------------------------------
     RENDERIZADO DEL PERRO DE PERFIL (ANDANDO, TROTANDO CON SOBRE O AGACHÁNDOSE)
     -------------------------------------------------------------------------- */
  function renderSideWalkRig(ctx, dog, walkRig, scale, sitPoseT, alpha) {
    if (alpha <= 0.01 || !walkRig) return;

    var phase = dog.walkPhase;
    var gaitAmp = clamp(dog.gaitAmp, 0, 1.25) * (1 - sitPoseT);

    // El render Pixar original mira hacia la IZQUIERDA (-1). Si camina a la derecha (+1), espejo horizontal
    var flipX = dog.facing === 1 ? -1 : 1;
    // Al empezar a sentarse y girar hacia el invitado, estrechamos sutilmente el perfil 3D
    var turnNarrow = 1 - 0.11 * sitPoseT;

    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.translate(CENTER_X, GROUND_Y);
    ctx.scale(flipX * scale * turnNarrow, scale);

    var torsoMeta = walkRig.torso;
    var baseTorsoX = torsoMeta.worldPivot[0] - walkRig.centerX;
    var baseTorsoY = torsoMeta.worldPivot[1] - walkRig.groundY;

    // Suspensión vertical real (2x frecuencia de zancada) + descenso de grupa al sentarse
    var bobY = Math.abs(Math.cos(phase)) * (isCourierBusy ? 6.5 : 4.2) * gaitAmp;
    var crouchSitY = 15.5 * sitPoseT;
    var torsoX = baseTorsoX;
    var torsoY = baseTorsoY - bobY + crouchSitY;

    // Cabeceo de columna en el trote + inclinación de grupa (+21°) al apoyar los cuartos traseros
    var spinePitchDeg = Math.sin(phase) * (isCourierBusy ? 3.2 : 2.0) * gaitAmp + 21.0 * sitPoseT;
    var torsoRot = degToRad(spinePitchDeg);

    // Pares diagonales cuadrúpedos (con ligero desfase natural entre tren delantero y trasero)
    var swingDeg = (isCourierBusy ? 27.0 : 20.5) * gaitAmp;
    var sA = Math.sin(phase);
    var sB = Math.sin(phase + Math.PI);
    var sBackA = Math.sin(phase - 0.26);
    var sBackB = Math.sin(phase + Math.PI - 0.26);
    var liftNearFront = Math.max(0, Math.cos(phase + Math.PI)) * gaitAmp;

    var ffRot = degToRad(-11.5 + swingDeg * sA - 5.0 * sitPoseT);
    var bfRot = degToRad(4.0 + swingDeg * sBackB + 42.0 * sitPoseT);
    var fnUpRot = degToRad(4.0 + (swingDeg * 1.06) * sB - 9.0 * sitPoseT);
    // Muñeca articulada: extiende la pata para apoyar en fase de soporte y la recoge en el aire
    var fnLoRel = degToRad(20.0 * (1 - liftNearFront * 0.92) + 18.0 * sitPoseT);
    var bnRot = degToRad(16.0 + (swingDeg * 1.06) * sBackA + 48.0 * sitPoseT);

    // Meneo de cola y estabilización natural del cuello/cabeza
    var tailDeg = Math.sin(dog.tailPhase) * (11.0 + 5.0 * gaitAmp) - 7.0 * sitPoseT;
    var headStabilizeDeg =
      -spinePitchDeg * 0.84 +
      Math.sin(phase * 2 - 0.55) * 2.4 * gaitAmp +
      dog.talkNodDeg * 0.6;
    var headRot = torsoRot + degToRad(headStabilizeDeg);

    // 1. Cola (detrás del torso)
    var tailPos = childPivotPos(torsoMeta, walkRig.tail, torsoX, torsoY, torsoRot);
    drawPart(ctx, walkRig.tail, tailPos.x, tailPos.y, torsoRot + degToRad(tailDeg));

    // 2. Patas lejanas (detrás del torso: cero costuras posibles)
    var ffPos = childPivotPos(torsoMeta, walkRig.frontFar, torsoX, torsoY, torsoRot);
    drawPart(ctx, walkRig.frontFar, ffPos.x, ffPos.y, ffRot);

    var bfPos = childPivotPos(torsoMeta, walkRig.backFar, torsoX, torsoY, torsoRot);
    drawPart(ctx, walkRig.backFar, bfPos.x, bfPos.y, bfRot);

    // 3. Torso reconstruido
    drawPart(ctx, torsoMeta, torsoX, torsoY, torsoRot);

    // 4. Cabeza Pixar (con sobre en la boca durante entrega, o mandíbula limpia al andar normal)
    var useEnvHead = Boolean(dog.hasEnvelope && walkRig.headEnv);
    var headMeta = useEnvHead ? walkRig.headEnv : walkRig.head;
    var headPos = childPivotPos(torsoMeta, headMeta, torsoX, torsoY, torsoRot);
    var blinkAmt = dog.blinkProgress;
    var happyAmt = dog.happyEyeTimer > 0 ? smoothstep(0, 0.25, dog.happyEyeTimer) : 0;

    drawPart(ctx, headMeta, headPos.x, headPos.y, headRot, function (lctx, hm) {
      if (!useEnvHead) {
        drawPixarBlinkAndHappyEyes(lctx, hm, blinkAmt, happyAmt);
      }
    });

    // Oreja doblada con rebote elástico en el perrito canela
    if (walkRig.earFlop) {
      var earPos = childPivotPos(headMeta, walkRig.earFlop, headPos.x, headPos.y, headRot);
      var earBounceDeg = Math.sin(phase * 2 - 1.15) * 11.5 * gaitAmp + dog.earSpringPos;
      drawPart(ctx, walkRig.earFlop, earPos.x, earPos.y, headRot + degToRad(earBounceDeg));
    }

    // Pajarita nítida cubriendo el cuello
    var bowPos = childPivotPos(torsoMeta, walkRig.bowtie, torsoX, torsoY, torsoRot);
    drawPart(ctx, walkRig.bowtie, bowPos.x, bowPos.y, torsoRot + degToRad(headStabilizeDeg * 0.15));

    // 5. Patas cercanas articuladas (hombro/cadera con fundido radial y muñeca de 2 segmentos)
    var bnPos = childPivotPos(torsoMeta, walkRig.backNear, torsoX, torsoY, torsoRot);
    drawPart(ctx, walkRig.backNear, bnPos.x, bnPos.y, bnRot);

    var fnUpPos = childPivotPos(torsoMeta, walkRig.frontNearUp, torsoX, torsoY, torsoRot);
    drawPart(ctx, walkRig.frontNearUp, fnUpPos.x, fnUpPos.y, fnUpRot);

    var fnLoPos = childPivotPos(walkRig.frontNearUp, walkRig.frontNearLo, fnUpPos.x, fnUpPos.y, fnUpRot);
    drawPart(ctx, walkRig.frontNearLo, fnLoPos.x, fnLoPos.y, fnUpRot + fnLoRel);

    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     RENDERIZADO DEL PERRO SENTADO / BAILANDO / SALTANDO DE FRENTE
     -------------------------------------------------------------------------- */
  function resolveSeatedMoodKey(mood) {
    if (mood === 'food') return 'food';
    if (mood === 'party' || mood === 'dance') return 'party';
    if (mood === 'sad') return 'sad';
    return 'welcome';
  }

  function renderFrontSeatedRig(ctx, dog, charRig, nowSec, settleSquash, alpha) {
    if (alpha <= 0.01 || !charRig) return;

    // Si está en pleno salto alegre en el aire, renderizamos el sprite Pixar de salto con patas arriba
    if (dog.jumpY > 9 && charRig.celebrate) {
      var cScale = POSE_SCALES[dog.key].celebrate || 0.48;
      var cMeta = charRig.celebrate;
      var airTilt = degToRad(Math.sin(nowSec * 14) * 3.2);
      ctx.save();
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.translate(CENTER_X, GROUND_Y - 12);
      ctx.scale(cScale, cScale);
      drawPart(ctx, cMeta, 0, 0, airTilt);
      ctx.restore();
      return;
    }

    var moodKey = resolveSeatedMoodKey(dog.mood);
    var moodRig = charRig.moods[moodKey] || charRig.moods.welcome;
    var mScale = POSE_SCALES[dog.key][moodKey] || 0.48;

    var isDance = dog.mood === 'dance' || dog.mood === 'party';
    var danceFreq = dog.mood === 'dance' ? 7.2 : 4.2;
    var danceAmp = dog.mood === 'dance' ? 1.0 : (dog.mood === 'party' ? 0.35 : 0);

    // Respiración orgánica continua + ritmo de baile + squash-and-stretch al sentarse/saltar
    var breath = Math.sin(nowSec * 2.35 + (dog.key === 'husky' ? 0 : 1.4));
    var danceCompress = danceAmp > 0 ? Math.abs(Math.sin(nowSec * danceFreq)) * 0.032 * danceAmp : 0;
    var danceSwayDeg = danceAmp > 0 ? Math.sin(nowSec * (danceFreq * 0.5)) * 3.8 * danceAmp : 0;

    var sy = (1 + breath * 0.013 - danceCompress) * (1 - settleSquash * 0.055);
    var sx = (1 - breath * 0.008 + danceCompress * 0.65) * (1 + settleSquash * 0.045);

    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 1);
    // Anclado exactamente en las patas sobre el suelo para que nunca floten al respirar
    ctx.translate(CENTER_X, GROUND_Y);
    ctx.scale(mScale * sx, mScale * sy);
    if (danceSwayDeg !== 0) {
      ctx.rotate(degToRad(danceSwayDeg * 0.45));
    }

    var bodyMeta = moodRig.body;

    // 1. Cola Pixar meneándose detrás de la cadera
    if (charRig.sitTail && moodRig.tailAttach) {
      var tx = moodRig.tailAttach[0] - bodyMeta.worldPivot[0];
      var ty = moodRig.tailAttach[1] - bodyMeta.worldPivot[1];
      var wagAmp = moodKey === 'sad' ? 5.5 : (isDance || dog.waveTimer > 0 ? 15.5 : 10.5);
      var tailAngle = degToRad(Math.sin(dog.tailPhase) * wagAmp);
      drawPart(ctx, charRig.sitTail, tx, ty, tailAngle);
    }

    // 2. Cuerpo sentado Pixar
    drawPart(ctx, bodyMeta, 0, 0, 0);

    // 3. Cabeza Pixar con ladeo expresivo, seguimiento suave del cursor, asentimiento al hablar y parpadeo
    var headMeta = moodRig.head;
    var headPos = childPivotPos(bodyMeta, headMeta, 0, 0, 0);

    var cursorTilt = clamp(pointerNormX * 3.8, -3.8, 3.8);
    var idleTilt = Math.sin(nowSec * 1.15 + (dog.key === 'husky' ? 0.5 : 2.1)) * 2.2;
    var sadExtra = moodKey === 'sad' ? (dog.key === 'husky' ? 3.5 : -3.5) : 0;
    var danceHead = danceSwayDeg * 1.15;
    var petWiggle = dog.waveTimer > 0 ? Math.sin(nowSec * 13) * 4.5 : 0;

    var totalHeadDeg = cursorTilt + idleTilt + sadExtra + danceHead + petWiggle + dog.talkNodDeg;
    var headRot = degToRad(totalHeadDeg);

    // Pequeño desplazamiento vertical de asentimiento al hablar o reír
    var nodOffsetY = Math.abs(dog.talkNodDeg) * 0.45 - breath * 1.4;

    var blinkAmt = dog.blinkProgress;
    var happyAmt = dog.happyEyeTimer > 0 ? smoothstep(0, 0.22, dog.happyEyeTimer) : 0;

    drawPart(ctx, headMeta, headPos.x, headPos.y + nodOffsetY, headRot, function (lctx, hm) {
      // En modo party el Husky lleva gafas de sol doradas reales del render Pixar
      if (!(dog.key === 'husky' && moodKey === 'party')) {
        drawPixarBlinkAndHappyEyes(lctx, hm, blinkAmt, happyAmt);
      }
    });

    // 4. Oreja doblada característica del perrito canela con física de muelle secundaria
    if (moodRig.earFlop) {
      var earPos = childPivotPos(headMeta, moodRig.earFlop, headPos.x, headPos.y + nodOffsetY, headRot);
      var earRot = headRot + degToRad(dog.earSpringPos + danceSwayDeg * 0.8);
      drawPart(ctx, moodRig.earFlop, earPos.x, earPos.y, earRot);
    }

    // 5. Pajarita superpuesta sobre la unión del cuello (cero costuras al ladear la cabeza)
    var bowPos = childPivotPos(bodyMeta, moodRig.bowtie, 0, 0, 0);
    drawPart(ctx, moodRig.bowtie, bowPos.x, bowPos.y + nodOffsetY * 0.25, degToRad(totalHeadDeg * 0.18));

    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     SOMBRA DINÁMICA SUAVE EN EL SUELO
     -------------------------------------------------------------------------- */
  function drawGroundShadow(ctx, dog) {
    var airFactor = clamp(1 - dog.jumpY / 115, 0.48, 1.0);
    var sitWidening = 1 - 0.14 * dog.sitBlend;
    var rx = (dog.key === 'husky' ? 68 : 58) * airFactor * sitWidening;
    var ry = 9.5 * airFactor;

    ctx.save();
    var grad = ctx.createRadialGradient(CENTER_X, GROUND_Y + 2, rx * 0.12, CENTER_X, GROUND_Y + 2, rx);
    grad.addColorStop(0, 'rgba(35, 30, 24, ' + (0.24 * airFactor).toFixed(3) + ')');
    grad.addColorStop(0.62, 'rgba(35, 30, 24, ' + (0.11 * airFactor).toFixed(3) + ')');
    grad.addColorStop(1, 'rgba(35, 30, 24, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(CENTER_X, GROUND_Y + 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     INICIALIZACIÓN DE CADA ACTOR EN CANVAS RETINA
     -------------------------------------------------------------------------- */
  function createDogActor(key, actorId, rigHostId, bubbleId, defaultRestFacing) {
    var actorEl = document.getElementById(actorId);
    var rigHost = document.getElementById(rigHostId);
    var bubbleEl = document.getElementById(bubbleId);
    if (!actorEl || !rigHost) return null;

    var canvas = document.createElement('canvas');
    canvas.className = 'dog-pixar-canvas dog-pixar-canvas--' + key;
    canvas.setAttribute('aria-hidden', 'true');
    rigHost.innerHTML = '';
    rigHost.appendChild(canvas);

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(LOGICAL_W * dpr);
    canvas.height = Math.round(LOGICAL_H * dpr);

    var ctx = canvas.getContext('2d');

    return {
      key: key,
      actorEl: actorEl,
      bubbleEl: bubbleEl,
      canvas: canvas,
      ctx: ctx,
      dpr: dpr,

      // Cinemática horizontal realista con aceleración y frenada suave
      x: key === 'husky' ? -150 : window.innerWidth + 12,
      targetX: key === 'husky' ? 24 : Math.max(190, window.innerWidth - 230),
      lastXPct: key === 'husky' ? 4 : 76,
      vx: 0,
      maxSpeed: 255,

      restFacing: defaultRestFacing,
      facing: defaultRestFacing,

      // sitBlend: 0 = de pie / andando de perfil, 1 = sentado mirando al frente
      sitBlend: 0,
      settleBounce: 0,
      wasSitting: false,

      mood: 'welcome',
      walkPhase: key === 'husky' ? 0.2 : 2.1,
      gaitAmp: 0,
      tailPhase: Math.random() * 6.28,

      // Salto parabólico con anticipación
      jumpDelay: 0,
      jumpY: 0,
      velY: 0,

      // Expresividad facial, habla y física secundaria de oreja
      waveTimer: 0,
      happyEyeTimer: 0,
      talkTimer: 0,
      talkNodDeg: 0,
      prevHeadVel: 0,
      earSpringPos: 0,
      earSpringVel: 0,

      // Parpadeo natural (con ocasional doble parpadeo Pixar)
      blinkTimer: 1.8 + Math.random() * 2.6,
      blinkClock: -1,
      blinkDuration: 0.17,
      blinkProgress: 0,
      pendingDoubleBlink: false,

      hasEnvelope: false
    };
  }

  function syncCanvasDpr(dog) {
    if (!dog || !dog.canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var targetW = Math.round(LOGICAL_W * dpr);
    var targetH = Math.round(LOGICAL_H * dpr);
    if (dog.canvas.width !== targetW || dog.canvas.height !== targetH) {
      dog.dpr = dpr;
      dog.canvas.width = targetW;
      dog.canvas.height = targetH;
    }
  }

  function getActiveRsvpCardRect() {
    var ids = ['rsvp-arena', 'rsvp-form-yes', 'rsvp-form-no', 'rsvp-vip-pass'];
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && !el.classList.contains('is-hidden')) {
        var r = el.getBoundingClientRect();
        if (r && r.width > 100) return r;
      }
    }
    var vw = window.innerWidth;
    var fallbackW = Math.min(720, vw - 32);
    var left = (vw - fallbackW) * 0.5;
    return { left: left, right: left + fallbackW, width: fallbackW };
  }

  function getExpectedActorWidth(dog, docked) {
    var vw = window.innerWidth;
    if (docked) {
      if (vw <= 640) return 112;
      if (dog && dog.actorEl && dog.actorEl.offsetWidth > 60) {
        return dog.actorEl.offsetWidth;
      }
      return clamp(vw * 0.38, 138, 196);
    }
    if (dog && dog.actorEl && dog.actorEl.offsetWidth > 60) {
      return dog.actorEl.offsetWidth;
    }
    return clamp(vw * 0.158, 148, 214);
  }

  function updateLayoutMode() {
    var vw = window.innerWidth;
    var cardRect = getActiveRsvpCardRect();
    var sideActorW = clamp(vw * 0.158, 148, 214);
    var minCorridor = sideActorW + 24;
    var leftSpace = cardRect.left;
    var rightSpace = vw - cardRect.right;

    // Si hay espacio suficiente a ambos lados de la tarjeta, flanquean en los márgenes sin tocarla;
    // si la pantalla es más estrecha, se acoplan debajo del cuestionario para no tapar nada.
    var shouldDock = leftSpace < minCorridor || rightSpace < minCorridor;
    if (shouldDock !== isDocked) {
      isDocked = shouldDock;
      if (stageEl) {
        stageEl.classList.toggle('is-docked', isDocked);
      }
    }
    return {
      vw: vw,
      cardRect: cardRect,
      docked: isDocked
    };
  }

  function getDockedSafeRange(dog, vw) {
    var actorW = getExpectedActorWidth(dog, true);
    var stageW = (stageEl && stageEl.clientWidth) || Math.min(720, vw - 24);
    var dPad = 4;
    if (dog.key === 'husky') {
      return { min: dPad, max: Math.max(dPad, stageW * 0.47 - actorW) };
    }
    var minT = Math.min(stageW - actorW - dPad, stageW * 0.53);
    var maxT = Math.max(minT, stageW - actorW - dPad);
    return { min: minT, max: maxT };
  }

  function percentToPixelX(dog, xPct) {
    var layout = updateLayoutMode();
    var vw = layout.vw;
    var cardRect = layout.cardRect;
    var docked = layout.docked;
    var actorW = getExpectedActorWidth(dog, docked);

    if (docked) {
      var bounds = getDockedSafeRange(dog, vw);
      if (dog.key === 'husky') {
        var uH = clamp((xPct - 3) / 15, 0, 1);
        return lerp(bounds.min, bounds.max, uH);
      }
      var uT = clamp((77 - xPct) / 16, 0, 1);
      return lerp(bounds.max, bounds.min, uT);
    }

    var pad = 12;
    var gap = 14;
    if (dog.key === 'husky') {
      var leftMax = Math.max(pad, cardRect.left - actorW - gap);
      var uLeft = clamp((xPct - 3) / 15, 0, 1);
      return lerp(pad, leftMax, uLeft);
    }

    var rightMin = Math.min(vw - actorW - pad, cardRect.right + gap);
    var rightMax = Math.max(rightMin, vw - actorW - pad);
    var uRight = clamp((77 - xPct) / 16, 0, 1);
    return lerp(rightMax, rightMin, uRight);
  }

  /* --------------------------------------------------------------------------
     SIMULACIÓN FÍSICA + RENDERIZADO 60FPS DE CADA PERRO
     -------------------------------------------------------------------------- */
  function stepAndRenderDog(dog, dt, nowSec) {
    if (!dog || !dog.ctx || !rigData) return;

    var dx = dog.targetX - dog.x;
    var absDx = Math.abs(dx);
    var wantsToMove = absDx > 4.5;

    // 1. Incorporarse desde sentado antes de arrancar + aceleración/deceleración suave
    if (wantsToMove) {
      dog.facing = dx > 0 ? 1 : -1;
      dog.sitBlend = Math.max(0, dog.sitBlend - dt * (isCourierBusy ? 6.2 : 4.2));
      dog.wasSitting = false;

      // Espera a levantar los cuartos traseros (sitBlend < 0.55) para impulsar la carrera
      var standReady = smoothstep(0.68, 0.15, dog.sitBlend);
      var brakeFactor = clamp(Math.sqrt(absDx / 82), 0.18, 1.0);
      var effectiveMaxSpeed =
        !isCourierBusy && isDocked && window.innerWidth <= 640
          ? Math.min(dog.maxSpeed, 175)
          : dog.maxSpeed;
      var desiredSpeed = effectiveMaxSpeed * standReady * brakeFactor * Math.sign(dx);

      var accel = isCourierBusy ? 1850 : 980;
      var dv = clamp(desiredSpeed - dog.vx, -accel * dt, accel * dt);
      dog.vx += dv;

      var stepX = dog.vx * dt;
      if (Math.abs(stepX) > absDx) {
        stepX = dx;
        dog.vx = 0;
      }
      dog.x += stepX;

      // Fase de paso proporcional al tamaño real del perro y la distancia recorrida (cero deslizamiento)
      var sizeRatio = clamp(getExpectedActorWidth(dog, isDocked) / 205, 0.52, 1.05);
      var stridePixels = (isCourierBusy ? 118 : 92) * sizeRatio;
      dog.walkPhase += (Math.abs(stepX) / stridePixels) * Math.PI * 2;
      var targetGait = clamp(Math.abs(dog.vx) / Math.max(110, effectiveMaxSpeed * 0.72), 0.15, 1.15);
      dog.gaitAmp = lerp(dog.gaitAmp, targetGait, dt * 10);
    } else {
      dog.x = dog.targetX;
      dog.vx = 0;
      dog.facing = dog.restFacing;
      dog.gaitAmp = lerp(dog.gaitAmp, 0, dt * 11);

      if (!isCourierBusy) {
        var prevSit = dog.sitBlend;
        dog.sitBlend = Math.min(1, dog.sitBlend + dt * 3.2);
        if (prevSit < 0.72 && dog.sitBlend >= 0.72 && !dog.wasSitting) {
          dog.wasSitting = true;
          dog.settleBounce = 1.0;
          dog.earSpringVel -= 95;
        }
      }
    }

    if (dog.settleBounce > 0) {
      dog.settleBounce = Math.max(0, dog.settleBounce - dt * 3.8);
    }

    // 2. Física parabólica de salto con breve anticipación
    if (dog.jumpDelay > 0) {
      dog.jumpDelay -= dt;
      dog.settleBounce = Math.max(dog.settleBounce, 0.85);
      if (dog.jumpDelay <= 0) {
        dog.velY = 395;
        dog.earSpringVel += 150;
      }
    }
    if (dog.jumpY > 0 || dog.velY !== 0) {
      dog.jumpY += dog.velY * dt;
      dog.velY -= 1180 * dt;
      if (dog.jumpY <= 0) {
        dog.jumpY = 0;
        dog.velY = 0;
        dog.settleBounce = 0.9;
        dog.earSpringVel -= 110;
      }
    }

    // 3. Timers expresivos (habla en bocadillo, caricias, cola, orejas y parpadeo)
    if (dog.waveTimer > 0) dog.waveTimer = Math.max(0, dog.waveTimer - dt);
    if (dog.happyEyeTimer > 0) dog.happyEyeTimer = Math.max(0, dog.happyEyeTimer - dt);

    if (dog.talkTimer > 0) {
      dog.talkTimer = Math.max(0, dog.talkTimer - dt);
      var env = smoothstep(0, 0.25, dog.talkTimer);
      dog.talkNodDeg = Math.sin(nowSec * 14.5 + (dog.key === 'husky' ? 0 : 1.2)) * 4.2 * env;
    } else {
      dog.talkNodDeg = lerp(dog.talkNodDeg, 0, dt * 8);
    }

    // Muelle amortiguado para la oreja doblada
    var earStiffness = 135;
    var earDamping = 11.5;
    var earAccel = -earStiffness * dog.earSpringPos - earDamping * dog.earSpringVel - dog.talkNodDeg * 8;
    dog.earSpringVel += earAccel * dt;
    dog.earSpringPos = clamp(dog.earSpringPos + dog.earSpringVel * dt, -16, 16);

    // Velocidad de la cola según emoción
    var tailSpeed =
      dog.mood === 'sad'
        ? 2.8
        : isCourierBusy || dog.waveTimer > 0 || dog.mood === 'celebrate' || dog.mood === 'food' || dog.mood === 'dance'
          ? 14.5
          : 7.8;
    dog.tailPhase += tailSpeed * dt;

    // Máquina de estados de parpadeo realista
    if (dog.blinkClock >= 0) {
      dog.blinkClock += dt;
      var u = dog.blinkClock / dog.blinkDuration;
      if (u >= 1) {
        dog.blinkClock = -1;
        dog.blinkProgress = 0;
        if (dog.pendingDoubleBlink) {
          dog.pendingDoubleBlink = false;
          dog.blinkTimer = 0.11;
        } else {
          dog.blinkTimer = 2.6 + Math.random() * 3.4;
        }
      } else {
        // Cierre rápido (38% del tiempo) y apertura suave (62%)
        dog.blinkProgress = u < 0.38 ? (u / 0.38) : (1 - (u - 0.38) / 0.62);
      }
    } else {
      dog.blinkTimer -= dt;
      if (dog.blinkTimer <= 0) {
        dog.blinkClock = 0;
        dog.pendingDoubleBlink = Math.random() < 0.22;
      }
    }

    // 4. Posicionamiento DOM acelerado por GPU
    dog.actorEl.style.transform =
      'translate3d(' + dog.x.toFixed(1) + 'px, ' + (-dog.jumpY).toFixed(1) + 'px, 0)';

    // 5. Dibujo en Canvas de alta resolución
    syncCanvasDpr(dog);
    var ctx = dog.ctx;
    ctx.save();
    ctx.setTransform(dog.dpr, 0, 0, dog.dpr, 0, 0);
    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
    ctx.imageSmoothingEnabled = true;
    if ('imageSmoothingQuality' in ctx) {
      ctx.imageSmoothingQuality = 'high';
    }

    drawGroundShadow(ctx, dog);

    var charRig = rigData[dog.key];
    var s = dog.sitBlend;

    // Transición cruzada suave: de 0..0.62 el perfil baja la grupa al suelo; de 0.36..0.78 gira al frente
    var sideAlpha = 1 - smoothstep(0.38, 0.76, s);
    var frontAlpha = smoothstep(0.34, 0.72, s);
    var sitPoseT = smoothstep(0.04, 0.62, s);
    var settleSquash = Math.sin(dog.settleBounce * Math.PI) * 0.85;

    if (sideAlpha > 0.01) {
      renderSideWalkRig(ctx, dog, charRig.walk, POSE_SCALES[dog.key].walk, sitPoseT, sideAlpha);
    }
    if (frontAlpha > 0.01) {
      renderFrontSeatedRig(ctx, dog, charRig, nowSec, settleSquash, frontAlpha);
    }

    ctx.restore();
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;

    if (isVisible && !document.hidden) {
      var nowSec = ts / 1000;
      stepAndRenderDog(dogs.husky, dt, nowSec);
      stepAndRenderDog(dogs.terrier, dt, nowSec);
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
    }
  }

  function ensureRunning() {
    if (!rafId && isVisible && !reducedMotion) {
      lastTs = 0;
      rafId = requestAnimationFrame(loop);
    }
  }

  /* --------------------------------------------------------------------------
     API PÚBLICA PARA RSVP.JS
     -------------------------------------------------------------------------- */
  function setVisible(visible) {
    isVisible = Boolean(visible);
    if (stageEl) {
      stageEl.classList.toggle('is-hidden', !isVisible);
    }
    if (isVisible) {
      if (reducedMotion) {
        if (dogs.husky) dogs.husky.sitBlend = 1;
        if (dogs.terrier) dogs.terrier.sitBlend = 1;
        stepAndRenderDog(dogs.husky, 0.016, 0);
        stepAndRenderDog(dogs.terrier, 0.016, 0);
      } else {
        ensureRunning();
      }
    } else if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function setBubble(dog, text) {
    if (!dog || !dog.bubbleEl) return;
    if (!text) {
      dog.bubbleEl.classList.add('is-hidden');
      return;
    }
    dog.bubbleEl.classList.remove('is-hidden');
    dog.bubbleEl.style.animation = 'none';
    void dog.bubbleEl.offsetWidth;
    dog.bubbleEl.style.animation = '';
    dog.bubbleEl.textContent = text;
    dog.talkTimer = 1.35;
    dog.earSpringVel += 75;
  }

  function command(key, opts) {
    var dog = dogs[key];
    if (!dog || !opts) return;

    if (opts.mood) dog.mood = opts.mood;
    if (typeof opts.xPct === 'number') {
      dog.lastXPct = opts.xPct;
      var nextTargetX = percentToPixelX(dog, opts.xPct);
      // En móvil acoplado, si el destino queda demasiado cerca (<36px), alterna al extremo opuesto
      // de su pasillo seguro para que siempre camine pasos visibles antes de sentarse.
      if (isDocked && Math.abs(nextTargetX - dog.x) < 36) {
        var dockedRange = getDockedSafeRange(dog, window.innerWidth);
        if (dockedRange.max - dockedRange.min >= 38) {
          var distMin = Math.abs(dog.x - dockedRange.min);
          var distMax = Math.abs(dog.x - dockedRange.max);
          nextTargetX = distMin > distMax ? dockedRange.min : dockedRange.max;
        }
      }
      dog.targetX = nextTargetX;
    }
    if (opts.jump) {
      dog.jumpDelay = 0.07;
    }
    if (opts.wave) {
      dog.waveTimer = 1.5;
      dog.earSpringVel += 90;
    }
    if (opts.happyEyes) {
      dog.happyEyeTimer = 1.5;
    }
    if (typeof opts.text === 'string') {
      var delay = opts.delayMs || 0;
      clearTimeout(dog._bubbleTimer);
      if (delay > 0) {
        dog._bubbleTimer = setTimeout(function () {
          setBubble(dog, opts.text);
        }, delay);
      } else {
        setBubble(dog, opts.text);
      }
    }

    if (reducedMotion) {
      dog.x = dog.targetX;
      dog.sitBlend = 1;
      stepAndRenderDog(dog, 0.016, 0);
    } else {
      ensureRunning();
    }
  }

  function pet(key) {
    var dog = dogs[key];
    if (!dog) return;
    dog.jumpDelay = 0.06;
    dog.waveTimer = 1.6;
    dog.happyEyeTimer = 1.6;
    dog.talkTimer = 1.2;
    ensureRunning();
  }

  function runCourierDelivery(snippet, caption, onDone) {
    if (isCourierBusy || !dogs.husky || !dogs.terrier) return;
    isCourierBusy = true;

    setBubble(dogs.husky, '');
    setBubble(dogs.terrier, '');

    if (bannerEl) {
      if (bannerSlipEl) bannerSlipEl.textContent = snippet;
      if (bannerCaptionEl) bannerCaptionEl.textContent = caption;
      bannerEl.classList.remove('is-hidden');
    }

    // El perrito canela sujeta el sobre sellado en la boca y ambos trotan juntos cruzando la web
    var runStageW = isDocked && stageEl && stageEl.clientWidth ? stageEl.clientWidth : window.innerWidth;
    if (isDocked) {
      dogs.husky.x = Math.max(dogs.husky.x, runStageW * 0.36);
      dogs.terrier.x = Math.max(dogs.terrier.x, runStageW * 0.72);
    }
    dogs.terrier.hasEnvelope = true;
    dogs.husky.mood = 'carry';
    dogs.terrier.mood = 'carry';
    dogs.husky.targetX = isDocked ? -210 : -300;
    dogs.terrier.targetX = isDocked ? -140 : -220;
    dogs.husky.maxSpeed = Math.max(isDocked ? 310 : 660, Math.abs(dogs.husky.x - dogs.husky.targetX) / (isDocked ? 1.12 : 1.05));
    dogs.terrier.maxSpeed = Math.max(isDocked ? 340 : 740, Math.abs(dogs.terrier.x - dogs.terrier.targetX) / (isDocked ? 1.14 : 1.08));
    ensureRunning();

    setTimeout(function () {
      dogs.terrier.hasEnvelope = false;
      dogs.husky.maxSpeed = 255;
      dogs.terrier.maxSpeed = 255;
      var reentryW = isDocked && stageEl && stageEl.clientWidth ? stageEl.clientWidth : runStageW;
      // Regresan andando tranquilamente desde ambos lados hasta su nuevo sitio y se sientan
      dogs.husky.x = -160;
      dogs.terrier.x = reentryW + 12;
      dogs.husky.sitBlend = 0;
      dogs.terrier.sitBlend = 0;
      if (bannerEl) bannerEl.classList.add('is-hidden');
      isCourierBusy = false;
      if (typeof onDone === 'function') onDone();
    }, reducedMotion ? 350 : 1320);
  }

  function refreshBounds(snapImmediate) {
    if (!dogs.husky || !dogs.terrier || isCourierBusy) return;
    var prevDocked = isDocked;
    updateLayoutMode();
    dogs.husky.targetX = percentToPixelX(dogs.husky, dogs.husky.lastXPct);
    dogs.terrier.targetX = percentToPixelX(dogs.terrier, dogs.terrier.lastXPct);
    if (snapImmediate || prevDocked !== isDocked) {
      dogs.husky.x = dogs.husky.targetX;
      dogs.terrier.x = dogs.terrier.targetX;
      dogs.husky.vx = 0;
      dogs.terrier.vx = 0;
      if (isVisible) {
        stepAndRenderDog(dogs.husky, 0.016, 0);
        stepAndRenderDog(dogs.terrier, 0.016, 0);
      }
    }
  }

  function handleResize() {
    refreshBounds(false);
  }

  function init(config) {
    cfg = config;
    rigData = window.BODA_DOG_RIG_DATA || null;
    reducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (rigData) {
      preloadRigTree(rigData.husky);
      preloadRigTree(rigData.terrier);
    }

    stageEl = document.getElementById('dogs-roaming-stage');
    bannerEl = document.getElementById('global-courier-banner');
    bannerSlipEl = document.getElementById('global-courier-slip');
    bannerCaptionEl = document.getElementById('global-courier-caption');

    dogs.husky = createDogActor('husky', 'dog-actor-husky', 'rig-actor-husky', 'husky-bubble', 1);
    dogs.terrier = createDogActor('terrier', 'dog-actor-terrier', 'rig-actor-terrier', 'terrier-bubble', -1);

    updateLayoutMode();
    if (isDocked && dogs.terrier && stageEl) {
      dogs.terrier.x = (stageEl.clientWidth || Math.min(720, window.innerWidth - 24)) + 12;
    }

    window.addEventListener(
      'pointermove',
      function (e) {
        pointerNormX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
        pointerNormY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      },
      { passive: true }
    );

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && isVisible) ensureRunning();
    });
  }

  window.BodaDogAnimator = {
    init: init,
    setVisible: setVisible,
    command: command,
    pet: pet,
    runCourierDelivery: runCourierDelivery,
    refreshBounds: refreshBounds
  };
})();

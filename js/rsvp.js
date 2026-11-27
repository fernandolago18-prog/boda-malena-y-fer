/* ============================================================================
   MOTOR RSVP INTERACTIVO: WIZARD 1 PREGUNTA POR PANTALLA + PERROS PIXAR
   ANIMADOS EN TIEMPO REAL (ANDAN, SE SIENTAN, BAILAN, LLEVAN TU RESPUESTA)
   + BOTÓN "NO" SORPRESA SIN CONTADOR
   ============================================================================ */

(function () {
  var STORAGE_KEY = 'boda_rsvp_v1';
  var TOTAL_STEPS = 8;
  var cfg = null;

  var noAttempts = 0;
  var isSurrendered = false;
  var lastDodgeAt = 0;

  var currentStep = 1;
  var isTransitioning = false;
  var petHuskyIdx = 0;
  var petTerrierIdx = 0;
  var nameDebounceTimer = null;

  var hasPlusOne = false;
  var hasChildren = false;
  var childrenData = [];
  var lastSubmitted = null;

  var rsvpSection, arenaCard, arenaStage, btnYes, btnNo;
  var formYes, formNo, vipPassWrap;
  var wizardScreensEl;
  var stepLabelEl, progressFillEl, btnPrev, btnNext, btnSubmitYes;
  var btnPetHusky, btnPetTerrier;

  function showToast(msg) {
    if (window.BodaEasterEggs && window.BodaEasterEggs.showToast) {
      window.BodaEasterEggs.showToast(msg);
    }
  }

  function choreograph(opts) {
    var anim = window.BodaDogAnimator;
    if (!anim) return;

    var mood = opts.mood || 'welcome';
    anim.command('husky', {
      mood: opts.huskyMood || mood,
      xPct: opts.huskyX,
      jump: opts.jump,
      wave: opts.wave,
      happyEyes: opts.happyEyes,
      text: opts.huskyText
    });

    anim.command('terrier', {
      mood: opts.terrierMood || mood,
      xPct: opts.terrierX,
      jump: opts.jump,
      wave: opts.wave,
      happyEyes: opts.happyEyes,
      text: opts.terrierText,
      delayMs: typeof opts.stagger === 'number' ? opts.stagger : 220
    });
  }

  function showStep(step) {
    arenaCard.classList.toggle('is-hidden', step !== 'arena');
    formYes.classList.toggle('is-hidden', step !== 'yes');
    formNo.classList.toggle('is-hidden', step !== 'no');
    vipPassWrap.classList.toggle('is-hidden', step !== 'vip');
    if (window.BodaDogAnimator && window.BodaDogAnimator.refreshBounds) {
      window.BodaDogAnimator.refreshBounds(false);
    }
  }

  function resetArenaState() {
    noAttempts = 0;
    isSurrendered = false;
    btnNo.classList.remove('is-dodging', 'is-surrendered');
    btnNo.style.left = '';
    btnNo.style.top = '';
    var labels = (cfg.rsvp.dogs && cfg.rsvp.dogs.noButtonLabels) || [];
    btnNo.textContent = labels[0] || 'No podré asistir';
    btnYes.style.transform = '';
    btnYes.classList.remove('is-magnetic');

    choreograph({
      mood: 'welcome',
      huskyX: 4,
      terrierX: 76,
      huskyText: 'El botón verde es una decisión brillante... el otro, la verdad, no te lo recomiendo.',
      terrierText: 'Aviso: nadie ha conseguido pulsar el botón de «No podré asistir» a la primera... pero te dejamos que lo intentes ;)'
    });
  }

  function findSafeDodgeCoords() {
    var stageRect = arenaStage.getBoundingClientRect();
    var yesRect = btnYes.getBoundingClientRect();
    var noRect = btnNo.getBoundingClientRect();

    var pad = 14;
    var maxLeft = Math.max(pad, stageRect.width - noRect.width - pad);
    var maxTop = Math.max(pad, stageRect.height - noRect.height - pad);

    var yesBox = {
      left: yesRect.left - stageRect.left - 12,
      right: yesRect.right - stageRect.left + 12,
      top: yesRect.top - stageRect.top - 12,
      bottom: yesRect.bottom - stageRect.top + 12
    };

    var curLeft = parseFloat(btnNo.style.left);
    var curTop = parseFloat(btnNo.style.top);
    if (isNaN(curLeft)) curLeft = noRect.left - stageRect.left;
    if (isNaN(curTop)) curTop = noRect.top - stageRect.top;

    var best = { left: maxLeft, top: pad };
    var bestDist = -1;
    for (var attempt = 0; attempt < 60; attempt++) {
      var candLeft = pad + Math.random() * Math.max(0, maxLeft - pad);
      var candTop = pad + Math.random() * Math.max(0, maxTop - pad);

      var overlapsYes = !(
        candLeft + noRect.width < yesBox.left ||
        candLeft > yesBox.right ||
        candTop + noRect.height < yesBox.top ||
        candTop > yesBox.bottom
      );

      if (!overlapsYes) {
        var movedDist = Math.hypot(candLeft - curLeft, candTop - curTop);
        if (movedDist > 55) {
          return { left: candLeft, top: candTop };
        }
        if (movedDist > bestDist) {
          bestDist = movedDist;
          best = { left: candLeft, top: candTop };
        }
      }
    }

    // Respaldo determinista en rejilla 4x3 (ideal en móvil vertical) para saltar siempre lejos
    for (var gx = 0; gx < 4; gx++) {
      for (var gy = 0; gy < 3; gy++) {
        var gLeft = pad + (maxLeft - pad) * (gx / 3);
        var gTop = pad + (maxTop - pad) * (gy / 2);
        var gOverlaps = !(
          gLeft + noRect.width < yesBox.left ||
          gLeft > yesBox.right ||
          gTop + noRect.height < yesBox.top ||
          gTop > yesBox.bottom
        );
        if (!gOverlaps) {
          var gDist = Math.hypot(gLeft - curLeft, gTop - curTop);
          if (gDist > bestDist) {
            bestDist = gDist;
            best = { left: gLeft, top: gTop };
          }
        }
      }
    }
    return best;
  }

  function handleNoDodge(e) {
    if (isSurrendered) return;

    var now = Date.now();
    if (now - lastDodgeAt < 260) {
      if (e) e.preventDefault();
      return;
    }
    lastDodgeAt = now;

    if (e) e.preventDefault();

    var maxDodges = cfg.rsvp.maxNoDodges || 5;
    noAttempts += 1;

    var yesStepScale = window.innerWidth <= 640 ? 0.032 : 0.055;
    var yesScale = 1 + noAttempts * yesStepScale;
    btnYes.style.transform = 'scale(' + yesScale.toFixed(3) + ')';
    btnYes.classList.add('is-magnetic');

    var banterList = (cfg.rsvp.dogs && cfg.rsvp.dogs.noDodgeBanter) || [];
    var pair = banterList[Math.min(noAttempts - 1, banterList.length - 1)] || {
      husky: '¡Piénsalo mejor!',
      terrier: '¡Ese botón no se toca!'
    };
    var labels = (cfg.rsvp.dogs && cfg.rsvp.dogs.noButtonLabels) || [];
    var nextLabel = labels[Math.min(noAttempts, labels.length - 1)] || '¿Seguro?';

    // Se incorporan y se acercan al margen: intento 1 alerta, 2 soborno gourmet (relamiéndose), 3+ ojitos tristes
    var inwardStep = Math.min(noAttempts, 4);
    var dodgeMood = noAttempts === 2 ? 'food' : (noAttempts >= 3 ? 'sad' : 'welcome');
    choreograph({
      mood: dodgeMood,
      huskyX: 5 + inwardStep * 4.5,
      terrierX: 76 - inwardStep * 4.5,
      jump: noAttempts < 3,
      huskyText: pair.husky,
      terrierText: pair.terrier,
      stagger: 180
    });

    if (noAttempts >= maxDodges) {
      isSurrendered = true;
      btnNo.classList.add('is-surrendered');
      btnNo.textContent = labels[labels.length - 1] || 'Vale, no puedo ir 😢';
      return;
    }

    if (!btnNo.classList.contains('is-dodging')) {
      var stageRect = arenaStage.getBoundingClientRect();
      var noRect = btnNo.getBoundingClientRect();
      btnNo.style.left = noRect.left - stageRect.left + 'px';
      btnNo.style.top = noRect.top - stageRect.top + 'px';
      btnNo.classList.add('is-dodging');
      void btnNo.offsetWidth;
    }

    var coords = findSafeDodgeCoords();
    btnNo.style.left = Math.round(coords.left) + 'px';
    btnNo.style.top = Math.round(coords.top) + 'px';
    btnNo.textContent = nextLabel;
  }

  function setupRunawayNoButton() {
    btnNo.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'mouse' && !isSurrendered) {
        handleNoDodge(e);
      }
    });

    btnNo.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' && !isSurrendered) {
        handleNoDodge(e);
      }
    });

    btnNo.addEventListener(
      'touchstart',
      function (e) {
        if (!isSurrendered) {
          handleNoDodge(e);
        }
      },
      { passive: false }
    );

    btnNo.addEventListener('click', function (e) {
      if (!isSurrendered) {
        handleNoDodge(e);
        return;
      }
      if (Date.now() - lastDodgeAt < 350) {
        e.preventDefault();
        return;
      }

      var rect = btnNo.getBoundingClientRect();
      if (window.BodaParticles) {
        window.BodaParticles.sadRain(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
      showStep('no');
      choreograph({
        mood: 'sad',
        huskyX: 16,
        terrierX: 64,
        huskyText: 'Antes de firmar tu ausencia: el botón dorado de arriba aún te salva del arrepentimiento.',
        terrierText: 'Si le das a «¡Espera, sí voy!» borramos el historial y aquí no ha pasado nada.'
      });
      formNo.scrollIntoView({
        behavior: 'smooth',
        block: window.innerWidth <= 768 ? 'start' : 'nearest'
      });
    });

    btnYes.addEventListener('click', function () {
      var rect = btnYes.getBoundingClientRect();
      if (window.BodaParticles) {
        window.BodaParticles.celebrate(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }
      renderWizardStep(1);
      showStep('yes');
      formYes.scrollIntoView({
        behavior: 'smooth',
        block: window.innerWidth <= 768 ? 'start' : 'nearest'
      });
    });
  }

  function moodForStep(step) {
    if (step === 4) return 'food';
    if (step >= 5 && step <= 7) return 'party';
    if (step === 8) return 'celebrate';
    return 'welcome';
  }

  function positionsForStep(step) {
    var map = {
      1: [5, 75],
      2: [15, 64],
      3: [7, 73],
      4: [14, 66],
      5: [16, 63],
      6: [18, 61],
      7: [7, 73],
      8: [16, 63]
    };
    return map[step] || [6, 74];
  }

  function formatChildrenSummary(list) {
    if (!list || !list.length) return '';
    return list
      .map(function (c) {
        var ageTxt = c.age !== '' && c.age !== null && c.age !== undefined ? c.age + ' años' : '';
        return (c.name || 'Peque') + (ageTxt ? ' (' + ageTxt + ')' : '');
      })
      .join('; ');
  }

  function renderWizardStep(step) {
    currentStep = Math.max(1, Math.min(TOTAL_STEPS, step));

    var screens = wizardScreensEl.querySelectorAll('.wizard-screen');
    screens.forEach(function (sc) {
      var sNum = parseInt(sc.getAttribute('data-step'), 10);
      sc.classList.toggle('is-active', sNum === currentStep);
    });

    stepLabelEl.textContent = 'Pregunta ' + currentStep + ' de ' + TOTAL_STEPS;
    progressFillEl.style.width = ((currentStep / TOTAL_STEPS) * 100).toFixed(1) + '%';

    btnPrev.classList.toggle('is-hidden', currentStep === 1);
    btnNext.classList.toggle('is-hidden', currentStep === TOTAL_STEPS);
    btnSubmitYes.classList.toggle('is-hidden', currentStep !== TOTAL_STEPS);

    var banter = (cfg.rsvp.dogs && cfg.rsvp.dogs.stepBanter && cfg.rsvp.dogs.stepBanter[currentStep]) || {};
    var pos = positionsForStep(currentStep);
    var mood = moodForStep(currentStep);

    choreograph({
      mood: mood,
      huskyX: pos[0],
      terrierX: pos[1],
      jump: currentStep === TOTAL_STEPS,
      wave: currentStep === 1 || currentStep === TOTAL_STEPS,
      huskyText: banter.husky,
      terrierText: banter.terrier
    });
  }

  function validateStep(step) {
    if (step === 1) {
      var name = document.getElementById('guest-name').value.trim();
      var email = document.getElementById('guest-email').value.trim();
      if (!name || !email) {
        showToast('Por favor, escribe tu nombre y tu email o teléfono.');
        choreograph({
          mood: 'welcome',
          jump: true,
          huskyText: '¡Guau! Nos falta saber cómo te llamas.',
          terrierText: 'Y tu email o teléfono para enviarte el Pase VIP.'
        });
        return false;
      }
    }
    if (step === 2 && hasPlusOne) {
      var plusName = document.getElementById('plus-one-name').value.trim();
      if (!plusName) {
        showToast('Indícanos el nombre de tu acompañante para su tarjeta.');
        choreograph({
          mood: 'welcome',
          jump: true,
          huskyText: '¡Eh! Nos falta el nombre de tu acompañante.',
          terrierText: 'Así le preparamos su tarjeta personalizada.'
        });
        return false;
      }
    }
    if (step === 3 && hasChildren) {
      var missingIdx = childrenData.findIndex(function (c) {
        return !c.name || !c.name.trim();
      });
      if (childrenData.length === 0 || missingIdx !== -1) {
        showToast('Indícanos el nombre de cada niño/a que viene con vosotros.');
        choreograph({
          mood: 'welcome',
          jump: true,
          huskyText: '¡Nos falta el nombre de algún peque!',
          terrierText: 'Así les reservamos su sitio especial.'
        });
        return false;
      }
    }
    return true;
  }

  function getAnswerSnippet(step) {
    if (step === 1) return document.getElementById('guest-name').value.trim();
    if (step === 2) {
      return hasPlusOne
        ? '+1: ' + document.getElementById('plus-one-name').value.trim()
        : 'Voy solo/a';
    }
    if (step === 3) {
      if (!hasChildren || !childrenData.length) return 'Sin niños';
      var names = childrenData.map(function (c) { return c.name.trim(); }).join(', ');
      return (childrenData.length === 1 ? '1 niño: ' : childrenData.length + ' niños: ') + names;
    }
    if (step === 4) return document.getElementById('guest-allergies').value.trim() || 'Sin alergias';
    if (step === 5) return document.getElementById('bus-needed').checked ? 'Con autobús 🚌' : 'En coche';
    if (step === 6) {
      var sliderVal = parseInt(document.getElementById('party-slider').value, 10) || 3;
      var lv = (cfg.rsvp.partyLevels || []).find(function (l) { return l.level === sliderVal; });
      return lv ? lv.emoji + ' ' + lv.title : 'Fiesta ' + sliderVal;
    }
    if (step === 7) return document.getElementById('dj-song').value.trim() || 'Sorpresa DJ 🎶';
    return '¡Listo!';
  }

  function playDogCourierTransition(snippet, fromStep, toStep) {
    if (isTransitioning) return;
    isTransitioning = true;

    var captions = (cfg.rsvp.dogs && cfg.rsvp.dogs.courierMessages) || [];
    var caption = captions[fromStep - 1] || '¡Atrapada! Se la llevamos corriendo a Malena y Fer...';

    if (window.BodaParticles) {
      window.BodaParticles.sparkles(window.innerWidth * 0.65, window.innerHeight - 95);
    }

    if (window.BodaDogAnimator && window.BodaDogAnimator.runCourierDelivery) {
      window.BodaDogAnimator.runCourierDelivery(snippet, caption, function () {
        isTransitioning = false;
        renderWizardStep(toStep);
        if (window.innerWidth <= 768 && formYes) {
          formYes.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    } else {
      isTransitioning = false;
      renderWizardStep(toStep);
    }
  }

  function advanceStep() {
    if (isTransitioning) return;
    if (!validateStep(currentStep)) return;
    if (currentStep >= TOTAL_STEPS) return;

    var snippet = getAnswerSnippet(currentStep);
    playDogCourierTransition(snippet, currentStep, currentStep + 1);
  }

  function setupDogPetting() {
    if (btnPetHusky) {
      btnPetHusky.addEventListener('click', function () {
        var r = btnPetHusky.getBoundingClientRect();
        if (window.BodaParticles) {
          window.BodaParticles.sparkles(r.left + r.width / 2, r.top + r.height / 2);
        }
        if (window.BodaDogAnimator) window.BodaDogAnimator.pet('husky');

        var list = (cfg.rsvp.dogs && cfg.rsvp.dogs.petHuskyBanter) || [];
        var pair = list[petHuskyIdx % Math.max(1, list.length)];
        petHuskyIdx += 1;
        if (window.BodaDogAnimator) {
          window.BodaDogAnimator.command('husky', {
            happyEyes: true,
            wave: true,
            text: pair ? pair.husky : '¡Auuu! ¡Gracias por las caricias!'
          });
          window.BodaDogAnimator.command('terrier', {
            jump: true,
            text: pair ? pair.terrier : '¡Yo también quiero mimos!',
            delayMs: 190
          });
        }
      });
    }

    if (btnPetTerrier) {
      btnPetTerrier.addEventListener('click', function () {
        var r = btnPetTerrier.getBoundingClientRect();
        if (window.BodaParticles) {
          window.BodaParticles.sparkles(r.left + r.width / 2, r.top + r.height / 2);
        }
        if (window.BodaDogAnimator) window.BodaDogAnimator.pet('terrier');

        var list = (cfg.rsvp.dogs && cfg.rsvp.dogs.petTerrierBanter) || [];
        var pair = list[petTerrierIdx % Math.max(1, list.length)];
        petTerrierIdx += 1;
        if (window.BodaDogAnimator) {
          window.BodaDogAnimator.command('terrier', {
            happyEyes: true,
            wave: true,
            text: pair ? pair.terrier : '¡Guau, guau! ¡Más mimos!'
          });
          window.BodaDogAnimator.command('husky', {
            jump: true,
            text: pair ? pair.husky : '¡Eh, yo también soy muy bueno!',
            delayMs: 190
          });
        }
      });
    }
  }

  function setupDogVisibilityObserver() {
    if (!rsvpSection || !window.BodaDogAnimator) return;
    var firstEntry = true;

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(
        function (entries) {
          var visible = Boolean(entries[0] && entries[0].isIntersecting);
          window.BodaDogAnimator.setVisible(visible);
          if (visible && firstEntry) {
            firstEntry = false;
            choreograph({
              mood: 'welcome',
              huskyX: 4,
              terrierX: 76,
              wave: true,
              huskyText: 'El botón verde es una decisión brillante... el otro, la verdad, no te lo recomiendo.',
              terrierText: 'Aviso: nadie ha conseguido pulsar el botón de «No podré asistir» a la primera... pero te dejamos que lo intentes ;)'
            });
          }
        },
        { threshold: 0.1 }
      );
      obs.observe(rsvpSection);
    } else {
      window.BodaDogAnimator.setVisible(true);
    }
  }

  function setupInteractiveFormControls() {
    var guestNameInput = document.getElementById('guest-name');
    var guestEmailInput = document.getElementById('guest-email');
    if (guestNameInput) {
      guestNameInput.addEventListener('input', function () {
        clearTimeout(nameDebounceTimer);
        var val = guestNameInput.value.trim();
        if (val.length < 2) return;
        nameDebounceTimer = setTimeout(function () {
          var firstName = val.split(/\s+/)[0];
          choreograph({
            mood: 'welcome',
            huskyX: 12,
            terrierX: 69,
            jump: true,
            happyEyes: true,
            huskyText: '¡Anda, ' + firstName + '! ¡Qué ilusión tenerte por aquí!',
            terrierText: '¡Apuntando «' + firstName + '» con letra de oro!'
          });
        }, 420);
      });
    }
    if (guestEmailInput) {
      guestEmailInput.addEventListener('focus', function () {
        choreograph({
          mood: 'welcome',
          huskyX: 7,
          terrierX: 74,
          huskyText: 'Prometemos cero spam, solo cosas de la boda.',
          terrierText: '¡Palabra de perro con pajarita!'
        });
      });
    }

    var btnPlusNo = document.getElementById('plus-one-no');
    var btnPlusYes = document.getElementById('plus-one-yes');
    var plusDrawer = document.getElementById('plus-one-drawer');

    function setPlusOne(active) {
      hasPlusOne = active;
      btnPlusNo.classList.toggle('is-active', !active);
      btnPlusYes.classList.toggle('is-active', active);
      plusDrawer.classList.toggle('is-hidden', !active);
      choreograph({
        mood: active ? 'celebrate' : 'welcome',
        huskyX: active ? 15 : 8,
        terrierX: active ? 66 : 73,
        jump: true,
        wave: active,
        huskyText: active
          ? '¡Más manos para darnos mimos!'
          : '¡Genial! Te guardamos asiento preferente.',
        terrierText: active
          ? 'Dinos cómo se llama para prepararle su Pase VIP.'
          : '¡Vas a ser el rey o la reina de tu mesa!'
      });
    }

    btnPlusNo.addEventListener('click', function () { setPlusOne(false); });
    btnPlusYes.addEventListener('click', function () { setPlusOne(true); });

    // Controles dinámicos para añadir 1 o más niños
    var btnChildNo = document.getElementById('children-no');
    var btnChildYes = document.getElementById('children-yes');
    var childDrawer = document.getElementById('children-drawer');
    var childListEl = document.getElementById('children-list');
    var childCountValEl = document.getElementById('children-count-value');
    var btnChildMinus = document.getElementById('btn-children-minus');
    var btnChildPlus = document.getElementById('btn-children-plus');
    var btnAddChild = document.getElementById('btn-add-child');

    function renderChildrenRows() {
      if (!childListEl) return;
      childListEl.innerHTML = '';
      if (childCountValEl) {
        childCountValEl.textContent = String(childrenData.length);
      }
      childrenData.forEach(function (child, idx) {
        var row = document.createElement('div');
        row.className = 'child-row-card';
        row.innerHTML =
          '<div class="child-row-head">' +
            '<span class="child-row-badge">Niño / a ' + (idx + 1) + '</span>' +
            (childrenData.length > 1
              ? '<button class="child-remove-btn" type="button" data-remove-idx="' + idx + '">Quitar</button>'
              : '') +
          '</div>' +
          '<div class="child-row-fields">' +
            '<input type="text" class="js-child-name" data-idx="' + idx + '" placeholder="Nombre del peque *" value="' + (child.name || '').replace(/"/g, '&quot;') + '">' +
            '<input type="number" class="js-child-age" data-idx="' + idx + '" min="0" max="17" placeholder="Edad" value="' + (child.age !== undefined && child.age !== null ? String(child.age) : '') + '">' +
          '</div>';
        childListEl.appendChild(row);
      });

      childListEl.querySelectorAll('.js-child-name').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var i = parseInt(inp.getAttribute('data-idx'), 10);
          if (childrenData[i]) childrenData[i].name = inp.value;
        });
      });
      childListEl.querySelectorAll('.js-child-age').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var i = parseInt(inp.getAttribute('data-idx'), 10);
          if (childrenData[i]) childrenData[i].age = inp.value;
        });
      });
      childListEl.querySelectorAll('.child-remove-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = parseInt(btn.getAttribute('data-remove-idx'), 10);
          childrenData.splice(i, 1);
          renderChildrenRows();
        });
      });
    }

    function setChildrenCount(nextCount) {
      var target = Math.max(1, Math.min(8, nextCount));
      while (childrenData.length < target) {
        childrenData.push({ name: '', age: '' });
      }
      while (childrenData.length > target) {
        childrenData.pop();
      }
      renderChildrenRows();
      choreograph({
        mood: 'celebrate',
        huskyX: 15,
        terrierX: 65,
        jump: true,
        huskyText:
          target === 1
            ? '¡Qué ilusión! Ya tenemos listo un sitio VIP para el peque.'
            : '¡' + target + ' peques en el equipo! Esto va a ser una fiesta épica.',
        terrierText: '¡Prometemos jugar con ellos y portarnos genial!'
      });
    }

    function setHasChildren(active) {
      hasChildren = active;
      if (btnChildNo) btnChildNo.classList.toggle('is-active', !active);
      if (btnChildYes) btnChildYes.classList.toggle('is-active', active);
      if (childDrawer) childDrawer.classList.toggle('is-hidden', !active);
      if (active) {
        if (childrenData.length === 0) {
          childrenData.push({ name: '', age: '' });
        }
        renderChildrenRows();
        choreograph({
          mood: 'celebrate',
          huskyX: 14,
          terrierX: 66,
          jump: true,
          wave: true,
          huskyText: '¡Qué alegría! Los peques son más que bienvenidos.',
          terrierText: 'Añade sus nombres y edades para reservarles sitio o trona.'
        });
      } else {
        childrenData = [];
        renderChildrenRows();
        choreograph({
          mood: 'welcome',
          huskyX: 6,
          terrierX: 74,
          huskyText: '¡Anotado! Plan solo para mayores esta noche.',
          terrierText: '¡Así podréis darlo todo en la pista sin parar!'
        });
      }
    }

    if (btnChildNo) btnChildNo.addEventListener('click', function () { setHasChildren(false); });
    if (btnChildYes) btnChildYes.addEventListener('click', function () { setHasChildren(true); });
    if (btnChildMinus) {
      btnChildMinus.addEventListener('click', function () {
        if (childrenData.length <= 1) {
          setHasChildren(false);
        } else {
          setChildrenCount(childrenData.length - 1);
        }
      });
    }
    if (btnChildPlus) {
      btnChildPlus.addEventListener('click', function () {
        setChildrenCount(childrenData.length + 1);
      });
    }
    if (btnAddChild) {
      btnAddChild.addEventListener('click', function () {
        setChildrenCount(childrenData.length + 1);
      });
    }

    var chipsContainer = document.getElementById('allergy-chips');
    var allergyInput = document.getElementById('guest-allergies');
    var allergyReaction = document.getElementById('allergy-reaction');
    var presets = cfg.rsvp.allergyPresets || [];

    chipsContainer.innerHTML = '';
    presets.forEach(function (preset) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip-btn';
      chip.textContent = preset;
      chip.addEventListener('click', function () {
        allergyInput.value = preset;
        chipsContainer.querySelectorAll('.chip-btn').forEach(function (c) {
          c.classList.remove('is-active');
        });
        chip.classList.add('is-active');

        allergyReaction.classList.remove('is-hidden');
        if (preset.toLowerCase().indexOf('servilletas') !== -1) {
          allergyReaction.textContent = '🍽️ ¡Actitud de diez! El chef te manda doble ración de croquetas.';
          choreograph({
            mood: 'food',
            huskyX: 16,
            terrierX: 65,
            jump: true,
            huskyText: '¡Ese también es nuestro lema oficial!',
            terrierText: 'Nosotros también nos comemos hasta las migas del suelo.'
          });
        } else {
          allergyReaction.textContent = '✅ Apuntado con máximo mimo para cocina (' + preset + ').';
          choreograph({
            mood: 'food',
            huskyX: 10,
            terrierX: 71,
            huskyText: '¡Oído cocina! Anotado: ' + preset + '.',
            terrierText: 'Tendrás tu plato adaptado y delicioso.'
          });
        }
      });
      chipsContainer.appendChild(chip);
    });

    var busCheck = document.getElementById('bus-needed');
    var busYesCard = document.getElementById('bus-choice-yes');
    var busNoCard = document.getElementById('bus-choice-no');

    function setBus(needed) {
      busCheck.checked = needed;
      busYesCard.classList.toggle('is-selected', needed);
      busNoCard.classList.toggle('is-selected', !needed);
      choreograph({
        mood: 'party',
        huskyX: needed ? 14 : 6,
        terrierX: needed ? 67 : 75,
        jump: true,
        huskyText: needed
          ? '¡Decisión sabia! Cero preocupaciones con el coche.'
          : '¡Perfecto! Hay parking amplio y vigilado en la finca.',
        terrierText: needed
          ? '¡Barra libre sin mirar el reloj!'
          : 'Solo no olvides dónde aparcaste al volver.'
      });
    }

    busYesCard.addEventListener('click', function () { setBus(true); });
    busNoCard.addEventListener('click', function () { setBus(false); });

    var partySlider = document.getElementById('party-slider');
    var partyEmoji = document.getElementById('party-emoji');
    var partyTitle = document.getElementById('party-title');
    var partyDesc = document.getElementById('party-desc');

    function updatePartyReadout(userTriggered) {
      var val = parseInt(partySlider.value, 10) || 3;
      var levels = cfg.rsvp.partyLevels || [];
      var match = levels.find(function (l) { return l.level === val; }) || levels[2];
      if (match) {
        partyEmoji.textContent = match.emoji;
        partyTitle.textContent = match.title;
        partyDesc.textContent = match.description;
      }

      if (userTriggered && currentStep === 6) {
        var partyBanter = (cfg.rsvp.dogs && cfg.rsvp.dogs.partyBanter && cfg.rsvp.dogs.partyBanter[val]) || {};
        choreograph({
          mood: val >= 3 ? 'dance' : 'party',
          huskyX: 8 + val * 2.2,
          terrierX: 74 - val * 2.2,
          jump: val >= 4,
          huskyText: partyBanter.husky,
          terrierText: partyBanter.terrier,
          stagger: 150
        });
      }
    }
    partySlider.addEventListener('input', function () { updatePartyReadout(true); });
    updatePartyReadout(false);

    var djInput = document.getElementById('dj-song');
    var djVinyl = document.getElementById('dj-vinyl');
    var djReaction = document.getElementById('dj-reaction');

    djInput.addEventListener('input', function () {
      var val = djInput.value.trim();
      var lower = val.toLowerCase();
      djVinyl.classList.toggle('is-spinning', val.length > 0);

      if (!val) {
        djReaction.textContent = 'Escribe un temazo y el vinilo empezará a girar 🎶';
        return;
      }

      var eggs = cfg.rsvp.songEasterEggs || [];
      var found = eggs.find(function (item) {
        return item.keywords.some(function (kw) {
          return lower.indexOf(kw) !== -1;
        });
      });

      djReaction.textContent = found
        ? found.reaction
        : '🎧 Apuntada en la mesa del DJ. ¡Prepárate para darlo todo!';

      var cleanDogSongText = found
        ? found.reaction.replace(/^[\uD800-\uDBFF][\uDC00-\uDFFF]\s*|^[^\w¡¿"«']+\s*/, '')
        : '¡Enseguida se la llevamos al DJ!';

      choreograph({
        mood: 'dance',
        huskyText: found ? '¡Auuu! ¡Ese temazo lo bailamos hasta nosotros!' : '¡Apuntada «' + val + '»!',
        terrierText: cleanDogSongText,
        stagger: 150
      });
    });

    var msgArea = document.getElementById('guest-message');
    if (msgArea) {
      msgArea.addEventListener('focus', function () {
        choreograph({
          mood: 'celebrate',
          huskyX: 16,
          terrierX: 65,
          wave: true,
          huskyText: '¡Saca tu lado más poeta (o más gamberro)!',
          terrierText: 'Malena y Fer se van a emocionar leyéndolo.'
        });
      });
    }

    btnNext.addEventListener('click', advanceStep);
    btnPrev.addEventListener('click', function () {
      if (isTransitioning || currentStep <= 1) return;
      renderWizardStep(currentStep - 1);
    });

    ['guest-name', 'guest-email', 'plus-one-name', 'guest-allergies', 'dj-song'].forEach(function (id) {
      var inputEl = document.getElementById(id);
      if (inputEl) {
        inputEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            advanceStep();
          }
        });
      }
    });

    document.getElementById('btn-back-arena-yes').addEventListener('click', function () {
      resetArenaState();
      showStep('arena');
    });

    document.getElementById('btn-change-mind').addEventListener('click', function () {
      if (window.BodaParticles) {
        window.BodaParticles.celebrate();
      }
      showToast('¡Sabíamos que no nos fallarías! 🥂');
      renderWizardStep(1);
      showStep('yes');
    });
  }

  function submitToBackend(payload) {
    var mode = cfg.rsvp.backendMode || 'demo';

    if (mode === 'google-forms') {
      var gf = cfg.rsvp.googleForms;
      if (!gf || !gf.actionUrl) {
        return Promise.reject(new Error('Falta configurar googleForms.actionUrl en js/config.js'));
      }
      var fd = new FormData();
      var map = gf.entries;
      if (map.name) fd.append(map.name, payload.name);
      if (map.email) fd.append(map.email, payload.email);
      if (map.attendance) fd.append(map.attendance, payload.attendance);
      if (map.hasPlusOne) fd.append(map.hasPlusOne, payload.hasPlusOne ? 'Sí' : 'No');
      if (map.plusOneName) fd.append(map.plusOneName, payload.plusOneName);
      if (map.childrenCount) fd.append(map.childrenCount, String(payload.childrenCount || 0));
      if (map.childrenDetails) fd.append(map.childrenDetails, payload.childrenDetails || '');
      if (map.allergies) fd.append(map.allergies, payload.allergies);
      if (map.bus) fd.append(map.bus, payload.bus ? 'Sí' : 'No');
      if (map.partyLevel) fd.append(map.partyLevel, payload.partyLabel);
      if (map.song) fd.append(map.song, payload.song);
      if (map.message) fd.append(map.message, payload.message);
      if (map.noAttempts) fd.append(map.noAttempts, String(payload.noAttempts));

      return fetch(gf.actionUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: fd
      }).then(function () {
        return { ok: true, mode: 'google-forms' };
      });
    }

    if (mode === 'apps-script') {
      var url = cfg.rsvp.appsScript && cfg.rsvp.appsScript.webAppUrl;
      if (!url) {
        return Promise.reject(new Error('Falta configurar appsScript.webAppUrl en js/config.js'));
      }
      return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Error del servidor (' + res.status + ')');
          return res.json();
        })
        .then(function (data) {
          if (data && data.status === 'error') {
            throw new Error(data.message || 'No se pudo guardar en Google Sheets');
          }
          return { ok: true, mode: 'apps-script' };
        });
    }

    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({ ok: true, mode: 'demo' });
      }, 320);
    });
  }

  function buildPassCode(name) {
    var clean = (name || 'VIP').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3) || 'VIP';
    var num = String(100 + Math.floor(Math.random() * 899));
    return clean + '-' + num + '-27';
  }

  function buildGuestsSummary(data) {
    var adults = 1 + (data.hasPlusOne ? 1 : 0);
    var kids = data.childrenCount || 0;
    var parts = [adults + (adults === 1 ? ' adulto' : ' adultos')];
    if (kids > 0) {
      parts.push(kids + (kids === 1 ? ' peque' : ' peques'));
    }
    parts.push(data.bus ? 'Con bus 🚌' : 'Por libre');
    return parts.join(' · ');
  }

  function renderVipPass(data) {
    lastSubmitted = data;
    var isYes = data.attendance === 'Sí';

    var stamp = document.getElementById('vip-status-stamp');
    stamp.textContent = isYes ? 'CONFIRMADO' : 'NO ASISTE';
    stamp.classList.toggle('is-declined', !isYes);

    document.getElementById('vip-couple-line').textContent =
      cfg.couple.partner1 + ' & ' + cfg.couple.partner2;
    document.getElementById('vip-date-line').textContent =
      cfg.wedding.dateDisplay + ' · ' + cfg.wedding.locationShort;

    var guestTitle = data.name + (data.hasPlusOne && data.plusOneName ? ' + ' + data.plusOneName : '');
    if (data.childrenCount > 0 && data.childrenDetails) {
      var kidNames = (data.children || [])
        .map(function (c) { return c.name; })
        .filter(Boolean)
        .join(', ');
      guestTitle += ' · Peques (' + data.childrenCount + '): ' + (kidNames || data.childrenDetails);
    }
    document.getElementById('vip-guest-name').textContent = guestTitle;

    var detailsEl = document.getElementById('vip-pass-details');
    detailsEl.classList.toggle('is-hidden', !isYes);
    document.getElementById('btn-download-vip').classList.toggle('is-hidden', !isYes);

    if (isYes) {
      var guestsValEl = document.getElementById('vip-guests-value');
      if (guestsValEl) {
        guestsValEl.textContent = buildGuestsSummary(data);
      }
      document.getElementById('vip-party-value').textContent = data.partyLabel || '—';
      document.getElementById('vip-song-value').textContent = data.song || 'Sorpresa del DJ';
      document.getElementById('vip-code-value').textContent = data.passCode || 'MF-2027';

      choreograph({
        mood: 'celebrate',
        huskyX: 14,
        terrierX: 67,
        jump: true,
        wave: true,
        happyEyes: true,
        huskyText: '¡Siii, ' + data.name.split(/\s+/)[0] + '! ¡Ya tienes tu Pase VIP!',
        terrierText: '¡Nos vemos el 18 de septiembre para darlo todo!'
      });
    } else {
      choreograph({
        mood: 'sad',
        huskyX: 16,
        terrierX: 65,
        huskyText: 'Os echaremos mucho de menos ese día...',
        terrierText: '¡Guardad este pase por si al final podéis escapar!'
      });
    }

    showStep('vip');
  }

  function saveSubmission(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function setupFormSubmissions() {
    formYes.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateStep(1) || !validateStep(2) || !validateStep(3)) return;

      var name = document.getElementById('guest-name').value.trim();
      var email = document.getElementById('guest-email').value.trim();
      var plusOneName = document.getElementById('plus-one-name').value.trim();
      var cleanChildren = hasChildren
        ? childrenData
            .filter(function (c) { return c.name && c.name.trim(); })
            .map(function (c) {
              return {
                name: c.name.trim(),
                age: c.age !== undefined && c.age !== null ? String(c.age).trim() : ''
              };
            })
        : [];

      var sliderVal = parseInt(document.getElementById('party-slider').value, 10) || 3;
      var levelObj = (cfg.rsvp.partyLevels || []).find(function (l) {
        return l.level === sliderVal;
      });
      var partyLabel = levelObj ? levelObj.emoji + ' ' + levelObj.title : String(sliderVal);
      var totalGuests = 1 + (hasPlusOne ? 1 : 0) + cleanChildren.length;

      var payload = {
        timestamp: new Date().toISOString(),
        name: name,
        email: email,
        attendance: 'Sí',
        totalGuests: totalGuests,
        hasPlusOne: hasPlusOne,
        plusOneName: hasPlusOne ? plusOneName : '',
        childrenCount: cleanChildren.length,
        children: cleanChildren,
        childrenDetails: formatChildrenSummary(cleanChildren),
        allergies: document.getElementById('guest-allergies').value.trim() || 'Ninguna',
        bus: document.getElementById('bus-needed').checked,
        partyLevel: sliderVal,
        partyLabel: partyLabel,
        song: document.getElementById('dj-song').value.trim(),
        message: document.getElementById('guest-message').value.trim(),
        noAttempts: noAttempts,
        passCode: buildPassCode(name)
      };

      var origLabel = btnSubmitYes.textContent;
      btnSubmitYes.disabled = true;
      btnSubmitYes.textContent = 'Enviando confirmación...';

      submitToBackend(payload)
        .then(function (res) {
          saveSubmission(payload);
          renderVipPass(payload);
          if (window.BodaParticles) {
            window.BodaParticles.celebrate();
          }
          showToast(
            res.mode === 'demo'
              ? '¡Pase VIP generado! (Modo Demo local)'
              : '¡Confirmación recibida y guardada! 🥂'
          );
        })
        .catch(function (err) {
          showToast('Error al enviar: ' + err.message);
        })
        .finally(function () {
          btnSubmitYes.disabled = false;
          btnSubmitYes.textContent = origLabel;
        });
    });

    formNo.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('no-guest-name').value.trim();
      var email = document.getElementById('no-guest-email').value.trim();

      if (!name || !email) {
        showToast('Por favor, escribe tu nombre y email.');
        return;
      }

      var payload = {
        timestamp: new Date().toISOString(),
        name: name,
        email: email,
        attendance: 'No',
        totalGuests: 0,
        hasPlusOne: false,
        plusOneName: '',
        childrenCount: 0,
        children: [],
        childrenDetails: '',
        allergies: '',
        bus: false,
        partyLevel: 0,
        partyLabel: 'Se queda con las ganas',
        song: '',
        message: document.getElementById('no-guest-message').value.trim(),
        noAttempts: noAttempts,
        passCode: 'MISS-YOU'
      };

      var submitBtn = document.getElementById('btn-submit-no');
      var origLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';

      submitToBackend(payload)
        .then(function () {
          saveSubmission(payload);
          renderVipPass(payload);
          showToast('Respuesta enviada. ¡Os echaremos mucho de menos! 💛');
        })
        .catch(function (err) {
          showToast('Error al enviar: ' + err.message);
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = origLabel;
        });
    });

    document.getElementById('btn-edit-rsvp').addEventListener('click', function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      resetArenaState();
      renderWizardStep(1);
      showStep('arena');
    });

    document.getElementById('btn-download-vip').addEventListener('click', downloadVipPassPNG);
  }

  /* Exporta el Pase VIP en PNG dibujando únicamente primitivas Canvas 2D (100% seguro en file://) */
  function downloadVipPassPNG() {
    if (!lastSubmitted) return;

    var canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 640;
    var ctx = canvas.getContext('2d');

    var grad = ctx.createLinearGradient(0, 0, 1080, 640);
    grad.addColorStop(0, '#FFFDF9');
    grad.addColorStop(1, '#F3ECE1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 640);

    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, 1024, 584);
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(42, 42, 996, 556);

    ctx.fillStyle = '#3E4C37';
    ctx.fillRect(42, 42, 996, 118);

    ctx.fillStyle = '#E5C886';
    ctx.font = '600 18px sans-serif';
    ctx.fillText('PASE OFICIAL DE INVITADO VIP', 78, 84);

    ctx.fillStyle = '#FAF7F2';
    ctx.font = 'italic 46px Georgia, serif';
    ctx.fillText(cfg.couple.partner1 + ' & ' + cfg.couple.partner2, 78, 134);

    ctx.fillStyle = '#E5C886';
    ctx.font = '600 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(cfg.wedding.dateDisplay.toUpperCase(), 1002, 96);
    ctx.fillStyle = '#FAF7F2';
    ctx.font = '400 18px sans-serif';
    ctx.fillText(cfg.wedding.locationShort, 1002, 128);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#8B8276';
    ctx.font = '600 16px sans-serif';
    ctx.fillText('INVITADO / A', 78, 222);

    var guestTitle =
      lastSubmitted.name +
      (lastSubmitted.hasPlusOne && lastSubmitted.plusOneName
        ? ' + ' + lastSubmitted.plusOneName
        : '');
    ctx.fillStyle = '#23201C';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.fillText(guestTitle.slice(0, 36), 78, 266);

    if (lastSubmitted.childrenCount > 0) {
      var pngKidNames = (lastSubmitted.children || [])
        .map(function (c) { return c.name; })
        .filter(Boolean)
        .join(', ');
      ctx.fillStyle = '#6B5D4D';
      ctx.font = '600 18px sans-serif';
      ctx.fillText(
        ('Con peques (' + lastSubmitted.childrenCount + '): ' + (pngKidNames || lastSubmitted.childrenDetails)).slice(0, 62),
        78,
        298
      );
    }

    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(197, 160, 89, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(78, 315);
    ctx.lineTo(1002, 315);
    ctx.stroke();
    ctx.setLineDash([]);

    var fields = [
      { label: 'PLAZAS Y TRANSPORTE', value: buildGuestsSummary(lastSubmitted), x: 78, y: 375 },
      { label: 'NIVEL BARRA LIBRE', value: lastSubmitted.partyLabel || '—', x: 560, y: 375 },
      { label: 'PETICIÓN AL DJ', value: lastSubmitted.song || 'Sorpresa del DJ', x: 78, y: 475 },
      { label: 'CÓDIGO DE PASE', value: lastSubmitted.passCode || 'MF-2027', x: 560, y: 475 }
    ];

    fields.forEach(function (f) {
      ctx.fillStyle = '#8B8276';
      ctx.font = '600 15px sans-serif';
      ctx.fillText(f.label, f.x, f.y);
      ctx.fillStyle = '#3E4C37';
      ctx.font = '600 24px sans-serif';
      ctx.fillText(String(f.value).slice(0, 34), f.x, f.y + 34);
    });

    ctx.save();
    ctx.translate(905, 250);
    ctx.rotate(-0.08);
    ctx.strokeStyle = '#3E4C37';
    ctx.lineWidth = 3;
    ctx.strokeRect(-92, -26, 184, 52);
    ctx.fillStyle = '#3E4C37';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONFIRMADO', 0, 7);
    ctx.restore();

    var link = document.createElement('a');
    link.download = 'Pase-VIP-' + (lastSubmitted.passCode || 'Boda') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Pase VIP descargado. Enséñalo en la barra libre.');
  }

  function restorePreviousRsvp() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        renderVipPass(parsed);
        return true;
      }
    } catch (e) {}
    return false;
  }

  function init(config) {
    cfg = config;
    rsvpSection = document.getElementById('rsvp');
    arenaCard = document.getElementById('rsvp-arena');
    arenaStage = arenaCard ? arenaCard.querySelector('.arena-stage') : null;
    btnYes = document.getElementById('btn-rsvp-yes');
    btnNo = document.getElementById('btn-rsvp-no');

    formYes = document.getElementById('rsvp-form-yes');
    formNo = document.getElementById('rsvp-form-no');
    vipPassWrap = document.getElementById('rsvp-vip-pass');

    wizardScreensEl = document.getElementById('wizard-screens');

    stepLabelEl = document.getElementById('wizard-step-label');
    progressFillEl = document.getElementById('wizard-progress-fill');
    btnPrev = document.getElementById('btn-wizard-prev');
    btnNext = document.getElementById('btn-wizard-next');
    btnSubmitYes = document.getElementById('btn-submit-yes');

    btnPetHusky = document.getElementById('btn-pet-husky');
    btnPetTerrier = document.getElementById('btn-pet-terrier');

    if (!arenaCard || !btnYes || !btnNo || !formYes) return;

    var demoBanner = document.getElementById('rsvp-demo-banner');
    if (demoBanner) {
      demoBanner.classList.toggle('is-hidden', cfg.rsvp.backendMode !== 'demo');
    }

    if (window.BodaDogAnimator && window.BodaDogAnimator.init) {
      window.BodaDogAnimator.init(cfg);
    }

    setupRunawayNoButton();
    setupDogPetting();
    setupDogVisibilityObserver();
    setupInteractiveFormControls();
    setupFormSubmissions();

    if (!restorePreviousRsvp()) {
      resetArenaState();
      renderWizardStep(1);
      showStep('arena');
    }
  }

  window.BodaRSVP = {
    init: init
  };
})();

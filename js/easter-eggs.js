/* ============================================================================
   EASTER EGGS, SOBRE CON SELLO DE LACRE, CALENDARIO (.ICS)
   Y CUENTA ATRÁS INTERACTIVA
   ============================================================================ */

(function () {
  var cfg = null;

  var countdownQuips = [
    'Tiempo oficial restante para encontrar el traje perfecto (o ensayar el paso prohibido).',
    'Cada segundo que pasa, las croquetas del cóctel están un poco más cerca.',
    'Recordatorio amistoso: el arroz se tira hacia arriba, no como si fuera un penalti.',
    'Nota del DJ: ya está calentando la carpeta de himnos de las 03:00 h.'
  ];
  var quipIndex = 0;

  function showToast(message) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);

    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s ease';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 320);
    }, 3400);
  }

  function copyText(text, successMsg, triggerEl) {
    function afterCopy() {
      showToast(successMsg);
      if (triggerEl && window.BodaParticles) {
        var r = triggerEl.getBoundingClientRect();
        window.BodaParticles.sparkles(r.left + r.width / 2, r.top + r.height / 2);
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(afterCopy).catch(function () {
        fallbackCopy(text);
        afterCopy();
      });
    } else {
      fallbackCopy(text);
      afterCopy();
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch (e) {}
    document.body.removeChild(ta);
  }

  /* 1. Sobre real con lazo tejido en Canvas, sello de lacre debajo y lectura pausada */
  function setupEnvelope() {
    var overlay = document.getElementById('intro-overlay');
    var bowBtn = document.getElementById('open-envelope-btn');
    var ribbonCanvas = document.getElementById('envelope-ribbon-canvas');
    var waxSeal = document.getElementById('envelope-wax-seal');
    var continueBtn = document.getElementById('envelope-continue-btn');
    if (!overlay || !bowBtn) {
      document.body.classList.remove('envelope-locked');
      return;
    }

    var readSeconds =
      cfg.envelope && typeof cfg.envelope.readDurationSeconds === 'number'
        ? cfg.envelope.readDurationSeconds
        : 4.5;
    var readMs = Math.max(2000, readSeconds * 1000);
    overlay.style.setProperty('--envelope-read-ms', readMs + 'ms');

    var reducedMotion = Boolean(
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );

    var unsealedStarted = false;
    var finished = false;
    var timers = [];

    function finishEnvelope() {
      if (finished) return;
      finished = true;
      timers.forEach(function (t) { clearTimeout(t); });
      document.body.classList.remove('envelope-locked');
      overlay.classList.add('is-opened');
      var nav = document.getElementById('site-nav');
      if (nav) nav.classList.add('is-visible');
      if (window.BodaMap && window.BodaMap.invalidateSize) {
        window.BodaMap.invalidateSize();
      }
    }

    function runPostUntieSequence() {
      if (unsealedStarted) return;
      unsealedStarted = true;

      // Fase 2: Se despega y retira el sello de lacre situado debajo del lazo
      if (waxSeal && window.BodaParticles) {
        var sealRect = waxSeal.getBoundingClientRect();
        window.BodaParticles.sparkles(
          sealRect.left + sealRect.width / 2,
          sealRect.top + sealRect.height / 2
        );
      }
      overlay.classList.add('is-unsealing');

      var dFlap = 680;
      var dExtract = 1680;
      var dRead = 3250;

      // Fase 3: La solapa superior se despliega lentamente en 3D
      timers.push(
        setTimeout(function () {
          overlay.classList.add('is-flap-open');
        }, dFlap)
      );

      // Fase 4: La tarjeta de invitación sale suavemente del sobre hacia el centro
      timers.push(
        setTimeout(function () {
          overlay.classList.add('is-extracting');
        }, dExtract)
      );

      // Fase 5: Permanece centrada y legible durante readMs (4.5 s por defecto)
      timers.push(
        setTimeout(function () {
          overlay.classList.add('is-reading');
        }, dRead)
      );

      timers.push(setTimeout(finishEnvelope, dRead + readMs));
    }

    if (window.BodaRibbonBow && ribbonCanvas) {
      var bowCtrl = window.BodaRibbonBow.attach({
        canvas: ribbonCanvas,
        triggerBtn: bowBtn,
        onStartPull: function (coords) {
          overlay.classList.add('is-untying');
          if (window.BodaParticles && coords) {
            window.BodaParticles.sparkles(coords.tailX, coords.tailY);
          }
        },
        onUntied: runPostUntieSequence
      });

      if (waxSeal && bowCtrl) {
        waxSeal.addEventListener('click', function () {
          bowCtrl.untie();
        });
      }
    } else {
      // Respaldo por si el canvas no estuviera disponible
      bowBtn.addEventListener('click', function () {
        overlay.classList.add('is-untying');
        runPostUntieSequence();
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener('click', finishEnvelope);
    }
  }

  /* 2. Cuenta atrás en vivo + lluvia de arroz al tocar */
  function setupCountdown() {
    var daysEl = document.getElementById('cd-days');
    var hoursEl = document.getElementById('cd-hours');
    var minsEl = document.getElementById('cd-mins');
    var secsEl = document.getElementById('cd-secs');
    var quipEl = document.getElementById('countdown-quip');
    var gridEl = document.getElementById('countdown-grid');
    if (!daysEl || !gridEl) return;

    var targetTs = new Date(cfg.wedding.dateISO).getTime();

    function updateClock() {
      var diff = targetTs - Date.now();
      if (diff <= 0) {
        daysEl.textContent = '000';
        hoursEl.textContent = '00';
        minsEl.textContent = '00';
        secsEl.textContent = '00';
        if (quipEl) quipEl.textContent = '¡HOY ES EL GRAN DÍA! A brindar se ha dicho.';
        return;
      }

      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      var secs = Math.floor((diff % 60000) / 1000);

      daysEl.textContent = String(days).padStart(3, '0');
      hoursEl.textContent = String(hours).padStart(2, '0');
      minsEl.textContent = String(mins).padStart(2, '0');
      secsEl.textContent = String(secs).padStart(2, '0');
    }

    updateClock();
    setInterval(updateClock, 1000);

    gridEl.addEventListener('click', function (e) {
      var card = e.target.closest('.countdown-card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      if (window.BodaParticles) {
        window.BodaParticles.riceShower(r.left + r.width / 2, r.top + r.height / 2);
      }
      if (quipEl) {
        quipIndex = (quipIndex + 1) % countdownQuips.length;
        quipEl.textContent = countdownQuips[quipIndex];
      }
    });
  }

  /* 4. Generador de Google Calendar e ICS */
  function toCalStamp(iso) {
    return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  function buildGoogleCalendarUrl() {
    var w = cfg.wedding;
    var dates = toCalStamp(w.dateISO) + '/' + toCalStamp(w.calendarEndISO);
    var params = new URLSearchParams({
      action: 'TEMPLATE',
      text: w.calendarTitle,
      dates: dates,
      details: w.calendarDescription,
      location: w.calendarLocation
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  function downloadICS() {
    var w = cfg.wedding;
    var ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Boda//Invitacion//ES',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@boda-invitacion',
      'DTSTAMP:' + toCalStamp(new Date().toISOString()),
      'DTSTART:' + toCalStamp(w.dateISO),
      'DTEND:' + toCalStamp(w.calendarEndISO),
      'SUMMARY:' + w.calendarTitle,
      'DESCRIPTION:' + w.calendarDescription,
      'LOCATION:' + w.calendarLocation,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Boda-' + cfg.couple.partner1 + '-y-' + cfg.couple.partner2 + '.ics';
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    showToast('Evento guardado en tu calendario');
  }

  function setupCalendarButtons() {
    var gUrl = buildGoogleCalendarUrl();
    ['btn-google-cal', 'btn-vip-gcal'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.href = gUrl;
    });
    ['btn-ics-cal', 'btn-vip-ics'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('click', downloadICS);
    });
  }

  /* 5. Modal Dress Code (color blanco) + IBAN */
  function openEasterModal(title, body, confirmText) {
    var modal = document.getElementById('easter-modal');
    var titleEl = document.getElementById('easter-modal-title');
    var bodyEl = document.getElementById('easter-modal-body');
    var closeBtn = document.getElementById('easter-modal-close');
    if (!modal) return;

    titleEl.textContent = title;
    bodyEl.textContent = body;
    closeBtn.textContent = confirmText || 'Entendido';
    modal.classList.remove('is-hidden');
  }

  function setupModalAndGift() {
    var modal = document.getElementById('easter-modal');
    var closeBtn = document.getElementById('easter-modal-close');
    var backdrop = modal ? modal.querySelector('.easter-modal-backdrop') : null;

    function close() {
      if (modal) modal.classList.add('is-hidden');
    }

    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);

    var copyIbanBtn = document.getElementById('btn-copy-iban');
    if (copyIbanBtn) {
      copyIbanBtn.addEventListener('click', function () {
        copyText(
          cfg.infoUtil.gift.ibanCopy,
          cfg.infoUtil.gift.copiedMessage,
          copyIbanBtn
        );
      });
    }
  }

  function init(config) {
    cfg = config;
    setupEnvelope();
    setupCountdown();
    setupCalendarButtons();
    setupModalAndGift();
  }

  window.BodaEasterEggs = {
    init: init,
    showToast: showToast,
    copyText: copyText,
    openEasterModal: openEasterModal
  };
})();

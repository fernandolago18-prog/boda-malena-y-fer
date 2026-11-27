/* ============================================================================
   ORQUESTADOR PRINCIPAL · HIDRATACIÓN DESDE CONFIG.JS Y ARRANQUE
   ============================================================================ */

(function () {
  var ICON_SVG_MAP = {
    welcome:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 21h8M12 15v6M7 3h10l-1 7a4 4 0 01-8 0L7 3z"/></svg>',
    rings:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9.2" cy="13.5" r="4.8"/><circle cx="14.8" cy="13.5" r="4.8"/><path d="M12 5.5l1.5-2h-3l1.5 2z"/></svg>',
    cocktail:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 4h14l-7 8v8M9 20h6M16 4l2-2"/></svg>',
    dinner:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M7 3v7a2 2 0 002 2v9M9 3v5M11 3v5M16 3v18M16 3c2 2 2 6 0 8"/></svg>',
    party:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
    bus:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="4" width="16" height="13" rx="3"/><path d="M4 11h16M8 17v2M16 17v2"/></svg>'
  };

  var PIN_SVG =
    '<svg class="icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z"/>' +
      '<circle cx="12" cy="11" r="2.2"/>' +
    '</svg>';

  var CLOCK_SVG =
    '<svg class="icon-svg-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M12 7v5l3 2"/>' +
    '</svg>';

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function hydrateCoupleAndMeta(cfg) {
    var coupleLine = cfg.couple.partner1 + ' & ' + cfg.couple.partner2;
    document.title = coupleLine + ' · Nuestra Boda';

    setText('intro-couple', coupleLine);
    if (cfg.envelope && cfg.envelope.invitationTagline) {
      setText('intro-tagline', cfg.envelope.invitationTagline);
    }
    setText('intro-date', cfg.wedding.dateDisplay);
    setText('intro-location', cfg.wedding.locationShort);
    setText('intro-monogram', cfg.couple.monogram.replace(/\s+/g, ''));

    setText('nav-monogram', cfg.couple.monogram);
    setText('schedule-eyebrow', 'Programa · ' + cfg.wedding.dateDisplay);
    setText('rsvp-deadline', cfg.rsvp.deadlineText);

    setText('footer-monogram', cfg.couple.monogram);
    setText('footer-couple', coupleLine);
    setText('footer-date', cfg.wedding.dateDisplay + ' · ' + cfg.wedding.locationShort);
    setText('footer-hashtag', cfg.couple.hashtag);
  }

  function hydrateTimeline(cfg) {
    var list = document.getElementById('timeline-list');
    if (!list) return;

    list.innerHTML = '';
    (cfg.schedule || []).forEach(function (item) {
      var el = document.createElement('article');
      el.className = 'timeline-item reveal-on-scroll';
      var iconMarkup = ICON_SVG_MAP[item.icon] || ICON_SVG_MAP.welcome;
      el.innerHTML =
        '<div class="timeline-node" aria-hidden="true">' + iconMarkup + '</div>' +
        '<div class="timeline-card">' +
          '<div class="timeline-meta">' +
            '<span class="timeline-time">' + item.time + ' h</span>' +
            '<span class="timeline-place">' + item.subtitle + '</span>' +
          '</div>' +
          '<h3>' + item.title + '</h3>' +
          '<p>' + item.description + '</p>' +
        '</div>';
      list.appendChild(el);
    });
  }

  function hydrateLocations(cfg) {
    var venuesGrid = document.getElementById('venue-cards');
    var hotelsGrid = document.getElementById('hotel-cards');

    if (venuesGrid) {
      venuesGrid.innerHTML = '';
      (cfg.locations.venues || []).forEach(function (v) {
        var card = document.createElement('article');
        card.className = 'venue-card reveal-on-scroll';
        card.innerHTML =
          '<div>' +
            '<span class="venue-role">' + v.role + '</span>' +
            '<h3>' + v.name + '</h3>' +
            '<p class="place-address">' + PIN_SVG + v.address + '</p>' +
            '<p class="place-time">' + CLOCK_SVG + v.time + '</p>' +
            '<p class="place-notes">' + v.notes + '</p>' +
          '</div>' +
          '<div class="card-actions">' +
            '<button class="btn btn-outline btn-sm js-focus-map" type="button" data-loc-id="' + v.id + '">Ver en el mapa</button>' +
            '<a class="btn btn-gold btn-sm" href="' + v.mapsUrl + '" target="_blank" rel="noopener noreferrer">Abrir en Google Maps</a>' +
          '</div>';
        venuesGrid.appendChild(card);
      });
    }

    if (hotelsGrid) {
      hotelsGrid.innerHTML = '';
      (cfg.locations.hotels || []).forEach(function (h) {
        var card = document.createElement('article');
        card.className = 'hotel-card reveal-on-scroll';
        card.innerHTML =
          '<div>' +
            '<div class="hotel-top-meta">' +
              '<span class="hotel-stars">' + h.stars + '</span>' +
              '<span class="hotel-distance">' + h.distance + '</span>' +
            '</div>' +
            '<h4>' + h.name + '</h4>' +
            '<p class="hotel-highlight">' + h.highlight + '</p>' +
            '<p class="place-address">' + PIN_SVG + h.address + '</p>' +
            '<p class="hotel-price">' + h.priceRange + ' · Tel: ' + h.phone + '</p>' +
            '<button class="promo-pill js-copy-promo" type="button" data-promo="' + h.promoCode + '">' +
              '<strong>Código: ' + h.promoCode + '</strong>' +
              '<span>Copiar</span>' +
            '</button>' +
            '<p class="promo-note">' + h.promoNote + '</p>' +
          '</div>' +
          '<div class="card-actions">' +
            '<button class="btn btn-outline btn-sm js-focus-map" type="button" data-loc-id="' + h.id + '">Ver en mapa</button>' +
            '<a class="btn btn-gold btn-sm" href="' + h.mapsUrl + '" target="_blank" rel="noopener noreferrer">Cómo llegar</a>' +
          '</div>';
        hotelsGrid.appendChild(card);
      });
    }

    // Delegación para enfocar mapa o copiar códigos promocionales
    var mapSection = document.getElementById('lugar-hoteles');
    if (mapSection) {
      mapSection.addEventListener('click', function (e) {
        var focusBtn = e.target.closest('.js-focus-map');
        if (focusBtn && window.BodaMap) {
          window.BodaMap.focusLocation(focusBtn.getAttribute('data-loc-id'));
          return;
        }
        var promoBtn = e.target.closest('.js-copy-promo');
        if (promoBtn && window.BodaEasterEggs) {
          var code = promoBtn.getAttribute('data-promo');
          window.BodaEasterEggs.copyText(
            code,
            'Código «' + code + '» copiado al portapapeles',
            promoBtn
          );
        }
      });
    }
  }

  function hydrateInfoUtil(cfg) {
    var dc = cfg.infoUtil.dressCode;
    setText('dresscode-title', dc.title);
    setText('dresscode-subtitle', dc.subtitle);
    setText('dresscode-desc', dc.description);
    setText('dresscode-avoid', dc.avoidNote + ' (Toca los colores para probar)');

    var swatchesEl = document.getElementById('dresscode-swatches');
    if (swatchesEl) {
      swatchesEl.innerHTML = '';
      (dc.swatches || []).forEach(function (sw) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'swatch-btn' + (sw.isWhiteTrap ? ' is-white-trap' : '');
        btn.style.backgroundColor = sw.hex;
        btn.title = sw.name;
        btn.setAttribute('aria-label', sw.name);
        btn.addEventListener('click', function () {
          if (sw.isWhiteTrap && window.BodaEasterEggs) {
            window.BodaEasterEggs.openEasterModal(
              dc.whiteAlertTitle,
              dc.whiteAlertMessage,
              dc.whiteAlertConfirm
            );
          } else if (window.BodaEasterEggs) {
            window.BodaEasterEggs.showToast('El tono «' + sw.name + '» queda espectacular entre los olivos.');
          }
        });
        swatchesEl.appendChild(btn);
      });
    }

    var tr = cfg.infoUtil.transport;
    setText('transport-title', tr.title);
    setText('transport-subtitle', tr.subtitle);
    setText('parking-note', tr.parkingNote);
    var busList = document.getElementById('bus-schedule-list');
    if (busList) {
      busList.innerHTML = (tr.busSchedule || [])
        .map(function (line) { return '<li>' + line + '</li>'; })
        .join('');
    }
    var btnBusMap = document.getElementById('btn-bus-map');
    if (btnBusMap) {
      btnBusMap.addEventListener('click', function () {
        if (window.BodaMap) window.BodaMap.focusLocation('parada-bus');
      });
    }

    var gift = cfg.infoUtil.gift;
    setText('gift-title', gift.title);
    setText('gift-subtitle', gift.subtitle);
    setText('gift-desc', gift.description);
    setText('gift-iban-display', gift.ibanDisplay);
  }

  function setupNavigationAndReveals() {
    var nav = document.getElementById('site-nav');
    var burger = document.getElementById('nav-menu-toggle');
    var drawer = document.getElementById('nav-drawer');

    if (burger && drawer) {
      burger.addEventListener('click', function () {
        var open = drawer.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
        drawer.setAttribute('aria-hidden', String(!open));
      });

      drawer.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          drawer.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          drawer.setAttribute('aria-hidden', 'true');
        });
      });
    }

    var revealEls = document.querySelectorAll('.reveal-on-scroll');
    if ('IntersectionObserver' in window) {
      var isMobileView = window.innerWidth <= 768;
      var obs = new IntersectionObserver(
        function (entries) {
          var visibleBatch = 0;
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              if (visibleBatch > 0) {
                entry.target.style.transitionDelay = Math.min(visibleBatch * 95, 285) + 'ms';
              }
              visibleBatch += 1;
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        {
          threshold: isMobileView ? 0.12 : 0.08,
          rootMargin: isMobileView ? '0px 0px -10% 0px' : '0px 0px -40px 0px'
        }
      );
      revealEls.forEach(function (el) { obs.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }

    var spineFill = document.getElementById('timeline-spine-fill');
    var timelineWrapper = document.querySelector('.timeline-wrapper');

    function onScroll() {
      if (nav && !document.body.classList.contains('envelope-locked')) {
        nav.classList.add('is-visible');
      }

      if (spineFill && timelineWrapper) {
        var rect = timelineWrapper.getBoundingClientRect();
        var viewMid = window.innerHeight * 0.65;
        var ratio = Math.max(0, Math.min(1, (viewMid - rect.top) / rect.height));
        spineFill.style.height = (ratio * 100).toFixed(1) + '%';
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var cfg = window.BODA_CONFIG;
    if (!cfg) return;

    hydrateCoupleAndMeta(cfg);
    hydrateTimeline(cfg);
    hydrateLocations(cfg);
    hydrateInfoUtil(cfg);

    if (window.BodaCinema) window.BodaCinema.init(cfg);
    if (window.BodaMap) window.BodaMap.init(cfg);
    if (window.BodaEasterEggs) window.BodaEasterEggs.init(cfg);
    if (window.BodaRSVP) window.BodaRSVP.init(cfg);

    setupNavigationAndReveals();
  });
})();

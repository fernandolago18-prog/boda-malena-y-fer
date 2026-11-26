/* ============================================================================
   MAPA INTERACTIVO SOBRE GOOGLE MAPS (100% GRATUITO, CERO API KEYS)
   Incluye filtros por categoría, selector Mapa/Satélite, tarjeta flotante,
   código promocional copiable, ruta GPS directa y ruta hasta la finca.
   ============================================================================ */

(function () {
  var allPoints = [];
  var venuePoint = null;
  var activeFilter = 'all';
  var activePointId = '';
  var mapType = 'm'; // 'm' = Mapa, 'h' = Satélite híbrido
  var myMapsUrl = '';

  function iconSvgForType(type) {
    if (type === 'venue') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="9" cy="13" r="4.5"/><circle cx="15" cy="13" r="4.5"/><path d="M12 5l1.5-2h-3L12 5z"/></svg>';
    }
    if (type === 'bus') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="5" y="4" width="14" height="13" rx="2.5"/><path d="M5 11h14M8.5 17v2M15.5 17v2"/></svg>';
    }
    if (type === 'all') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-6-5.3-6-10a6 6 0 1112 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 20V7l8-4 8 4v13M9 20v-5h6v5M9 10h.01M15 10h.01"/></svg>';
  }

  function buildEmbedUrl(point) {
    return (
      'https://maps.google.com/maps?q=' +
      encodeURIComponent(point.lat + ',' + point.lng) +
      '&t=' +
      mapType +
      '&z=15&ie=UTF8&iwloc=&output=embed'
    );
  }

  function updateOverlayCard(point) {
    var badgeEl = document.getElementById('map-card-badge');
    var titleEl = document.getElementById('map-card-title');
    var addrEl = document.getElementById('map-card-address');
    var metaEl = document.getElementById('map-card-meta');
    var promoBtn = document.getElementById('map-card-promo');
    var gpsLink = document.getElementById('map-card-gps');
    var routeLink = document.getElementById('map-card-route-venue');

    if (!titleEl || !point) return;

    if (badgeEl) {
      badgeEl.textContent =
        point.role ||
        (point.stars ? point.stars + ' · ' + point.distance : 'Ubicación de la boda');
    }
    titleEl.textContent = point.name;
    if (addrEl) addrEl.textContent = point.address || '';
    if (metaEl) metaEl.textContent = point.time || point.highlight || '';

    if (promoBtn) {
      if (point.promoCode) {
        promoBtn.classList.remove('is-hidden');
        promoBtn.textContent = 'Copiar código: ' + point.promoCode;
        promoBtn.setAttribute('data-promo', point.promoCode);
      } else {
        promoBtn.classList.add('is-hidden');
      }
    }

    if (gpsLink) {
      gpsLink.href =
        'https://www.google.com/maps/dir/?api=1&destination=' +
        encodeURIComponent(point.lat + ',' + point.lng);
    }

    if (routeLink) {
      if (venuePoint && point.id !== venuePoint.id) {
        routeLink.classList.remove('is-hidden');
        routeLink.href =
          'https://www.google.com/maps/dir/?api=1&origin=' +
          encodeURIComponent(point.lat + ',' + point.lng) +
          '&destination=' +
          encodeURIComponent(venuePoint.lat + ',' + venuePoint.lng);
      } else {
        routeLink.classList.add('is-hidden');
      }
    }
  }

  function highlightActivePill(id) {
    var btns = document.querySelectorAll('#gmaps-quick-places .gmaps-place-btn');
    btns.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-loc-id') === id);
    });
  }

  function selectMyMapsOverview() {
    var iframe = document.getElementById('gmaps-iframe');
    if (!iframe || !myMapsUrl) return;
    activePointId = '__all__';
    iframe.src = myMapsUrl;
    highlightActivePill('__all__');
    if (venuePoint) {
      updateOverlayCard(venuePoint);
    }
  }

  function selectPoint(point, shouldScroll) {
    if (!point) return;
    activePointId = point.id;

    var iframe = document.getElementById('gmaps-iframe');
    if (iframe) {
      iframe.src = buildEmbedUrl(point);
    }

    updateOverlayCard(point);
    highlightActivePill(point.id);

    if (shouldScroll) {
      var frameWrap = document.querySelector('.map-frame');
      if (frameWrap) {
        frameWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function filteredPoints() {
    if (activeFilter === 'all') return allPoints;
    return allPoints.filter(function (pt) {
      return pt.type === activeFilter;
    });
  }

  function renderQuickPlaces() {
    var container = document.getElementById('gmaps-quick-places');
    if (!container) return;

    var list = filteredPoints();
    container.innerHTML = '';

    if (activeFilter === 'all' && myMapsUrl) {
      var allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = 'gmaps-place-btn';
      allBtn.setAttribute('data-loc-id', '__all__');
      allBtn.innerHTML = iconSvgForType('all') + '<span>Ver todos juntos</span>';
      allBtn.addEventListener('click', selectMyMapsOverview);
      container.appendChild(allBtn);
    }

    list.forEach(function (pt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gmaps-place-btn';
      btn.setAttribute('data-loc-id', pt.id);
      btn.innerHTML = iconSvgForType(pt.type) + '<span>' + pt.name + '</span>';
      btn.addEventListener('click', function () {
        selectPoint(pt, false);
      });
      container.appendChild(btn);
    });

    highlightActivePill(activePointId);
  }

  function setFilterButtonUI(filter) {
    var buttons = document.querySelectorAll('#map-filters .filter-pill');
    buttons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-filter') === filter);
    });
  }

  function applyFilter(filter) {
    activeFilter = filter;
    setFilterButtonUI(filter);
    renderQuickPlaces();

    if (filter === 'all' && myMapsUrl) {
      selectMyMapsOverview();
      return;
    }

    var list = filteredPoints();
    var currentStillVisible = list.some(function (pt) {
      return pt.id === activePointId;
    });
    if (!currentStillVisible && list.length > 0) {
      selectPoint(list[0], false);
    }
  }

  function focusLocation(id) {
    var point = allPoints.find(function (p) { return p.id === id; });
    if (!point) return;

    if (activeFilter !== 'all' && point.type !== activeFilter) {
      activeFilter = 'all';
      setFilterButtonUI('all');
      renderQuickPlaces();
    }

    selectPoint(point, true);
  }

  function setMapType(type) {
    mapType = type === 'h' ? 'h' : 'm';
    var buttons = document.querySelectorAll('#map-type-switch .mode-tab');
    buttons.forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-map-type') === mapType);
    });

    if (activePointId && activePointId !== '__all__') {
      var pt = allPoints.find(function (p) { return p.id === activePointId; });
      if (pt) selectPoint(pt, false);
    }
  }

  function init(config) {
    var loc = config.locations;
    allPoints = [].concat(loc.venues || [], loc.hotels || []);
    venuePoint = allPoints.find(function (p) { return p.type === 'venue'; }) || allPoints[0] || null;
    myMapsUrl = loc.googleMyMapsEmbedUrl || '';

    var filtersEl = document.getElementById('map-filters');
    if (filtersEl) {
      filtersEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-pill');
        if (!btn) return;
        applyFilter(btn.getAttribute('data-filter') || 'all');
      });
    }

    var typeSwitchEl = document.getElementById('map-type-switch');
    if (typeSwitchEl) {
      typeSwitchEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.mode-tab');
        if (!btn) return;
        setMapType(btn.getAttribute('data-map-type') || 'm');
      });
    }

    var promoBtn = document.getElementById('map-card-promo');
    if (promoBtn) {
      promoBtn.addEventListener('click', function () {
        var code = promoBtn.getAttribute('data-promo');
        if (code && window.BodaEasterEggs) {
          window.BodaEasterEggs.copyText(
            code,
            'Código «' + code + '» copiado al portapapeles',
            promoBtn
          );
        }
      });
    }

    renderQuickPlaces();
    if (myMapsUrl) {
      selectMyMapsOverview();
    } else if (venuePoint) {
      selectPoint(venuePoint, false);
    }
  }

  window.BodaMap = {
    init: init,
    focusLocation: focusLocation,
    invalidateSize: function () {}
  };
})();

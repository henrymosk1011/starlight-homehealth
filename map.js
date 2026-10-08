/* Starlight Home Health Services: office and service area map on the contact page.
   Built on Leaflet (assets/leaflet) with OpenStreetMap tiles and county outlines from
   assets/service-area.js. Progressive enhancement: with scripts off, the address and the
   note inside the map box stay in place, and the map controls stay hidden. */
(function () {
  "use strict";

  var el = document.getElementById("area-map");
  var area = window.SL_SERVICE_AREA;
  if (!el || !window.L || !area) return;

  var root = document.documentElement;
  /* 220 N Glenoaks Blvd, Suite C, Burbank. Estimated from nearby addresses; confirm with the client. */
  var OFFICE = [34.1836, -118.3084];
  var OFFICE_ZOOM = 15;

  function motionOn() {
    return root.classList.contains("motion-on");
  }
  function token(name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }
  var navy = token("--navy");
  var gold = token("--gold");

  el.textContent = "";
  el.setAttribute("role", "region");
  el.setAttribute("aria-label", "Map of our Burbank office and the four counties we serve");
  el.setAttribute("aria-describedby", "area-map-help");

  var map = L.map(el, {
    zoomControl: false,
    scrollWheelZoom: false,
    /* One finger drags scroll the page on phones; the move buttons pan the map instead */
    dragging: !L.Browser.mobile,
    fadeAnimation: false,
    zoomSnap: 0.5,
    minZoom: 6,
    maxZoom: 18,
    maxBounds: [
      [31, -124],
      [37.5, -111],
    ],
    maxBoundsViscosity: 0.8,
  });
  map.attributionControl.setPrefix(false);

  /* The Pause animations switch covers every pan and zoom, including keyboard and mouse ones */
  var setView = map.setView;
  map.setView = function (center, zoom, options) {
    if (options !== true && !motionOn()) {
      options = L.extend({}, options, { animate: false });
      options.pan = L.extend({}, options.pan, { animate: false });
      options.zoom = L.extend({}, options.zoom, { animate: false });
    }
    return setView.call(this, center, zoom, options);
  };
  var panBy = map.panBy;
  map.panBy = function (offset, options) {
    if (!motionOn()) options = L.extend({}, options, { animate: false });
    return panBy.call(this, offset, options);
  };

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  /* County shapes. Bounds use each county's mainland only, so the offshore islands do not shrink the view. */
  var BASE = { color: navy, weight: 2, opacity: 0.9, fillColor: navy, fillOpacity: 0.08 };
  var ACTIVE = { color: navy, weight: 3, opacity: 1, fillColor: gold, fillOpacity: 0.32 };
  var MUTED = { color: navy, weight: 1.5, opacity: 0.55, fillColor: navy, fillOpacity: 0.03 };
  var counties = {};
  var allBounds = null;

  function mainlandBounds(geometry) {
    var polys = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
    var best = null,
      bestSize = -1;
    polys.forEach(function (poly) {
      var b = L.latLngBounds(
        poly[0].map(function (c) {
          return [c[1], c[0]];
        }),
      );
      var size = (b.getNorth() - b.getSouth()) * (b.getEast() - b.getWest());
      if (size > bestSize) {
        best = b;
        bestSize = size;
      }
    });
    return best;
  }

  L.geoJSON(area, {
    style: BASE,
    onEachFeature: function (feature, layer) {
      var id = feature.properties.id;
      var bounds = mainlandBounds(feature.geometry);
      counties[id] = { layer: layer, bounds: bounds, name: feature.properties.name };
      allBounds = allBounds ? allBounds.extend(bounds) : L.latLngBounds(bounds.getSouthWest(), bounds.getNorthEast());
      layer.on("click", function () {
        show(id);
      });
      layer.on("mouseover", function () {
        layer.setStyle({ weight: 3.5 });
      });
      layer.on("mouseout", function () {
        restyle();
      });
    },
  }).addTo(map);

  /* Labels and the office pin are pictures on the map; the same facts are in the text beside it */
  var LABELS = {
    "los-angeles": [34.75, -118.05],
    orange: [33.7, -117.78],
    ventura: [34.47, -119.1],
    "san-bernardino": [34.86, -116.18],
  };
  Object.keys(LABELS).forEach(function (id) {
    L.marker(LABELS[id], {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({
        className: "map-label",
        html: '<span aria-hidden="true">' + counties[id].name.replace(" County", "") + "</span>",
        iconSize: null,
      }),
    }).addTo(map);
  });
  L.marker(OFFICE, {
    interactive: false,
    keyboard: false,
    zIndexOffset: 1000,
    icon: L.divIcon({
      className: "map-office",
      iconSize: [40, 48],
      iconAnchor: [20, 46],
      html:
        '<span aria-hidden="true"><svg viewBox="0 0 40 48" focusable="false">' +
        '<path d="M20 46s16-14.2 16-27A16 16 0 0 0 4 19c0 12.8 16 27 16 27z" />' +
        '<path class="map-office-star" d="M20 9.6l2.4 6.4 6.8.3-5.3 4.2 1.8 6.6L20 23.3l-5.7 3.8 1.8-6.6-5.3-4.2 6.8-.3z" />' +
        '</svg><span class="map-office-label">Starlight office</span></span>',
    }),
  }).addTo(map);

  /* County names only show once there is room for them */
  map.on("zoomend", function () {
    el.classList.toggle("is-far", map.getZoom() < 7);
  });

  /* Views: the whole service area, the office, or one county */
  var current = "all";
  var flying = false;
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-map-view]"));

  function restyle() {
    Object.keys(counties).forEach(function (id) {
      var style = BASE;
      if (counties[current]) style = id === current ? ACTIVE : MUTED;
      counties[id].layer.setStyle(style);
    });
    if (counties[current]) counties[current].layer.bringToFront();
  }

  function show(view, animate) {
    current = view;
    buttons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-map-view") === view ? "true" : "false");
    });
    restyle();
    var fly = animate !== false && motionOn();
    var padding = { padding: [28, 28] };
    if (view === "office") {
      if (fly) map.flyTo(OFFICE, OFFICE_ZOOM, { duration: 1.2 });
      else map.setView(OFFICE, OFFICE_ZOOM, { animate: false });
    } else {
      var bounds = counties[view] ? counties[view].bounds : allBounds;
      if (fly) map.flyToBounds(bounds, L.extend({ duration: 1 }, padding));
      else map.fitBounds(bounds, L.extend({ animate: false }, padding));
    }
    flying = fly;
  }
  map.on("moveend", function () {
    flying = false;
  });

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      show(btn.getAttribute("data-map-view"));
    });
  });

  /* Zoom and move buttons: a pointer alternative to dragging, and they work on phones */
  document.querySelectorAll("[data-map-zoom]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      map.setZoom(map.getZoom() + parseInt(btn.getAttribute("data-map-zoom"), 10));
    });
  });
  document.querySelectorAll("[data-map-pan]").forEach(function (btn) {
    var dir = btn.getAttribute("data-map-pan").split(",");
    btn.addEventListener("click", function () {
      var size = map.getSize();
      map.panBy([(size.x / 3) * parseFloat(dir[0]), (size.y / 3) * parseFloat(dir[1])]);
    });
  });

  /* If animations are paused mid flight, land on the chosen view at once */
  function syncMotion() {
    map.options.inertia = motionOn();
    if (!motionOn() && flying) {
      map.stop();
      show(current, false);
    }
  }
  syncMotion();
  if ("MutationObserver" in window) {
    new MutationObserver(syncMotion).observe(root, { attributes: true, attributeFilter: ["class"] });
  }

  show("all", false);
  document.querySelectorAll("[data-map-ui]").forEach(function (node) {
    node.hidden = false;
  });
})();

// --- 1. Load Mapbox + Turf ---
const mapboxCss = document.createElement('link');
mapboxCss.href = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.css';
mapboxCss.rel = 'stylesheet';
document.head.appendChild(mapboxCss);

const mapboxJs = document.createElement('script');
mapboxJs.src = 'https://api.mapbox.com/mapbox-gl-js/v3.12.0/mapbox-gl.js';
document.head.appendChild(mapboxJs);

const turfJs = document.createElement('script');
turfJs.src = 'https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js';
document.head.appendChild(turfJs);

// -----------------------------------------------------
//  MultiLineString Exploder (utility for hex engine)
// -----------------------------------------------------
function explodeToLineStrings(geo) {
  const out = [];
  if (!geo) return out;
  if (geo.type === 'LineString') {
    out.push(geo);
  } else if (geo.type === 'MultiLineString') {
    geo.coordinates.forEach(coords => {
      out.push({ type: 'LineString', coordinates: coords });
    });
  }
  return out;
}

// -----------------------------------------------------
//  Helpers
// -----------------------------------------------------
function getVal(item, attr) {
  const el = item.querySelector(`[${attr}]`);
  return el ? el.getAttribute(attr) : null;
}

function safeFloat(val, def) {
  const num = parseFloat(val);
  return isNaN(num) ? def : num;
}

function parseColorToRgb(colorStr) {
  if (!colorStr) return { r: 0, g: 149, b: 157 };
  const hexResult = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorStr);
  if (hexResult) {
    return {
      r: parseInt(hexResult[1], 16),
      g: parseInt(hexResult[2], 16),
      b: parseInt(hexResult[3], 16)
    };
  }
  const rgbMatches = colorStr.match(/\d+/g);
  if (rgbMatches && rgbMatches.length >= 3) {
    return {
      r: parseInt(rgbMatches[0], 10),
      g: parseInt(rgbMatches[1], 10),
      b: parseInt(rgbMatches[2], 10)
    };
  }
  return { r: 0, g: 149, b: 157 };
}

// -----------------------------------------------------
//  Extract Area Polygons (from Webflow CMS)
// -----------------------------------------------------
function getAreaGeoJSON() {
  const feats = [];
  const items = document.querySelectorAll('#map-data-source [data-area-geo]');

  items.forEach(el => {
    const item = el.closest('.w-dyn-item');
    try {
      const geoRaw = getVal(item, 'data-area-geo');
      const geometry = JSON.parse(geoRaw);
      const p = {
        name:        getVal(item,'data-area-name'),
        label:       getVal(item,'data-area-label'),
        description: getVal(item,'data-area-desc'),
        color:       getVal(item,'data-area-color') || '#00959d',
        opacity:     safeFloat(getVal(item,'data-area-alpha'), 50),
        zIndex:      safeFloat(getVal(item,'data-area-index'), 1),
        softness:    safeFloat(getVal(item,'data-area-softness'), 50),
        jitter:      safeFloat(getVal(item,'data-area-jitter'), 30),
        isBelowRoads: getVal(item,'data-area-slot') === 'true'
      };
      feats.push({ type:'Feature', properties:p, geometry });
    } catch(e) {
      // ignore malformed items
    }
  });

  feats.sort((a,b) => a.properties.zIndex - b.properties.zIndex);
  return { type:'FeatureCollection', features:feats };
}

// -----------------------------------------------------
//  Extract Custom Location Pins (from Webflow CMS)
// -----------------------------------------------------
function getLocationsList() {
  const pins = [];
  const items = document.querySelectorAll('#map-data-source [data-loc-lat]');

  items.forEach(el => {
    const item = el.closest('.w-dyn-item');
    try {
      const latVal = getVal(item,'data-loc-lat');
      const lngVal = getVal(item,'data-loc-long');
      const lat = parseFloat(latVal);
      const lng = parseFloat(lngVal);
      if (isNaN(lat) || isNaN(lng)) return;

      const imgUrl = getVal(item,'data-loc-icon-url');
      const clickableRaw = (getVal(item,'data-loc-click') || '').trim().toLowerCase();
      const isClickable = clickableRaw === 'true';
      const slug = getVal(item,'data-loc-slug') || '';

      const targetRaw = getVal(item,'data-loc-target');
      let targetBlank = true;
      if (typeof targetRaw === 'string') {
        const v = targetRaw.trim().toLowerCase();
        if (v === 'false') targetBlank = false;
        else if (v === 'true') targetBlank = true;
      }

      const minZoom = safeFloat(getVal(item,'data-loc-zoom'), 0);
      const zIndex = safeFloat(getVal(item,'data-loc-index'), 0);

      // --- Template Variant ID ---
      const templateRaw = getVal(item, 'data-loc-template');
      const templateId = templateRaw ? templateRaw.trim() : '1';

      pins.push({
        lat,
        long: lng,
        title:       getVal(item,'data-loc-disp'),
        description: getVal(item,'data-loc-desc'),
        iconUrl:     imgUrl,
        minZoom,
        zIndex,
        isClickable,
        slug,
        targetBlank,
        templateId
      });
    } catch(e) {
      // ignore malformed items
    }
  });

  pins.sort((a, b) => a.zIndex - b.zIndex);
  return pins;
}

// -----------------------------------------------------
//  CORE: HEX GRID COMPOSITING ENGINE
// -----------------------------------------------------
function buildHexGrid(areasFC) {
  const turf = window.turf;
  if (!turf || !areasFC.features.length)
    return { type:'FeatureCollection', features:[], meta:[] };

  const bbox = turf.bbox(areasFC);
  const container = document.getElementById('map-data-source');

  let resolution = 1.75;
  let outlineMultiplier = 1.0;

  if (container) {
    const r = container.getAttribute('data-grid-resolution');
    if (r) resolution = parseFloat(r);
    const o = container.getAttribute('data-outline-multiplier');
    if (o) outlineMultiplier = parseFloat(o);
  }

  if (resolution < 0.2) resolution = 0.2;

  const CELL_KM = resolution;
  const rawGrid = turf.hexGrid(bbox, CELL_KM, { units:'kilometers' });

  const layersMeta = areasFC.features.map(f => {
    const p = f.properties;
    let boundaryLines = [];
    try {
      const converted = turf.polygonToLine(f);
      if (converted.type === 'FeatureCollection') {
        converted.features.forEach(feat => {
          boundaryLines.push(...explodeToLineStrings(feat.geometry));
        });
      } else {
        boundaryLines.push(...explodeToLineStrings(converted.geometry));
      }
    } catch(e) { }

    let softnessRadiusKm = (p.softness / 100) * 100;
    if (softnessRadiusKm > 0 && softnessRadiusKm < CELL_KM * 3) {
      softnessRadiusKm = CELL_KM * 3;
    }

    const jitterAmp = p.jitter > 0 ? (p.jitter / 100) * 0.25 : 0;
    const rgb = parseColorToRgb(p.color);

    return {
      area: f,
      boundaryLines,
      baseOpacity: p.opacity / 100,
      jitterAmp,
      softnessRadiusKm,
      rgb,
      zIndex:      p.zIndex,
      label:       p.label,
      description: p.description,
      isBelowRoads:p.isBelowRoads
    };
  });

  const out = [];

  rawGrid.features.forEach(hex => {
    const center = turf.centerOfMass(hex);
    const activeLayers = layersMeta.filter(m =>
      turf.booleanPointInPolygon(center, m.area)
    );

    if (!activeLayers.length) return;

    activeLayers.sort((a,b) => a.zIndex - b.zIndex);

    let currentR=0, currentG=0, currentB=0, currentA=0;
    let topLabel="", topDescription="", topZ=0, topBelow=false;

    activeLayers.forEach(m => {
      let alpha = m.baseOpacity;

      if (m.boundaryLines.length > 0 && m.softnessRadiusKm > 0) {
        let minD = Infinity;
        m.boundaryLines.forEach(line => {
          const d = turf.pointToLineDistance(center, line, { units:'kilometers' });
          if (d < minD) minD = d;
        });

        if (minD !== Infinity) {
          let t = minD / m.softnessRadiusKm;
          if (t > 1) t = 1;
          alpha *= t;
        }
      }

      if (m.jitterAmp > 0) {
        alpha += (Math.random() - 0.5) * m.jitterAmp;
      }

      alpha = Math.max(0, Math.min(1, alpha));
      if (alpha <= 0.001) return;

      const newA = alpha + currentA * (1 - alpha);

      if (newA > 0) {
        currentR = (m.rgb.r * alpha + currentR * currentA * (1 - alpha)) / newA;
        currentG = (m.rgb.g * alpha + currentG * currentA * (1 - alpha)) / newA;
        currentB = (m.rgb.b * alpha + currentB * currentA * (1 - alpha)) / newA;
      }

      currentA = newA;

      topLabel       = m.label;
      topDescription = m.description;
      topZ           = m.zIndex;
      topBelow       = m.isBelowRoads;
    });

    if (currentA <= 0.01) return;

    const finalR = Math.round(currentR);
    const finalG = Math.round(currentG);
    const finalB = Math.round(currentB);

    const fillColorStr = `rgb(${finalR},${finalG},${finalB})`;
    const outlineA = currentA * outlineMultiplier;
    const outlineColor = `rgba(${finalR},${finalG},${finalB},${outlineA})`;

    out.push({
      type:'Feature',
      properties:{
        color: fillColorStr,
        opacity: currentA,
        outlineColor,
        label: topLabel || "Area",
        description: topDescription,
        zIndex: topZ,
        isBelowRoads: topBelow
      },
      geometry: hex.geometry
    });
  });

  return {
    geoJSON: { type:'FeatureCollection', features:out },
    meta: layersMeta
  };
}

// -----------------------------------------------------
//  INITIALIZE MAP
// -----------------------------------------------------
function initMap() {
  if (!window.mapboxgl || !window.turf) {
    setTimeout(initMap, 50);
    return;
  }

  const mapContainer = document.getElementById('map');
  if (mapContainer) {
    const overlay = document.createElement('div');
    overlay.id = 'map-loader-overlay';
    overlay.innerHTML = '<div class="map-spinner"></div>';
    mapContainer.appendChild(overlay);

    if (getComputedStyle(mapContainer).position === 'static') {
      mapContainer.style.position = 'relative';
    }
  }

  mapboxgl.accessToken =
    'pk.eyJ1Ijoid2Vic2VydmljZS1kZXYiLCJhIjoiY20zYzNyOWExMGd2ajJtczZ0YXg0d3UwbyJ9.6avXsfoNLoTmGFE0I6eH5Q';

  const map = new mapboxgl.Map({
    container:'map',
    style:'mapbox://styles/webservice-dev/cmcmck0kf008k01r1bggr7bqm',
    center:[19.2,52.0],
    zoom:5.6
  });

  map.scrollZoom.disable();
  map.addControl(new mapboxgl.NavigationControl());

  const popup = new mapboxgl.Popup({
    closeButton:false,
    closeOnClick:false,
    className:'custom-mapbox-popup',
    offset:20
  });

  const dialogRegistry = new Map();
  let openDialog = null;

  function closeMapDialog(dialogEl) {
    if (!dialogEl) return;
    if (typeof dialogEl.close === 'function') {
      dialogEl.close();
    } else {
      dialogEl.removeAttribute('open');
    }
    dialogEl.classList.remove('is-open');
    if (openDialog === dialogEl) {
      openDialog = null;
    }
  }

  function openMapDialog(dialogEl, loc) {
    if (!dialogEl) return;
    if (openDialog && openDialog !== dialogEl) {
      closeMapDialog(openDialog);
    }
    openDialog = dialogEl;

    const linkEl = dialogEl.querySelector('[data-dialog-link]');
    if (linkEl && loc) {
      if (loc.targetBlank) {
        linkEl.setAttribute('target', '_blank');
        linkEl.setAttribute('rel', 'noopener noreferrer');
      } else {
        linkEl.setAttribute('target', '_self');
        linkEl.removeAttribute('rel');
      }
    }

    if (typeof dialogEl.showModal === 'function') {
      if (!dialogEl.open) dialogEl.showModal();
    } else {
      dialogEl.setAttribute('open', 'open');
    }
    dialogEl.classList.add('is-open');
  }

  document.querySelectorAll('[data-map-dialog][data-dialog-id]').forEach(dialogEl => {
    const id = dialogEl.getAttribute('data-dialog-id');
    if (!id) return;

    dialogRegistry.set(id, dialogEl);

    dialogEl.querySelectorAll('[data-dialog-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeMapDialog(dialogEl);
      });
    });

    dialogEl.addEventListener('click', (event) => {
      if (event.target === dialogEl) {
        closeMapDialog(dialogEl);
      }
    });

    dialogEl.addEventListener('cancel', (event) => {
      event.preventDefault(); 
      closeMapDialog(dialogEl);
    });
  });

  const gestureEl = document.querySelector('[data-map-ctrlmsg]');
  let gestureTimer;

  let ctrlMsgText  = 'Use Ctrl + Scroll to zoom';
  let touchMsgText = 'Use two fingers to move the map';

  const ctrlMsgSource  = document.querySelector('[data-map-ctrlmsg-zoom]');
  const touchMsgSource = document.querySelector('[data-map-ctrlmsg-touch]');

  if (ctrlMsgSource && ctrlMsgSource.innerHTML.trim()) {
    ctrlMsgText = ctrlMsgSource.innerHTML.trim();
  }
  if (touchMsgSource && touchMsgSource.innerHTML.trim()) {
    touchMsgText = touchMsgSource.innerHTML.trim();
  }

  if (gestureEl) gestureEl.style.zIndex = '2000';

  function triggerGestureMsg(type) {
    if (!gestureEl) return;
    gestureEl.innerHTML = (type === 'touch') ? touchMsgText : ctrlMsgText;
    gestureEl.classList.add('is-visible');
    gestureEl.style.display = 'flex';
    gestureEl.style.opacity = '1';
    if (gestureTimer) clearTimeout(gestureTimer);
    gestureTimer = setTimeout(() => {
      gestureEl.classList.remove('is-visible');
      gestureEl.style.opacity = '0';
      setTimeout(() => {
        if (!gestureEl.classList.contains('is-visible')) {
          gestureEl.style.display = 'none';
        }
      }, 300);
    }, 2000);
  }

  const canvas = map.getCanvas();

  canvas.addEventListener('wheel', (e) => {
    const wantsZoom = e.ctrlKey || e.metaKey;
    if (wantsZoom) {
      map.scrollZoom.enable();
    } else {
      map.scrollZoom.disable();
      triggerGestureMsg('zoom');
    }
  }, { passive:false, capture:true });

  canvas.addEventListener('mouseleave', () => {
    map.scrollZoom.disable();
  });

  window.addEventListener('keydown', (e) => {
    if (e.metaKey) {
      map.dragPan.enable();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (!e.metaKey && !('ontouchstart' in window)) {
      map.dragPan.enable();
    }
  });

  map.dragPan.disable();

  map.on('touchstart', (e) => {
    if (e.points.length >= 2) {
      map.dragPan.enable();
    } else {
      map.dragPan.disable();
    }
  });

  map.on('touchmove', (e) => {
    if (e.points.length < 2) {
      map.dragPan.disable();
      triggerGestureMsg('touch');
    } else {
      map.dragPan.enable();
    }
  });

  map.on('touchend', () => {
    map.dragPan.disable();
  });

  let isHoveringMarker = false;
  const markerEntries = [];

  function updateMarkerVisibility() {
    if (!markerEntries.length) return;
    const z = map.getZoom();
    markerEntries.forEach(entry => {
      const visible = z >= entry.minZoom;
      entry.el.style.display = visible ? 'flex' : 'none';
    });
  }

  map.on('load', () => {
    setTimeout(() => {
      const areas = getAreaGeoJSON();
      const buildResult = buildHexGrid(areas);
      const hexData = buildResult.geoJSON;

      map.addSource('hex-src', { type:'geojson', data:hexData });

      const layers = map.getStyle().layers;
      let beforeId = null;
      const priorityKeywords = ['symbol','label','road','building'];

      for (const layer of layers) {
        if (priorityKeywords.some(kw =>
          layer.id.includes(kw) || layer.type === 'symbol'
        )) {
          beforeId = layer.id;
          break;
        }
      }

      map.addLayer({
        id:'hex-layer-bottom',
        type:'fill',
        source:'hex-src',
        slot:'bottom',
        filter:['==',['get','isBelowRoads'], true],
        paint:{
          'fill-color':['get','color'],
          'fill-opacity':['get','opacity'],
          'fill-outline-color':['get','outlineColor']
        }
      }, beforeId);

      map.addLayer({
        id:'hex-layer-top',
        type:'fill',
        source:'hex-src',
        filter:['!=',['get','isBelowRoads'], true],
        paint:{
          'fill-color':['get','color'],
          'fill-opacity':['get','opacity'],
          'fill-outline-color':['get','outlineColor']
        }
      }, beforeId);

      // --- CUSTOM PIN MARKERS ---
      const pins = getLocationsList();

      pins.forEach(loc => {
        // --- TEMPLATE LOGIC ---
        const targetId = `pin-template-${loc.templateId}`;
        let tpl = document.getElementById(targetId);
        
        // Fallback to template 1
        if (!tpl) {
          tpl = document.getElementById('pin-template-1');
        }
        
        if (tpl) {
          const el = document.createElement('div');
          
          // Use class from selected template (styles from CSS)
          el.className = tpl.className; 
          el.style.display = 'flex';

          const baseZ = loc.zIndex + 200;
          el.style.zIndex = baseZ;

          if (loc.iconUrl) {
            el.innerHTML = `<img src="${loc.iconUrl}" style="width:100%;height:100%;object-fit:contain;">`;
          }

          const marker = new mapboxgl.Marker({element:el})
            .setLngLat([loc.long, loc.lat])
            .addTo(map);

          const dialogEl = loc.slug ? dialogRegistry.get(loc.slug) : null;
          const hasDialog = !!(dialogEl && loc.isClickable);

          markerEntries.push({
            marker,
            el,
            minZoom: loc.minZoom,
            hasDialog,
            dialogId: loc.slug,
            loc
          });

          // --- POPUP EVENTS (Removed JS cursor manipulation) ---
          el.addEventListener('mouseenter', () => {
            isHoveringMarker = true;
            el.style.zIndex = 1000;
            // No JS cursor set here. Handled by CSS on el.className

            if (loc.title) {
              popup
                .setLngLat([loc.long, loc.lat])
                .setHTML(`<div>${loc.title}</div>`)
                .addTo(map);
            }
          });

          el.addEventListener('mouseleave', () => {
            isHoveringMarker = false;
            el.style.zIndex = baseZ;
            popup.remove();
          });

          el.addEventListener('click', () => {
            if (!hasDialog) return;
            const dlg = dialogRegistry.get(loc.slug);
            if (dlg) {
              openMapDialog(dlg, loc);
            }
          });
        }
      });

      const loader = document.getElementById('map-loader-overlay');
      if (loader) {
        loader.classList.add('loader-hidden');
        setTimeout(() => loader.remove(), 500);
      }

      updateMarkerVisibility();
      map.on('zoom', updateMarkerVisibility);

      const hexLayers = ['hex-layer-bottom','hex-layer-top'];

      map.on('mousemove', e => {
        if (isHoveringMarker) return;

        const feats = map.queryRenderedFeatures(e.point, { layers:hexLayers });

        if (feats.length) {
          const f = feats[0];
          if (f.properties.opacity > 0.2) {
            map.getCanvas().style.cursor = 'default';
            popup
              .setLngLat(e.lngLat)
              .setHTML(`<div>${f.properties.label}</div>`)
              .addTo(map);
          } else {
            popup.remove();
            map.getCanvas().style.cursor = '';
          }
        } else {
          popup.remove();
          map.getCanvas().style.cursor = '';
        }
      });

      map.on('click', e => {
        if (isHoveringMarker) return;
        const feats = map.queryRenderedFeatures(e.point, { layers:hexLayers });
        if (feats.length) {
          const f = feats[0];
          if (f.properties.opacity > 0.2 && f.properties.description) {
            console.log("Open Area Modal:", f.properties.label);
          }
        }
      });

      map.on('mouseout', () => {
        if (!isHoveringMarker) popup.remove();
      });
    }, 50);
  });
}

mapboxJs.onload = initMap;
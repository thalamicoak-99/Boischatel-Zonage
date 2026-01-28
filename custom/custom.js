window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  const cadInput = document.getElementById('cadastre-input');
  const cadBox = document.getElementById('cadastre-suggestions');

  const addrInput = document.getElementById('address-input');
  const addrBox = document.getElementById('address-suggestions');

  // -------------------------------------------------
  // Couche de surbrillance
  // -------------------------------------------------
  const highlightLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: '#ff0000', width: 3 }),
      fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.25)' })
    })
  });
  map.addLayer(highlightLayer);

  // -------------------------------------------------
  // Utilitaires
  // -------------------------------------------------
  function normalizeLot(value) {
    return value.toString().replace(/\s+/g, '').toLowerCase();
  }
  
  function normalizeText(val) {
  return val
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-–—]/g, '');
  }

  function clearBox(box) {
    box.innerHTML = '';
    box.style.display = 'none';
  }

  function showBox(box) {
    box.style.display = 'block';
  }

  function createItem(label, action) {
    const div = document.createElement('div');
    div.className = 'search-item';
    div.textContent = label;
    div.onclick = action;
    return div;
  }

  // -------------------------------------------------
  // Trouver la couche cadastre
  // -------------------------------------------------
  function getCadastreLayer() {
    let found = null;

    map.getLayers().forEach(layer => {
      const src = layer.getSource && layer.getSource();
      if (!src || !src.getFeatures) return;

      const feats = src.getFeatures();
      if (!feats.length) return;

      const p = feats[0].getProperties();
      if (
        p['NoLot'] !== undefined &&
        p['Info info lot — A_Matricule'] !== undefined
      ) {
        found = layer;
      }
    });

    return found;
  }

  // -------------------------------------------------
  // Zoom + surbrillance (corrigé)
  // -------------------------------------------------
  function zoomToFeature(feature) {
    highlightLayer.getSource().clear();
    highlightLayer.getSource().addFeature(feature);

    map.getView().fit(feature.getGeometry().getExtent(), {
      padding: [50, 50, 50, 50],
      maxZoom: 18,
      duration: 700
    });
  }

  // =================================================
  // 🔹 RECHERCHE CADASTRALE (LOT / MATRICULE)
  // =================================================
  function runCadastreSearch(query) {
    cadBox.innerHTML = '';
  
    const layer = getCadastreLayer();
    if (!layer || !query) return;
  
    const q = normalizeText(query);
    const feats = layer.getSource().getFeatures();
    const matches = [];
  
    feats.forEach(f => {
      const lot = normalizeText(f.get('NoLot') || '');
      const mat = normalizeText(f.get('Info info lot — A_Matricule') || '');
  
      if (lot.includes(q) || mat.includes(q)) {
        matches.push(f);
      }
    });
  
    matches.slice(0, 3).forEach(f => {
      cadBox.appendChild(
        createItem(
          `Lot ${f.get('NoLot')} — ${f.get('Info info lot — A_Matricule')}`,
          () => {
            zoomToFeature(f);
            cadBox.innerHTML = '';
          }
        )
      );
    });
  
    cadBox.style.display = matches.length ? 'block' : 'none';
  }

  // -------------------------------------------------
  // Suggestions en temps réel + Bouton 🔍 cadastral (corrigé)
  // -------------------------------------------------

  let cadTimer;
  cadInput.addEventListener('input', () => {
    clearTimeout(cadTimer);
    const val = cadInput.value.trim();
    if (val.length < 2) {
      cadBox.innerHTML = '';
      return;
    }
    cadTimer = setTimeout(() => runCadastreSearch(val), 250);
  });

  document.getElementById('cadastre-btn').addEventListener('click', () => {
    runCadastreSearch(cadInput.value.trim());
  });
  
  // =================================================
  // 🔹 RECHERCHE ADRESSE (OSM)
  // =================================================
  function runAddressSearch(query) {
    if (!query) return;
  
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q: query + ', Boischatel, Québec, Canada',
        format: 'json',
        limit: 3,
        countrycodes: 'ca'
      });
  
    fetch(url)
      .then(r => r.json())
      .then(results => {
        addrBox.innerHTML = '';
        results.forEach(r => {
          addrBox.appendChild(
            createItem(r.display_name, () => {
              map.getView().animate({
                center: ol.proj.fromLonLat([+r.lon, +r.lat]),
                zoom: 10,
                duration: 700
              });
              addrBox.innerHTML = '';
            })
          );
        });
        addrBox.style.display = results.length ? 'block' : 'none';
      });
  }

  // -------------------------------------------------
  // Suggestions en temps réel + Bouton 🔍 cadastral (corrigé)
  // -------------------------------------------------

  let addrTimer;
  addrInput.addEventListener('input', () => {
    clearTimeout(addrTimer);
    const val = addrInput.value.trim();
    if (val.length < 3) {
      addrBox.innerHTML = '';
      return;
    }
    addrTimer = setTimeout(() => runAddressSearch(val), 300);
  });

  document.getElementById('address-btn').addEventListener('click', () => {
    runAddressSearch(addrInput.value.trim());
  });
  
  // -------------------------------------------------
  // Fermer les suggestions au clic externe
  // -------------------------------------------------
  document.addEventListener('click', e => {
    if (!e.target.closest('#search-cadastre')) clearBox(cadBox);
    if (!e.target.closest('#search-address')) clearBox(addrBox);
  });

});

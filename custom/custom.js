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

    const geom = feature.getGeometry().clone();
    geom.transform('EPSG:4326', map.getView().getProjection());

    const clone = feature.clone();
    clone.setGeometry(geom);
    highlightLayer.getSource().addFeature(clone);

    map.getView().fit(geom, {
      padding: [80, 80, 80, 80],
      maxZoom: 18,
      duration: 700
    });
  }

  // =================================================
  // 🔹 RECHERCHE CADASTRALE (LOT / MATRICULE)
  // =================================================
  let cadTimer;
  cadInput.addEventListener('input', function () {
    const query = this.value.trim();
    clearTimeout(cadTimer);

    if (query.length < 2) {
      clearBox(cadBox);
      return;
    }

    cadTimer = setTimeout(() => {
      const layer = getCadastreLayer();
      if (!layer) return;

      cadBox.innerHTML = '';

      const qLot = normalizeLot(query);
      const qMat = query.toLowerCase();

      const feats = layer.getSource().getFeatures();
      const results = [];

      feats.forEach(f => {
        const lot = normalizeLot(f.get('NoLot') || '');
        const mat = (f.get('Info info lot — A_Matricule') || '').toLowerCase();

        if (lot.includes(qLot) || mat.includes(qMat)) {
          results.push(f);
        }
      });

      results.slice(0, 3).forEach(f => {
        cadBox.appendChild(
          createItem(
            `Lot ${f.get('NoLot')} — ${f.get('Info info lot — A_Matricule')}`,
            () => {
              zoomToFeature(f);
              clearBox(cadBox);
            }
          )
        );
      });

      results.length ? showBox(cadBox) : clearBox(cadBox);
    }, 300);
  });

  // =================================================
  // 🔹 RECHERCHE ADRESSE (OSM)
  // =================================================
  let addrTimer;
  addrInput.addEventListener('input', function () {
    const query = this.value.trim();
    clearTimeout(addrTimer);

    if (query.length < 3) {
      clearBox(addrBox);
      return;
    }

    addrTimer = setTimeout(() => {
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
                  zoom: 16,
                  duration: 700
                });
                clearBox(addrBox);
              })
            );
          });

          results.length ? showBox(addrBox) : clearBox(addrBox);
        });
    }, 300);
  });

  // -------------------------------------------------
  // Fermer les suggestions au clic externe
  // -------------------------------------------------
  document.addEventListener('click', e => {
    if (!e.target.closest('#search-cadastre')) clearBox(cadBox);
    if (!e.target.closest('#search-address')) clearBox(addrBox);
  });

});

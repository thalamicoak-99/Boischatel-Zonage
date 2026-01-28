window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');
  const box = document.getElementById('search-suggestions');

  // -------------------------------------------------
  // Couche de surbrillance (robuste)
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
      if (p['NoLot'] !== undefined &&
          p['Info info lot — A_Matricule'] !== undefined) {
        found = layer;
      }
    });

    return found;
  }

  // -------------------------------------------------
  // Normalisation lot (IGNORE ESPACES)
  // -------------------------------------------------
  function normalizeLot(value) {
    return value.toString().replace(/\s+/g, '');
  }

  // -------------------------------------------------
  // Recherche cadastre (lots / matricules)
  // -------------------------------------------------
  function cadastreSearch(query) {
    const layer = getCadastreLayer();
    if (!layer) return { lots: [], mats: [] };

    const q = normalizeLot(query.toLowerCase());
    const feats = layer.getSource().getFeatures();

    const lots = [];
    const mats = [];

    feats.forEach(f => {
      const lot = normalizeLot((f.get('NoLot') || '').toLowerCase());
      const mat = (f.get('Info info lot — A_Matricule') || '').toLowerCase();

      if (lot.includes(q)) lots.push(f);
      if (mat.includes(query.toLowerCase())) mats.push(f);
    });

    return {
      lots: lots.slice(0, 3),
      mats: mats.slice(0, 3)
    };
  }

  // -------------------------------------------------
  // Recherche OSM (adresses)
  // -------------------------------------------------
  function osmSearch(query) {
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q: query + ', Boischatel, Québec, Canada',
        format: 'json',
        limit: 3,
        countrycodes: 'ca'
      });

    return fetch(url).then(r => r.json());
  }

  // -------------------------------------------------
  // Zoom + surbrillance (CORRIGÉ)
  // -------------------------------------------------
  function zoomToFeature(feature) {
    highlightLayer.getSource().clear();

    // Clone + reprojection sécuritaire
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

  // -------------------------------------------------
  // Affichage des sections
  // -------------------------------------------------
  function addSection(title, items) {
    if (!items.length) return;

    const header = document.createElement('div');
    header.className = 'search-section';
    header.textContent = title;
    box.appendChild(header);

    items.forEach(item => box.appendChild(item));
  }

  function createItem(label, action) {
    const div = document.createElement('div');
    div.className = 'search-item';
    div.textContent = label;
    div.onclick = action;
    return div;
  }

  function clearBox() {
    box.innerHTML = '';
    box.style.display = 'none';
  }

  function showBox() {
    box.style.display = 'block';
  }

  // -------------------------------------------------
  // Suggestions temps réel (3 sections)
  // -------------------------------------------------
  let timer;
  input.addEventListener('input', function () {
    const query = this.value.trim();
    clearTimeout(timer);

    if (query.length < 3) {
      clearBox();
      return;
    }

    timer = setTimeout(async () => {
      box.innerHTML = '';

      const cad = cadastreSearch(query);
      const osm = await osmSearch(query);

      const lotItems = cad.lots.map(f =>
        createItem(
          `Lot ${f.get('NoLot')}`,
          () => { zoomToFeature(f); clearBox(); }
        )
      );

      const matItems = cad.mats.map(f =>
        createItem(
          `Matricule ${f.get('Info info lot — A_Matricule')}`,
          () => { zoomToFeature(f); clearBox(); }
        )
      );

      const addrItems = osm.map(r =>
        createItem(
          r.display_name,
          () => {
            map.getView().animate({
              center: ol.proj.fromLonLat([+r.lon, +r.lat]),
              zoom: 16,
              duration: 700
            });
            clearBox();
          }
        )
      );

      addSection('Lots', lotItems);
      addSection('Matricules', matItems);
      addSection('Adresses', addrItems);

      (lotItems.length || matItems.length || addrItems.length)
        ? showBox()
        : clearBox();

    }, 300);
  });

  // -------------------------------------------------
  // Recherche par Enter / bouton
  // -------------------------------------------------
  function runSearch() {
    const q = input.value.trim();
    if (!q) return;

    const cad = cadastreSearch(q);
    if (cad.lots.length) return zoomToFeature(cad.lots[0]);
    if (cad.mats.length) return zoomToFeature(cad.mats[0]);

    osmSearch(q).then(r => {
      if (!r.length) return;
      map.getView().animate({
        center: ol.proj.fromLonLat([+r[0].lon, +r[0].lat]),
        zoom: 16,
        duration: 700
      });
    });
  }

  btn.addEventListener('click', runSearch);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') runSearch();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#search-container')) clearBox();
  });

});

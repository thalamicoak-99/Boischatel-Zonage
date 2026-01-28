window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  const cadInput = document.getElementById('cadastre-input');
  const cadBox = document.getElementById('cadastre-suggestions');
  const cadBtn = document.getElementById('cadastre-btn');

  const addrInput = document.getElementById('address-input');
  const addrBox = document.getElementById('address-suggestions');
  const addrBtn = document.getElementById('address-btn');

  // -------------------------------------------------
  // Utilitaires
  // -------------------------------------------------
  function normalizeCadastre(val) {
    return val.toString().toLowerCase().replace(/\s+/g, '').replace(/[-–—]/g, '');
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
  // 3) Détection couche cadastre (une seule fois)
  // -------------------------------------------------
  let cadastreLayer = null;
  map.getLayers().forEach(layer => {
    if (!layer.getSource) return;
    const src = layer.getSource();
    if (!src || !src.getFeatures) return;
    const feats = src.getFeatures();
    if (!feats.length) return;
    const props = feats[0].getProperties();
    if (props['Info info lot — A_Matricule'] !== undefined &&
        props['NoLot'] !== undefined) {
      cadastreLayer = layer;
    }
  });

  if (!cadastreLayer) {
    console.warn("Couche cadastre non trouvée !");
    return;
  }
  
  // -------------------------------------------------
  // 4) Couche de surbrillance
  // -------------------------------------------------
  const highlightLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: 'rgba(255,0,0,0.9)', width: 3 }),
      fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.2)' })
    })
  });
  map.addLayer(highlightLayer);
  
  // -------------------------------------------------
  // 5) Zoom + surbrillance
  // -------------------------------------------------
  function zoomToCadastreFeature(feature) {
    highlightLayer.getSource().clear();
    highlightLayer.getSource().addFeature(feature);
    const extent = feature.getGeometry().getExtent();
    map.getView().fit(extent, { padding: [40,40,40,40], maxZoom: 18, duration: 600 });
  }

  // =================================================
  // 🔹 RECHERCHE CADASTRALE (LOT / MATRICULE)
  // =================================================
  
  function searchCadastre(query) {
    if (!query) return [];
    const q = normalizeCadastre(query);
    const features = cadastreLayer.getSource().getFeatures();
    const results = features.filter(f => {
      const lot = normalizeCadastre(f.get('NoLot') || '');
      const mat = normalizeCadastre(f.get('Info info lot — A_Matricule') || '');
      return lot.includes(q) || mat.includes(q);
    });
    return results;
  }
  
  // -------------------------------------------------
  // 7) Affichage suggestions (max 3)
  // -------------------------------------------------
  function displayCadastreSuggestions(features) {
    cadBox.innerHTML = '';
    if (!features.length) {
      cadBox.style.display = 'none';
      return;
    }
    features.slice(0,3).forEach(f => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.textContent = `Lot ${f.get('NoLot')} — ${f.get('Info info lot — A_Matricule')}`;
      item.addEventListener('click', () => {
        zoomToCadastreFeature(f);
        cadBox.innerHTML = '';
        cadBox.style.display = 'none';
      });
      cadBox.appendChild(item);
    });
    cadBox.style.display = 'block';
  }


  // -------------------------------------------------
  // Suggestions en temps réel + Bouton 🔍 cadastral (corrigé)
  // -------------------------------------------------
  let cadTimer = null;
  cadInput.addEventListener('input', () => {
    clearTimeout(cadTimer);
    cadTimer = setTimeout(() => {
      const val = cadInput.value.trim();
      if (!val) { cadBox.innerHTML=''; cadBox.style.display='none'; return; }
      const results = searchCadastre(val);
      displayCadastreSuggestions(results);
    }, 250);
  });

  // -------------------------------------------------
  // 9) Bouton recherche
  // -------------------------------------------------
  cadBtn.addEventListener('click', () => {
    const val = cadInput.value.trim();
    if (!val) return;
    const results = searchCadastre(val);
    if (results.length) zoomToCadastreFeature(results[0]);
    displayCadastreSuggestions(results);
  });

  // -------------------------------------------------
  // 10) Fermer suggestions au clic hors champ
  // -------------------------------------------------
  document.addEventListener('click', e => {
    if (!e.target.closest('#search-cadastre')) {
      cadBox.innerHTML = '';
      cadBox.style.display = 'none';
    }
  });
  
  // =================================================
  // 🔹 RECHERCHE ADRESSE (OSM)
  // =================================================
  
  
  // -------------------------------------------------
  // 3) Fonction pour zoomer sur un résultat
  // -------------------------------------------------
  function zoomToAddress(lon, lat) {
    map.getView().animate({
      center: ol.proj.fromLonLat([parseFloat(lon), parseFloat(lat)]),
      zoom: 16,
      duration: 700
    });
  }

  // -------------------------------------------------
  // 4) Affichage des suggestions (max 3)
  // -------------------------------------------------
  function displayAddressSuggestions(results) {
    clearBox(addrBox);
    if (!results.length) return;

    results.slice(0,3).forEach(r => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.textContent = r.display_name;
      item.addEventListener('click', () => {
        zoomToAddress(r.lon, r.lat);
        clearBox(addrBox);
      });
      addrBox.appendChild(item);
    });
    addrBox.style.display = 'block';
  }

  // -------------------------------------------------
  // 5) Recherche via Nominatim
  // -------------------------------------------------
  function runAddressSearch(query) {
    if (!query) return;
    const url = 'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q: query + ', Boischatel, Québec, Canada',
        format: 'json',
        limit: 5,
        countrycodes: 'ca'
      });

    fetch(url)
      .then(r => r.json())
      .then(results => displayAddressSuggestions(results))
      .catch(err => console.error("Erreur recherche adresse :", err));
  }
  
  // -------------------------------------------------
  // Suggestions en temps réel 
  // -------------------------------------------------

    let addrTimer = null;
  addrInput.addEventListener('input', () => {
    clearTimeout(addrTimer);
    const val = addrInput.value.trim();
    if (val.length < 3) { clearBox(addrBox); return; }
    addrTimer = setTimeout(() => runAddressSearch(val), 300);
  });

  // -------------------------------------------------
  // 7) Bouton recherche 🔍
  // -------------------------------------------------
  addrBtn.addEventListener('click', () => {
    const val = addrInput.value.trim();
    if (!val) return;
    runAddressSearch(val);
  });
  
  // -------------------------------------------------
  // 8) Fermer suggestions au clic externe
  // -------------------------------------------------
  document.addEventListener('click', e => {
    if (!e.target.closest('#search-address')) clearBox(addrBox);
  });

});

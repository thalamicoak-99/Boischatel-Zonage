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
      stroke: new ol.style.Stroke({
        color: 'rgba(255, 0, 0, 0.9)',
        width: 3
      }),
      fill: new ol.style.Fill({
        color: 'rgba(255, 0, 0, 0.2)'
      })
    })
  });

  map.addLayer(highlightLayer);

  // -------------------------------------------------
  // Utilitaires
  // -------------------------------------------------
  function normalizeCadastre(val) {
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
  let cadastreLayer = null;
  
  map.getLayers().forEach(layer => {
    if (!layer.getSource) return;
  
    const src = layer.getSource();
    if (!src || !src.getFeatures) return;
  
    const feats = src.getFeatures();
    if (!feats.length) return;
  
    const props = feats[0].getProperties();
    if (
      props['Info info lot — A_Matricule'] !== undefined &&
      props['NoLot'] !== undefined
    ) {
      cadastreLayer = layer;
    }
  });
  
  if (!cadastreLayer) {
    console.warn("Couche cadastre non trouvée !");
    return;
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
      duration: 600
    });
  }

  // =================================================
  // 🔹 RECHERCHE CADASTRALE (LOT / MATRICULE)
  // =================================================
  function searchCadastre(query) {
    if (!query) return [];
    const q = normalizeCadastre(query);
    const features = cadastreLayer.getSource().getFeatures();
    const results = [];
    for (const f of features) {
      const lot = normalizeCadastre(f.get('NoLot') || '');
      const mat = normalizeCadastre(f.get('Info info lot — A_Matricule') || '');
      if (lot.includes(q) || mat.includes(q)) {
        results.push(f);
      }
    }
    return results;
  }

  // -------------------------------------------------
  // Affichage suggestions (max 3)
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
      if (!val) { cadBox.innerHTML = ''; cadBox.style.display = 'none'; return; }
      const results = searchCadastre(val);
      displayCadastreSuggestions(results);
    }, 250);
  });

  cadBtn.addEventListener('click', () => {
    const val = cadInput.value.trim();
    if (!val) return;
    const results = searchCadastre(val);
    if (results.length) zoomToCadastreFeature(results[0]);
    displayCadastreSuggestions(results);
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
                zoom: 20,
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
    if (!e.target.closest('#search-cadastre')) {
      cadBox.innerHTML = '';
      cadBox.style.display = 'none';
    }
    if (!e.target.closest('#search-address')) clearBox(addrBox);
  });

});

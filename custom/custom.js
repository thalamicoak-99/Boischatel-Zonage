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

  // =================================================
  // 🔹 RECHERCHE CADASTRALE (LOT / MATRICULE)
  // =================================================
  
  // -------------------------------------------------
  // Fonction pour attendre la couche cadastre
  // -------------------------------------------------
  function waitForCadastreLayer(callback) {
    const interval = setInterval(() => {
      const cadastreLayer = findCadastreLayer(map.getLayers().getArray());
      if (cadastreLayer) {
        clearInterval(interval);
        callback(cadastreLayer);
      }
    }, 200);
  }
  
  function findCadastreLayer(layers) {
    for (let layer of layers) {
      if (layer instanceof ol.layer.Group) {
        const found = findCadastreLayer(layer.getLayers().getArray());
        if (found) return found;
      } else if (layer instanceof ol.layer.Vector) {
        const feats = layer.getSource()?.getFeatures() || [];
        if (!feats.length) continue;
        const props = feats[0].getProperties();
        if (props['Info info lot — A_Matricule'] !== undefined &&
            props['NoLot'] !== undefined) {
          return layer;
        }
      }
    }
    return null;
  }

  // -------------------------------------------------
  // Fonction principale cadastre
  // -------------------------------------------------
  function initCadastreSearch(cadastreLayer) {
    console.log("Couche cadastre trouvée !");

   // Normalisation
      function normalizeCadastre(val) {
        return val.toString().toLowerCase().replace(/\s+/g, '').replace(/[-–—]/g, '');
      }
    
  // -------------------------------------------------
  // Couche de surbrillance
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
  // Zoom
  // -------------------------------------------------
    function zoomToCadastreFeature(feature) {
      highlightLayer.getSource().clear();
      highlightLayer.getSource().addFeature(feature);
      const extent = feature.getGeometry().getExtent();
      map.getView().fit(extent, { padding: [40,40,40,40], maxZoom: 18, duration: 600 });
    }

  // -------------------------------------------------
  // Fonction search couche cadastre
  // -------------------------------------------------
  
  function searchCadastre(query) {
      if (!query) return [];
      const q = normalizeCadastre(query);
      const features = cadastreLayer.getSource().getFeatures();
      return features.filter(f => {
        const lot = normalizeCadastre(f.get('NoLot') || '');
        const mat = normalizeCadastre(f.get('Info info lot — A_Matricule') || '');
        return lot.includes(q) || mat.includes(q);
      });
    }
  
  // -------------------------------------------------
  // Affichage suggestions (max 3)
  // -------------------------------------------------
  function displayCadastreSuggestions(features) {
      cadBox.innerHTML = '';
      if (!features.length) { cadBox.style.display='none'; return; }
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
  // Suggestions en temps réel
  // -------------------------------------------------
  let cadTimer = null;
    cadInput.addEventListener('input', () => {
      clearTimeout(cadTimer);
      const val = cadInput.value.trim();
      if (!val) { cadBox.innerHTML=''; cadBox.style.display='none'; return; }
      cadTimer = setTimeout(() => {
        displayCadastreSuggestions(searchCadastre(val));
      }, 250);
    });
    
  // -------------------------------------------------
  // Bouton 🔍 cadastral
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
        cadBox.innerHTML='';
        cadBox.style.display='none';
      }
    });
  }

  // -------------------------------------------------
  // Appel de waitForCadastreLayer pour init
  // -------------------------------------------------
  waitForCadastreLayer(initCadastreSearch);
  
  // =================================================
  // 🔹 RECHERCHE ADRESSE (OSM)
  // =================================================
  
  
  // -------------------------------------------------
  // 3) Fonction pour zoomer sur un résultat
  // -------------------------------------------------
  function zoomToAddress(lon, lat) {
    map.getView().animate({
      center: ol.proj.fromLonLat([parseFloat(lon), parseFloat(lat)]),
      zoom: 24,
      duration: 600
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

    // Exemple de rectangle : sud-ouest (long_min, lat_min) et nord-est (long_max, lat_max)
    const viewbox = '46.94249,-71.20995,-71.08772'; // ajuster selon la zone de Boischatel

      const url = 'https://nominatim.openstreetmap.org/search?' +
        new URLSearchParams({
          q: query + ', Boischatel, Québec, Canada',
          format: 'json',
          limit: 5,
          countrycodes: 'ca'
          viewbox: viewbox,
          bounded: 1
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

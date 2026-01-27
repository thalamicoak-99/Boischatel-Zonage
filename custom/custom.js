window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  const input = document.getElementById('search-input');
  const suggestionsBox = document.getElementById('search-suggestions');
  const searchBtn = document.getElementById('search-btn');
  
  // -------------------------------------------------
  // 1) RÉCUPÉRER LA COUCHE CADASTRE DANS LE GROUPE
  // -------------------------------------------------
  let cadastreLayer = null;
  
  map.getLayers().forEach(layer => {
  
    // On cherche le groupe
    if (layer instanceof ol.layer.Group &&
        layer.get('title') === 'Zone dossier de travail') {
  
      // On parcourt les couches du groupe
      layer.getLayers().forEach(subLayer => {
  
        // qgis2web donne souvent le nom ici
        if (subLayer.getSource &&
            subLayer.getSource() instanceof ol.source.Vector) {
  
          const feats = subLayer.getSource().getFeatures();
          if (!feats.length) return;
  
          const props = feats[0].getProperties();
  
          // Signature du cadastre
          if (props['NoLot'] !== undefined &&
              props['Info info lot — A_Matricule'] !== undefined) {
            cadastreLayer = subLayer;
          }
        }
      });
    }
  });
  
  if (!cadastreLayer) {
    console.warn("Couche cadastre non trouvée !");
    return;
  }
  
  // -------------------------------------------------
  // 2) COUCHE DE SURBRILLANCE (CORRIGÉE)
  // -------------------------------------------------
  const highlightLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: '#ff0000',
        width: 3
      }),
      fill: new ol.style.Fill({
        color: 'rgba(255,0,0,0.25)'
      })
    })
  });

  map.addLayer(highlightLayer);

  // -------------------------------------------------
  // 3) NORMALISATION (espaces, tirets, etc.)
  // -------------------------------------------------
  function normalize(val) {
    return val
      .toString()
      .toLowerCase()
      .replace(/[^0-9a-z]/g, '');
  }

  // -------------------------------------------------
  // 4) RECHERCHE FLEXIBLE DANS LE CADASTRE
  // -------------------------------------------------
  function searchCadastre(query) {
    const q = normalize(query);
    if (!q) return [];

    return cadastreLayer.getSource().getFeatures().filter(f => {
      const lot = normalize(f.get('NoLot') || '');
      const mat = normalize(f.get('Info info lot — A_Matricule') || '');
      return lot.includes(q) || mat.includes(q);
    });
  }

  // -------------------------------------------------
  // 5) AFFICHER SUGGESTIONS (3 MAX)
  // -------------------------------------------------
  function showSuggestions(features) {
    suggestionsBox.innerHTML = '';

    features.slice(0, 3).forEach(f => {
      const div = document.createElement('div');
      div.className = 'search-item';

      div.textContent =
        `Lot ${f.get('NoLot')} — ${f.get('Info info lot — A_Matricule')}`;

      div.addEventListener('click', () => {
        selectFeature(f);
        suggestionsBox.innerHTML = '';
      });

      suggestionsBox.appendChild(div);
    });
  }

  // -------------------------------------------------
  // 6) SÉLECTION + ZOOM ADAPTÉ À L’ENTITÉ
  // -------------------------------------------------
  function selectFeature(feature) {
    highlightLayer.getSource().clear();
    highlightLayer.getSource().addFeature(feature);

    map.getView().fit(feature.getGeometry().getExtent(), {
      padding: [50, 50, 50, 50],
      duration: 700,
      maxZoom: 18
    });
  }

  // -------------------------------------------------
  // 7) SAISIE TEMPS RÉEL
  // -------------------------------------------------
  input.addEventListener('input', () => {
    const results = searchCadastre(input.value);
    results.length ? showSuggestions(results) : suggestionsBox.innerHTML = '';
  });

  // -------------------------------------------------
  // 8) BOUTON 🔍 + ENTER
  // -------------------------------------------------
  searchBtn.addEventListener('click', () => {
    const results = searchCadastre(input.value);

    if (results.length === 1) {
      selectFeature(results[0]);
      suggestionsBox.innerHTML = '';
    } else if (results.length > 1) {
      showSuggestions(results);
    }
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchBtn.click();
  });

});

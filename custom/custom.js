window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  const input = document.getElementById('search-input');
  const suggestionsBox = document.getElementById('search-suggestions');
  const searchBtn = document.getElementById('search-btn');
  
  // -------------------------------------------------
  // 1) Trouver la couche cadastre par ses champs
  // -------------------------------------------------
  let cadastreLayer = null;

  map.getLayers().forEach(layer => {
    if (!layer.getSource) return;
    const src = layer.getSource();
    if (!src.getFeatures) return;

    const feats = src.getFeatures();
    if (!feats.length) return;

    const props = feats[0].getProperties();
    if (props['NoLot'] !== undefined &&
        props['Info info lot — A_Matricule'] !== undefined) {
      cadastreLayer = layer;
    }
  });

  if (!cadastreLayer) {
    console.warn('Couche cadastre non trouvée');
    return;
  }

  // -------------------------------------------------
  // 2) Couche de surbrillance (corrigée)
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
  // 3) Normalisation des valeurs
  // -------------------------------------------------
  function normalize(val) {
    return val
      .toString()
      .toLowerCase()
      .replace(/[^0-9a-z]/g, '');
  }

  // -------------------------------------------------
  // 4) Recherche flexible
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
  // 5) Afficher suggestions
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
  // 6) Sélection + zoom intelligent
  // -------------------------------------------------
  function selectFeature(feature) {
    highlightLayer.getSource().clear();
    highlightLayer.getSource().addFeature(feature);

    const extent = feature.getGeometry().getExtent();

    map.getView().fit(extent, {
      padding: [50, 50, 50, 50],
      duration: 700,
      maxZoom: 18
    });
  }

  // -------------------------------------------------
  // 7) Événement sur saisie
  // -------------------------------------------------
  input.addEventListener('input', () => {
    const results = searchCadastre(input.value);
    if (results.length) {
      showSuggestions(results);
    } else {
      suggestionsBox.innerHTML = '';
    }
  });

  searchBtn.addEventListener('click', () => {
  const results = searchCadastre(input.value);

  if (results.length === 1) {
    // Un seul résultat → zoom direct
    selectFeature(results[0]);
    suggestionsBox.innerHTML = '';
  } else if (results.length > 1) {
    // Plusieurs → afficher suggestions
    showSuggestions(results);
  }
  });


  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      searchBtn.click();
    }
  });
});

window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  const input = document.getElementById('search-input');
  const suggestionsBox = document.getElementById('search-suggestions');

  // ------------------------------
  // Couche de surbrillance
  // ------------------------------
  const highlightLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: 'red', width: 3 }),
      fill: new ol.style.Fill({ color: 'rgba(255,0,0,0.25)' })
    })
  });
  map.addLayer(highlightLayer);

  // ------------------------------
  // Trouver la couche cadastre
  // ------------------------------
  function getCadastreLayer() {
    let layerFound = null;

    map.getLayers().forEach(layer => {
      const src = layer.getSource && layer.getSource();
      if (!src || !src.getFeatures) return;

      const feats = src.getFeatures();
      if (!feats.length) return;

      const props = feats[0].getProperties();
      if (props['NoLot'] !== undefined &&
          props['Info info lot — A_Matricule'] !== undefined) {
        layerFound = layer;
      }
    });

    return layerFound;
  }

  // ------------------------------
  // Recherche cadastre (suggestions)
  // ------------------------------
  function searchCadastreSuggestions(query) {
    const layer = getCadastreLayer();
    if (!layer) return [];

    const feats = layer.getSource().getFeatures();
    const q = query.toLowerCase();

    return feats
      .filter(f => {
        return (
          (f.get('NoLot') || '').toLowerCase().includes(q) ||
          (f.get('Info info lot — A_Matricule') || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 5);
  }

  // ------------------------------
  // Recherche OSM (suggestions)
  // ------------------------------
  function searchOSMSuggestions(query) {
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q: query + ', Boischatel, Québec, Canada',
        format: 'json',
        addressdetails: 1,
        limit: 5,
        countrycodes: 'ca'
      });

    return fetch(url).then(r => r.json());
  }

  // ------------------------------
  // Affichage suggestions
  // ------------------------------
  function showSuggestions(items) {
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'block';

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'suggestion';
      div.textContent = item.label;
      div.onclick = item.action;
      suggestionsBox.appendChild(div);
    });
  }

  function clearSuggestions() {
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';
  }

  // ------------------------------
  // Zoom précis sur entité
  // ------------------------------
  function zoomToFeature(feature) {
    highlightLayer.getSource().clear();
    highlightLayer.getSource().addFeature(feature);

    map.getView().fit(feature.getGeometry(), {
      padding: [60, 60, 60, 60],
      maxZoom: 18,
      duration: 700
    });
  }

  // ------------------------------
  // Input en temps réel
  // ------------------------------
  let timeout;
  input.addEventListener('input', function () {
    const query = this.value.trim();
    clearTimeout(timeout);

    if (query.length < 3) {
      clearSuggestions();
      return;
    }

    timeout = setTimeout(async () => {
      const suggestions = [];

      // Cadastre
      const cadastreResults = searchCadastreSuggestions(query);
      cadastreResults.forEach(f => {
        suggestions.push({
          label: `Lot ${f.get('NoLot')} — ${f.get('Info info lot — A_Matricule')}`,
          action: () => {
            zoomToFeature(f);
            clearSuggestions();
          }
        });
      });

      // OSM
      const osmResults = await searchOSMSuggestions(query);
      osmResults.forEach(r => {
        suggestions.push({
          label: r.display_name,
          action: () => {
            map.getView().animate({
              center: ol.proj.fromLonLat([+r.lon, +r.lat]),
              zoom: 16,
              duration: 700
            });
            clearSuggestions();
          }
        });
      });

      if (suggestions.length) showSuggestions(suggestions);
      else clearSuggestions();

    }, 300);
  });

  // ------------------------------
  // Clic hors boîte
  // ------------------------------
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-box')) clearSuggestions();
  });

});

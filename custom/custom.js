window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  const input = document.getElementById('search-input');
  const btn = document.getElementById('search-btn');
  const suggestionsBox = document.getElementById('search-suggestions');

  // -------------------------------------------------
  // Couche de surbrillance
  // -------------------------------------------------
  const highlightLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: 'red', width: 3 }),
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

      const props = feats[0].getProperties();
      if (
        props['NoLot'] !== undefined &&
        props['Info info lot — A_Matricule'] !== undefined
      ) {
        found = layer;
      }
    });

    return found;
  }

  // -------------------------------------------------
  // Suggestions cadastre
  // -------------------------------------------------
  function cadastreSuggestions(query) {
    const layer = getCadastreLayer();
    if (!layer) return [];

    const q = query.toLowerCase();
    return layer.getSource().getFeatures()
      .filter(f => {
        return (
          (f.get('NoLot') || '').toLowerCase().includes(q) ||
          (f.get('Info info lot — A_Matricule') || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 5);
  }

  // -------------------------------------------------
  // Suggestions OSM
  // -------------------------------------------------
  function osmSuggestions(query) {
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q: query + ', Boischatel, Québec, Canada',
        format: 'json',
        limit: 5,
        countrycodes: 'ca'
      });

    return fetch(url).then(r => r.json());
  }

  // -------------------------------------------------
  // Affichage suggestions (ADAPTÉ AU CSS)
  // -------------------------------------------------
  function showSuggestions(items) {
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'block';

    items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'search-item';
      div.textContent = item.label;
      div.onclick = item.action;
      suggestionsBox.appendChild(div);
    });
  }

  function clearSuggestions() {
    suggestionsBox.innerHTML = '';
    suggestionsBox.style.display = 'none';
  }

  // -------------------------------------------------
  // Zoom précis
  // -------------------------------------------------
  function zoomFeature(feature) {
    highlightLayer.getSource().clear();
    highlightLayer.getSource().addFeature(feature);

    map.getView().fit(feature.getGeometry(), {
      padding: [60, 60, 60, 60],
      maxZoom: 18,
      duration: 700
    });
  }

  // -------------------------------------------------
  // Recherche principale (clic bouton ou Enter)
  // -------------------------------------------------
  function runSearch() {
    const query = input.value.trim();
    if (!query) return;

    clearSuggestions();

    const cadastre = cadastreSuggestions(query);
    if (cadastre.length) {
      zoomFeature(cadastre[0]);
      return;
    }

    osmSuggestions(query).then(results => {
      if (!results.length) return;

      map.getView().animate({
        center: ol.proj.fromLonLat([+results[0].lon, +results[0].lat]),
        zoom: 16,
        duration: 700
      });
    });
  }

  // -------------------------------------------------
  // Suggestions temps réel
  // -------------------------------------------------
  let timer;
  input.addEventListener('input', function () {
    const query = this.value.trim();
    clearTimeout(timer);

    if (query.length < 3) {
      clearSuggestions();
      return;
    }

    timer = setTimeout(async () => {
      const items = [];

      cadastreSuggestions(query).forEach(f => {
        items.push({
          label: `Lot ${f.get('NoLot')} — ${f.get('Info info lot — A_Matricule')}`,
          action: () => {
            zoomFeature(f);
            clearSuggestions();
          }
        });
      });

      const osm = await osmSuggestions(query);
      osm.forEach(r => {
        items.push({
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

      items.length ? showSuggestions(items) : clearSuggestions();
    }, 300);
  });

  // -------------------------------------------------
  // Events UI
  // -------------------------------------------------
  btn.addEventListener('click', runSearch);

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') runSearch();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#search-container')) clearSuggestions();
  });

});

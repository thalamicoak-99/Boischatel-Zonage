window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  // -------------------------------------------------
  // Couche de surbrillance
  // -------------------------------------------------
  const highlightLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(255,0,0,0.9)',
        width: 3
      }),
      fill: new ol.style.Fill({
        color: 'rgba(255,0,0,0.25)'
      })
    })
  });
  map.addLayer(highlightLayer);

  // -------------------------------------------------
  // Recherche OSM (TOUJOURS DISPONIBLE)
  // -------------------------------------------------
  function searchOSM(query) {
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q: query + ', Boischatel, Québec, Canada',
        format: 'json',
        limit: 5,
        countrycodes: 'ca'
      });

    fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(r => r.json())
    .then(results => {
      if (!results.length) {
        alert('Aucun résultat trouvé');
        return;
      }

      const lon = parseFloat(results[0].lon);
      const lat = parseFloat(results[0].lat);

      map.getView().animate({
        center: ol.proj.fromLonLat([lon, lat]),
        zoom: 16,
        duration: 700
      });
    })
    .catch(err => {
      console.error('Erreur Nominatim', err);
    });
  }

  // -------------------------------------------------
  // Recherche cadastrale (SAFE)
  // -------------------------------------------------
  function searchCadastre(query) {

    let cadastreLayer = null;

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
        cadastreLayer = layer;
      }
    });

    if (!cadastreLayer) return null;

    const features = cadastreLayer.getSource().getFeatures();

    const results = features.filter(f => {
      const lot = (f.get('NoLot') || '').toString();
      const mat = (f.get('Info info lot — A_Matricule') || '').toString();

      return (
        lot.toLowerCase().includes(query.toLowerCase()) ||
        mat.toLowerCase().includes(query.toLowerCase())
      );
    });

    return results.length ? results[0] : null;
  }

  // -------------------------------------------------
  // Fonction principale
  // -------------------------------------------------
  function search() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    highlightLayer.getSource().clear();

    // 1️⃣ Essai cadastral (non bloquant)
    const feature = searchCadastre(query);

    if (feature) {
      map.getView().fit(feature.getGeometry(), {
        maxZoom: 18,
        duration: 700
      });

      highlightLayer.getSource().addFeature(feature);
      return;
    }

    // 2️⃣ Sinon → adresse
    searchOSM(query);
  }

  // -------------------------------------------------
  // Events
  // -------------------------------------------------
  document.getElementById('search-btn').addEventListener('click', search);
  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') search();
  });

});

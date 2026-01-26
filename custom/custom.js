// Sécuritaire : attendre que la carte existe
window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  // -------------------------------------------------
  // 1) Récupérer la couche cadastre (par champ)
  // -------------------------------------------------
  let cadastreLayer = null;

  map.getLayers().forEach(layer => {
    if (!layer.getSource) return;

    const src = layer.getSource();
    if (!src || !src.getFeatures) return;

    const feats = src.getFeatures();
    if (!feats.length) return;

    // On vérifie si la couche contient le champ A_Matricule
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
  // 2) Couche de surbrillance
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
  // 3) Recherche dans la couche cadastre
  // -------------------------------------------------
  function searchCadastre(query) {
    const source = cadastreLayer.getSource();
    const features = source.getFeatures();

    const results = features.filter(f => {
      const matricule = (f.get('Info info lot — A_Matricule') || '').toString();
      const nolot = (f.get('NoLot') || '').toString();

      return matricule.toLowerCase().includes(query.toLowerCase()) ||
             nolot.toLowerCase().includes(query.toLowerCase());
    });

    return results;
  }

  // -------------------------------------------------
  // 4) Surbrillance
  // -------------------------------------------------
  function highlightFeature(feature) {
    highlightLayer.getSource().clear();
    highlightLayer.getSource().addFeature(feature);
  }

  // -------------------------------------------------
  // 5) Recherche OSM (Nominatim)
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

    return fetch(url).then(r => r.json());
  }

  // -------------------------------------------------
  // 6) Événements de recherche
  // -------------------------------------------------
  document.getElementById('search-btn').addEventListener('click', search);
  document.getElementById('search-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') search();
  });

  // -------------------------------------------------
  // 7) Fonction principale
  // -------------------------------------------------
  function search() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    // 1) Recherche dans le cadastre
    const cadastreResults = searchCadastre(query);

    if (cadastreResults.length) {
      const f = cadastreResults[0];
      const geom = f.getGeometry();

      // Zoom sur le lot
      map.getView().fit(geom, { maxZoom: 18, duration: 700 });

      // Surbrillance
      highlightFeature(f);

      return; // PRIORITÉ à la couche cadastre
    }

    // 2) Sinon, recherche OSM
    searchOSM(query).then(results => {
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
    });
  }

});

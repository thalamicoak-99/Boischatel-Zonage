// Sécuritaire : attendre que la carte existe
window.addEventListener('load', function () {

  // Récupérer la carte créée par qgis2web
  var map = window.map || window.map_1 || window.map_2;

  if (!map) {
    console.error("Carte OpenLayers introuvable");
    return;
  }

  // Création du geocoder OSM (Nominatim)
  var geocoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'fr',
    placeholder: 'Rechercher une adresse à Boischatel',
    limit: 5,
    debug: false,
    countrycodes: 'ca',           // 🇨🇦 Canada seulement
    autoComplete: true,
    keepOpen: false
  });

  // Ajouter la barre de recherche à la carte
  map.addControl(geocoder);

});

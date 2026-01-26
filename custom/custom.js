// Sécuritaire : attendre que la carte existe
window.addEventListener('load', function () {

  const map = window.map || window.map_1 || window.map_2;
  if (!map) return;

  document.getElementById('search-btn').addEventListener('click', search);
  document.getElementById('search-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') search();
  });

  function search() {
    const query = document.getElementById('search-input').value;
    if (!query) return;

    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q: query + ', Boischatel, Québec, Canada',
        format: 'json',
        limit: 5,
        countrycodes: 'ca'
      });

    fetch(url)
      .then(r => r.json())
      .then(results => {
        if (!results.length) return;

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

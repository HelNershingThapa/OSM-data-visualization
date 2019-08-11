const map = L.map('map').setView([27.7172, 85.3240], 12);
let resultLayer = null

const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(map);

function buildOverpassApiUrl(map, overpassQuery, place) {
  let baseUrl = "http://overpass-api.de/api/interpreter";
  let customBounds = {
    kathmandu: "3604583247",
    chitwan: "3604589410"
  };
  let defaultQuery = `?data=[out:json][timeout:25];node[${overpassQuery}](${map
    .getBounds()
    .getSouth()},${map
    .getBounds()
    .getWest()},${map
    .getBounds()
    .getNorth()},${map.getBounds().getEast()});out;`;
  if (place === "default") return `${baseUrl}${defaultQuery}`;

  let searchAreaQuery = `area(${customBounds[place]})->.searchArea;`;
  let nodeQuery = `node[${overpassQuery}](area.searchArea);`;
  let wayQuery = `way[${overpassQuery}](area.searchArea);`;
  let relationQuery = `relation[${overpassQuery}](area.searchArea);`;
  let query = `?data=[out:json][timeout:25];${searchAreaQuery}(${nodeQuery}${wayQuery}${relationQuery});out body geom;`;
  let resultUrl = baseUrl + query;
  return resultUrl;
}
function submitQuery(){
  if (resultLayer) map.removeLayer(resultLayer)

 
  const inputValue = document.getElementById('amenity').value
  async function getMapResource() {
    let overpassApiUrl = buildOverpassApiUrl(map, `amenity=${inputValue}`, "default");
    const response = await fetch(overpassApiUrl);
    const data = await response.json();
  
    let geoData = osmtogeojson(data);
  // TODO: remove layer on each query
    resultLayer = L.geoJson(geoData, {
      style: feature => {
        return { color: "#330099" };
      },
      filter: (feature, layer) => {
        let isPolygon =
          feature.geometry &&
          feature.geometry.type &&
          feature.geometry.type === "Polygon";
        if (isPolygon) {
          feature.geometry.type = "Point";
          let polygonCenter = L.latLngBounds(
            feature.geometry.coordinates[0]
          ).getCenter();
          feature.geometry.coordinates = [polygonCenter.lat, polygonCenter.lng];
        }
        return true;
      },
      onEachFeature: (feature, layer) => {
        let popupContent = "";
        let keys = Object.keys(feature.properties.tags);
        keys.forEach(function(key) {
          popupContent = `${popupContent}<dt>${_.capitalize(
            key
          )}:</dt><dd>${_.capitalize(feature.properties.tags[key])}</dd>`;
        });
        popupContent = popupContent + "</dl>";
        layer.bindPopup(popupContent);
      }
    }).addTo(map);
  }
  getMapResource();
}

// setInterval(getMapResource, 1000);

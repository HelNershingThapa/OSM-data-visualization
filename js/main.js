const map = L.map("map").setView([27.7172, 85.324], 12);
let resultLayer = null;
let queryFlag = false;
let defaultBox = 'ViewPort'

const place = document.getElementById("place")
const amenity = document.getElementById("amenity")
const count = document.getElementById('countbox')

const attribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tiles = L.tileLayer(tileUrl, { attribution });
tiles.addTo(map);

function buildOverpassApiUrl(map, overpassQuery, place) {
  let baseUrl = "http://overpass-api.de/api/interpreter";
  let customBounds = {
    kathmandu: "3604583247",
    chitwan: "3604589410",
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

async function handleLocationToggle() {
  if (!queryFlag) {
    amenity.disabled = false
  }
  const location = { 
    kathmandu : {
      lat: 27.7172,
      lon: 85.3240
    },
    chitwan : {
      lat: 27.6989, 
      lon: 84.4304
    },
  };
  if (place.value !== defaultBox) await map.panTo(new L.LatLng(location[place.value.toLowerCase()].lat, location[place.value.toLowerCase()].lon));
  if (queryFlag) {
    amenity.disabled = false
    submitQuery();
  }
}

function setCount(counter) {
  count.innerText = `Number of ${amenity.value.toLowerCase()}s in ${place.value}: ${counter}`;
}

function submitQuery() {
  queryFlag = true
  amenity.disabled = true
  place.disabled = true
  if (resultLayer) map.removeLayer(resultLayer);
  document.getElementsByClassName('loading')[0].style.display = 'block';
  
  async function getMapResource() {    
    let overpassApiUrl = buildOverpassApiUrl(
      map,
      `amenity=${amenity.value.toLowerCase()}`,
      (place.value === defaultBox) ? 'default' : `${place.value.toLowerCase()}`
    );

    const response = await fetch(overpassApiUrl);
    const data = await response.json();
    let geoData = osmtogeojson(data);
    
    document.getElementsByClassName('loading')[0].style.display = 'none'
    place.disabled = false
    amenity.disabled = false

    let counter = 0;
    resultLayer = L.geoJson(geoData, {
      filter: (feature, _layer) => {
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
        counter++;         
        let popupContent = "";
        let keys = Object.keys(feature.properties.tags);
        keys.forEach(function(key) {
          popupContent = `${popupContent}<dt>${_.capitalize(key)}:</dt><dd>${_.capitalize(feature.properties.tags[key])}</dd>`;
        });
        popupContent = popupContent + "</dl>";
        layer.bindPopup(popupContent);
      }
    }    
    ).addTo(map);  
    setCount(counter);  
  }  
  getMapResource();  
  
}
// setInterval(getMapResource, 1000);

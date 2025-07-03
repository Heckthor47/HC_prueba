// =========================
// VARIABLES GLOBALES
// =========================
let marker = null;
let geojsonMunicipios = null;
let estadosGeoJson = null;
let bboxNacional = null;

window.map = new maplibregl.Map({
  container: 'map',
  style: 'https://www.datosgeoespaciales.atdt.gob.mx/api/style_white.json',
  center: [-99.1332, 19.4326],
  zoom: 5
});

window.currentPopup = null;

// =========================
// INICIALIZACIÓN AL CARGAR DOM
// =========================
document.addEventListener('DOMContentLoaded', function () {
  const esperarMapa = setInterval(() => {
    if (window.map && typeof window.map.on === 'function' && window.map.isStyleLoaded()) {
      clearInterval(esperarMapa);
      initializeLayerControls();
      const resetBtn = document.querySelector('boton-reset-mapa');
      if (resetBtn) {
        const resetButton = resetBtn.querySelector('#reset-button');
        resetButton.addEventListener('click', () => {
          resetBtn.resetMapView(resetButton);
        });
      }
    }
  }, 100);
});

// =========================
// CONFIGURACIÓN DEL MAPA Y CAPAS
// =========================
map.on("load", () => {
  // 1) Carga de entidades GeoJSON
  fetch("https://fabulous-dodol-d03b96.netlify.app/entidades.geojson")
    .then(r => r.json())
    .then(data => {
      estadosGeoJson = data;
      bboxNacional = turf.bbox(estadosGeoJson);
      configurarSelectorEstado();
    })
    .catch(err => console.error("Error al cargar entidades:", err));

  // 2) Capas de homicidios
  map.addSource("homicidios", {
    type: "geojson",
    data: "https://fabulous-dodol-d03b96.netlify.app/homicidios.geojson"
  });
  map.addLayer({
    id: "homicidios-layer",
    type: "circle",
    source: "homicidios",
    paint: {
      "circle-radius": 3,
      "circle-color": "#F9EFA5",
      "circle-opacity": 0.8,
      "circle-stroke-color": "black",
      "circle-stroke-width": 1
    },
    filter: ["==", "CVE_ENT", ""]
  });
  map.setLayoutProperty("homicidios-layer", "visibility", "none");

  // 3) Capas de parques
  map.addSource("parques", {
    type: "geojson",
    data: "https://fabulous-dodol-d03b96.netlify.app/parques.geojson"
  });

  map.loadImage('imagenes/tree-fill.png', (error, image) => {
    if (error) return console.error("Error al cargar imagen de parques", error);
    if (!map.hasImage('icono-parque')) map.addImage('icono-parque', image);
    map.addLayer({
      id: 'parques-layer',
      type: 'symbol',
      source: 'parques',
      layout: { 'icon-image': 'icono-parque', 'icon-size': 0.1 },
      filter: ['==', 'CVE_ENT', '']
    });
    map.setLayoutProperty('parques-layer', 'visibility', 'none');
    const toggleParques = document.getElementById('toggle-parques');
    if (toggleParques) toggleParques.checked = false;
  });

  // 4) Capas de escuelas
  map.addSource("escuelas", {
    type: "geojson",
    data: "https://fabulous-dodol-d03b96.netlify.app/escuelas.geojson"
  });

  map.loadImage('imagenes/school1.png', (error, image) => {
    if (error) return console.error("Error al cargar imagen de escuelas", error);
    if (!map.hasImage('icono-escuela')) map.addImage('icono-escuela', image);
    map.addLayer({
      id: 'escuelas-layer',
      type: 'symbol',
      source: 'escuelas',
      layout: {
        'icon-image': 'icono-escuela',
        'icon-size': 0.1,
        'icon-allow-overlap': true
      },
      filter: ['==', 'CVE_ENT', '']
    });
    map.setLayoutProperty('escuelas-layer', 'visibility', 'none');
    const toggleEscuelas = document.getElementById('toggle-escuelas');
    if (toggleEscuelas) toggleEscuelas.checked = false;
  });

  // 5) Municipios
  fetch("https://fabulous-dodol-d03b96.netlify.app/municip_poblacion.geojson")
    .then(r => r.json())
    .then(data => {
      geojsonMunicipios = data;

      // Agregar la fuente de municipios al mapa
      map.addSource("municipios-source", {
        type: "geojson",
        data: geojsonMunicipios
      });

      // Agregar capas relacionadas con municipios
      map.addLayer({
        id: "municipio-fill",
        type: "fill",
        source: "municipios-source",
        paint: {
          "fill-color": "#FA0",
          "fill-opacity": 0.0
        },
        layout: {
          visibility: "none"
        }
      });

      map.addLayer({
        id: "municipio-outline",
        type: "line",
        source: "municipios-source",
        paint: {
          "line-color": "#B9BBC4",
          "line-width": 2
        },
        layout: {
          visibility: "none"
        }
      });

      // ✅ Aquí generamos la lista de estados ya con geojsonMunicipios cargado
      const estadosMap = new Map();

      geojsonMunicipios.features.forEach(f => {
        const cveEnt = f.properties.CVEGEO.slice(0, 2);
        const estadoInfo = diccionarioEstados[cveEnt];
        if (!estadoInfo) return;

        if (!estadosMap.has(estadoInfo.value)) {
          estadosMap.set(estadoInfo.value, {
            value: estadoInfo.value,
            label: estadoInfo.label,
            municipios: []
          });
        }

        estadosMap.get(estadoInfo.value).municipios.push({
          value: f.properties.CVEGEO,
          label: f.properties.NOMGEO
        });
      });

      const estados = Array.from(estadosMap.values());
      const filtro = document.querySelector('dropdown-filtros-ubicacion');
      if (filtro) filtro.setEstados(estados);
    })
    .catch(err => console.error("Error al cargar municipios para el filtro:", err));

  // 6) Calles
  map.addSource("calles", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    buffer: 512,
    tolerance: 0.05
  });

  map.addLayer({
    id: "calles-layer",
    type: "line",
    source: "calles",
    layout: { visibility: "none" },
    paint: {
      "line-color": ["get", "colores"],
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        1, 0.2,
        7, 0.4,
        15, 1
      ]
    }
  });
});

// =========================
// FUNCIONES AUXILIARES
// =========================
function initializeLayerControls() {
  const capas = [
    { id: 'toggle-homicidios', layer: 'homicidios-layer' },
    { id: 'toggle-parques', layer: 'parques-layer' },
    { id: 'toggle-escuelas', layer: 'escuelas-layer' },
    { id: 'toggle-calles', layer: 'calles-layer' }
  ];
  capas.forEach(capa => {
    const checkbox = document.getElementById(capa.id);
    if (checkbox) {
      checkbox.addEventListener('change', function () {
        map.setLayoutProperty(capa.layer, 'visibility', this.checked ? 'visible' : 'none');
      });
    }
  });
}

// Asignar la función al objeto global window
window.initializeLayerControls = initializeLayerControls;

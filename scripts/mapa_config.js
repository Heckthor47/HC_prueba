import { aplicarFiltros } from './capas.js';

// =========================
// VARIABLES GLOBALES
// =========================
let marker = null;
export let municipiosGeoJson = null;
export let estadosGeoJson = null;
export const cargarCallesPorEstado = (codigoEntidad) => {
  const source = window.map.getSource("calles");
  if (!source) {
    console.error("La fuente 'calles' no está disponible en el mapa.");
    return;
  }

  const rutaCalles = `https://fabulous-dodol-d03b96.netlify.app/calles${codigoEntidad}.geojson`;
  source.setData(rutaCalles);
  console.log(`Calles cargadas para el estado ${codigoEntidad}: ${rutaCalles}`);
};
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
if (typeof window !== "undefined") {
  // @ts-ignore
  window.map = window.map;
}

document.addEventListener('DOMContentLoaded', function () {
  const esperarMapa = setInterval(() => {
    if (window.map && typeof window.map.on === 'function' && window.map.isStyleLoaded()) {
      clearInterval(esperarMapa);

      // Inicializar capas y fuentes aquí
      console.log("El mapa está listo para modificar capas y fuentes.");

      Promise.all([
        fetch("https://fabulous-dodol-d03b96.netlify.app/entidades.geojson")
          .then(r => r.json())
          .then(data => {
            estadosGeoJson = data;
            bboxNacional = turf.bbox(estadosGeoJson);
            console.log("Datos de entidades cargados:", estadosGeoJson);
          })
          .catch(err => console.error("Error al cargar entidades:", err)),

        fetch("https://fabulous-dodol-d03b96.netlify.app/municip_poblacion.geojson")
          .then(r => r.json())
          .then(data => {
            municipiosGeoJson = data;
            bboxNacional = turf.bbox(municipiosGeoJson);
            console.log("Datos de municipios cargados:", municipiosGeoJson);
            
            // Agregar la fuente de municipios al mapa
            window.map.addSource("municipios-source", {
              type: "geojson",
              data: municipiosGeoJson
            });

            // Agregar capas relacionadas con municipios
            window.map.addLayer({
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

            window.map.addLayer({
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
            
            // Disparar evento personalizado
            document.dispatchEvent(new Event("municipios-cargados"));
            console.log("Datos cargados correctamente.");
          })
          .catch(err => console.error("Error al cargar municipios:", err))
      ]).then(() => {
        // Configurar eventos de capas
        const cardCapas = document.querySelector('card-capas');
        if (cardCapas) {
          cardCapas.addEventListener('layer-toggle', (e) => {
            const { layer, checked } = e.detail;
            if (window.map.getLayer(layer)) {
              window.map.setLayoutProperty(layer, 'visibility', checked ? 'visible' : 'none');
            }
          });
        }

        // Configurar botón de reset
        const resetBtn = document.querySelector('boton-reset-mapa');
        if (resetBtn) {
          const resetButton = resetBtn.querySelector('#reset-button');
          resetButton.addEventListener('click', () => {
            resetBtn.resetMapView(resetButton);
          });
        }
      });
    }
  }, 100);
});

// =========================
// CONFIGURACIÓN DEL MAPA Y CAPAS
// =========================
window.map.on("load", () => {
  configurarCapas().then(() => {
    const cardCapas = document.querySelector('card-capas');
    if (cardCapas) {
      setTimeout(() => {
        cardCapas.sincronizarCheckboxes();
        activarVistaNacional(); // O activarVistaLocal según el caso
      }, 100); // Esperar un poco para asegurar que las capas estén listas
    }
  });
});

// =========================
// FUNCIONES AUXILIARES
// =========================

// Configuración para vista nacional
function activarVistaNacional() {
  const cardCapas = document.querySelector('card-capas');
  if (cardCapas && typeof cardCapas.sincronizarCheckboxes === 'function') {
    cardCapas.toggleLayerControls(false); // Deshabilitar controles
    cardCapas.sincronizarCheckboxes(); // Sincronizar checkboxes
  }

  // Ajustar vista a nivel nacional
  if (window.bboxNacional) {
    window.map.fitBounds(window.bboxNacional, { padding: 20, duration: 1000 });
  }
}

// Configuración para vista estado/municipio
export function activarVistaLocal(codigoEntidad, nivel) {
  const cardCapas = document.querySelector('card-capas');
  if (cardCapas) {
    cardCapas.toggleLayerControls(true, nivel === 'municipio'); // Habilitar controles y prender "Calles" si es municipio
  }

  const capas = ["homicidios-layer", "parques-layer", "escuelas-layer", "calles-layer"];
  if (nivel === 'estado') {
    aplicarFiltros(capas, codigoEntidad, "CVE_ENT");
  } else if (nivel === 'municipio') {
    aplicarFiltros(capas, codigoEntidad, "CVEGEO");
  } else {
    console.error(`Nivel inválido: ${nivel}`);
    return;
  }

  // Sincronizar los checkboxes después de aplicar filtros
  if (cardCapas) {
    cardCapas.sincronizarCheckboxes();
  }
}

// Configuración de capas
function configurarCapas() {
  return new Promise((resolve) => {
    // Homicidios
    window.map.addSource("homicidios", {
      type: "geojson",
      data: "https://fabulous-dodol-d03b96.netlify.app/homicidios.geojson"
    });
    window.map.addLayer({
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
    window.map.setLayoutProperty("homicidios-layer", "visibility", "none");

    // Parques
    window.map.addSource("parques", {
      type: "geojson",
      data: "https://fabulous-dodol-d03b96.netlify.app/parques.geojson"
    });
    window.map.loadImage('imagenes/tree-fill.png', (error, image) => {
      if (error) return console.error("Error al cargar imagen de parques", error);
      if (!window.map.hasImage('icono-parque')) window.map.addImage('icono-parque', image);
      window.map.addLayer({
        id: 'parques-layer',
        type: 'symbol',
        source: 'parques',
        layout: { 'icon-image': 'icono-parque', 'icon-size': 0.1 },
        filter: ['==', 'CVE_ENT', '']
      });
      window.map.setLayoutProperty('parques-layer', 'visibility', 'none');
    });

    // Escuelas
    window.map.addSource("escuelas", {
      type: "geojson",
      data: "https://fabulous-dodol-d03b96.netlify.app/escuelas.geojson"
    });
    window.map.loadImage('imagenes/school1.png', (error, image) => {
      if (error) return console.error("Error al cargar imagen de escuelas", error);
      if (!window.map.hasImage('icono-escuela')) window.map.addImage('icono-escuela', image);
      window.map.addLayer({
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
      window.map.setLayoutProperty('escuelas-layer', 'visibility', 'none');
    });

    // Crear la fuente de calles inicialmente vacía
    window.map.addSource("calles", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }, 
      buffer: 512,
      tolerance: 0.1
    });

    window.map.addLayer({
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

    resolve({ cargarCallesPorEstado });
  });
}

import { aplicarFiltros } from './capas.js';
import { municipiosGeoJson } from './mapa_config.js';

// Punto de entrada
document.addEventListener("DOMContentLoaded", () => {
  configurarSelectorEstado();

  // Espera a que los custom elements hayan renderizado su contenido
  setTimeout(() => {
    const capas = [
      { id: "toggle-calles", layer: "calles-layer" },
      { id: "toggle-parques", layer: "parques-layer" },
      { id: "toggle-homicidios", layer: "homicidios-layer" },
      { id: "toggle-escuelas", layer: "escuelas-layer" }
    ];
    capas.forEach(({ id, layer }) => {
      const checkbox = document.getElementById(id);
      if (checkbox) {
        checkbox.addEventListener("change", (e) => {
          const visibility = e.target.checked ? "visible" : "none";
          if (map.getLayer(layer)) {
            map.setLayoutProperty(layer, "visibility", visibility);
          }
        });
      }
    });
  }, 0); 

document.addEventListener('estado-change', (e) => {
  const codigoEntidad = e.detail.value.replace('calles', '');
  console.log(`Estado cambiado: ${codigoEntidad}`);
  
  // Usar la función genérica para aplicar filtros al estado
  const capas = ["calles-layer", "parques-layer", "homicidios-layer", "escuelas-layer"];
  aplicarFiltros(capas, codigoEntidad, "CVE_ENT");
});

document.addEventListener('municipio-change', (e) => {
  const cvegeo = e.detail.value;
  console.log(`Municipio cambiado: ${cvegeo}`);
  
  // Usar la función genérica para aplicar filtros al municipio
  const capas = ["calles-layer", "parques-layer", "homicidios-layer", "escuelas-layer"];
  aplicarFiltros(capas, cvegeo, "CVEGEO");
});

document.addEventListener("municipios-cargados", () => {
  console.log("Municipios cargados en main.js:", municipiosGeoJson);
});
  const filtro = document.querySelector('dropdown-filtros-ubicacion');
  if (!filtro) {
    console.error("El elemento <dropdown-filtros-ubicacion> no está presente en el DOM.");
    return;
  }

  filtro.addEventListener('municipio-change', (e) => {
    const cvegeo = e.detail.value;
    const feature = municipiosGeoJson.features.find(f => f.properties.CVEGEO === cvegeo);
    if (feature) {
      const bounds = turf.bbox(feature);
      window.map.fitBounds(bounds, { padding: 20 });
    }
  });
});


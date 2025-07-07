import { estadosGeoJson, municipiosGeoJson } from './mapa_config.js';
import { aplicarFiltros } from './capas.js'; 
import { activarVistaLocal } from './mapa_config.js';
import { cargarCallesPorEstado } from './mapa_config.js';

// --- eventos_selector.js ---
// Función para manejar el cambio de estado y municipio
function configurarSelectorEstado() {
  const filtro = document.querySelector('dropdown-filtros-ubicacion');
  if (!filtro) {
    console.error("El elemento <dropdown-filtros-ubicacion> no está presente en el DOM.");
    return;
  }

  const selectorEstado = filtro.querySelector('#select-estado');
  const selectorMunicipio = filtro.querySelector('#select-municipio');

  if (!selectorEstado || !selectorMunicipio) {
    console.error("No se encontraron los selectores #select-estado o #select-municipio.");
    return;
  }

  // =========================
  // Cambio de estado
  // =========================
  selectorEstado.addEventListener("change", () => {
    const seleccion = selectorEstado.value;

    // Limpieza si no hay selección
    if (!seleccion) {
      limpiarEstado();
      return;
    }

    // Localizar la geometría del estado
    const codigoEntidad = seleccion.replace("calles", "");
    const feature = estadosGeoJson.features.find(f => f.properties.CVE_ENT == codigoEntidad);
    if (!feature) {
      console.error("Estado no encontrado:", codigoEntidad);
      return;
    }

    // Dibujar polígono del estado
    dibujarEstado(feature);

    if (!municipiosGeoJson) {
      console.error("municipiosGeoJson no está cargado.");
      return;
    }

    // Filtrar municipios
    const cve_ent = codigoEntidad.padStart(2, '0'); // Formato de 2 dígitos
    const municipiosDelEstado = {
      type: "FeatureCollection",
      features: municipiosGeoJson.features.filter(f => f.properties.CVE_ENT === cve_ent)
    };

    if (window.map.getSource("municipios-source")) {
      window.map.getSource("municipios-source").setData(municipiosDelEstado);
      window.map.setLayoutProperty("municipio-fill", "visibility", "visible");
      window.map.setLayoutProperty("municipio-outline", "visibility", "visible");
    } else {
      console.error("La fuente 'municipios-source' no está disponible.");
    }

    // Ajustar vista al estado completo
    const bboxEstado = turf.bbox(feature);
    window.map.fitBounds(bboxEstado, { padding: 20, duration: 1000 });

    // Aplicar filtros y visibilidad de capas
    aplicarFiltrosEstado(codigoEntidad);

    // Habilitar controles de capas al seleccionar estado
    const cardCapas = document.querySelector('card-capas');
    if (cardCapas) {
      cardCapas.toggleLayerControls(true, true); // Habilitar controles y auto-activar calles
      console.log("Controles de capas habilitados para vista estatal");
    }

    // Recargar datos de calles
    recargarCalles(seleccion);
  });

  // =========================
  // Cambio de municipio
  // =========================
  selectorMunicipio.addEventListener("change", () => {
    const cvegeo = selectorMunicipio.value;

    // Si se deselecciona municipio → volver al estado
    if (!cvegeo) {
      const seleccion = selectorEstado.value;
      if (!seleccion) return;

      const codigoEntidad = seleccion.replace("calles", "");
      const feature = estadosGeoJson.features.find(f => f.properties.CVE_ENT == codigoEntidad);
      if (feature) {
        dibujarEstado(feature);
        const bboxEstado = turf.bbox(feature);
        window.map.fitBounds(bboxEstado, { padding: 20, duration: 1000 });
      }

      // Filtrar solo municipios del estado
      const municipiosDelEstado = {
        type: "FeatureCollection",
        features: municipiosGeoJson.features.filter(f => f.properties.CVE_ENT === codigoEntidad)
      };

      // Restaurar municipios del estado
      if (window.map.getSource("municipios-source")) {
        window.map.getSource("municipios-source").setData(municipiosDelEstado);
      }

      // Mostrar capa de municipios
      if (window.map.getLayer("municipio-fill")) {
        window.map.setLayoutProperty("municipio-fill", "visibility", "visible");
      }
      if (window.map.getLayer("municipio-outline")) {
        window.map.setLayoutProperty("municipio-outline", "visibility", "visible");
      }

      // Aplicar filtros estatales al volver del municipio
      aplicarFiltrosEstado(codigoEntidad);

      return;
    }

    // Seleccionó un municipio → solo hacer zoom, sin cambiar filtros
    const feature = municipiosGeoJson.features.find(f => f.properties.CVEGEO === cvegeo);
    if (!feature) {
      console.warn("Municipio no encontrado:", cvegeo);
      return;
    }

    dibujarMunicipio(feature);

    const bboxMunicipio = turf.bbox(feature);
    window.map.fitBounds(bboxMunicipio, { padding: 20, duration: 1000 });

    // Aplicar filtros por municipio para que las capas se muestren correctamente
    aplicarFiltrosMunicipio(cvegeo);

    // Habilitar controles de capas al seleccionar municipio
    const cardCapas = document.querySelector('card-capas');
    if (cardCapas) {
      cardCapas.toggleLayerControls(true, true); // Habilitar controles y auto-activar calles
      console.log("Controles de capas habilitados para vista municipal");
    }
  });
}

// =========================
// Funciones Auxiliares
// =========================

// Limpieza de capas y vista al estado nacional
function limpiarEstado() {
  removerCapaEstado();
  ["homicidios-layer", "parques-layer", "escuelas-layer"].forEach(id => {
    window.map.setFilter(id, ["==", "CVE_ENT", ""]);
    window.map.setLayoutProperty(id, "visibility", "none");
  });
  window.map.getSource("calles").setData({ type: "FeatureCollection", features: [] });
  window.map.setLayoutProperty("calles-layer", "visibility", "none");
  
  // Ocultar municipios
  if (window.map.getLayer("municipio-fill")) {
    window.map.setLayoutProperty("municipio-fill", "visibility", "none");
  }
  if (window.map.getLayer("municipio-outline")) {
    window.map.setLayoutProperty("municipio-outline", "visibility", "none");
  }

  // Deshabilitar controles de capas en vista nacional
  const cardCapas = document.querySelector('card-capas');
  if (cardCapas) {
    cardCapas.toggleLayerControls(false);
    console.log("Controles de capas deshabilitados en vista nacional");
  }

  if (window.bboxNacional) window.map.fitBounds(window.bboxNacional, { padding: 20, duration: 1000 });
}

// Dibujar el polígono del estado
function dibujarEstado(feature) {
  removerCapaEstado();
  window.map.addSource("estado-source", { type: "geojson", data: feature });
  window.map.addLayer({
    id: "estado-fill",
    type: "fill",
    source: "estado-source",
    paint: { "fill-color": "#B0C4DE", "fill-opacity": 0.2 }
  });
  window.map.addLayer({
    id: "estado-outline",
    type: "line",
    source: "estado-source",
    paint: { "line-color": "#FFFFFF", "line-width": 2 }
  });
}

// Dibujar el polígono del municipio (SIN amarillo - usar la fuente existente)
function dibujarMunicipio(feature) {
  if (window.map.getSource("municipios-source")) {
    // Actualiza los datos de la fuente existente
    window.map.getSource("municipios-source").setData(feature);
  }

  // Muestra las capas existentes
  if (window.map.getLayer("municipio-fill")) {
    window.map.setLayoutProperty("municipio-fill", "visibility", "visible");
  }

  if (window.map.getLayer("municipio-outline")) {
    window.map.setLayoutProperty("municipio-outline", "visibility", "visible"); 
  }
}

// Aplicar filtros y visibilidad de capas por estado
function aplicarFiltrosEstado(codigoEntidad) {
  const layerToggleMapping = {
    "homicidios-layer": "toggle-homicidios",
    "parques-layer": "toggle-parques",
    "escuelas-layer": "toggle-escuelas"
  };
  Object.entries(layerToggleMapping).forEach(([layerId, toggleId]) => {
    window.map.setFilter(layerId, ["==", "CVE_ENT", codigoEntidad]);
    const isChecked = document.getElementById(toggleId).checked;
    window.map.setLayoutProperty(layerId, "visibility", isChecked ? "visible" : "none");
  });

  window.map.setFilter("calles-layer", ["==", "CVE_ENT", codigoEntidad]);
  window.map.setLayoutProperty("calles-layer", "visibility", "visible");

  // Activar el checkbox de calles
  const toggleCalles = document.getElementById("toggle-calles");
  if (toggleCalles && !toggleCalles.checked) {
    toggleCalles.checked = true;
  }
}

// Aplicar filtros por municipio (mantener capas estatales visibles)
function aplicarFiltrosMunicipio(cvegeo) {
  console.log(`Vista municipal - manteniendo capas estatales para CVEGEO: ${cvegeo}`);
  
  // Extraer código de estado del CVEGEO
  const cveEnt = cvegeo.substring(0, 2);  // Primeros 2 dígitos
  
  console.log(`Manteniendo filtros estatales para CVE_ENT: ${cveEnt}`);

  const layerToggleMapping = {
    "homicidios-layer": "toggle-homicidios",
    "parques-layer": "toggle-parques",
    "escuelas-layer": "toggle-escuelas"
  };

  // Para vista municipal: mantener filtros estatales, NO aplicar filtros municipales
  Object.entries(layerToggleMapping).forEach(([layerId, toggleId]) => {
    const toggle = document.getElementById(toggleId);

    if (window.map.getLayer(layerId)) {
      // Mantener filtro estatal (no cambiar el filtro existente)
      window.map.setFilter(layerId, ["==", "CVE_ENT", cveEnt]);
      
      // Aplicar visibilidad según el checkbox
      const visible = toggle?.checked ? "visible" : "none";
      window.map.setLayoutProperty(layerId, "visibility", visible);
      
      console.log(`Capa ${layerId} → filtro estatal mantenido: CVE_ENT=${cveEnt}, visibilidad: ${visible}`);
    }
  });

  // Para calles: mantener filtro estatal también
  if (window.map.getLayer("calles-layer")) {
    window.map.setFilter("calles-layer", ["==", "CVE_ENT", cveEnt]);
    const toggleCalles = document.getElementById("toggle-calles");
    if (toggleCalles) {
      const visible = toggleCalles.checked ? "visible" : "none";
      window.map.setLayoutProperty("calles-layer", "visibility", visible);
      console.log(`Capa calles-layer → filtro estatal mantenido: CVE_ENT=${cveEnt}, visibilidad: ${visible}`);
    }
  }
}

// Recargar datos de calles
function recargarCalles(seleccion) {
  const ruta = `https://fabulous-dodol-d03b96.netlify.app/${seleccion}.geojson`;
  fetch(ruta)
    .then(response => response.json())
    .then(data => {
      const others = data.features.filter(f => f.properties.colores !== '#CDCDCD');
      const cdcdFeatures = data.features.filter(f => f.properties.colores === '#CDCDCD');
      const sampled = cdcdFeatures.filter(() => Math.random() < 0.4);
      const finalFeatures = others.concat(sampled);

      const source = window.map.getSource("calles");
      if (!source) {
        console.error('La fuente "calles" no está disponible.');
        return;
      }

      source.setData({ type: "FeatureCollection", features: finalFeatures });
      const vis = document.getElementById("toggle-calles").checked ? "visible" : "none";
      window.map.setLayoutProperty("calles-layer", "visibility", vis);
    })
    .catch(err => console.error('Error cargando calles:', err));
}

// Remover capas del estado
function removerCapaEstado() {
  if (window.map.getLayer("estado-fill")) window.map.removeLayer("estado-fill");
  if (window.map.getLayer("estado-outline")) window.map.removeLayer("estado-outline");
  if (window.map.getSource("estado-source")) window.map.removeSource("estado-source");
}

// Popup fluido al mover el mouse sobre municipios
let popupMunicipio = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
  className: 'glass-effect' // Aplicar efecto de cristal
});

window.map.on("mousemove", "municipio-fill", (e) => {
  window.map.getCanvas().style.cursor = "pointer";

  const props = e.features[0].properties;
  const nombre = props.NOMGEO || "Municipio";
  const densidad = props.prom_densidad_pob
    ? Number(props.prom_densidad_pob).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "N/D";

  popupMunicipio
    .setLngLat(e.lngLat)
    .setHTML(`
      <div class="popup-header">
        <strong>${nombre}</strong>
      </div>
      <div class="popup-body">
        <div class="popup-label">Densidad poblacional</div>
        <div class="popup-value">${densidad} <span style="font-size: 12px; color: #718096;">hab/km²</span></div>
      </div>
    `)
    .addTo(window.map);
});

window.map.on("mouseleave", "municipio-fill", () => {
  window.map.getCanvas().style.cursor = "";
  popupMunicipio.remove();
});

document.addEventListener('estado-change', (e) => {
  const codigoEntidad = e.detail.value;

  if (!codigoEntidad) {
    console.warn(`No se encontró el estado con código: ${codigoEntidad}`);
    return;
  }

  // Extraer código numérico
  const codigo = codigoEntidad.replace('calles', '');
  
  // Activar la vista local para el estado
  if (typeof activarVistaLocal === 'function') {
    activarVistaLocal(codigo, 'estado');
  }

  // Cargar calles dinámicamente según el estado seleccionado
  if (typeof cargarCallesPorEstado === 'function') {
    cargarCallesPorEstado(codigo);
  }
});

// Hacer la función disponible globalmente
window.configurarSelectorEstado = configurarSelectorEstado;

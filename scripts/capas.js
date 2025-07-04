// Función específica para eliminar una fuente y sus capas asociadas
/**
 * Elimina una fuente y todas las capas asociadas a ella.
 * @param {string} sourceId - ID de la fuente a eliminar.
 * @param {string[]} layerIds - IDs de las capas asociadas a la fuente.
 */
export function removerCapaYCapaFuente(sourceId, layerIds) {
  // Eliminar todas las capas asociadas a la fuente
  layerIds.forEach(layerId => {
    if (window.map && window.map.getLayer(layerId)) {
      console.log(`Eliminando capa: ${layerId}`);
      window.map.removeLayer(layerId);
    }
  });

  // Verificar y eliminar la fuente
  if (window.map && window.map.getSource(sourceId)) {
    console.log(`Eliminando fuente: ${sourceId}`);
    window.map.removeSource(sourceId);
  } else {
    console.warn(`La fuente "${sourceId}" no existe o ya fue eliminada.`);
  }
}

// Función genérica para eliminar múltiples capas y fuentes
/**
 * Elimina múltiples capas y fuentes del mapa.
 * @param {Array} capas - Array de objetos con `layerId` y `sourceId`.
 */
export function removerCapasYFuentes(capas) {
  capas.forEach(({ layerId, sourceId }) => {
    if (window.map && window.map.getLayer(layerId)) {
      window.map.removeLayer(layerId);
    }
    if (sourceId && window.map && window.map.getSource(sourceId)) {
      window.map.removeSource(sourceId);
    }
  });
}

// Función genérica para aplicar filtros a las capas basado en un código y propiedad
/**
 * Aplica un filtro a un conjunto de capas basado en una propiedad y un valor.
 * @param {string[]} capas - IDs de las capas a las que se aplicará el filtro.
 * @param {string|number} filtro - Valor del filtro.
 * @param {string} propiedad - Propiedad en la que se basará el filtro.
 */
export function aplicarFiltros(capas, filtro, propiedad) {
  capas.forEach(id => {
    if (window.map && window.map.getLayer(id)) {
      const sourceId = window.map.getLayer(id).source;
      if (window.map.getSource(sourceId)) {
        console.log(`Aplicando filtro a la capa: ${id}`);
        window.map.setFilter(id, ["==", propiedad, filtro]);
        window.map.setLayoutProperty(id, "visibility", "visible");
      } else {
        console.warn(`La fuente "${sourceId}" no existe para la capa "${id}".`);
      }
    } else {
      console.warn(`La capa "${id}" no existe en el mapa.`);
    }
  });
}

// Función para sincronizar checkboxes con las capas del mapa
export function sincronizarCheckboxesConCapas(capas) {
  capas.forEach(({ checkboxId, layerId }) => {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox && window.map && window.map.getLayer(layerId)) {
      const visibility = window.map.getLayoutProperty(layerId, 'visibility');
      checkbox.checked = visibility === 'visible';

      // Registrar evento de cambio en el checkbox
      checkbox.addEventListener('change', function () {
        window.map.setLayoutProperty(layerId, 'visibility', this.checked ? 'visible' : 'none');
      });
    }
  });
}

// Función para reiniciar la vista del mapa
export function resetMapView(button) {
  // 1. Eliminar marcador si existe
  if (window.marker) {
    window.marker.remove();
    window.marker = null;
  }

  // 2. Limpiar geocoder si existe
  if (window.geocoder && typeof window.geocoder.clear === 'function') {
    window.geocoder.clear();
  }

  // 3. Quitar capas y fuentes asociadas
  const capas = [
    { id: "municipio-fill", source: "municipio-source" },
    { id: "municipio-outline", source: "municipio-source" },
    { id: "estado-fill", source: "estado-source" },
    { id: "estado-outline", source: "estado-source" },
    { id: "calles-layer", source: "calles" }
  ];

  capas.forEach(({ id, source }) => {
    if (window.map.getLayer(id)) {
      window.map.removeLayer(id); // Eliminar la capa
    }
    if (source && window.map.getSource(source)) {
      window.map.removeSource(source); // Eliminar la fuente
    }
  });

  // 4. Volver a vista nacional
  window.map.flyTo({
    center: [-102.5528, 23.6345],
    zoom: 4.2,
    speed: 1.2,
    essential: true
  });

  // Sincronizar los checkboxes
  const cardCapas = document.querySelector('card-capas');
  if (cardCapas) {
    cardCapas.toggleLayerControls(false); // Deshabilitar controles
    cardCapas.sincronizarCheckboxes(); // Sincronizar checkboxes
  }
}
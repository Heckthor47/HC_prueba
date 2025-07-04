import { aplicarFiltros } from './capas.js';

class BotonResetMapa extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div id="reset-button" class="map-control-button" title="Volver a vista nacional">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12,10H24.1851L20.5977,6.4141,22,5,28,11,22,17l-1.4023-1.4146L24.1821,12H12a6,6,0,0,0,0,12h8v2H12a8,8,0,0,1,0-16Z" fill="currentColor"/>
        </svg>
      </div>
    `;

    const btn = this.querySelector('#reset-button');
    btn.addEventListener('click', () => {
      this.resetMapView(btn);
    });
  }

resetMapView(button) {
  // Obtener el elemento <card-capas>
  const cardCapas = document.querySelector('card-capas');

  if (cardCapas) {
    cardCapas.sincronizarCheckboxes();
  } else {
    console.warn("El elemento <card-capas> no está presente en el DOM.");
  }

  /* 1. Limpiar marcador y GEOCODER -------------------------------------- */
  if (window.marker) {                      // Quitar marcador del mapa
    window.marker.remove();
    window.marker = null;
  }

  // ----- Geocoder -----
  if (window.geocoder?.clear) {             // Vaciar el texto del input
    window.geocoder.clear();                // (método propio de MapLibre-Geocoder)
  }

    // Limpiar el texto del input del geocoder manualmente
  const geocoderInput = document.querySelector('.mapboxgl-ctrl-geocoder--input.maplibregl-ctrl-geocoder--input');
  if (geocoderInput) {
    geocoderInput.value = ''; // Limpiar el texto
  } else {
    console.warn("No se encontró el input del geocoder.");
  }
  
  // Cerrar panel flotante (si usas el envoltorio con id="geocoder-wrapper")
  const gWrapper = document.getElementById('geocoder-wrapper');
  if (gWrapper) gWrapper.style.display = 'none';

  /* 2. Remover polígonos de estado y municipio --------------------------- */
  if (map.getLayer('estado-fill'))     map.removeLayer('estado-fill');
  if (map.getLayer('estado-outline'))  map.removeLayer('estado-outline');
  if (map.getSource('estado-source'))  map.removeSource('estado-source');

  if (map.getLayer('municipio-fill'))    map.removeLayer('municipio-fill');
  if (map.getLayer('municipio-outline')) map.removeLayer('municipio-outline');
  if (map.getSource('municipio-source')) map.removeSource('municipio-source');

  /* 3. Ocultar capas temáticas y limpiar filtros ------------------------- */
  ['homicidios-layer','parques-layer','escuelas-layer','calles-layer'].forEach(id=>{
    if (map.getLayer(id)) {
      map.setFilter(id, ['==','CVE_ENT','']);
      map.setLayoutProperty(id,'visibility','none');
    }
  });

  /* 4. Vaciar la fuente de calles (no se elimina) ------------------------ */
  const srcCalles = map.getSource('calles');
  if (srcCalles) srcCalles.setData({ type:'FeatureCollection', features: [] });

  /* 5. Reiniciar dropdowns de filtros ------------------------------------ */
  const filtro    = document.querySelector('dropdown-filtros-ubicacion');
  const selEstado = filtro?.querySelector('#select-estado');
  const selMpio   = filtro?.querySelector('#select-municipio');
  if (selEstado) { selEstado.value=''; selEstado.dispatchEvent(new Event('change')); }
  if (selMpio)   { selMpio.value=''; selMpio.disabled=true; }

  /* 6. Volver a vista nacional ------------------------------------------ */
  map.flyTo({ center:[-102.5528,23.6345], zoom:4.2, speed:1.2 });

  /* 7. Efecto visual del botón ------------------------------------------ */
    button.style.transform = 'scale(0.95) translateY(1px)';
    button.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';

    setTimeout(() => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    }, 200);
}
}
customElements.define('boton-reset-mapa', BotonResetMapa);






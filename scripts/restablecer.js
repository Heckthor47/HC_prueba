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
    // 1. Eliminar marcador si existe
    if (window.marker) {
      window.marker.remove();
      window.marker = null;
    }

    // 2. Limpiar geocoder si existe
    if (window.geocoder && typeof window.geocoder.clear === 'function') {
      window.geocoder.clear();
    }

    // Quitar capas y fuente del municipio y estado
    if (map.getLayer("municipio-fill")) map.removeLayer("municipio-fill");
    if (map.getLayer("municipio-outline")) map.removeLayer("municipio-outline");
    if (map.getSource("municipios-source")) map.removeSource("municipios-source");

    if (map.getLayer("estado-fill")) map.removeLayer("estado-fill");
    if (map.getLayer("estado-outline")) map.removeLayer("estado-outline");
    if (map.getSource("estado-source")) map.removeSource("estado-source");

    // 3. Volver a vista nacional
    window.map.flyTo({
      center: [-102.5528, 23.6345],
      zoom: 4.2,
      speed: 1.2,
      essential: true
    });

    // 4. Nivel nacional
    if (typeof window.seleccionarNivel === 'function') {
      window.seleccionarNivel('nacional');
    }

    // 5. Resetear filtros
    const filtro = document.querySelector('dropdown-filtros-ubicacion');
    const estado = filtro?.querySelector('#select-estado');
    const municipio = filtro?.querySelector('#select-municipio');
    if (estado) {
      estado.value = ''; // Reinicia el valor del selector
      estado.dispatchEvent(new Event('change')); // Dispara el evento 'change' para reflejar el cambio
    }
    if (municipio) {
      municipio.value = '';
      municipio.disabled = true;
    }

    // 6. Ocultar geocoder
    const geocoderPanel = document.getElementById('geocoder-wrapper');
    if (geocoderPanel) geocoderPanel.style.display = 'none';

    // 7. Efecto visual de clic
    button.style.transform = 'scale(0.95) translateY(1px)';
    button.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)';

    setTimeout(() => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    }, 200);

    // 8. Ocultar y limpiar filtros de capas temáticas
    const capas = [
      { id: "homicidios-layer", filtro: ["==", "CVE_ENT", ""] },
      { id: "parques-layer", filtro: ["==", "CVE_ENT", ""] },
      { id: "escuelas-layer", filtro: ["==", "CVE_ENT", ""] },
      { id: "calles-layer", filtro: ["==", "CVE_ENT", ""] }
    ];

    capas.forEach(({ id, filtro }) => {
      if (map.getLayer(id)) {
        map.setFilter(id, filtro);
        map.setLayoutProperty(id, "visibility", "none");
      }

      // También desmarcar checkbox si existen
      const checkbox = document.getElementById(`toggle-${id.replace("-layer", "")}`);
      if (checkbox) checkbox.checked = false;
    });
  }
}

customElements.define('boton-reset-mapa', BotonResetMapa);

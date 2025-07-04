import { aplicarFiltros } from './capas.js';
class CardCapas extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
       <div class="card-capas">
        <div class="leyenda-header">
          <h4>Capas</h4>
        </div>
        <div class="leyendas-contenido" style="max-height: 300px; overflow-y: auto;">
          <label class="switch">
            <input type="checkbox" id="toggle-calles" data-layer="calles-layer">
            <span class="slider round"></span>
            <span class="layer-label">Calles</span>
          </label>
          <label class="switch">
            <input type="checkbox" id="toggle-escuelas" data-layer="escuelas-layer">
            <span class="slider round"></span>
            <span class="layer-label">Escuelas</span>
          </label>
          <label class="switch">
            <input type="checkbox" id="toggle-parques" data-layer="parques-layer">
            <span class="slider round"></span>
            <span class="layer-label">Parques</span>
          </label>
          <label class="switch">
            <input type="checkbox" id="toggle-homicidios" data-layer="homicidios-layer">
            <span class="slider round"></span>
            <span class="layer-label">Homicidios</span>
          </label>
        </div>
      </div>
    `;

    // Sincronizar checkboxes con las capas al cargar el componente
    this.sincronizarCheckboxes();

    // Registrar eventos de cambio en los checkboxes
    this.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const layer = input.getAttribute('data-layer');
        const checked = input.checked;

        console.log(`Checkbox cambiado: ${layer}, estado: ${checked}`);

        // Actualizar visibilidad de la capa en el mapa
        if (window.map && window.map.getLayer(layer)) {
          window.map.setLayoutProperty(layer, 'visibility', checked ? 'visible' : 'none');
        }
      });
    });
  }

  // Sincronizar el estado de los checkboxes con las capas del mapa
  sincronizarCheckboxes() {
    const capas = [
      { id: 'toggle-homicidios', layer: 'homicidios-layer' },
      { id: 'toggle-parques', layer: 'parques-layer' },
      { id: 'toggle-escuelas', layer: 'escuelas-layer' },
      { id: 'toggle-calles', layer: 'calles-layer' }
    ];

    capas.forEach(({ id, layer }) => {
      const checkbox = this.querySelector(`#${id}`);
      if (!checkbox || !window.map.getLayer(layer)) return;

      try {
        const visibility = window.map.getLayoutProperty(layer, 'visibility');
        checkbox.checked = visibility === 'visible';
      } catch (error) {
        console.warn(`No se pudo obtener la visibilidad de la capa "${layer}":`, error);
        checkbox.checked = false;
      }
    });
  }

  // Función para habilitar/deshabilitar controles de capas
  toggleLayerControls(enabled, autoEnableCalles = false) {
    const capas = [
      'toggle-homicidios',
      'toggle-parques',
      'toggle-escuelas',
      'toggle-calles'
    ];

    capas.forEach(id => {
      const checkbox = this.querySelector(`#${id}`);
      if (!checkbox) return;

      checkbox.disabled = !enabled;
      if (!enabled) checkbox.checked = false;
      if (enabled && autoEnableCalles && id === 'toggle-calles') {
        checkbox.checked = true;
      }

      const layerId = id.replace('toggle-', '') + '-layer';
      if (window.map && window.map.getLayer(layerId)) {
        try {
          const visible = checkbox.checked ? 'visible' : 'none';
          window.map.setLayoutProperty(layerId, 'visibility', visible);
        } catch (error) {
          console.error(`Error modificando visibilidad de la capa "${layerId}":`, error);
        }
      } else {
        console.warn(`La capa "${layerId}" no existe en el mapa.`);
      }
    });
  }
}

customElements.define('card-capas', CardCapas);

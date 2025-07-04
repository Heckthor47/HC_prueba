import { estadosGeoJson, municipiosGeoJson } from './mapa_config.js';

class GeocoderIntegrado extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="geocoder-float-container">
        <div id="geocoder-icon" class="map-control-button" title="Buscar ubicación">
          <img src="https://cdn-icons-png.flaticon.com/512/622/622669.png" alt="Lupa">
        </div>
        <div id="geocoder-wrapper" class="geocoder-panel" style="display:none;">
          <div id="geocoder-container"></div>
        </div>
      </div>
    `;

    const icon = this.querySelector('#geocoder-icon');
    const wrapper = this.querySelector('#geocoder-wrapper');
    const container = this.querySelector('#geocoder-container');
    let isOpen = false;

    // Mostrar/ocultar el panel del geocoder
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen = !isOpen;
      wrapper.style.display = isOpen ? 'block' : 'none';

      if (isOpen) { 
        setTimeout(() => {
          const input = container.querySelector('input');
          if (input) input.focus();
        }, 100);
      }
    });

    // Cerrar el panel si se hace clic fuera de él
    this._onDocClick = (e) => {
      if (!this.contains(e.target)) {
        wrapper.style.display = 'none';
        isOpen = false;
      }
    };
    document.addEventListener('click', this._onDocClick);

    // Inicializar el geocoder después de que los municipios hayan sido cargados
    document.addEventListener('municipios-cargados', () => {
      if (window.map && window.map.isStyleLoaded()) {
        this.initGeocoder(container);
      } else {
        window.addEventListener('map-loaded', () => this.initGeocoder(container), { once: true });
      }
    });
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onDocClick);
    if (this.geocoder) {
      this.geocoder.off('result', this._onResult);
    }
  }

  initGeocoder(container) {
    const geocoderApi = {
      forwardGeocode: async (config) => {
        const features = [];
        try {
          const request = `https://nominatim.openstreetmap.org/search?q=${config.query}&format=geojson&polygon_geojson=1&addressdetails=1&countrycodes=MX&limit=10`;
          const response = await fetch(request);
          const geojson = await response.json();
          for (const feature of geojson.features) {
            const center = [
              feature.bbox[0] + (feature.bbox[2] - feature.bbox[0]) / 2,
              feature.bbox[1] + (feature.bbox[3] - feature.bbox[1]) / 2
            ];
            features.push({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: center },
              place_name: feature.properties.display_name,
              properties: feature.properties,
              text: feature.properties.display_name,
              place_type: ['place'],
              center
            });
          }
        } catch (e) {
          console.error(`Error en la búsqueda: ${e}`);
        }
        return { features };
      }
    };

    const MaplibreGeocoderClass = window.MaplibreGeocoder;
    if (!MaplibreGeocoderClass) {
      console.error("MaplibreGeocoder no está definido.");
      return;
    }

    const geocoder = new MaplibreGeocoderClass(geocoderApi, {
      maplibregl: window.maplibregl,
      placeholder: "Buscar dirección...",
      marker: true,
      limit: 10,
      proximity: [-99.1332, 19.4326],
    });

    geocoder.on('result', (e) => {
      const lngLat = e.result.center;

      // Mover el mapa a la ubicación
      map.flyTo({ center: lngLat, zoom: 12 });

      // Verificar si municipiosGeoJson está cargado
      if (!municipiosGeoJson) {
        console.error('Municipios no está cargado.');
        return;
      }

      // Encontrar el municipio correspondiente usando coordenadas
      const point = turf.point(lngLat);
      const municipio = municipiosGeoJson.features.find(mun =>
        turf.booleanPointInPolygon(point, mun)
      );

      if (!municipio) {
        console.warn('No se encontró municipio en el GeoJSON.');
        alert('No se encontró el municipio correspondiente a la ubicación seleccionada.');
        return;
      }

      const nom_ent = municipio.properties.NOM_ENT;
      const cve_ent = municipio.properties.CVEGEO.slice(0, 2); // Código de estado
      const cvegeo = municipio.properties.CVEGEO; // Código de municipio

      // Actualizar dropdowns dentro del web component
      const filtro = document.querySelector('dropdown-filtros-ubicacion');
      const selectEstado = filtro?.querySelector('#select-estado');
      const selectMunicipio = filtro?.querySelector('#select-municipio');

      if (!selectEstado || !selectMunicipio) {
        console.error("No se encontraron los selectores de estado o municipio.");
        alert("Hubo un problema al cargar los filtros de ubicación. Por favor, recarga la página.");
        return;
      }

      // Encontrar y seleccionar estado (por value: "callesXX")
      const estadoOption = Array.from(selectEstado.options).find(opt =>
        opt.value.endsWith(cve_ent)
      );

      if (!estadoOption) {
        console.warn("Estado no encontrado en dropdown:", cve_ent);
        return;
      }

      // Cambiar estado y emitir evento personalizado
      selectEstado.value = estadoOption.value;
      filtro.dispatchEvent(new CustomEvent('estado-change', {
        detail: { value: selectEstado.value },
        bubbles: true
      }));

      // Esperar a que se carguen municipios
      setTimeout(() => {
        const municipioOption = Array.from(selectMunicipio.options).find(opt =>
          opt.value === cvegeo
        );

        if (!municipioOption) {
          console.warn("Municipio no encontrado en dropdown:", cvegeo);
          alert(`No se encontró el municipio con código "${cvegeo}" en el dropdown.`);
          return;
        }

        selectMunicipio.value = municipioOption.value;
        filtro.dispatchEvent(new CustomEvent('municipio-change', {
          detail: { value: selectMunicipio.value },
          bubbles: true
        }));
      }, 0);
    });

    container.appendChild(geocoder.onAdd(window.map));
  }
}

customElements.define('geocoder-integrado', GeocoderIntegrado);

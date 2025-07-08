import { estadosGeoJson, municipiosGeoJson } from './mapa_config.js';

class GeocoderIntegrado extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="geocoder-float-container">
        <div id="geocoder-icon" class="map-control-button" title="Buscar ubicación">
          <img src="https://cdn-icons-png.flaticon.com/512/622/622669.png" alt="Lupa">
        </div>
        <div id="geocoder-wrapper" class="geocoder-panel" style="display:none;">
          <div id="geocoder-container" /div>
        </div>
      </div>
    `;

    const icon = this.querySelector('#geocoder-icon');
    const wrapper = this.querySelector('#geocoder-wrapper');
    const container = this.querySelector('#geocoder-container');
    let isOpen = false;

    // Mostrar/ocultar el panel del geocoder
    icon.addEventListener('click', (e) => {
      console.log('Click en icono geocoder detected!'); // Debug
      e.stopPropagation();
      isOpen = !isOpen;
      console.log('Estado geocoder:', isOpen ? 'abierto' : 'cerrado'); // Debug
      wrapper.style.display = isOpen ? 'block' : 'none';
      
      // Debug adicional
      console.log('Wrapper display después del click:', wrapper.style.display);
      console.log('Container HTML:', container.innerHTML);
      console.log('Wrapper tiene contenido:', wrapper.children.length > 0);

      if (isOpen) { 
        setTimeout(() => {
          const input = container.querySelector('input');
          if (input) {
            input.focus();
            console.log('Input enfocado'); // Debug
          } else {
            console.log('No se encontró input en el geocoder'); // Debug
            console.log('Contenido del container:', container.innerHTML);
          }
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
      console.log('Evento municipios-cargados detectado'); // Debug
      setTimeout(() => {
        this.initGeocoder(container);
      }, 1000); // Dar tiempo para que todo se cargue
    });

    // También intentar inicializar después de un tiempo fijo
    setTimeout(() => {
      if (container.innerHTML === 'Cargando buscador...') {
        console.log('Inicializando geocoder por timeout'); // Debug
        this.initGeocoder(container);
      }
    }, 3000);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this._onDocClick);
    if (this.geocoder) {
      this.geocoder.off('result', this._onResult);
    }
  }

  initGeocoder(container) {
    console.log('Inicializando geocoder...'); // Debug
    
    // Verificar que el mapa esté listo
    if (!window.map) {
      console.log('Mapa no disponible, reintentando en 1 segundo');
      setTimeout(() => this.initGeocoder(container), 1000);
      return;
    }

    const MaplibreGeocoderClass = window.MaplibreGeocoder;
    if (!MaplibreGeocoderClass) {
      console.error("MaplibreGeocoder no está definido.");
      container.innerHTML = 'Error: Geocoder no disponible';
      return;
    }

    console.log('MaplibreGeocoder encontrado, creando instancia...'); // Debug
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

    console.log('MaplibreGeocoder encontrado, creando instancia...'); // Debug

    const geocoder = new MaplibreGeocoderClass(geocoderApi, {
      maplibregl: window.maplibregl,
      placeholder: "Buscar dirección...",
      marker: false, 
      limit: 10,
      proximity: [-99.1332, 19.4326],
    });

    geocoder.on('result', (e) => {
      const lngLat = e.result.center;

      // Limpiar filtros inmediatamente cuando se busca algo
      const filtroComponent = document.querySelector('dropdown-filtros-ubicacion');
      if (filtroComponent && typeof filtroComponent.resetFilters === 'function') {
        filtroComponent.resetFilters();
      }

      // Remover marcador anterior si existe
      if (window.marker) {
        window.marker.remove();
      }

      // Crear marcador personalizado con tu imagen
      const markerElement = document.createElement('div');
      markerElement.style.backgroundImage = 'url(imagenes/ubi.png)';
      markerElement.style.width = '30px';
      markerElement.style.height = '30px';
      markerElement.style.backgroundSize = 'contain';
      markerElement.style.backgroundRepeat = 'no-repeat';
      markerElement.style.backgroundPosition = 'center';
      markerElement.style.cursor = 'pointer';

      // Añadir marcador personalizado al mapa
      window.marker = new maplibregl.Marker(markerElement)
        .setLngLat(lngLat)
        .addTo(map);

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

      // Limpiar filtros primero
      const filtroDropdown = document.querySelector('dropdown-filtros-ubicacion');
      if (!filtroDropdown) {
        console.error("No se encontró el componente de filtros de ubicación.");
        alert("Hubo un problema al cargar los filtros de ubicación. Por favor, recarga la página.");
        return;
      }

      // Limpiar filtros existentes antes de aplicar nuevos
      filtroDropdown.resetFilters();

      // Buscar el estado correspondiente en el diccionario
      const estadoValue = `calles${cve_ent}`;
      
      // Actualizar filtros usando los nuevos métodos
      setTimeout(() => {
        filtroDropdown.updateFromGeocoder(estadoValue, cvegeo);
      }, 200);
    });

    container.appendChild(geocoder.onAdd(window.map));
    console.log('Geocoder añadido al container'); // Debug
  }
}

customElements.define('geocoder-integrado', GeocoderIntegrado);

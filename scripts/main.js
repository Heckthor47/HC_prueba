import { aplicarFiltros } from './capas.js';
import { municipiosGeoJson } from './mapa_config.js';

// Punto de entrada
document.addEventListener("DOMContentLoaded", () => {
  configurarSelectorEstado();

  // Los listeners de checkboxes se manejan en card-capas.js
  // para evitar conflictos
});

document.addEventListener('estado-change', (e) => {
  const codigoEntidad = e.detail.value.replace('calles', '');
  console.log(`Estado cambiado: ${codigoEntidad}`);

});


document.addEventListener("municipios-cargados", () => {
  console.log("Municipios cargados en main.js:", municipiosGeoJson);
});


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
  
  const filtro = document.querySelector('dropdown-filtros-ubicacion');
  if (!filtro) {
    console.error("El elemento <dropdown-filtros-ubicacion> no está presente en el DOM.");
    return;
  }

  filtro.addEventListener('municipio-change', (e) => {
    if (!geojsonMunicipios) {
      console.error("geojsonMunicipios no está cargado.");
      return;
    }
    const cvegeo = e.detail.value;
    const feature = geojsonMunicipios.features.find(f => f.properties.CVEGEO === cvegeo);
    if (feature) {
      const bounds = turf.bbox(feature);
      map.fitBounds(bounds, { padding: 20 });
    }
  });
});


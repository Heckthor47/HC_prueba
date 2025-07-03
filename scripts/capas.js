function removerCapaYCapaFuente(nombreCapa, nombreFuente) {
  if (map.getLayer(nombreCapa)) map.removeLayer(nombreCapa);
  if (map.getSource(nombreFuente)) map.removeSource(nombreFuente);
}

// Funciones para remover capas y fuentes del mapa
function removerCapaCalles() {
  removerCapaYCapaFuente("calles-layer", "calles");
}

function removerCapaEstado() {
  if (map.getLayer("estado-fill")) map.removeLayer("estado-fill");
  if (map.getLayer("estado-outline")) map.removeLayer("estado-outline");
  if (map.getSource("estado-source")) map.removeSource("estado-source");
}

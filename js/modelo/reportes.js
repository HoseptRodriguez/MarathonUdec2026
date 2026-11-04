// MODELO · Reportes de zonas inseguras, guardados en el servidor.
// Todas las usuarias ven los reportes en el mapa (sin saber quién los hizo).

let reportesDelMapa = []; // copia local de los reportes públicos

// Trae del servidor los reportes de todas las usuarias
async function actualizarReportes() {
  reportesDelMapa = await llamarApi('GET', '/api/reportes');
}

// Guarda un reporte nuevo (datos = { motivo, descripcion, municipio, departamento })
async function guardarReporte(pos, datos) {
  const reporte = await llamarApi('POST', '/api/reportes', { lat: pos[0], lng: pos[1], ...datos });
  await actualizarReportes();
  return reporte;
}

// Reportes completos de la usuaria con sesión iniciada
function misReportes() {
  return llamarApi('GET', '/api/reportes/mios');
}

// Puntos del demo + puntos de ejemplo de toda la ciudad + reportes de todas las usuarias
function todosLosPuntos() {
  return PUNTOS.concat(PUNTOS_CIUDAD, reportesDelMapa);
}

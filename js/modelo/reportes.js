// MODELO · Reportes de zonas inseguras hechos por las usuarias.
// Se guardan en el navegador (localStorage) y cuentan en el cálculo de seguridad.

const CLAVE_REPORTES = 'ruta-segura-reportes';

// Lee los reportes guardados (lista vacía si no hay o si el navegador lo bloquea)
function cargarReportes() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_REPORTES)) || [];
  } catch {
    return [];
  }
}

// Agrega un reporte nuevo y lo guarda (datos = { motivo, descripcion, municipio, departamento })
function guardarReporte(pos, datos) {
  const reporte = {
    tipo: 'inseguro',
    nombre: 'Reporte: ' + datos.motivo,
    lat: pos[0],
    lng: pos[1],
    fecha: new Date().toISOString(),
    ...datos,
  };
  const lista = cargarReportes();
  lista.push(reporte);
  try {
    localStorage.setItem(CLAVE_REPORTES, JSON.stringify(lista));
  } catch {
    // Sin almacenamiento disponible: el reporte solo vive mientras la página esté abierta
  }
  return reporte;
}

// Puntos de ejemplo + reportes de usuarias
function todosLosPuntos() {
  return PUNTOS.concat(cargarReportes());
}

// MODELO (servidor) · Reportes de zonas inseguras.

const crypto = require('node:crypto');
const { leer, guardar, ErrorAura } = require('./almacen');

// Texto limpio y con largo máximo
const texto = (valor, maximo) => String(valor || '').trim().slice(0, maximo);

function crearReporte(usuariaId, datos) {
  const lat = Number(datos.lat);
  const lng = Number(datos.lng);
  // Rectángulo aproximado que cubre Colombia
  if (!(lat > -5 && lat < 14 && lng > -82 && lng < -66)) {
    throw new ErrorAura('El reporte debe estar dentro de Colombia.');
  }
  const motivo = texto(datos.motivo, 100);
  if (!motivo) throw new ErrorAura('Elige qué pasa en el lugar.');

  const reporte = {
    id: crypto.randomUUID(),
    usuariaId,
    fecha: new Date().toISOString(),
    lat,
    lng,
    motivo,
    descripcion: texto(datos.descripcion, 500),
    municipio: texto(datos.municipio, 100) || 'Municipio no identificado',
    departamento: texto(datos.departamento, 100),
  };
  const reportes = leer('reportes');
  reportes.push(reporte);
  guardar('reportes', reportes);
  return sinDuena(reporte);
}

// Lo que ven todas las usuarias en el mapa: sin quién lo hizo ni la descripción
function reportesPublicos() {
  return leer('reportes').map(r => ({
    tipo: 'inseguro',
    nombre: `Reporte: ${r.motivo}`,
    lat: r.lat,
    lng: r.lng,
    fecha: r.fecha,
  }));
}

// Los reportes completos de una usuaria (para su Excel)
function reportesDe(usuariaId) {
  return leer('reportes').filter(r => r.usuariaId === usuariaId).map(sinDuena);
}

function sinDuena({ usuariaId, ...resto }) {
  return resto;
}

module.exports = { crearReporte, reportesPublicos, reportesDe };

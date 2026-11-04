// MODELO (servidor) · Reportes de zonas inseguras.

const crypto = require('node:crypto');
const { todos, guardarRegistro, borrarRegistro, ErrorAura } = require('./almacen');

// Texto limpio y con largo máximo
const texto = (valor, maximo) => String(valor || '').trim().slice(0, maximo);

async function crearReporte(usuariaId, datos) {
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
  await guardarRegistro('reportes', reporte.id, reporte);
  return sinDuena(reporte);
}

// Lo que ven todas las usuarias en el mapa: sin quién lo hizo ni la descripción
async function reportesPublicos() {
  return (await todos('reportes')).map(r => ({
    tipo: 'inseguro',
    nombre: `Reporte: ${r.motivo}`,
    lat: r.lat,
    lng: r.lng,
    fecha: r.fecha,
  }));
}

// Los reportes completos de una usuaria (para su Excel), del más antiguo al más reciente
async function reportesDe(usuariaId) {
  return (await todos('reportes'))
    .filter(r => r.usuariaId === usuariaId)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(sinDuena);
}

// Borra todos los reportes de una usuaria (cuando elimina su cuenta)
async function borrarReportesDe(usuariaId) {
  for (const r of (await todos('reportes')).filter(r => r.usuariaId === usuariaId)) {
    await borrarRegistro('reportes', r.id);
  }
}

function sinDuena({ usuariaId, ...resto }) {
  return resto;
}

module.exports = { crearReporte, reportesPublicos, reportesDe, borrarReportesDe };

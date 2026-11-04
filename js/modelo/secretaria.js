// MODELO · Reporte formal para la Secretaría de la Mujer del municipio.
// No hay una API oficial: se arma el texto y el enlace de correo para que la usuaria lo envíe.

// Pasa "Fusagasugá" a "fusagasuga" para buscar en ENTIDADES
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// Texto del reporte, listo para enviar
function textoReporte(r) {
  const fecha = new Date(r.fecha);
  return [
    'REPORTE CIUDADANO DE ZONA INSEGURA (Aura - Ruta nocturna segura)',
    '',
    `Fecha: ${fecha.toLocaleDateString('es-CO')}  Hora: ${fecha.toLocaleTimeString('es-CO')}`,
    `Municipio: ${r.municipio}${r.departamento ? ', ' + r.departamento : ''}`,
    `Situación: ${r.motivo}`,
    `Descripción: ${r.descripcion || 'Sin descripción'}`,
    `Ubicación: https://maps.google.com/?q=${r.lat},${r.lng}`,
    '',
    'Solicito revisar este punto (alumbrado, presencia policial, rutas seguras).',
  ].join('\n');
}

// Todo lo que la vista necesita para mostrar el reporte: { entidad, texto, mailto }
function prepararReporteSecretaria(reporte) {
  const entidad = ENTIDADES[normalizar(reporte.municipio)] || null;
  const texto = textoReporte(reporte);
  const asunto = `Reporte de zona insegura - ${reporte.municipio}`;
  const correo = entidad ? entidad.correo : '';
  return {
    entidad: entidad && entidad.correo ? entidad : null,
    texto,
    mailto: `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`,
  };
}

// Contenido CSV de todos los reportes (se abre en Excel)
function crearCSV(reportes) {
  const columnas = ['fecha', 'municipio', 'departamento', 'motivo', 'descripcion', 'lat', 'lng'];
  const celda = valor => `"${String(valor ?? '').replace(/"/g, '""')}"`;
  const filas = reportes.map(r => columnas.map(c => celda(r[c])).join(';'));
  // El BOM (﻿) hace que Excel muestre bien las tildes
  return '﻿' + [columnas.join(';'), ...filas].join('\n');
}

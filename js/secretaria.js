// Reporte formal para la Secretaría de la Mujer del municipio donde ocurrió.
// No hay una API oficial: Aura arma el reporte y la usuaria lo envía por correo o lo copia.

// Pasa "Fusagasugá" a "fusagasuga" para buscar en ENTIDADES
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

// Pregunta a OpenStreetMap en qué municipio y departamento está la ubicación
async function obtenerMunicipio(pos) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&accept-language=es&lat=${pos[0]}&lon=${pos[1]}`;
    const datos = await (await fetch(url)).json();
    const a = datos.address || {};
    return {
      // OpenStreetMap a veces dice "Fusagasugá ciudad": se quita "ciudad"
      municipio: (a.city || a.town || a.village || a.municipality || a.county || 'Municipio no identificado').replace(/ ciudad$/i, ''),
      departamento: a.state || '',
    };
  } catch {
    return { municipio: 'Municipio no identificado', departamento: '' };
  }
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

// Muestra la ventana con el reporte y los botones para enviarlo
function abrirReporteSecretaria(reporte) {
  const entidad = ENTIDADES[normalizar(reporte.municipio)];
  const texto = textoReporte(reporte);
  const asunto = `Reporte de zona insegura - ${reporte.municipio}`;

  document.getElementById('textoSecretaria').value = texto;
  document.getElementById('entidadSecretaria').textContent = entidad && entidad.correo
    ? `Se enviará a: ${entidad.nombre} (${entidad.correo})`
    : `No tenemos el correo de la Secretaría de la Mujer de ${reporte.municipio}. ` +
      'Escribe el destinatario en tu correo o copia el texto. Si necesitas orientación, llama a la línea ' + LINEA_NACIONAL + '.';
  document.getElementById('linkCorreo').href =
    `mailto:${entidad ? entidad.correo : ''}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`;
  document.getElementById('dialogoSecretaria').showModal();
}

// Descarga todos los reportes en un archivo CSV (se abre en Excel)
function descargarCSV(reportes) {
  const columnas = ['fecha', 'municipio', 'departamento', 'motivo', 'descripcion', 'lat', 'lng'];
  const celda = valor => `"${String(valor ?? '').replace(/"/g, '""')}"`;
  const filas = reportes.map(r => columnas.map(c => celda(r[c])).join(';'));
  // El BOM (﻿) hace que Excel muestre bien las tildes
  const csv = '﻿' + [columnas.join(';'), ...filas].join('\n');

  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  enlace.download = 'reportes-aura.csv';
  enlace.click();
}

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

// Todo lo que la vista necesita para mostrar el reporte:
// { entidad, texto, mailto, whatsapp, contacto }
function prepararReporteSecretaria(reporte) {
  const entidad = ENTIDADES[normalizar(reporte.municipio)] || null;
  const texto = textoReporte(reporte);
  const asunto = `Reporte de zona insegura - ${reporte.municipio}`;
  const correo = entidad ? entidad.correo : '';
  return {
    entidad: entidad && entidad.correo ? entidad : null,
    texto,
    mailto: `mailto:${correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`,
    whatsapp: enlaceWhatsAppContacto(texto), // al número de confianza registrado
    contacto: cargarContacto(),
  };
}

// Filas para el archivo de Excel: una por reporte, con encabezados en español
function filasExcel(reportes) {
  return reportes.map(r => {
    const fecha = r.fecha ? new Date(r.fecha) : null;
    return {
      Fecha: fecha ? fecha.toLocaleDateString('es-CO') : '',
      Hora: fecha ? fecha.toLocaleTimeString('es-CO') : '',
      Municipio: r.municipio || '',
      Departamento: r.departamento || '',
      Situación: r.motivo || r.nombre,
      Descripción: r.descripcion || '',
      Latitud: r.lat,
      Longitud: r.lng,
      Ubicación: `https://maps.google.com/?q=${r.lat},${r.lng}`,
    };
  });
}

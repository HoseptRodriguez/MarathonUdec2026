// VISTA · Panel lateral y ventanas (todo lo que se muestra fuera del mapa).

const $ = id => document.getElementById(id);

function instruccion(html) {
  $('instruccion').innerHTML = html;
}

// Marca qué botón está activo para el próximo toque en el mapa
function mostrarModoClic(modo) {
  $('btnClicOrigen').classList.toggle('activo', modo === 'origen');
  $('btnClicDestino').classList.toggle('activo', modo === 'destino');
}

// Tarjetas de rutas (de más a menos segura)
function mostrarListaRutas(rutas, seleccionada, alElegir) {
  const lista = $('listaRutas');
  lista.innerHTML = rutas.length ? '<h2>Rutas (de más a menos segura)</h2>' : '';

  rutas.forEach((ruta, i) => {
    const conteo = {};
    ruta.cercanos.forEach(p => { conteo[p.tipo] = (conteo[p.tipo] || 0) + 1; });
    const resumen = Object.keys(conteo)
      .map(t => `<span class="mini" title="${TIPOS[t].texto}">${htmlMarcador(TIPOS[t].icono, TIPOS[t].color)}×${conteo[t]}</span>`)
      .join(' ') || 'Sin puntos de apoyo cerca';

    const tarjeta = document.createElement('div');
    tarjeta.className = `ruta ${ruta.nivel}` + (i === seleccionada ? ' seleccionada' : '');
    tarjeta.innerHTML = `
      <b>${ruta.nivel}</b> · ${ruta.distanciaKm.toFixed(1)} km · ${ruta.minutos} min
      <div class="nota">${resumen}</div>
      ${ruta.aproximada ? '<div class="nota">Ruta aproximada (sin conexión al servidor de rutas)</div>' : ''}`;
    tarjeta.onclick = () => alElegir(i);
    lista.appendChild(tarjeta);
  });
}

function mostrarLeyenda() {
  $('leyenda').innerHTML = Object.values(TIPOS)
    .map(t => `<li class="leyenda-item">${htmlMarcador(t.icono, t.color)} ${t.texto}</li>`)
    .join('');
}

function mostrarEstadoReportes(total) {
  $('estadoReportes').textContent = total
    ? `Has hecho ${total} reporte(s). Puedes descargarlos para entregarlos a la Secretaría de la Mujer.`
    : 'Aún no has hecho reportes.';
}

// Ventana SOS: primero "obteniendo ubicación", luego el enlace listo
function abrirSOS() {
  $('linkWhatsApp').textContent = 'Obteniendo ubicación…';
  $('dialogoSOS').showModal();
}
function mostrarEnlaceSOS(url) {
  $('linkWhatsApp').href = url;
  $('linkWhatsApp').textContent = 'Enviar mi ubicación por WhatsApp';
}

// Ventana del reporte para la Secretaría de la Mujer
function mostrarReporteSecretaria({ entidad, texto, mailto, whatsapp, contacto }, municipio) {
  $('textoSecretaria').value = texto;
  $('linkCorreo').href = mailto;
  $('linkWhatsAppReporte').href = whatsapp;
  $('linkWhatsAppReporte').lastChild.textContent = contacto
    ? ` Enviar por WhatsApp a mi contacto (${contacto})`
    : ' Enviar por WhatsApp (no has registrado contacto de confianza)';
  $('entidadSecretaria').textContent = entidad
    ? `Se enviará a: ${entidad.nombre} (${entidad.correo})`
    : `No tenemos el correo de la Secretaría de la Mujer de ${municipio}. ` +
      `Escribe el destinatario en tu correo o copia el texto. Si necesitas orientación, llama a la línea ${LINEA_NACIONAL}.`;
  $('btnCopiarReporte').lastChild.textContent = ' Copiar texto';
  $('dialogoSecretaria').showModal();
}

// Descarga un archivo de Excel (.xlsx) con las filas dadas (usa SheetJS)
function descargarExcel(filas, nombreArchivo) {
  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja['!cols'] = Object.keys(filas[0]).map(() => ({ wch: 22 })); // ancho de columnas
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Reportes');
  XLSX.writeFile(libro, nombreArchivo);
}

// Conecta la interfaz con el mapa, las rutas y el SOS.

let origen = null;
let destino = null;
let rutas = [];
let modoClic = 'origen';   // qué marca el próximo toque en el mapa: 'origen' o 'destino'
let modoReporte = false;
let posicionReporte = null;

// Texto que se puso en "Desde" y "Hasta" (si la usuaria lo cambia, se busca de nuevo)
let textoOrigen = '';
let textoDestino = '';

const $ = id => document.getElementById(id);

function instruccion(html) {
  $('instruccion').innerHTML = html;
}

// --- Origen y destino ---

function fijarOrigen(pos, nombre) {
  origen = pos;
  textoOrigen = $('desde').value = nombre;
  ponerMarcador(pos, 'origen');
  elegirModoClic('destino');
  if (destino) buscarRutas();
  else instruccion('Escribe a dónde vas o toca tu <b>destino</b> en el mapa.');
}

function fijarDestino(pos, nombre) {
  destino = pos;
  textoDestino = $('hasta').value = nombre;
  ponerMarcador(pos, 'destino');
  if (origen) buscarRutas();
  else instruccion('Falta el <b>origen</b>: usa tu ubicación, escríbelo o tócalo en el mapa.');
}

// Marca qué botón está activo (origen o destino) para el próximo toque en el mapa
function elegirModoClic(modo) {
  modoClic = modo;
  $('btnClicOrigen').classList.toggle('activo', modo === 'origen');
  $('btnClicDestino').classList.toggle('activo', modo === 'destino');
}

// Origen automático con el GPS del celular
async function usarMiUbicacion() {
  instruccion('Obteniendo tu ubicación…');
  const pos = await obtenerUbicacion(null);
  if (!pos) {
    instruccion('No pudimos obtener tu ubicación. Escribe desde dónde sales o tócalo en el mapa.');
    elegirModoClic('origen');
    return;
  }
  mapa.setView(pos, 16);
  fijarOrigen(pos, 'Mi ubicación');
}

// Toque en el mapa: reporte, origen o destino
mapa.on('click', e => {
  const pos = [e.latlng.lat, e.latlng.lng];

  if (modoReporte) {
    posicionReporte = pos;
    $('dialogoReporte').showModal();
  } else if (modoClic === 'origen') {
    fijarOrigen(pos, 'Punto en el mapa');
  } else {
    fijarDestino(pos, 'Punto en el mapa');
  }
});

// "Buscar ruta segura": busca las direcciones escritas que hayan cambiado
$('formRuta').onsubmit = async e => {
  e.preventDefault();
  const desde = $('desde').value.trim();
  const hasta = $('hasta').value.trim();
  if (!hasta) return instruccion('Escribe a dónde vas.');

  // Olvidar lo que cambió, para no calcular rutas con datos viejos
  if (desde !== textoOrigen) origen = null;
  if (hasta !== textoDestino) destino = null;

  instruccion('Buscando direcciones…');
  if (!desde) {
    await usarMiUbicacion();
    if (!origen) return;
  } else if (desde !== textoOrigen) {
    const lugar = await buscarLugar(desde).catch(() => null);
    if (!lugar) return instruccion(`No encontramos "${desde}". Prueba con otro nombre.`);
    fijarOrigen(lugar.pos, lugar.nombre);
  }
  if (hasta !== textoDestino) {
    const lugar = await buscarLugar(hasta).catch(() => null);
    if (!lugar) return instruccion(`No encontramos "${hasta}". Prueba con otro nombre.`);
    fijarDestino(lugar.pos, lugar.nombre);
  } else if (origen && destino) {
    buscarRutas();
  }
};

// Pide las rutas, les pone nota de seguridad y las ordena de más a menos segura
async function buscarRutas() {
  instruccion('Buscando rutas…');
  const encontradas = await obtenerRutas(origen, destino);
  const puntos = todosLosPuntos();

  rutas = encontradas
    .map(r => ({ ...r, ...calcularSeguridad(r.coords, r.distanciaKm, puntos) }))
    .sort((a, b) => b.puntaje - a.puntaje);

  elegirRuta(0);
  mapa.fitBounds(L.latLngBounds(rutas[0].coords), { padding: [40, 40] });
  instruccion('Te recomendamos la primera ruta. Toca otra tarjeta para compararla.');
}

function elegirRuta(i) {
  dibujarRutas(rutas, i);
  mostrarListaRutas(rutas, i, elegirRuta);
}

function empezarDeNuevo() {
  origen = null;
  destino = null;
  rutas = [];
  textoOrigen = textoDestino = $('desde').value = $('hasta').value = '';
  limpiarMapa();
  $('listaRutas').innerHTML = '';
  elegirModoClic('origen');
  instruccion('Escribe desde dónde sales y a dónde vas, o márcalos en el mapa.');
}

// --- Botones del panel ---

$('btnUbicacion').onclick = usarMiUbicacion;
$('btnClicOrigen').onclick = () => { elegirModoClic('origen'); instruccion('Toca el mapa para marcar el <b>origen</b>.'); };
$('btnClicDestino').onclick = () => { elegirModoClic('destino'); instruccion('Toca el mapa para marcar el <b>destino</b>.'); };
$('btnLimpiar').onclick = empezarDeNuevo;

// Demo: Parque Principal (Plaza Mayor) → Universidad de Cundinamarca
const DEMO_ORIGEN = [4.3439103, -74.3619659];
const DEMO_DESTINO = [4.3359848, -74.3712360];

$('btnDemo').onclick = () => {
  empezarDeNuevo();
  fijarOrigen(DEMO_ORIGEN, 'Parque Principal de Fusagasugá');
  fijarDestino(DEMO_DESTINO, 'Universidad de Cundinamarca');
};

$('btnReportar').onclick = () => {
  modoReporte = !modoReporte;
  $('btnReportar').classList.toggle('activo', modoReporte);
  instruccion(modoReporte ? 'Toca en el mapa el lugar inseguro.' : 'Listo. Puedes seguir buscando rutas.');
};

$('btnGuardarReporte').onclick = async () => {
  $('dialogoReporte').close();
  $('btnReportar').click(); // salir del modo reporte

  const lugar = await obtenerMunicipio(posicionReporte);
  const reporte = guardarReporte(posicionReporte, {
    motivo: $('motivoReporte').value,
    descripcion: $('descripcionReporte').value.trim(),
    ...lugar,
  });
  $('descripcionReporte').value = '';

  dibujarPuntos();
  mostrarEstadoReportes();
  if (origen && destino) buscarRutas(); // recalcular con el nuevo reporte
  if ($('enviarSecretaria').checked) abrirReporteSecretaria(reporte);
};
$('btnCancelarReporte').onclick = () => $('dialogoReporte').close();

// --- Secretaría de la Mujer y descarga de reportes ---

function mostrarEstadoReportes() {
  const total = cargarReportes().length;
  $('estadoReportes').textContent = total
    ? `Has hecho ${total} reporte(s). Puedes descargarlos para entregarlos a la Secretaría de la Mujer.`
    : 'Aún no has hecho reportes.';
}

$('btnCopiarReporte').onclick = async () => {
  try {
    await navigator.clipboard.writeText($('textoSecretaria').value);
    $('btnCopiarReporte').lastChild.textContent = ' Copiado';
  } catch {
    $('textoSecretaria').select(); // si no se puede copiar solo, queda seleccionado
  }
};
$('btnCerrarSecretaria').onclick = () => {
  $('dialogoSecretaria').close();
  $('btnCopiarReporte').lastChild.textContent = ' Copiar texto';
};
$('btnDescargarCSV').onclick = () => descargarCSV(cargarReportes());

// --- SOS y acompañamiento ---

$('btnSOS').onclick = () => abrirSOS(origen || CENTRO);
$('btnCerrarSOS').onclick = () => $('dialogoSOS').close();

$('btnAcompanar').onclick = () => {
  const minutos = Number($('minutos').value) || 20;
  iniciarAcompanamiento(minutos, () => {
    $('estadoAcompanar').textContent = 'No confirmaste tu llegada.';
    abrirSOS(destino || origen || CENTRO, 'No he confirmado que llegué a mi destino.');
  });
  $('estadoAcompanar').textContent = `En camino. Si no confirmas en ${minutos} min, se abrirá el SOS.`;
  $('btnLlegue').hidden = false;
};

$('btnLlegue').onclick = () => {
  detenerAcompanamiento();
  $('estadoAcompanar').textContent = '¡Qué bueno que llegaste bien!';
  $('btnLlegue').hidden = true;
};

$('contacto').value = cargarContacto();
$('btnGuardarContacto').onclick = () => {
  guardarContacto($('contacto').value.replace(/\D/g, ''));
  $('estadoContacto').textContent = 'Contacto guardado.';
};

// --- Inicio ---

$('leyenda').innerHTML = Object.values(TIPOS)
  .map(t => `<li class="leyenda-item">${htmlMarcador(t.icono, t.color)} ${t.texto}</li>`)
  .join('');
dibujarPuntos();
mostrarEstadoReportes();
usarMiUbicacion(); // origen automático al abrir la app

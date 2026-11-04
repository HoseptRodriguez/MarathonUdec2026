// Conecta la interfaz con el mapa, las rutas y el SOS.

let origen = null;
let destino = null;
let rutas = [];
let modoReporte = false;
let posicionReporte = null;

const $ = id => document.getElementById(id);

function instruccion(html) {
  $('instruccion').innerHTML = html;
}

// Clic en el mapa: reportar, o marcar origen y destino
mapa.on('click', e => {
  const pos = [e.latlng.lat, e.latlng.lng];

  if (modoReporte) {
    posicionReporte = pos;
    $('dialogoReporte').showModal();
    return;
  }

  if (!origen || destino) {
    empezarDeNuevo();
    fijarOrigen(pos);
  } else {
    destino = pos;
    ponerMarcador(pos, 'B');
    buscarRutas();
  }
});

function fijarOrigen(pos) {
  origen = pos;
  ponerMarcador(pos, 'A');
  instruccion('Ahora toca tu <b>destino</b>.');
}

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
  limpiarMapa();
  $('listaRutas').innerHTML = '';
  instruccion('Toca el mapa para marcar tu <b>origen</b>.');
}

// --- Botones del panel ---

$('btnLimpiar').onclick = empezarDeNuevo;

$('btnUbicacion').onclick = async () => {
  instruccion('Obteniendo tu ubicación…');
  const pos = await obtenerUbicacion(null);
  if (!pos) return instruccion('No se pudo obtener tu ubicación. Toca el mapa para marcar tu <b>origen</b>.');
  empezarDeNuevo();
  fijarOrigen(pos);
  mapa.setView(pos, 16);
};

$('btnReportar').onclick = () => {
  modoReporte = !modoReporte;
  $('btnReportar').classList.toggle('activo', modoReporte);
  instruccion(modoReporte ? 'Toca en el mapa el lugar inseguro.' : 'Toca el mapa para marcar tu <b>origen</b>.');
};

$('btnGuardarReporte').onclick = () => {
  guardarReporte(posicionReporte, $('motivoReporte').value);
  $('dialogoReporte').close();
  $('btnReportar').click(); // salir del modo reporte
  dibujarPuntos();
  if (origen && destino) buscarRutas(); // recalcular con el nuevo reporte
};
$('btnCancelarReporte').onclick = () => $('dialogoReporte').close();

// --- SOS y acompañamiento ---

$('btnSOS').onclick = () => abrirSOS(origen || CENTRO);
$('btnCerrarSOS').onclick = () => $('dialogoSOS').close();

$('btnAcompanar').onclick = () => {
  const minutos = Number($('minutos').value) || 20;
  iniciarAcompanamiento(minutos, () => {
    $('estadoAcompanar').textContent = '⏰ No confirmaste tu llegada.';
    abrirSOS(destino || origen || CENTRO, 'No he confirmado que llegué a destino.');
  });
  $('estadoAcompanar').textContent = `En camino. Si no confirmas en ${minutos} min, se abrirá el SOS.`;
  $('btnLlegue').hidden = false;
};

$('btnLlegue').onclick = () => {
  detenerAcompanamiento();
  $('estadoAcompanar').textContent = '💜 ¡Qué bueno que llegaste bien!';
  $('btnLlegue').hidden = true;
};

$('contacto').value = cargarContacto();
$('btnGuardarContacto').onclick = () => {
  guardarContacto($('contacto').value.replace(/\D/g, ''));
  $('estadoContacto').textContent = 'Contacto guardado.';
};

// --- Inicio ---

$('leyenda').innerHTML = Object.values(TIPOS).map(t => `<li>${t.icono} ${t.texto}</li>`).join('');
dibujarPuntos();

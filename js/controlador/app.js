// CONTROLADOR · Guarda el estado, escucha a la usuaria y conecta el Modelo con la Vista.

// --- Estado de la app ---
let origen = null;
let destino = null;
let rutas = [];
let modoClic = 'origen';   // qué marca el próximo toque en el mapa: 'origen' o 'destino'
let modoReporte = false;
let posicionReporte = null;
let temporizador = null;   // modo acompañamiento

// Texto que se puso en "Desde" y "Hasta" (si la usuaria lo cambia, se busca de nuevo)
let textoOrigen = '';
let textoDestino = '';

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

function elegirModoClic(modo) {
  modoClic = modo;
  mostrarModoClic(modo);
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
  centrarEn(pos);
  fijarOrigen(pos, 'Mi ubicación');
}

// Toque en el mapa: reporte, origen o destino
alTocarMapa(pos => {
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
    const lugar = await buscarLugar(desde, centroDelMapa()).catch(() => null);
    if (!lugar) return instruccion(`No encontramos "${desde}". Prueba con otro nombre.`);
    fijarOrigen(lugar.pos, lugar.nombre);
  }
  if (hasta !== textoDestino) {
    const lugar = await buscarLugar(hasta, centroDelMapa()).catch(() => null);
    if (!lugar) return instruccion(`No encontramos "${hasta}". Prueba con otro nombre.`);
    fijarDestino(lugar.pos, lugar.nombre);
  } else if (origen && destino) {
    buscarRutas();
  }
};

// Pide las rutas al modelo, las evalúa y las muestra
async function buscarRutas() {
  instruccion('Buscando rutas…');
  rutas = evaluarRutas(await obtenerRutas(origen, destino), todosLosPuntos());
  elegirRuta(0);
  encuadrar(rutas[0].coords);
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
  mostrarListaRutas([], 0, elegirRuta);
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

// --- Reportes y Secretaría de la Mujer ---

$('btnReportar').onclick = () => {
  modoReporte = !modoReporte;
  $('btnReportar').classList.toggle('activo', modoReporte);
  instruccion(modoReporte ? 'Toca en el mapa el lugar inseguro.' : 'Listo. Puedes seguir buscando rutas.');
};

$('btnGuardarReporte').onclick = async () => {
  $('dialogoReporte').close();
  $('btnReportar').click(); // salir del modo reporte

  instruccion('Guardando tu reporte…');
  let reporte;
  try {
    const lugar = await obtenerMunicipio(posicionReporte);
    reporte = await guardarReporte(posicionReporte, {
      motivo: $('motivoReporte').value,
      descripcion: $('descripcionReporte').value.trim(),
      ...lugar,
    });
  } catch (error) {
    return instruccion(`No se pudo guardar el reporte: ${error.message}`);
  }
  $('descripcionReporte').value = '';
  instruccion('Reporte guardado. Ya lo ven todas las usuarias en el mapa.');

  dibujarPuntos(todosLosPuntos());
  actualizarEstadoReportes();
  if (origen && destino) buscarRutas(); // recalcular con el nuevo reporte
  if ($('enviarSecretaria').checked) mostrarReporteSecretaria(prepararReporteSecretaria(reporte), reporte.municipio);
};
$('btnCancelarReporte').onclick = () => $('dialogoReporte').close();

$('btnCopiarReporte').onclick = async () => {
  try {
    await navigator.clipboard.writeText($('textoSecretaria').value);
    $('btnCopiarReporte').lastChild.textContent = ' Copiado';
  } catch {
    $('textoSecretaria').select(); // si no se puede copiar solo, queda seleccionado
  }
};
$('btnCerrarSecretaria').onclick = () => $('dialogoSecretaria').close();
// Cuántos reportes ha hecho la usuaria (se pregunta al servidor)
async function actualizarEstadoReportes() {
  const reportes = await misReportes().catch(() => []);
  mostrarEstadoReportes(reportes.length);
}

$('btnDescargarExcel').onclick = async () => {
  const reportes = await misReportes().catch(() => []);
  if (!reportes.length) return mostrarEstadoReportes(0);
  descargarExcel(filasExcel(reportes), 'mis-reportes-aura.xlsx');
};

// --- SOS y acompañamiento ---

async function pedirAyuda(respaldo, motivo = 'Necesito ayuda.') {
  abrirSOS();
  const pos = await obtenerUbicacion(respaldo);
  mostrarEnlaceSOS(enlaceWhatsApp(pos, motivo));
}

$('btnSOS').onclick = () => pedirAyuda(origen || CENTRO);
$('btnCerrarSOS').onclick = () => $('dialogoSOS').close();

$('btnAcompanar').onclick = () => {
  const minutos = Number($('minutos').value) || 20;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    $('estadoAcompanar').textContent = 'No confirmaste tu llegada.';
    pedirAyuda(destino || origen || CENTRO, 'No he confirmado que llegué a mi destino.');
  }, minutos * 60 * 1000);
  $('estadoAcompanar').textContent = `En camino. Si no confirmas en ${minutos} min, se abrirá el SOS.`;
  $('btnLlegue').hidden = false;
};

$('btnLlegue').onclick = () => {
  clearTimeout(temporizador);
  $('estadoAcompanar').textContent = '¡Qué bueno que llegaste bien!';
  $('btnLlegue').hidden = true;
};

// El contacto se guarda en la cuenta mientras se escribe (y también con el botón)
let esperaContacto = null;
async function registrarContacto() {
  const numero = $('contacto').value.replace(/\D/g, '');
  try {
    await guardarContacto(numero);
    $('estadoContacto').textContent = numero ? `Contacto guardado: ${cargarContacto()}` : '';
  } catch (error) {
    $('estadoContacto').textContent = `No se pudo guardar: ${error.message}`;
  }
}
$('contacto').oninput = () => {
  clearTimeout(esperaContacto);
  esperaContacto = setTimeout(registrarContacto, 600); // espera a que termine de escribir
};
$('btnGuardarContacto').onclick = registrarContacto;

// --- Sesión ---

$('pestanaEntrar').onclick = () => mostrarPestana('entrar');
$('pestanaCrear').onclick = () => mostrarPestana('crear');

$('formEntrar').onsubmit = async e => {
  e.preventDefault();
  try {
    await entrar($('entrarCorreo').value, $('entrarContrasena').value);
    iniciarApp();
  } catch (error) {
    mostrarErrorSesion(error.message);
  }
};

$('formCrear').onsubmit = async e => {
  e.preventDefault();
  try {
    await crearCuenta({
      nombre: $('crearNombre').value,
      correo: $('crearCorreo').value,
      contrasena: $('crearContrasena').value,
      autorizaDatos: $('crearAutoriza').checked,
    });
    iniciarApp();
  } catch (error) {
    mostrarErrorSesion(error.message);
  }
};

$('btnSalir').onclick = async () => {
  await salir();
  empezarDeNuevo();
  mostrarPestana('entrar');
  mostrarPantallaSesion(true);
};

// Con la sesión iniciada: carga los reportes de todas y arranca la app
async function iniciarApp() {
  mostrarPantallaSesion(false);
  mostrarSaludo(usuariaActual);
  mapa.invalidateSize(); // el mapa estaba oculto detrás de la pantalla de sesión
  await actualizarReportes().catch(() => instruccion('No se pudieron cargar los reportes.'));
  dibujarPuntos(todosLosPuntos());
  actualizarEstadoReportes();
  usarMiUbicacion(); // origen automático
}

// --- Inicio ---

mostrarLeyenda();
dibujarPuntos(todosLosPuntos());

if (location.protocol === 'file:') {
  // Abierta con doble clic: sin servidor no hay cuentas ni reportes compartidos
  mostrarErrorSesion('Abre Aura con el servidor: en la terminal escribe "npm start" y entra a http://localhost:3000');
} else {
  recuperarSesion().then(usuaria => (usuaria ? iniciarApp() : mostrarPantallaSesion(true)));
}

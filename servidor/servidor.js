// CONTROLADOR (servidor) · Servidor web de Aura: entrega la app y atiende la API.
// Solo usa Node.js (sin dependencias). Se inicia con: npm start

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { exec } = require('node:child_process');
const { ErrorAura } = require('./almacen');
const usuarias = require('./usuarias');
const reportes = require('./reportes');

const PUERTO = Number(process.env.PORT) || 3000;
const RAIZ = path.join(__dirname, '..');

// Carpetas de la app que se pueden descargar (nunca servidor/ ni .git)
const PUBLICAS = ['index.html', 'politica.html', 'manifest.webmanifest', 'css/', 'js/', 'img/', 'data/', 'vendor/'];

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
};

// Exige que haya una usuaria con sesión iniciada
function requiereSesion(usuaria) {
  if (!usuaria) throw new ErrorAura('Inicia sesión para continuar.', 401);
  return usuaria;
}

// --- Rutas de la API: "MÉTODO /ruta" → función que devuelve la respuesta ---
const API = {
  // Permite al navegador comprobar que le responde Aura (y no otro programa)
  'GET /api/salud': () => ({ app: 'aura', ok: true }),
  'POST /api/registro': async ({ cuerpo }) => {
    const usuaria = await usuarias.registrar(cuerpo);
    return { token: await usuarias.crearSesion(usuaria.id), usuaria };
  },
  'POST /api/sesion': async ({ cuerpo }) => {
    const usuaria = await usuarias.verificar(cuerpo);
    return { token: await usuarias.crearSesion(usuaria.id), usuaria };
  },
  'DELETE /api/sesion': async ({ token }) => {
    await usuarias.cerrarSesion(token);
    return { ok: true };
  },
  'GET /api/perfil': ({ usuaria }) => requiereSesion(usuaria),
  'PUT /api/perfil': ({ usuaria, cuerpo }) => usuarias.actualizarContacto(requiereSesion(usuaria).id, cuerpo.contacto),
  // Elimina la cuenta, sus sesiones y sus reportes (derecho de supresión, Ley 1581 de 2012)
  'DELETE /api/perfil': async ({ usuaria }) => {
    const { id } = requiereSesion(usuaria);
    await reportes.borrarReportesDe(id);
    await usuarias.eliminarCuenta(id);
    return { ok: true };
  },
  'GET /api/reportes': ({ usuaria }) => (requiereSesion(usuaria), reportes.reportesPublicos()),
  'GET /api/reportes/mios': ({ usuaria }) => reportes.reportesDe(requiereSesion(usuaria).id),
  'POST /api/reportes': ({ usuaria, cuerpo }) => reportes.crearReporte(requiereSesion(usuaria).id, cuerpo),
};

// Lee el cuerpo JSON de la petición (máximo 10 KB)
function leerCuerpo(peticion) {
  // En Vercel el cuerpo ya llega leído en peticion.body
  if ('body' in peticion) {
    return typeof peticion.body === 'string' ? JSON.parse(peticion.body || '{}') : (peticion.body || {});
  }
  return new Promise((resolver, rechazar) => {
    let datos = '';
    peticion.on('data', parte => {
      datos += parte;
      if (datos.length > 10000) rechazar(new ErrorAura('Datos demasiado grandes.', 413));
    });
    peticion.on('end', () => {
      try { resolver(datos ? JSON.parse(datos) : {}); } catch { rechazar(new ErrorAura('Datos inválidos.')); }
    });
  });
}

function responderJSON(respuesta, estado, datos) {
  respuesta.writeHead(estado, { 'Content-Type': 'application/json; charset=utf-8' });
  respuesta.end(JSON.stringify(datos));
}

async function atenderApi(peticion, respuesta, ruta) {
  const accion = API[`${peticion.method} ${ruta}`];
  if (!accion) return responderJSON(respuesta, 404, { error: 'Ruta no encontrada.' });
  try {
    const token = (peticion.headers.authorization || '').replace('Bearer ', '');
    const resultado = await accion({
      token,
      usuaria: await usuarias.usuariaDeToken(token),
      cuerpo: ['POST', 'PUT'].includes(peticion.method) ? await leerCuerpo(peticion) : {},
    });
    responderJSON(respuesta, 200, resultado);
  } catch (error) {
    if (!(error instanceof ErrorAura)) console.error(error);
    responderJSON(respuesta, error.estado || 500, { error: error instanceof ErrorAura ? error.message : 'Error del servidor.' });
  }
}

// Entrega los archivos de la app (HTML, CSS, JS, imágenes)
function servirArchivo(respuesta, ruta) {
  const relativa = ruta === '/' ? 'index.html' : decodeURIComponent(ruta).slice(1);
  const archivo = path.join(RAIZ, relativa);
  const permitida = !relativa.includes('..') && PUBLICAS.some(p => relativa === p || relativa.startsWith(p));

  if (!permitida || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) {
    respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return respuesta.end('No encontrado');
  }
  respuesta.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
  fs.createReadStream(archivo).pipe(respuesta);
}

function crearServidor() {
  return http.createServer((peticion, respuesta) => {
    const ruta = new URL(peticion.url, 'http://localhost').pathname;
    if (ruta.startsWith('/api/')) atenderApi(peticion, respuesta, ruta);
    else servirArchivo(respuesta, ruta);
  });
}

// Abre la app en el navegador (si falla, la dirección queda escrita en la terminal)
function abrirNavegador(url) {
  const comando = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(comando, () => {});
}

// Inicia el servidor; si el puerto está ocupado por otro programa, prueba el siguiente
function iniciar(puerto, intentos = 20) {
  const servidor = crearServidor();
  servidor.once('error', error => {
    if (error.code !== 'EADDRINUSE' || intentos === 0) throw error;
    console.log(`El puerto ${puerto} está ocupado por otro programa. Probando el ${puerto + 1}…`);
    iniciar(puerto + 1, intentos - 1);
  });
  servidor.listen(puerto, () => {
    const url = `http://localhost:${puerto}`;
    console.log(`\n  Aura está lista en ${url}\n  Base de datos: ${require('./almacen').DONDE}\n`);
    if (!process.env.NO_ABRIR) abrirNavegador(url);
  });
}

// Solo arranca si se ejecuta directamente (npm start), no cuando lo cargan las pruebas
if (require.main === module) iniciar(PUERTO);

module.exports = { crearServidor, atenderApi };

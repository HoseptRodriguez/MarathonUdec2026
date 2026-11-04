// CONTROLADOR (servidor) · Servidor web de Aura: entrega la app y atiende la API.
// Solo usa Node.js (sin dependencias). Se inicia con: npm start

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { ErrorAura } = require('./almacen');
const usuarias = require('./usuarias');
const reportes = require('./reportes');

const PUERTO = process.env.PORT || 3000;
const RAIZ = path.join(__dirname, '..');

// Carpetas de la app que se pueden descargar (nunca servidor/ ni .git)
const PUBLICAS = ['index.html', 'css/', 'js/', 'img/', 'data/'];

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml',
};

// Exige que haya una usuaria con sesión iniciada
function requiereSesion(usuaria) {
  if (!usuaria) throw new ErrorAura('Inicia sesión para continuar.', 401);
  return usuaria;
}

// --- Rutas de la API: "MÉTODO /ruta" → función que devuelve la respuesta ---
const API = {
  'POST /api/registro': ({ cuerpo }) => {
    const usuaria = usuarias.registrar(cuerpo);
    return { token: usuarias.crearSesion(usuaria.id), usuaria };
  },
  'POST /api/sesion': ({ cuerpo }) => {
    const usuaria = usuarias.verificar(cuerpo);
    return { token: usuarias.crearSesion(usuaria.id), usuaria };
  },
  'DELETE /api/sesion': ({ token }) => {
    usuarias.cerrarSesion(token);
    return { ok: true };
  },
  'GET /api/perfil': ({ usuaria }) => requiereSesion(usuaria),
  'PUT /api/perfil': ({ usuaria, cuerpo }) => usuarias.actualizarContacto(requiereSesion(usuaria).id, cuerpo.contacto),
  'GET /api/reportes': ({ usuaria }) => (requiereSesion(usuaria), reportes.reportesPublicos()),
  'GET /api/reportes/mios': ({ usuaria }) => reportes.reportesDe(requiereSesion(usuaria).id),
  'POST /api/reportes': ({ usuaria, cuerpo }) => reportes.crearReporte(requiereSesion(usuaria).id, cuerpo),
};

// Lee el cuerpo JSON de la petición (máximo 10 KB)
function leerCuerpo(peticion) {
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
      usuaria: usuarias.usuariaDeToken(token),
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

http.createServer((peticion, respuesta) => {
  const ruta = new URL(peticion.url, 'http://localhost').pathname;
  if (ruta.startsWith('/api/')) atenderApi(peticion, respuesta, ruta);
  else servirArchivo(respuesta, ruta);
}).listen(PUERTO, () => {
  console.log(`Aura está lista en http://localhost:${PUERTO}`);
});

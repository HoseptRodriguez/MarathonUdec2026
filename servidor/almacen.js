// MODELO (servidor) · Base de datos de Aura. Guarda colecciones de registros (usuarias, sesiones, reportes).
//
// Tiene dos formas de guardar, con las mismas tres funciones:
//   - En internet (Vercel): Upstash Redis, si existen KV_REST_API_URL y KV_REST_API_TOKEN.
//   - En el computador:     archivos JSON en servidor/datos/ (o en CARPETA_DATOS).

const fs = require('node:fs');
const path = require('node:path');

const REDIS_URL = process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN;
const CARPETA = process.env.CARPETA_DATOS || path.join(__dirname, 'datos');

const USA_REDIS = Boolean(REDIS_URL && REDIS_TOKEN);
const DONDE = USA_REDIS ? 'Upstash Redis (en la nube)' : CARPETA;

// Error con mensaje para mostrar a la usuaria y código HTTP
class ErrorAura extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}

// --- Archivos JSON: cada colección es un archivo { id: registro } ---

function leerArchivo(coleccion) {
  try {
    return JSON.parse(fs.readFileSync(path.join(CARPETA, `${coleccion}.json`), 'utf8'));
  } catch {
    return {};
  }
}

function escribirArchivo(coleccion, datos) {
  fs.mkdirSync(CARPETA, { recursive: true });
  const archivo = path.join(CARPETA, `${coleccion}.json`);
  // Primero a un archivo temporal y luego se renombra, para no dejarlo a medias
  fs.writeFileSync(`${archivo}.tmp`, JSON.stringify(datos, null, 2));
  fs.renameSync(`${archivo}.tmp`, archivo);
}

// --- Upstash Redis: cada colección es un hash "aura:<coleccion>" con campo = id ---

async function redis(...comando) {
  const respuesta = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    body: JSON.stringify(comando),
  });
  const datos = await respuesta.json();
  if (datos.error) throw new Error(`Redis: ${datos.error}`);
  return datos.result;
}

// --- Las tres funciones que usa el resto del servidor ---

// Todos los registros de una colección (lista)
async function todos(coleccion) {
  if (!USA_REDIS) return Object.values(leerArchivo(coleccion));
  const plano = (await redis('HGETALL', `aura:${coleccion}`)) || [];
  // Redis responde [id1, valor1, id2, valor2, ...]
  const registros = [];
  for (let i = 1; i < plano.length; i += 2) registros.push(JSON.parse(plano[i]));
  return registros;
}

// Crea o reemplaza un registro
async function guardarRegistro(coleccion, id, registro) {
  if (USA_REDIS) return redis('HSET', `aura:${coleccion}`, id, JSON.stringify(registro));
  const datos = leerArchivo(coleccion);
  datos[id] = registro;
  escribirArchivo(coleccion, datos);
}

async function borrarRegistro(coleccion, id) {
  if (USA_REDIS) return redis('HDEL', `aura:${coleccion}`, id);
  const datos = leerArchivo(coleccion);
  delete datos[id];
  escribirArchivo(coleccion, datos);
}

module.exports = { todos, guardarRegistro, borrarRegistro, ErrorAura, DONDE };

// MODELO (servidor) · Guarda y lee colecciones en archivos JSON dentro de servidor/datos/.
// Es simple a propósito; en producción se cambiaría por una base de datos.

const fs = require('node:fs');
const path = require('node:path');

const CARPETA = process.env.CARPETA_DATOS || path.join(__dirname, 'datos');
fs.mkdirSync(CARPETA, { recursive: true });

// Error con mensaje para mostrar a la usuaria y código HTTP
class ErrorAura extends Error {
  constructor(mensaje, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}

// Lee una colección (lista vacía si todavía no existe)
function leer(nombre) {
  try {
    return JSON.parse(fs.readFileSync(path.join(CARPETA, `${nombre}.json`), 'utf8'));
  } catch {
    return [];
  }
}

// Guarda una colección completa (primero en un archivo temporal, para no dejarla a medias)
function guardar(nombre, datos) {
  const archivo = path.join(CARPETA, `${nombre}.json`);
  fs.writeFileSync(`${archivo}.tmp`, JSON.stringify(datos, null, 2));
  fs.renameSync(`${archivo}.tmp`, archivo);
}

module.exports = { leer, guardar, ErrorAura };

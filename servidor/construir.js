// Prepara la carpeta "publico/" que Vercel entrega a los navegadores.
// Copia solo los archivos de la app, para que nunca se publiquen el servidor, las pruebas ni los datos.

const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const DESTINO = path.join(RAIZ, 'publico');
const PUBLICAS = ['index.html', 'politica.html', 'manifest.webmanifest', 'css', 'js', 'img', 'data', 'vendor'];

fs.rmSync(DESTINO, { recursive: true, force: true });
for (const nombre of PUBLICAS) {
  fs.cpSync(path.join(RAIZ, nombre), path.join(DESTINO, nombre), { recursive: true });
}
console.log(`Listo: ${PUBLICAS.join(', ')} copiados a publico/`);

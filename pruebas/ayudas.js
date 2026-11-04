// Ayudas para las pruebas.
// Los scripts del navegador no usan módulos, así que se cargan en un contexto aislado con vm.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');

// Ejecuta los scripts indicados (rutas desde la raíz del proyecto) y devuelve su contexto.
// "globales" son las cosas del navegador que se reemplazan por simulaciones (fetch, etc.).
function cargarScripts(archivos, globales = {}) {
  const contexto = vm.createContext({ ...globales });
  for (const archivo of archivos) {
    const codigo = fs.readFileSync(path.join(__dirname, '..', archivo), 'utf8');
    vm.runInContext(codigo, contexto, { filename: archivo });
  }
  return contexto;
}

// Lee una constante (const/let) de un contexto cargado con cargarScripts
function valor(contexto, nombre) {
  return vm.runInContext(nombre, contexto);
}

// Convierte objetos de otro contexto en objetos normales para poder compararlos
const plano = objeto => JSON.parse(JSON.stringify(objeto));

// Carpeta temporal vacía para la base de datos de las pruebas
function carpetaTemporal() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'aura-pruebas-'));
}

module.exports = { cargarScripts, valor, plano, carpetaTemporal };

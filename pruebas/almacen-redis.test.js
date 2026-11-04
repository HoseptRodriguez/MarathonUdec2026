// Pruebas de la base de datos en modo nube (Upstash Redis), con un Redis simulado en memoria

const test = require('node:test');
const assert = require('node:assert/strict');

// Redis falso: atiende la API REST de Upstash (POST con ["COMANDO", ...argumentos])
const hashes = {};
const comandosRecibidos = [];
globalThis.fetch = async (url, opciones) => {
  assert.equal(url, 'https://redis.ejemplo');
  assert.equal(opciones.headers.Authorization, 'Bearer clave-secreta');
  const [comando, clave, campo, valor] = JSON.parse(opciones.body);
  comandosRecibidos.push(comando);
  const hash = (hashes[clave] ||= {});
  let result = null;
  if (comando === 'HSET') { hash[campo] = valor; result = 1; }
  if (comando === 'HDEL') { result = campo in hash ? 1 : 0; delete hash[campo]; }
  if (comando === 'HGETALL') result = Object.entries(hash).flat();
  return { json: async () => ({ result }) };
};

process.env.KV_REST_API_URL = 'https://redis.ejemplo';
process.env.KV_REST_API_TOKEN = 'clave-secreta';
const almacen = require('../servidor/almacen');
const usuarias = require('../servidor/usuarias');
const reportes = require('../servidor/reportes');

test('usa Redis cuando existen las variables de Upstash', () => {
  assert.match(almacen.DONDE, /Redis/);
});

test('guardar, listar y borrar registros', async () => {
  await almacen.guardarRegistro('prueba', 'a', { id: 'a', n: 1 });
  await almacen.guardarRegistro('prueba', 'b', { id: 'b', n: 2 });
  assert.deepEqual((await almacen.todos('prueba')).map(r => r.n).sort(), [1, 2]);
  await almacen.borrarRegistro('prueba', 'a');
  assert.deepEqual(await almacen.todos('prueba'), [{ id: 'b', n: 2 }]);
  assert.ok(hashes['aura:prueba'], 'las claves llevan el prefijo aura:');
});

test('colección vacía → lista vacía', async () => {
  assert.deepEqual(await almacen.todos('no-existe'), []);
});

test('flujo completo de cuenta, sesión y reporte sobre Redis', async () => {
  const ana = await usuarias.registrar({ nombre: 'Ana', correo: 'ana@nube.co', contrasena: 'claveSegura1', autorizaDatos: true });
  const token = await usuarias.crearSesion(ana.id);
  assert.equal((await usuarias.usuariaDeToken(token)).correo, 'ana@nube.co');

  await reportes.crearReporte(ana.id, { lat: 4.34, lng: -74.36, motivo: 'Calle muy sola' });
  assert.equal((await reportes.reportesDe(ana.id)).length, 1);
  assert.equal((await reportes.reportesPublicos())[0].usuariaId, undefined);

  await usuarias.cerrarSesion(token);
  assert.equal(await usuarias.usuariaDeToken(token), null);
  assert.ok(comandosRecibidos.includes('HSET') && comandosRecibidos.includes('HDEL'));
});

test('si Redis responde con error, se informa', async () => {
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async () => ({ json: async () => ({ error: 'WRONGPASS' }) });
  await assert.rejects(almacen.todos('usuarias'), /Redis: WRONGPASS/);
  globalThis.fetch = fetchOriginal;
});

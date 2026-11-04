// Pruebas de la API completa (servidor/servidor.js): se levanta el servidor en un puerto libre

const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { carpetaTemporal } = require('./ayudas');

process.env.CARPETA_DATOS = carpetaTemporal();
const { crearServidor } = require('../servidor/servidor');

let servidor;
let base;

// OpenStreetMap simulado: el servidor de Aura no sale a internet durante las pruebas
const fetchReal = globalThis.fetch;
const pedidosExternos = [];
globalThis.fetch = async (url, opciones) => {
  if (String(url).startsWith(base)) return fetchReal(url, opciones);
  pedidosExternos.push({ url: String(url), agente: opciones?.headers?.['User-Agent'] });
  if (String(url).includes('tile.openstreetmap.org')) {
    return { ok: true, arrayBuffer: async () => new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer };
  }
  if (String(url).includes('/search?')) return { ok: true, json: async () => [{ lat: '4.336', lon: '-74.371', display_name: 'Universidad de Cundinamarca, Fusagasugá' }] };
  if (String(url).includes('/reverse?')) return { ok: true, json: async () => ({ address: { town: 'Fusagasugá', state: 'Cundinamarca' } }) };
  return { ok: true, json: async () => ({ code: 'Ok', routes: [] }) };
};

test.before(async () => {
  servidor = crearServidor();
  await new Promise(listo => servidor.listen(0, listo)); // 0 = cualquier puerto libre
  base = `http://localhost:${servidor.address().port}`;
});
test.after(() => servidor.close());

// Llama a la API y devuelve { estado, datos }
async function api(metodo, ruta, cuerpo, token) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  return { estado: r.status, datos: await r.json() };
}

// Pide una ruta tal cual (sin que fetch normalice los "..")
function rutaCruda(ruta) {
  return new Promise(listo => http.get(base + ruta, r => { r.resume(); listo(r.statusCode); }));
}

const cuenta = correo => ({ nombre: 'Ana', correo, contrasena: 'claveSegura1', autorizaDatos: true });

test('GET /api/salud responde que es Aura', async () => {
  assert.deepEqual((await api('GET', '/api/salud')).datos, { app: 'aura', ok: true });
});

test('registro, perfil, contacto y cierre de sesión', async () => {
  const { estado, datos } = await api('POST', '/api/registro', cuenta('ana@api.co'));
  assert.equal(estado, 200);
  const token = datos.token;

  assert.equal((await api('GET', '/api/perfil', null, token)).datos.nombre, 'Ana');
  assert.equal((await api('PUT', '/api/perfil', { contacto: '3005556677' }, token)).datos.contacto, '573005556677');

  await api('DELETE', '/api/sesion', null, token);
  assert.equal((await api('GET', '/api/perfil', null, token)).estado, 401);
});

test('inicio de sesión con contraseña errada → 401', async () => {
  const r = await api('POST', '/api/sesion', { correo: 'ana@api.co', contrasena: 'mala' });
  assert.equal(r.estado, 401);
  assert.match(r.datos.error, /incorrectos/);
});

test('sin sesión no se pueden ver ni crear reportes', async () => {
  assert.equal((await api('GET', '/api/reportes')).estado, 401);
  assert.equal((await api('POST', '/api/reportes', { lat: 4.34, lng: -74.36, motivo: 'x' })).estado, 401);
});

test('reportes: otra usuaria los ve en el mapa pero no en su lista', async () => {
  const ana = (await api('POST', '/api/sesion', { correo: 'ana@api.co', contrasena: 'claveSegura1' })).datos.token;
  const bea = (await api('POST', '/api/registro', cuenta('bea@api.co'))).datos.token;

  const creado = await api('POST', '/api/reportes', { lat: 4.3413, lng: -74.3651, motivo: 'Calle muy sola' }, ana);
  assert.equal(creado.estado, 200);

  const mapaDeBea = (await api('GET', '/api/reportes', null, bea)).datos;
  assert.equal(mapaDeBea.length, 1);
  assert.equal(mapaDeBea[0].usuariaId, undefined);
  assert.equal((await api('GET', '/api/reportes/mios', null, bea)).datos.length, 0);
  assert.equal((await api('GET', '/api/reportes/mios', null, ana)).datos.length, 1);
});

test('eliminar cuenta: borra la cuenta, sus sesiones y sus reportes', async () => {
  const token = (await api('POST', '/api/registro', cuenta('cata@api.co'))).datos.token;
  await api('POST', '/api/reportes', { lat: 4.34, lng: -74.36, motivo: 'Calle muy sola' }, token);
  const otra = (await api('POST', '/api/registro', cuenta('dani@api.co'))).datos.token;
  const antes = (await api('GET', '/api/reportes', null, otra)).datos.length;

  assert.equal((await api('DELETE', '/api/perfil', null, token)).estado, 200);
  assert.equal((await api('GET', '/api/perfil', null, token)).estado, 401); // la sesión ya no sirve
  assert.equal((await api('POST', '/api/sesion', { correo: 'cata@api.co', contrasena: 'claveSegura1' })).estado, 401);
  assert.equal((await api('GET', '/api/reportes', null, otra)).datos.length, antes - 1); // su reporte desapareció
  assert.equal((await api('POST', '/api/registro', cuenta('cata@api.co'))).estado, 200); // el correo queda libre
});

test('la política de datos se puede consultar sin iniciar sesión', async () => {
  assert.equal(await rutaCruda('/politica.html'), 200);
});

test('las librerías (Leaflet y SheetJS) se entregan desde el proyecto, sin depender de unpkg', async () => {
  assert.equal(await rutaCruda('/vendor/leaflet/leaflet.js'), 200);
  assert.equal(await rutaCruda('/vendor/leaflet/leaflet.css'), 200);
  assert.equal(await rutaCruda('/vendor/xlsx/xlsx.full.min.js'), 200);
  const html = await (await fetch(base + '/')).text();
  assert.ok(!html.includes('unpkg.com'), 'index.html no debe cargar nada de unpkg');
});

test('mapas: búsqueda, municipio y rutas pasan por Aura y exigen sesión', async () => {
  assert.equal((await api('GET', '/api/lugares?q=Universidad')).estado, 401);
  const token = (await api('POST', '/api/registro', cuenta('mapas@api.co'))).datos.token;

  const lugares = await api('GET', '/api/lugares?q=Universidad%20de%20Cundinamarca&lat=4.34&lng=-74.36', null, token);
  assert.equal(lugares.datos[0].lat, '4.336');
  const busqueda = pedidosExternos.find(p => p.url.includes('/search?'));
  assert.match(busqueda.url, /countrycodes=co/);
  assert.match(busqueda.url, /viewbox=/);
  assert.match(busqueda.agente, /Aura/); // OpenStreetMap exige identificarse

  assert.equal((await api('GET', '/api/municipio?lat=4.34&lng=-74.36', null, token)).datos.address.town, 'Fusagasugá');
  assert.equal((await api('GET', '/api/rutas?puntos=-74.36,4.34;-74.37,4.336', null, token)).datos.code, 'Ok');
  assert.equal((await api('GET', '/api/rutas?puntos=hola', null, token)).estado, 400);
  assert.equal((await api('GET', '/api/lugares?q=', null, token)).estado, 400);
});

test('mapas: las teselas se entregan como imagen con caché', async () => {
  const r = await fetch(`${base}/api/teselas/16/19229/31977`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('content-type'), 'image/png');
  assert.match(r.headers.get('cache-control'), /s-maxage=/);
  assert.equal((await fetch(`${base}/api/teselas/25/1/1`)).status, 404); // zoom imposible
  assert.equal((await fetch(`${base}/api/teselas/abc`)).status, 404);
});

test('datos inválidos y rutas desconocidas', async () => {
  assert.equal((await api('POST', '/api/registro', { nombre: 'x' })).estado, 400);
  assert.equal((await api('GET', '/api/no-existe')).estado, 404);
});

test('archivos: entrega la app pero nunca el servidor ni la base de datos', async () => {
  assert.equal(await rutaCruda('/'), 200);
  assert.equal(await rutaCruda('/js/controlador/app.js'), 200);
  assert.equal(await rutaCruda('/servidor/usuarias.js'), 404);
  assert.equal(await rutaCruda('/servidor/datos/usuarias.json'), 404);
  assert.equal(await rutaCruda('/css/../servidor/servidor.js'), 404);
  assert.equal(await rutaCruda('/package.json'), 404);
});

// Pruebas de las rutas (js/modelo/rutas.js), sin conexión a internet: fetch es simulado
// (las rutas se piden al servidor de Aura con llamarApi, de js/modelo/api.js)

const test = require('node:test');
const assert = require('node:assert/strict');
const { cargarScripts, plano } = require('./ayudas');

const ORIGEN = [4.3439, -74.3620];
const DESTINO = [4.3360, -74.3712];

// Respuesta simulada del servidor de rutas con una ruta de 2 km
function respuestaOsrm(distancia) {
  return {
    ok: true,
    json: async () => ({
      code: 'Ok',
      routes: [{ distance: distancia, duration: 1500, geometry: { coordinates: [[-74.362, 4.3439], [-74.3712, 4.336]] } }],
    }),
  };
}

test('puntoDeDesvio: queda a un lado de la línea recta', () => {
  const m = cargarScripts(['js/modelo/api.js', 'js/modelo/seguridad.js', 'js/modelo/rutas.js']);
  assert.deepEqual(plano(m.puntoDeDesvio([0, 0], [0, 1], 1)), [-0.3, 0.5]);
  assert.deepEqual(plano(m.puntoDeDesvio([0, 0], [0, 1], -1)), [0.3, 0.5]);
});

test('obtenerRutas: convierte la respuesta a [lat, lng], km y minutos', async () => {
  let llamadas = 0;
  const fetch = async () => { llamadas++; return respuestaOsrm(2000 + llamadas * 500); };
  const m = cargarScripts(['js/modelo/api.js', 'js/modelo/seguridad.js', 'js/modelo/rutas.js'], { fetch });

  const rutas = plano(await m.obtenerRutas(ORIGEN, DESTINO));
  assert.equal(rutas.length, 3); // directa + 2 desvíos distintos
  assert.deepEqual(rutas[0].coords[0], [4.3439, -74.362]);
  assert.equal(rutas[0].distanciaKm, 2.5);
  assert.equal(rutas[0].minutos, 25);
  assert.equal(rutas[0].aproximada, false);
});

test('obtenerRutas: no agrega desvíos iguales a la ruta directa', async () => {
  const fetch = async () => respuestaOsrm(2000); // siempre la misma distancia
  const m = cargarScripts(['js/modelo/api.js', 'js/modelo/seguridad.js', 'js/modelo/rutas.js'], { fetch });
  assert.equal((await m.obtenerRutas(ORIGEN, DESTINO)).length, 1);
});

test('obtenerRutas: sin conexión devuelve una línea recta aproximada', async () => {
  const fetch = async () => { throw new Error('sin internet'); };
  const m = cargarScripts(['js/modelo/api.js', 'js/modelo/seguridad.js', 'js/modelo/rutas.js'], { fetch });

  const [ruta] = plano(await m.obtenerRutas(ORIGEN, DESTINO));
  assert.equal(ruta.aproximada, true);
  assert.deepEqual(ruta.coords, [ORIGEN, DESTINO]);
  assert.ok(ruta.distanciaKm > 1 && ruta.distanciaKm < 1.5, `dio ${ruta.distanciaKm}`);
});

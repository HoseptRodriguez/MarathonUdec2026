// Pruebas del cálculo de seguridad (js/modelo/seguridad.js)

const test = require('node:test');
const assert = require('node:assert/strict');
const { cargarScripts, valor } = require('./ayudas');

const m = cargarScripts(['js/modelo/seguridad.js']);

// Ruta recta de ~1 km hacia el norte, en Fusagasugá
const RUTA = [[4.340, -74.370], [4.349, -74.370]];
const KM = 1;
// Un punto a ~33 m al lado de la mitad de la ruta
const cerca = tipo => ({ tipo, nombre: tipo, lat: 4.3445, lng: -74.3697 });

test('distanciaMetros: un grado de latitud mide unos 111 km', () => {
  const metros = m.distanciaMetros([0, 0], [1, 0]);
  assert.ok(Math.abs(metros - 111195) < 200, `dio ${metros}`);
});

test('distanciaASegmento: mide hasta la línea, no solo hasta las puntas', () => {
  // Punto a 0,0005° (~55 m) al lado del centro de un segmento de ~1,1 km
  const metros = m.distanciaASegmento([0.0005, 0.005], [0, 0], [0, 0.01]);
  assert.ok(Math.abs(metros - 55.6) < 1, `dio ${metros}`);
});

test('estaCercaDeRuta: cuenta puntos a menos de 60 m y descarta los lejanos', () => {
  assert.equal(m.estaCercaDeRuta([4.3445, -74.3697], RUTA), true);  // ~33 m
  assert.equal(m.estaCercaDeRuta([4.3445, -74.3680], RUTA), false); // ~220 m
});

test('calcularSeguridad: policía y Punto Violeta hacen una ruta segura', () => {
  const r = m.calcularSeguridad(RUTA, KM, [cerca('policia'), cerca('violeta')]);
  assert.equal(r.nivel, 'segura');
  assert.equal(r.cercanos.length, 2);
  assert.ok(Math.abs(r.puntaje - 6) < 0.01);
});

test('calcularSeguridad: luz y comercio dan nivel medio', () => {
  assert.equal(m.calcularSeguridad(RUTA, KM, [cerca('luz'), cerca('comercio')]).nivel, 'media');
});

test('calcularSeguridad: zonas inseguras hacen una ruta riesgosa', () => {
  assert.equal(m.calcularSeguridad(RUTA, KM, [cerca('inseguro'), cerca('luz')]).nivel, 'riesgosa');
});

test('calcularSeguridad: ignora puntos lejanos', () => {
  const lejos = { tipo: 'policia', nombre: 'x', lat: 4.3445, lng: -74.3600 };
  const r = m.calcularSeguridad(RUTA, KM, [lejos]);
  assert.equal(r.cercanos.length, 0);
  assert.equal(r.nivel, 'riesgosa');
});

test('calcularSeguridad: una ruta muy corta se divide como mínimo por 0,5 km', () => {
  const r = m.calcularSeguridad(RUTA, 0.1, [cerca('luz')]);
  assert.equal(r.puntaje, 2); // 1 / 0,5
});

test('evaluarRutas: ordena de la más segura a la menos segura', () => {
  m.PUNTOS_PRUEBA = [cerca('policia'), cerca('violeta')];
  const lejos = [[4.340, -74.360], [4.349, -74.360]];
  const rutas = [
    { coords: lejos, distanciaKm: 1 },
    { coords: RUTA, distanciaKm: 1 },
  ];
  const ordenadas = m.evaluarRutas(rutas, m.PUNTOS_PRUEBA);
  assert.equal(ordenadas[0].coords, RUTA);
  assert.equal(ordenadas[0].nivel, 'segura');
  assert.equal(ordenadas[1].nivel, 'riesgosa');
});

test('PESOS: los reportes inseguros restan y los puntos de apoyo suman', () => {
  const pesos = valor(m, 'PESOS');
  assert.ok(pesos.inseguro < 0);
  for (const tipo of ['luz', 'comercio', 'policia', 'violeta']) assert.ok(pesos[tipo] > 0);
});

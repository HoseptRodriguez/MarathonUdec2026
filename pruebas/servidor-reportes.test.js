// Pruebas de reportes en el servidor (servidor/reportes.js) con una base de datos temporal

const test = require('node:test');
const assert = require('node:assert/strict');
const { carpetaTemporal } = require('./ayudas');

process.env.CARPETA_DATOS = carpetaTemporal();
const reportes = require('../servidor/reportes');

const DATOS = {
  lat: 4.3413, lng: -74.3651, motivo: 'Acoso o hostigamiento',
  descripcion: 'Dato privado', municipio: 'Fusagasugá', departamento: 'Cundinamarca',
};

test('crearReporte: guarda el reporte con fecha y sin exponer a su dueña', async () => {
  const r = await reportes.crearReporte('ana', DATOS);
  assert.equal(r.motivo, 'Acoso o hostigamiento');
  assert.ok(r.id && r.fecha);
  assert.equal(r.usuariaId, undefined);
});

test('crearReporte: rechaza ubicaciones fuera de Colombia', async () => {
  await assert.rejects(reportes.crearReporte('ana', { ...DATOS, lat: 40.4, lng: -3.7 }), /Colombia/); // Madrid
  await assert.rejects(reportes.crearReporte('ana', { ...DATOS, lat: 'abc' }), /Colombia/);
});

test('crearReporte: exige el motivo y recorta textos largos', async () => {
  await assert.rejects(reportes.crearReporte('ana', { ...DATOS, motivo: '' }), /qué pasa/);
  const r = await reportes.crearReporte('ana', { ...DATOS, descripcion: 'x'.repeat(2000) });
  assert.equal(r.descripcion.length, 500);
});

test('reportesPublicos: todas ven la ubicación, sin dueña ni descripción', async () => {
  const publicos = await reportes.reportesPublicos();
  assert.equal(publicos.length, 2);
  for (const p of publicos) {
    assert.equal(p.tipo, 'inseguro');
    assert.equal(p.usuariaId, undefined);
    assert.equal(p.descripcion, undefined);
  }
});

test('reportesDe: cada usuaria ve solo los suyos', async () => {
  await reportes.crearReporte('bea', DATOS);
  assert.equal((await reportes.reportesDe('ana')).length, 2);
  assert.equal((await reportes.reportesDe('bea')).length, 1);
  assert.equal((await reportes.reportesDe('nadie')).length, 0);
});

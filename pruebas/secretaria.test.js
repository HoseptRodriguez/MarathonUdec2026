// Pruebas del reporte para la Secretaría de la Mujer (js/modelo/secretaria.js)

const test = require('node:test');
const assert = require('node:assert/strict');
const { cargarScripts } = require('./ayudas');

const m = cargarScripts(['js/modelo/secretaria.js'], {
  ENTIDADES: { fusagasuga: { nombre: 'Oficina de la Mujer', correo: 'mujer@ejemplo.gov.co' } },
  cargarContacto: () => '573001234567',
  enlaceWhatsAppContacto: texto => `https://wa.me/573001234567?text=${encodeURIComponent(texto)}`,
});

const REPORTE = {
  fecha: '2026-11-04T23:30:00.000Z',
  lat: 4.3413,
  lng: -74.3651,
  motivo: 'Acoso o hostigamiento',
  descripcion: 'Hombres molestando en la esquina',
  municipio: 'Fusagasugá',
  departamento: 'Cundinamarca',
};

test('normalizar: quita tildes, mayúsculas y espacios', () => {
  assert.equal(m.normalizar('  Fusagasugá '), 'fusagasuga');
  assert.equal(m.normalizar('BOGOTÁ'), 'bogota');
});

test('textoReporte: incluye municipio, situación, descripción y enlace al mapa', () => {
  const texto = m.textoReporte(REPORTE);
  assert.match(texto, /Municipio: Fusagasugá, Cundinamarca/);
  assert.match(texto, /Situación: Acoso o hostigamiento/);
  assert.match(texto, /Descripción: Hombres molestando en la esquina/);
  assert.match(texto, /https:\/\/maps\.google\.com\/\?q=4\.3413,-74\.3651/);
});

test('prepararReporteSecretaria: usa el correo del municipio y el WhatsApp del contacto', () => {
  const r = m.prepararReporteSecretaria(REPORTE);
  assert.equal(r.entidad.correo, 'mujer@ejemplo.gov.co');
  assert.ok(r.mailto.startsWith('mailto:mujer@ejemplo.gov.co?subject='));
  assert.ok(r.whatsapp.startsWith('https://wa.me/573001234567?text='));
  assert.equal(r.contacto, '573001234567');
});

test('prepararReporteSecretaria: municipio sin correo registrado → sin entidad', () => {
  const r = m.prepararReporteSecretaria({ ...REPORTE, municipio: 'Medellín' });
  assert.equal(r.entidad, null);
  assert.ok(r.mailto.startsWith('mailto:?subject='));
});

test('filasExcel: una fila por reporte con encabezados en español', () => {
  const [fila] = m.filasExcel([REPORTE]);
  assert.deepEqual(Object.keys(fila),
    ['Fecha', 'Hora', 'Municipio', 'Departamento', 'Situación', 'Descripción', 'Latitud', 'Longitud', 'Ubicación']);
  assert.equal(fila.Municipio, 'Fusagasugá');
  assert.equal(fila.Latitud, 4.3413);
});

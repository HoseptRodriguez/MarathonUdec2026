// Pruebas de cuentas y sesiones (servidor/usuarias.js) con una base de datos temporal

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { carpetaTemporal } = require('./ayudas');

process.env.CARPETA_DATOS = carpetaTemporal(); // antes de cargar el servidor
const usuarias = require('../servidor/usuarias');

const ANA = { nombre: 'Ana', correo: 'Ana@Correo.co', contrasena: 'claveSegura1', autorizaDatos: true };

test('registrar: crea la cuenta y no devuelve la contraseña', () => {
  const u = usuarias.registrar(ANA);
  assert.equal(u.nombre, 'Ana');
  assert.equal(u.correo, 'ana@correo.co'); // el correo se guarda en minúsculas
  assert.equal(u.contrasena, undefined);
});

test('registrar: la contraseña queda cifrada en la base de datos', () => {
  const datos = fs.readFileSync(path.join(process.env.CARPETA_DATOS, 'usuarias.json'), 'utf8');
  assert.ok(!datos.includes('claveSegura1'));
  assert.match(JSON.parse(datos)[0].contrasena, /^[0-9a-f]{32}:[0-9a-f]{128}$/); // sal:hash
});

test('registrar: rechaza correo repetido', () => {
  assert.throws(() => usuarias.registrar(ANA), /Ya existe una cuenta/);
});

test('registrar: valida nombre, correo, contraseña y autorización de datos', () => {
  const base = { ...ANA, correo: 'otra@correo.co' };
  assert.throws(() => usuarias.registrar({ ...base, nombre: ' ' }), /nombre/);
  assert.throws(() => usuarias.registrar({ ...base, correo: 'sin-arroba' }), /correo válido/);
  assert.throws(() => usuarias.registrar({ ...base, contrasena: '123' }), /8 caracteres/);
  assert.throws(() => usuarias.registrar({ ...base, autorizaDatos: false }), /tratamiento de datos/);
});

test('verificar: acepta la contraseña correcta y rechaza la incorrecta', () => {
  assert.equal(usuarias.verificar({ correo: 'ana@correo.co', contrasena: 'claveSegura1' }).nombre, 'Ana');
  assert.throws(() => usuarias.verificar({ correo: 'ana@correo.co', contrasena: 'otra' }), /incorrectos/);
  assert.throws(() => usuarias.verificar({ correo: 'nadie@correo.co', contrasena: 'x' }), /incorrectos/);
});

test('sesiones: el token identifica a la usuaria hasta cerrar sesión', () => {
  const { id } = usuarias.verificar({ correo: 'ana@correo.co', contrasena: 'claveSegura1' });
  const token = usuarias.crearSesion(id);
  assert.equal(usuarias.usuariaDeToken(token).id, id);
  usuarias.cerrarSesion(token);
  assert.equal(usuarias.usuariaDeToken(token), null);
  assert.equal(usuarias.usuariaDeToken('token-falso'), null);
  assert.equal(usuarias.usuariaDeToken(''), null);
});

test('sesiones: la base de datos guarda la huella del token, no el token', () => {
  const { id } = usuarias.verificar({ correo: 'ana@correo.co', contrasena: 'claveSegura1' });
  const token = usuarias.crearSesion(id);
  const datos = fs.readFileSync(path.join(process.env.CARPETA_DATOS, 'sesiones.json'), 'utf8');
  assert.ok(!datos.includes(token));
});

test('actualizarContacto: agrega el indicativo 57 a un celular colombiano', () => {
  const { id } = usuarias.verificar({ correo: 'ana@correo.co', contrasena: 'claveSegura1' });
  assert.equal(usuarias.actualizarContacto(id, '300 555 6677').contacto, '573005556677');
  assert.equal(usuarias.actualizarContacto(id, '+57 300 555 6677').contacto, '573005556677');
  assert.equal(usuarias.actualizarContacto(id, '').contacto, '');
});

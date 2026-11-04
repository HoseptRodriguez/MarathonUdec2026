// Pruebas de cuentas y sesiones (servidor/usuarias.js) con una base de datos temporal

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { carpetaTemporal } = require('./ayudas');

process.env.CARPETA_DATOS = carpetaTemporal(); // antes de cargar el servidor
const usuarias = require('../servidor/usuarias');

const ANA = { nombre: 'Ana', correo: 'Ana@Correo.co', contrasena: 'claveSegura1', autorizaDatos: true };
const leerBase = archivo => fs.readFileSync(path.join(process.env.CARPETA_DATOS, archivo), 'utf8');
const entrarComoAna = () => usuarias.verificar({ correo: 'ana@correo.co', contrasena: 'claveSegura1' });

test('registrar: crea la cuenta y no devuelve la contraseña', async () => {
  const u = await usuarias.registrar(ANA);
  assert.equal(u.nombre, 'Ana');
  assert.equal(u.correo, 'ana@correo.co'); // el correo se guarda en minúsculas
  assert.equal(u.contrasena, undefined);
});

test('registrar: la contraseña queda cifrada en la base de datos', () => {
  const datos = leerBase('usuarias.json');
  assert.ok(!datos.includes('claveSegura1'));
  assert.match(Object.values(JSON.parse(datos))[0].contrasena, /^[0-9a-f]{32}:[0-9a-f]{128}$/); // sal:hash
});

test('registrar: rechaza correo repetido', async () => {
  await assert.rejects(usuarias.registrar(ANA), /Ya existe una cuenta/);
});

test('registrar: valida nombre, correo, contraseña y autorización de datos', async () => {
  const base = { ...ANA, correo: 'otra@correo.co' };
  await assert.rejects(usuarias.registrar({ ...base, nombre: ' ' }), /nombre/);
  await assert.rejects(usuarias.registrar({ ...base, correo: 'sin-arroba' }), /correo válido/);
  await assert.rejects(usuarias.registrar({ ...base, contrasena: '123' }), /8 caracteres/);
  await assert.rejects(usuarias.registrar({ ...base, autorizaDatos: false }), /tratamiento de datos/);
});

test('verificar: acepta la contraseña correcta y rechaza la incorrecta', async () => {
  assert.equal((await entrarComoAna()).nombre, 'Ana');
  await assert.rejects(usuarias.verificar({ correo: 'ana@correo.co', contrasena: 'otra' }), /incorrectos/);
  await assert.rejects(usuarias.verificar({ correo: 'nadie@correo.co', contrasena: 'x' }), /incorrectos/);
});

test('sesiones: el token identifica a la usuaria hasta cerrar sesión', async () => {
  const { id } = await entrarComoAna();
  const token = await usuarias.crearSesion(id);
  assert.equal((await usuarias.usuariaDeToken(token)).id, id);
  await usuarias.cerrarSesion(token);
  assert.equal(await usuarias.usuariaDeToken(token), null);
  assert.equal(await usuarias.usuariaDeToken('token-falso'), null);
  assert.equal(await usuarias.usuariaDeToken(''), null);
});

test('sesiones: la base de datos guarda la huella del token, no el token', async () => {
  const token = await usuarias.crearSesion((await entrarComoAna()).id);
  assert.ok(!leerBase('sesiones.json').includes(token));
});

test('actualizarContacto: agrega el indicativo 57 a un celular colombiano', async () => {
  const { id } = await entrarComoAna();
  assert.equal((await usuarias.actualizarContacto(id, '300 555 6677')).contacto, '573005556677');
  assert.equal((await usuarias.actualizarContacto(id, '+57 300 555 6677')).contacto, '573005556677');
  assert.equal((await usuarias.actualizarContacto(id, '')).contacto, '');
});

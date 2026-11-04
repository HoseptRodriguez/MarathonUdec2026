// MODELO (servidor) · Cuentas de usuarias y sesiones.

const crypto = require('node:crypto');
const { todos, guardarRegistro, borrarRegistro, ErrorAura } = require('./almacen');

const DURACION_SESION = 30 * 24 * 60 * 60 * 1000; // 30 días

// --- Contraseñas: nunca se guardan en texto plano ---

function cifrarContrasena(contrasena) {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(contrasena, sal, 64).toString('hex');
  return `${sal}:${hash}`;
}

function contrasenaCorrecta(contrasena, guardada) {
  const [sal, hash] = guardada.split(':');
  const intento = crypto.scryptSync(contrasena, sal, 64);
  return crypto.timingSafeEqual(intento, Buffer.from(hash, 'hex'));
}

// Datos de la usuaria que sí se pueden enviar al navegador
function datosPublicos(u) {
  return { id: u.id, nombre: u.nombre, correo: u.correo, contacto: u.contacto || '' };
}

async function buscarPorCorreo(correo) {
  return (await todos('usuarias')).find(u => u.correo === correo);
}

async function buscarPorId(id) {
  return (await todos('usuarias')).find(u => u.id === id);
}

// --- Cuentas ---

async function registrar({ nombre, correo, contrasena, autorizaDatos }) {
  nombre = String(nombre || '').trim().slice(0, 80);
  correo = String(correo || '').trim().toLowerCase();
  contrasena = String(contrasena || '');

  if (!nombre) throw new ErrorAura('Escribe tu nombre.');
  if (!/^\S+@\S+\.\S+$/.test(correo)) throw new ErrorAura('Escribe un correo válido.');
  if (contrasena.length < 8) throw new ErrorAura('La contraseña debe tener al menos 8 caracteres.');
  if (!autorizaDatos) throw new ErrorAura('Debes autorizar el tratamiento de datos personales.');
  if (await buscarPorCorreo(correo)) throw new ErrorAura('Ya existe una cuenta con ese correo.');

  const usuaria = {
    id: crypto.randomUUID(),
    nombre,
    correo,
    contrasena: cifrarContrasena(contrasena),
    contacto: '',
    autorizaDatos: new Date().toISOString(), // fecha de la autorización (Ley 1581 de 2012)
  };
  await guardarRegistro('usuarias', usuaria.id, usuaria);
  return datosPublicos(usuaria);
}

async function verificar({ correo, contrasena }) {
  const usuaria = await buscarPorCorreo(String(correo || '').trim().toLowerCase());
  if (!usuaria || !contrasenaCorrecta(String(contrasena || ''), usuaria.contrasena)) {
    throw new ErrorAura('Correo o contraseña incorrectos.', 401);
  }
  return datosPublicos(usuaria);
}

async function actualizarContacto(id, contacto) {
  const usuaria = await buscarPorId(id);
  let numero = String(contacto || '').replace(/\D/g, '').slice(0, 15);
  // Celular colombiano sin indicativo (10 dígitos que empiezan por 3): se agrega el 57
  if (/^3\d{9}$/.test(numero)) numero = `57${numero}`;
  usuaria.contacto = numero;
  await guardarRegistro('usuarias', id, usuaria);
  return datosPublicos(usuaria);
}

// --- Sesiones: el navegador guarda un token; aquí solo se guarda su huella (hash) ---

const huella = token => crypto.createHash('sha256').update(token).digest('hex');
const vencida = sesion => Date.now() - sesion.creada > DURACION_SESION;

async function crearSesion(usuariaId) {
  const token = crypto.randomBytes(32).toString('hex');
  await guardarRegistro('sesiones', huella(token), { huella: huella(token), usuariaId, creada: Date.now() });
  // Limpieza de sesiones vencidas
  for (const s of (await todos('sesiones')).filter(vencida)) await borrarRegistro('sesiones', s.huella);
  return token;
}

async function usuariaDeToken(token) {
  if (!token) return null;
  const sesion = (await todos('sesiones')).find(s => s.huella === huella(token));
  if (!sesion || vencida(sesion)) return null;
  const usuaria = await buscarPorId(sesion.usuariaId);
  return usuaria ? datosPublicos(usuaria) : null;
}

async function cerrarSesion(token) {
  if (token) await borrarRegistro('sesiones', huella(token));
}

// Derecho de supresión (Ley 1581): borra la cuenta y todas sus sesiones
async function eliminarCuenta(id) {
  for (const s of (await todos('sesiones')).filter(s => s.usuariaId === id)) {
    await borrarRegistro('sesiones', s.huella);
  }
  await borrarRegistro('usuarias', id);
}

module.exports = { registrar, verificar, actualizarContacto, crearSesion, usuariaDeToken, cerrarSesion, eliminarCuenta };

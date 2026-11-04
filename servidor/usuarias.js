// MODELO (servidor) · Cuentas de usuarias y sesiones.

const crypto = require('node:crypto');
const { leer, guardar, ErrorAura } = require('./almacen');

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

// --- Cuentas ---

function registrar({ nombre, correo, contrasena, autorizaDatos }) {
  nombre = String(nombre || '').trim().slice(0, 80);
  correo = String(correo || '').trim().toLowerCase();
  contrasena = String(contrasena || '');

  if (!nombre) throw new ErrorAura('Escribe tu nombre.');
  if (!/^\S+@\S+\.\S+$/.test(correo)) throw new ErrorAura('Escribe un correo válido.');
  if (contrasena.length < 8) throw new ErrorAura('La contraseña debe tener al menos 8 caracteres.');
  if (!autorizaDatos) throw new ErrorAura('Debes autorizar el tratamiento de datos personales.');

  const usuarias = leer('usuarias');
  if (usuarias.some(u => u.correo === correo)) throw new ErrorAura('Ya existe una cuenta con ese correo.');

  const usuaria = {
    id: crypto.randomUUID(),
    nombre,
    correo,
    contrasena: cifrarContrasena(contrasena),
    contacto: '',
    autorizaDatos: new Date().toISOString(), // fecha de la autorización (Ley 1581 de 2012)
  };
  usuarias.push(usuaria);
  guardar('usuarias', usuarias);
  return datosPublicos(usuaria);
}

function verificar({ correo, contrasena }) {
  correo = String(correo || '').trim().toLowerCase();
  const usuaria = leer('usuarias').find(u => u.correo === correo);
  if (!usuaria || !contrasenaCorrecta(String(contrasena || ''), usuaria.contrasena)) {
    throw new ErrorAura('Correo o contraseña incorrectos.', 401);
  }
  return datosPublicos(usuaria);
}

function actualizarContacto(id, contacto) {
  const usuarias = leer('usuarias');
  const usuaria = usuarias.find(u => u.id === id);
  let numero = String(contacto || '').replace(/\D/g, '').slice(0, 15);
  // Celular colombiano sin indicativo (10 dígitos que empiezan por 3): se agrega el 57
  if (/^3\d{9}$/.test(numero)) numero = `57${numero}`;
  usuaria.contacto = numero;
  guardar('usuarias', usuarias);
  return datosPublicos(usuaria);
}

// --- Sesiones: el navegador guarda un token; aquí solo se guarda su huella (hash) ---

const huella = token => crypto.createHash('sha256').update(token).digest('hex');

function crearSesion(usuariaId) {
  const token = crypto.randomBytes(32).toString('hex');
  const sesiones = leer('sesiones').filter(s => Date.now() - s.creada < DURACION_SESION);
  sesiones.push({ huella: huella(token), usuariaId, creada: Date.now() });
  guardar('sesiones', sesiones);
  return token;
}

function usuariaDeToken(token) {
  if (!token) return null;
  const sesion = leer('sesiones').find(s => s.huella === huella(token));
  if (!sesion || Date.now() - sesion.creada > DURACION_SESION) return null;
  const usuaria = leer('usuarias').find(u => u.id === sesion.usuariaId);
  return usuaria ? datosPublicos(usuaria) : null;
}

function cerrarSesion(token) {
  guardar('sesiones', leer('sesiones').filter(s => s.huella !== huella(token)));
}

module.exports = { registrar, verificar, actualizarContacto, crearSesion, usuariaDeToken, cerrarSesion };

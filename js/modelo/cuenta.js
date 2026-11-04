// MODELO · Cuenta de la usuaria: registro, inicio y cierre de sesión, contacto de confianza.

let usuariaActual = null; // { id, nombre, correo, contacto }

async function crearCuenta(datos) {
  const { token, usuaria } = await llamarApi('POST', '/api/registro', datos);
  guardarToken(token);
  usuariaActual = usuaria;
  return usuaria;
}

async function entrar(correo, contrasena) {
  const { token, usuaria } = await llamarApi('POST', '/api/sesion', { correo, contrasena });
  guardarToken(token);
  usuariaActual = usuaria;
  return usuaria;
}

// Si ya había una sesión guardada en este navegador, la recupera (o devuelve null)
async function recuperarSesion() {
  if (!tokenGuardado()) return null;
  try {
    usuariaActual = await llamarApi('GET', '/api/perfil');
  } catch {
    guardarToken('');
    usuariaActual = null;
  }
  return usuariaActual;
}

async function salir() {
  await llamarApi('DELETE', '/api/sesion').catch(() => {});
  guardarToken('');
  usuariaActual = null;
}

// Borra la cuenta, sus sesiones y sus reportes (derecho de supresión, Ley 1581)
async function eliminarMiCuenta() {
  await llamarApi('DELETE', '/api/perfil');
  guardarToken('');
  usuariaActual = null;
}

// El contacto de confianza vive en la cuenta (sirve desde cualquier dispositivo)
function cargarContacto() {
  return usuariaActual ? usuariaActual.contacto : '';
}
async function guardarContacto(numero) {
  usuariaActual.contacto = numero;
  usuariaActual = await llamarApi('PUT', '/api/perfil', { contacto: numero });
}

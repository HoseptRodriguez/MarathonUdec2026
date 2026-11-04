// MODELO · Comunicación con el servidor de Aura (cuentas, perfil y reportes).

const CLAVE_TOKEN = 'aura-token';

function tokenGuardado() {
  try { return localStorage.getItem(CLAVE_TOKEN) || ''; } catch { return ''; }
}
function guardarToken(token) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch { /* sin almacenamiento: la sesión dura mientras la página esté abierta */ }
}

// ¿La página la está entregando el servidor de Aura? (y no Live Server u otro programa)
async function servidorDeAuraDisponible() {
  try {
    return (await llamarApi('GET', '/api/salud')).app === 'aura';
  } catch {
    return false;
  }
}

// Llama a la API; si el servidor responde con error, lanza ese mensaje
async function llamarApi(metodo, ruta, cuerpo) {
  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenGuardado()}` },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new Error('No hay conexión con el servidor de Aura.');
  }
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'Algo salió mal. Intenta de nuevo.');
  return datos;
}

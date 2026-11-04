// Botón SOS, contacto de confianza y modo acompañamiento.

const CLAVE_CONTACTO = 'ruta-segura-contacto';
let temporizador = null;

// Lee y guarda el número del contacto de confianza
function cargarContacto() {
  try { return localStorage.getItem(CLAVE_CONTACTO) || ''; } catch { return ''; }
}
function guardarContacto(numero) {
  try { localStorage.setItem(CLAVE_CONTACTO, numero); } catch { /* sin almacenamiento */ }
}

// Obtiene la ubicación actual; si no se puede, usa la de respaldo
function obtenerUbicacion(respaldo) {
  return new Promise(resolver => {
    if (!navigator.geolocation) return resolver(respaldo);
    navigator.geolocation.getCurrentPosition(
      pos => resolver([pos.coords.latitude, pos.coords.longitude]),
      () => resolver(respaldo),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
}

// Abre la ventana SOS con el enlace de WhatsApp listo
async function abrirSOS(respaldo, motivo = 'Necesito ayuda.') {
  document.getElementById('dialogoSOS').showModal();
  const link = document.getElementById('linkWhatsApp');
  link.textContent = 'Obteniendo ubicación…';

  const [lat, lng] = await obtenerUbicacion(respaldo);
  const mensaje = `AURA - ${motivo} Mi ubicación: https://maps.google.com/?q=${lat},${lng}`;
  link.href = `https://wa.me/${cargarContacto()}?text=${encodeURIComponent(mensaje)}`;
  link.textContent = 'Enviar mi ubicación por WhatsApp';
}

// Inicia el acompañamiento: si no confirma llegada a tiempo, abre el SOS
function iniciarAcompanamiento(minutos, alVencer) {
  clearTimeout(temporizador);
  temporizador = setTimeout(alVencer, minutos * 60 * 1000);
}

function detenerAcompanamiento() {
  clearTimeout(temporizador);
}

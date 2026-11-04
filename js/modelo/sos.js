// MODELO · Ubicación (GPS), contacto de confianza y mensaje de emergencia.

const CLAVE_CONTACTO = 'ruta-segura-contacto';

// Lee y guarda el número del contacto de confianza
function cargarContacto() {
  try { return localStorage.getItem(CLAVE_CONTACTO) || ''; } catch { return ''; }
}
function guardarContacto(numero) {
  try { localStorage.setItem(CLAVE_CONTACTO, numero); } catch { /* sin almacenamiento */ }
}

// Obtiene la ubicación actual del GPS; si no se puede, devuelve la de respaldo
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

// Enlace de WhatsApp con el mensaje de ayuda y la ubicación
function enlaceWhatsApp(pos, motivo) {
  const mensaje = `AURA - ${motivo} Mi ubicación: https://maps.google.com/?q=${pos[0]},${pos[1]}`;
  return `https://wa.me/${cargarContacto()}?text=${encodeURIComponent(mensaje)}`;
}

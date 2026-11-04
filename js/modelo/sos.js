// MODELO · Ubicación (GPS) y mensajes de WhatsApp al contacto de confianza (ver cuenta.js).

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

// Enlace de WhatsApp que abre el chat del contacto de confianza con un texto listo
function enlaceWhatsAppContacto(texto) {
  return `https://wa.me/${cargarContacto()}?text=${encodeURIComponent(texto)}`;
}

// Enlace de WhatsApp con el mensaje de ayuda y la ubicación
function enlaceWhatsApp(pos, motivo) {
  return enlaceWhatsAppContacto(`AURA - ${motivo} Mi ubicación: https://maps.google.com/?q=${pos[0]},${pos[1]}`);
}

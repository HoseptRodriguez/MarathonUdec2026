// Mapa con Leaflet: capas, marcadores y puntos de seguridad.

const CENTRO = [-36.8275, -73.0450]; // Centro de Concepción

const mapa = L.map('mapa').setView(CENTRO, 16);

// Mapa base de OpenStreetMap (se oscurece con CSS para uso nocturno)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap',
  maxZoom: 19,
}).addTo(mapa);

const capaPuntos = L.layerGroup().addTo(mapa);
const capaRutas = L.layerGroup().addTo(mapa);
const capaMarcadores = L.layerGroup().addTo(mapa);

// Crea un ícono con un emoji
function iconoEmoji(emoji) {
  return L.divIcon({ html: emoji, className: '', iconSize: [24, 24], iconAnchor: [12, 12] });
}

// Dibuja un punto de seguridad en el mapa
function dibujarPunto(punto) {
  const tipo = TIPOS[punto.tipo];
  L.marker([punto.lat, punto.lng], { icon: iconoEmoji(tipo.icono) })
    .bindPopup(`<b>${tipo.texto}</b><br>${punto.nombre}`)
    .addTo(capaPuntos);
}

// Dibuja todos los puntos (ejemplo + reportes)
function dibujarPuntos() {
  capaPuntos.clearLayers();
  todosLosPuntos().forEach(dibujarPunto);
}

// Marca el origen (A) o el destino (B)
function ponerMarcador(pos, letra) {
  L.marker(pos, { icon: iconoEmoji(letra === 'A' ? '🟣' : '🏁') })
    .bindTooltip(letra === 'A' ? 'Origen' : 'Destino')
    .addTo(capaMarcadores);
}

// Borra rutas y marcadores
function limpiarMapa() {
  capaRutas.clearLayers();
  capaMarcadores.clearLayers();
}

// Mapa con Leaflet: capas, marcadores y puntos de seguridad.

const CENTRO = [4.3405, -74.3693]; // Fusagasugá, cerca de la Universidad de Cundinamarca

const mapa = L.map('mapa').setView(CENTRO, 16);

// Mapa base de OpenStreetMap (se oscurece con CSS para uso nocturno)
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap',
  maxZoom: 19,
}).addTo(mapa);

const capaPuntos = L.layerGroup().addTo(mapa);
const capaRutas = L.layerGroup().addTo(mapa);
const capaMarcadores = L.layerGroup().addTo(mapa);
const marcadores = {}; // { origen, destino }

// Ícono de Leaflet con un círculo de color
function iconoMapa(icono, color) {
  return L.divIcon({ html: htmlMarcador(icono, color), className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
}

// Dibuja un punto de seguridad en el mapa
function dibujarPunto(punto) {
  const tipo = TIPOS[punto.tipo];
  L.marker([punto.lat, punto.lng], { icon: iconoMapa(tipo.icono, tipo.color) })
    .bindPopup(`<b>${tipo.texto}</b><br>${punto.nombre}`)
    .addTo(capaPuntos);
}

// Dibuja todos los puntos (ejemplo + reportes)
function dibujarPuntos() {
  capaPuntos.clearLayers();
  todosLosPuntos().forEach(dibujarPunto);
}

// Pone (o mueve) el marcador de origen o de destino
function ponerMarcador(pos, cual) {
  if (marcadores[cual]) capaMarcadores.removeLayer(marcadores[cual]);
  const icono = cual === 'origen' ? iconoMapa('map-pin', '#7c3aed') : iconoMapa('flag', '#111827');
  marcadores[cual] = L.marker(pos, { icon: icono, zIndexOffset: 1000 }) // encima de los demás puntos
    .bindTooltip(cual === 'origen' ? 'Origen' : 'Destino')
    .addTo(capaMarcadores);
}

// Busca una dirección o lugar en Colombia, dando prioridad a la zona que se ve en el mapa.
// Devuelve { pos, nombre } o null.
async function buscarLugar(texto) {
  const c = mapa.getCenter();
  const zona = [c.lng - 0.3, c.lat + 0.3, c.lng + 0.3, c.lat - 0.3].join(',');
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=co&accept-language=es&viewbox=${zona}&q=${encodeURIComponent(texto)}`;
  const resultados = await (await fetch(url)).json();
  if (!resultados.length) return null;
  const lugar = resultados[0];
  return { pos: [+lugar.lat, +lugar.lon], nombre: lugar.display_name.split(',').slice(0, 2).join(',') };
}

// Borra rutas y marcadores
function limpiarMapa() {
  capaRutas.clearLayers();
  capaMarcadores.clearLayers();
  delete marcadores.origen;
  delete marcadores.destino;
}

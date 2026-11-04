// VISTA · Mapa con Leaflet: dibuja puntos, marcadores y rutas.

const CENTRO = [4.3405, -74.3693]; // Fusagasugá, cerca de la Universidad de Cundinamarca

const COLORES_RUTA = { segura: '#22c55e', media: '#eab308', riesgosa: '#ef4444' };

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

// Dibuja los puntos de seguridad (ejemplo + reportes)
function dibujarPuntos(puntos) {
  capaPuntos.clearLayers();
  puntos.forEach(punto => {
    const tipo = TIPOS[punto.tipo];
    L.marker([punto.lat, punto.lng], { icon: iconoMapa(tipo.icono, tipo.color) })
      .bindPopup(`<b>${tipo.texto}</b><br>${punto.nombre}`)
      .addTo(capaPuntos);
  });
}

// Pone (o mueve) el marcador de origen o de destino
function ponerMarcador(pos, cual) {
  if (marcadores[cual]) capaMarcadores.removeLayer(marcadores[cual]);
  const icono = cual === 'origen' ? iconoMapa('map-pin', '#7c3aed') : iconoMapa('flag', '#111827');
  marcadores[cual] = L.marker(pos, { icon: icono, zIndexOffset: 1000 }) // encima de los demás puntos
    .bindTooltip(cual === 'origen' ? 'Origen' : 'Destino')
    .addTo(capaMarcadores);
}

// Dibuja las rutas; la seleccionada va más gruesa y encima de las demás
function dibujarRutas(rutas, seleccionada) {
  capaRutas.clearLayers();
  rutas.forEach((ruta, i) => {
    const elegida = i === seleccionada;
    const linea = L.polyline(ruta.coords, {
      color: COLORES_RUTA[ruta.nivel],
      weight: elegida ? 8 : 4,
      opacity: elegida ? 1 : 0.45,
      dashArray: ruta.aproximada ? '8 8' : null,
    }).addTo(capaRutas);
    if (elegida) linea.bringToFront();
  });
}

// Mueve el mapa a una posición, o para que se vea toda una ruta
function centrarEn(pos) {
  mapa.setView(pos, 16);
}
function encuadrar(coords) {
  mapa.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
}

// Centro actual del mapa como [lat, lng]
function centroDelMapa() {
  const c = mapa.getCenter();
  return [c.lat, c.lng];
}

// Avisa al controlador cuando se toca el mapa
function alTocarMapa(funcion) {
  mapa.on('click', e => funcion([e.latlng.lat, e.latlng.lng]));
}

// Borra rutas y marcadores
function limpiarMapa() {
  capaRutas.clearLayers();
  capaMarcadores.clearLayers();
  delete marcadores.origen;
  delete marcadores.destino;
}

// MODELO · Rutas a pie entre dos puntos.
// Las calcula OSRM de FOSSGIS (OpenStreetMap); se piden a través del servidor de Aura.

// Pide las rutas que pasan por la lista de puntos ([lat, lng])
async function pedirRutas(puntos) {
  const texto = puntos.map(p => `${p[1].toFixed(6)},${p[0].toFixed(6)}`).join(';');
  const datos = await llamarApi('GET', `/api/rutas?puntos=${texto}`);
  if (datos.code !== 'Ok') throw new Error(datos.code);

  return datos.routes.map(r => ({
    // GeoJSON entrega [lng, lat]; Leaflet usa [lat, lng]
    coords: r.geometry.coordinates.map(c => [c[1], c[0]]),
    distanciaKm: r.distance / 1000,
    minutos: Math.round(r.duration / 60),
    aproximada: false,
  }));
}

// Punto de desvío a un lado de la línea recta (lado = 1 o -1)
function puntoDeDesvio(origen, destino, lado) {
  const medio = [(origen[0] + destino[0]) / 2, (origen[1] + destino[1]) / 2];
  const dLat = destino[0] - origen[0];
  const dLng = destino[1] - origen[1];
  // Perpendicular a la línea recta, a un 30 % de su largo
  return [medio[0] - dLng * 0.3 * lado, medio[1] + dLat * 0.3 * lado];
}

// Devuelve la ruta directa y desvíos por cada lado, para comparar alternativas
async function obtenerRutas(origen, destino) {
  try {
    const rutas = await pedirRutas([origen, destino]);

    for (const lado of [1, -1]) {
      if (rutas.length >= 3) break;
      const desvio = await pedirRutas([origen, puntoDeDesvio(origen, destino, lado), destino]).catch(() => []);
      // Solo se agrega si es distinta a las que ya hay (más de 5 % de diferencia en largo)
      if (desvio[0] && rutas.every(r => Math.abs(r.distanciaKm - desvio[0].distanciaKm) > r.distanciaKm * 0.05)) {
        rutas.push(desvio[0]);
      }
    }
    return rutas;
  } catch (error) {
    // Respaldo: línea recta, para que la app siga funcionando sin el servidor
    const distanciaKm = distanciaMetros(origen, destino) / 1000;
    return [{ coords: [origen, destino], distanciaKm, minutos: Math.round(distanciaKm / 4.5 * 60), aproximada: true }];
  }
}

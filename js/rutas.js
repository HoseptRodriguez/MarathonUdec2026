// Obtiene rutas a pie y las dibuja con el color de su nivel de seguridad.

// Servidor público de rutas a pie (OSRM de FOSSGIS sobre OpenStreetMap)
const URL_RUTAS = 'https://routing.openstreetmap.de/routed-foot/route/v1/driving/';

const COLORES = { segura: '#22c55e', media: '#eab308', riesgosa: '#ef4444' };

// Pide hasta 3 rutas alternativas entre origen y destino ([lat, lng])
async function obtenerRutas(origen, destino) {
  const puntos = `${origen[1]},${origen[0]};${destino[1]},${destino[0]}`;
  try {
    const respuesta = await fetch(`${URL_RUTAS}${puntos}?alternatives=3&geometries=geojson&overview=full`);
    const datos = await respuesta.json();
    if (datos.code !== 'Ok') throw new Error(datos.code);

    return datos.routes.map(r => ({
      // GeoJSON entrega [lng, lat]; Leaflet usa [lat, lng]
      coords: r.geometry.coordinates.map(c => [c[1], c[0]]),
      distanciaKm: r.distance / 1000,
      minutos: Math.round(r.duration / 60),
      aproximada: false,
    }));
  } catch (error) {
    // Respaldo: línea recta, para que la app siga funcionando sin el servidor
    const distanciaKm = mapa.distance(origen, destino) / 1000;
    return [{ coords: [origen, destino], distanciaKm, minutos: Math.round(distanciaKm / 4.5 * 60), aproximada: true }];
  }
}

// Dibuja las rutas; la seleccionada va más gruesa y encima de las demás
function dibujarRutas(rutas, seleccionada) {
  capaRutas.clearLayers();
  rutas.forEach((ruta, i) => {
    const elegida = i === seleccionada;
    const linea = L.polyline(ruta.coords, {
      color: COLORES[ruta.nivel],
      weight: elegida ? 8 : 4,
      opacity: elegida ? 1 : 0.45,
      dashArray: ruta.aproximada ? '8 8' : null,
    }).addTo(capaRutas);
    if (elegida) linea.bringToFront();
  });
}

// Muestra las tarjetas de rutas en el panel
function mostrarListaRutas(rutas, seleccionada, alElegir) {
  const lista = document.getElementById('listaRutas');
  lista.innerHTML = '<h2>Rutas (de más a menos segura)</h2>';

  rutas.forEach((ruta, i) => {
    const conteo = {};
    ruta.cercanos.forEach(p => { conteo[p.tipo] = (conteo[p.tipo] || 0) + 1; });
    const resumen = Object.keys(conteo).map(t => `${TIPOS[t].icono}×${conteo[t]}`).join('  ') || 'Sin puntos de apoyo cerca';

    const tarjeta = document.createElement('div');
    tarjeta.className = `ruta ${ruta.nivel}` + (i === seleccionada ? ' seleccionada' : '');
    tarjeta.innerHTML = `
      <b>${ruta.nivel}</b> · ${ruta.distanciaKm.toFixed(1)} km · ${ruta.minutos} min
      <div class="nota">${resumen}</div>
      ${ruta.aproximada ? '<div class="nota">Ruta aproximada (sin conexión al servidor de rutas)</div>' : ''}`;
    tarjeta.onclick = () => alElegir(i);
    lista.appendChild(tarjeta);
  });
}

// Cálculo del nivel de seguridad de una ruta.
// Idea: cada punto cercano a la ruta suma (da seguridad) o resta (es riesgoso).

// Cuánto aporta cada tipo de punto
const PESOS = { luz: 1, comercio: 2, carabineros: 3, violeta: 3, inseguro: -4 };

// Cómo se muestra cada tipo en el mapa y la leyenda
const TIPOS = {
  luz:         { icono: '💡', texto: 'Zona iluminada' },
  comercio:    { icono: '🏪', texto: 'Comercio abierto 24 h' },
  carabineros: { icono: '👮', texto: 'Carabineros' },
  violeta:     { icono: '💜', texto: 'Punto Violeta (apoyo a mujeres)' },
  inseguro:    { icono: '⚠️', texto: 'Zona insegura reportada' },
};

// Un punto cuenta si está a menos de esta distancia de la ruta
const RADIO_METROS = 60;

// Convierte [lat, lng] a metros (x, y) respecto de un punto de referencia
function aMetros(punto, referencia) {
  const rad = Math.PI / 180;
  const radioTierra = 6371000;
  return {
    x: (punto[1] - referencia[1]) * rad * radioTierra * Math.cos(referencia[0] * rad),
    y: (punto[0] - referencia[0]) * rad * radioTierra,
  };
}

// Distancia en metros desde un punto P al segmento de calle A-B
function distanciaASegmento(p, a, b) {
  const A = aMetros(a, p);
  const B = aMetros(b, p);
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const largo2 = dx * dx + dy * dy;
  // t indica en qué parte del segmento está el punto más cercano (0 = A, 1 = B)
  const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, -(A.x * dx + A.y * dy) / largo2));
  return Math.hypot(A.x + t * dx, A.y + t * dy);
}

// ¿El punto está cerca de algún tramo de la ruta?
function estaCercaDeRuta(punto, coords) {
  for (let i = 0; i < coords.length - 1; i++) {
    if (distanciaASegmento(punto, coords[i], coords[i + 1]) < RADIO_METROS) return true;
  }
  return false;
}

// Devuelve { puntaje, nivel, cercanos } para una ruta
function calcularSeguridad(coords, distanciaKm, puntos) {
  const cercanos = puntos.filter(p => estaCercaDeRuta([p.lat, p.lng], coords));
  const suma = cercanos.reduce((total, p) => total + PESOS[p.tipo], 0);

  // Puntaje por kilómetro, para no favorecer rutas largas solo por tener más puntos
  const puntaje = suma / Math.max(distanciaKm, 0.5);

  let nivel = 'riesgosa';
  if (puntaje >= 4) nivel = 'segura';
  else if (puntaje >= 1) nivel = 'media';

  return { puntaje, nivel, cercanos };
}

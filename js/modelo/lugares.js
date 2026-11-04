// MODELO · Búsqueda de lugares en Colombia (Nominatim de OpenStreetMap).

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/';

// Busca una dirección o lugar en Colombia, dando prioridad a la zona alrededor de "centro".
// Devuelve { pos, nombre } o null.
async function buscarLugar(texto, centro) {
  const zona = [centro[1] - 0.3, centro[0] + 0.3, centro[1] + 0.3, centro[0] - 0.3].join(',');
  const url = `${URL_NOMINATIM}search?format=json&limit=1&countrycodes=co&accept-language=es&viewbox=${zona}&q=${encodeURIComponent(texto)}`;
  const resultados = await (await fetch(url)).json();
  if (!resultados.length) return null;
  const lugar = resultados[0];
  return { pos: [+lugar.lat, +lugar.lon], nombre: lugar.display_name.split(',').slice(0, 2).join(',') };
}

// Dice en qué municipio y departamento está una ubicación
async function obtenerMunicipio(pos) {
  try {
    const url = `${URL_NOMINATIM}reverse?format=json&zoom=10&accept-language=es&lat=${pos[0]}&lon=${pos[1]}`;
    const a = (await (await fetch(url)).json()).address || {};
    return {
      // OpenStreetMap a veces dice "Fusagasugá ciudad": se quita "ciudad"
      municipio: (a.city || a.town || a.village || a.municipality || a.county || 'Municipio no identificado').replace(/ ciudad$/i, ''),
      departamento: a.state || '',
    };
  } catch {
    return { municipio: 'Municipio no identificado', departamento: '' };
  }
}

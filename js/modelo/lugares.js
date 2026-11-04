// MODELO · Búsqueda de lugares en Colombia (Nominatim de OpenStreetMap, a través del servidor de Aura).

// Busca una dirección o lugar en Colombia, dando prioridad a la zona alrededor de "centro".
// Devuelve { pos, nombre } o null.
async function buscarLugar(texto, centro) {
  const consulta = `q=${encodeURIComponent(texto)}&lat=${centro[0]}&lng=${centro[1]}`;
  const resultados = await llamarApi('GET', `/api/lugares?${consulta}`);
  if (!resultados.length) return null;
  const lugar = resultados[0];
  return { pos: [+lugar.lat, +lugar.lon], nombre: lugar.display_name.split(',').slice(0, 2).join(',') };
}

// Dice en qué municipio y departamento está una ubicación
async function obtenerMunicipio(pos) {
  try {
    const a = (await llamarApi('GET', `/api/municipio?lat=${pos[0]}&lng=${pos[1]}`)).address || {};
    return {
      // OpenStreetMap a veces dice "Fusagasugá ciudad": se quita "ciudad"
      municipio: (a.city || a.town || a.village || a.municipality || a.county || 'Municipio no identificado').replace(/ ciudad$/i, ''),
      departamento: a.state || '',
    };
  } catch {
    return { municipio: 'Municipio no identificado', departamento: '' };
  }
}

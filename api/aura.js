// Entrada de la API cuando Aura está publicada en Vercel.
// vercel.json envía /api/<ruta> aquí como /api/aura?ruta=<ruta>; se atiende con el mismo código del servidor local.

const { atenderApi } = require('../servidor/servidor');

module.exports = (peticion, respuesta) => {
  const url = new URL(peticion.url, 'http://localhost');
  const ruta = `/api/${url.searchParams.get('ruta') || ''}`;
  return atenderApi(peticion, respuesta, ruta);
};

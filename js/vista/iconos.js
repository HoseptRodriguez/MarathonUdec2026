// VISTA · Cómo se muestra cada tipo de punto (íconos de Lucide en img/iconos/).

const TIPOS = {
  luz:      { icono: 'lightbulb',       color: '#d97706', texto: 'Zona iluminada' },
  comercio: { icono: 'store',           color: '#2563eb', texto: 'Comercio abierto 24 h' },
  policia:  { icono: 'shield',          color: '#0f766e', texto: 'CAI / Policía' },
  violeta:  { icono: 'heart-handshake', color: '#7c3aed', texto: 'Punto Violeta (apoyo a mujeres)' },
  inseguro: { icono: 'triangle-alert',  color: '#dc2626', texto: 'Zona insegura reportada' },
};

// HTML del círculo de color con el ícono (se usa en el mapa, la leyenda y las rutas)
function htmlMarcador(icono, color) {
  return `<span class="marcador" style="background:${color}"><img src="img/iconos/${icono}.svg" alt=""></span>`;
}

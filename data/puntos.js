// Puntos DE EJEMPLO en Fusagasugá (Cundinamarca, Colombia).
// No son datos oficiales: están puestos para que el demo
// Parque Principal (Plaza Mayor) → Universidad de Cundinamarca muestre rutas distintas:
//   - la ruta más corta (por el sureste) pasa por zonas inseguras → riesgosa
//   - la ruta por el oeste tiene policía, comercio y luz          → segura
//   - el desvío del oeste suma un tramo conflictivo                → media
// Tipos: luz, comercio, policia, violeta (punto de apoyo), inseguro.
const PUNTOS = [
  // Inicio y fin (todas las rutas pasan por aquí)
  { tipo: 'violeta', nombre: 'Punto Violeta Parque Principal', lat: 4.34391, lng: -74.36197 },
  { tipo: 'comercio', nombre: 'Droguería 24 h', lat: 4.34380, lng: -74.36210 },
  { tipo: 'policia', nombre: 'CAI Universidad', lat: 4.33600, lng: -74.37120 },
  { tipo: 'violeta', nombre: 'Punto Violeta Universidad de Cundinamarca', lat: 4.33590, lng: -74.37130 },

  // Ruta por el oeste: bien iluminada y con comercio
  { tipo: 'policia', nombre: 'CAI Centro (ejemplo)', lat: 4.34130, lng: -74.36508 },
  { tipo: 'comercio', nombre: 'Supermercado 24 h', lat: 4.34109, lng: -74.36663 },
  { tipo: 'luz', nombre: 'Calle iluminada', lat: 4.34165, lng: -74.36830 },
  { tipo: 'comercio', nombre: 'Estación de gasolina 24 h', lat: 4.34080, lng: -74.36973 },
  { tipo: 'luz', nombre: 'Avenida iluminada', lat: 4.33955, lng: -74.37074 },
  { tipo: 'luz', nombre: 'Avenida iluminada', lat: 4.33761, lng: -74.37201 },

  // Desvío del oeste: tramo conflictivo
  { tipo: 'inseguro', nombre: 'Cuadra sin alumbrado', lat: 4.34269, lng: -74.36891 },
  { tipo: 'inseguro', nombre: 'Reportes de acoso', lat: 4.34243, lng: -74.36935 },
  { tipo: 'inseguro', nombre: 'Lote baldío', lat: 4.34249, lng: -74.36997 },

  // Ruta más corta (sureste): zonas inseguras
  { tipo: 'inseguro', nombre: 'Calle solitaria de noche', lat: 4.33970, lng: -74.36309 },
  { tipo: 'inseguro', nombre: 'Tramo sin alumbrado', lat: 4.33727, lng: -74.36527 },
  { tipo: 'inseguro', nombre: 'Puente peatonal oscuro', lat: 4.33473, lng: -74.36826 },
  { tipo: 'inseguro', nombre: 'Esquina sin alumbrado', lat: 4.33911, lng: -74.36383 },
  { tipo: 'inseguro', nombre: 'Tramo solitario de noche', lat: 4.33596, lng: -74.36645 },
];

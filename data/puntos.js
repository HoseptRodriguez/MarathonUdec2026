// Puntos DE EJEMPLO en Fusagasugá (Cundinamarca, Colombia).
// No son datos oficiales: están puestos para que el demo
// "Fusagasugá" de OpenStreetMap (4.34495, -74.36742) → Universidad de Cundinamarca
// muestre rutas distintas:
//   - la ruta directa (más corta) pasa por zonas inseguras  → riesgosa
//   - el desvío largo tiene algo de apoyo                    → media
//   - el otro desvío tiene policía, comercio y luz           → segura
// Tipos: luz, comercio, policia, violeta (punto de apoyo), inseguro.
const PUNTOS = [
  // Inicio y fin (todas las rutas pasan por aquí)
  { tipo: 'violeta', nombre: 'Punto Violeta (ejemplo)', lat: 4.34490, lng: -74.36735 },
  { tipo: 'comercio', nombre: 'Droguería 24 h', lat: 4.34500, lng: -74.36750 },
  { tipo: 'policia', nombre: 'CAI Universidad', lat: 4.33600, lng: -74.37120 },
  { tipo: 'violeta', nombre: 'Punto Violeta Universidad de Cundinamarca', lat: 4.33590, lng: -74.37130 },

  // Ruta directa: zonas inseguras
  { tipo: 'inseguro', nombre: 'Cuadra sin alumbrado', lat: 4.34129, lng: -74.36758 },
  { tipo: 'inseguro', nombre: 'Lote baldío', lat: 4.34152, lng: -74.36915 },
  { tipo: 'inseguro', nombre: 'Reportes de acoso', lat: 4.34023, lng: -74.37019 },

  // Desvío largo: algo de apoyo
  { tipo: 'policia', nombre: 'CAI barrio (ejemplo)', lat: 4.34243, lng: -74.36997 },
  { tipo: 'comercio', nombre: 'Tienda 24 h', lat: 4.34282, lng: -74.37106 },
  { tipo: 'luz', nombre: 'Calle iluminada', lat: 4.34178, lng: -74.37168 },
  { tipo: 'luz', nombre: 'Calle iluminada', lat: 4.34223, lng: -74.37144 },
  { tipo: 'violeta', nombre: 'Punto Violeta comunal', lat: 4.34264, lng: -74.37056 },

  // Desvío seguro: bien iluminado y con comercio
  { tipo: 'policia', nombre: 'CAI Avenida (ejemplo)', lat: 4.34015, lng: -74.36704 },
  { tipo: 'comercio', nombre: 'Supermercado 24 h', lat: 4.33926, lng: -74.36672 },
  { tipo: 'luz', nombre: 'Avenida iluminada', lat: 4.33994, lng: -74.36732 },
  { tipo: 'luz', nombre: 'Avenida iluminada', lat: 4.33939, lng: -74.36803 },
  { tipo: 'comercio', nombre: 'Estación de servicio 24 h', lat: 4.33859, lng: -74.36867 },
  { tipo: 'luz', nombre: 'Avenida iluminada', lat: 4.33904, lng: -74.37009 },
];

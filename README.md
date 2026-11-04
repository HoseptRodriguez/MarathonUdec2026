# 🌙 Ruta Nocturna Segura

Maratón IA UdeC 2026 · Problemática: **ruta nocturna segura para mujeres en el espacio público**.

## El problema
En Fusagasugá (Cundinamarca), como en muchas ciudades, de noche muchas mujeres eligen su camino a pie con miedo y sin información: no saben qué calles están iluminadas, dónde hay comercio abierto o un CAI de Policía, ni qué lugares han tenido reportes de acoso. Las apps de mapas sugieren la ruta **más corta**, no la **más segura**.

## La solución
Una app web que:
1. **Recomienda la ruta más segura** entre dos puntos. Compara rutas a pie alternativas y les asigna un nivel 🟢 Segura / 🟡 Media / 🔴 Riesgosa.
2. **Explica por qué**: cuenta los puntos de apoyo y riesgo cercanos a cada ruta (💡 iluminación, 🏪 comercio 24 h, 👮 CAI/Policía, 💜 Puntos Violeta, ⚠️ zonas inseguras).
3. **Permite reportar zonas inseguras**. Los reportes se ven en el mapa y bajan la nota de las rutas que pasan cerca.
4. **Tiene un botón SOS** que envía la ubicación por WhatsApp a un contacto de confianza y llama con un toque a la línea 123 (emergencias) y a la 155 (orientación a mujeres víctimas de violencia).
5. **Ofrece un modo acompañamiento**: si no confirmas que llegaste en X minutos, se abre el SOS.

## Cómo se calcula la seguridad
En `js/seguridad.js`, cada punto a menos de **60 m** de la ruta suma su peso:

| Tipo | Peso |
|---|---|
| 💡 Zona iluminada | +1 |
| 🏪 Comercio 24 h | +2 |
| 👮 CAI / Policía | +3 |
| 💜 Punto Violeta | +3 |
| ⚠️ Zona insegura | −4 |

El total se divide por los kilómetros de la ruta. Si da 4 o más, la ruta es **segura**; entre 1 y 4, **media**; menos de 1, **riesgosa**.

## Cómo ejecutarlo (VS Code)
1. Abrir la carpeta en VS Code e instalar la extensión recomendada **Live Server** (`ritwickdey.LiveServer`).
2. Clic derecho en `index.html` → **Open with Live Server**.
3. Tocar el mapa para marcar el origen y luego el destino.

**Demo para el jurado:** botón **▶ Ver demo**. Traza las rutas del Parque Principal (Plaza Mayor) a la Universidad de Cundinamarca:

| Ruta | Distancia | Nivel |
|---|---|---|
| Por el oeste | 2,0 km · 27 min | 🟢 Segura (recomendada) |
| Desvío del oeste | 2,4 km · 32 min | 🟡 Media |
| Por el sureste (la más corta) | 1,9 km · 25 min | 🔴 Riesgosa |

**La ruta más corta no es la más segura.** Después se puede reportar una zona insegura sobre la ruta verde y ver cómo cambia la recomendación.

> También funciona abriendo `index.html` directamente, pero "Usar mi ubicación" necesita `localhost` (Live Server) o HTTPS.

## Estructura
```
index.html          Interfaz (panel, mapa, ventanas SOS y reporte)
css/estilos.css     Tema oscuro, botones grandes, diseño para celular
data/puntos.js      Puntos de EJEMPLO en Fusagasugá
js/seguridad.js     Cálculo del nivel de seguridad (el corazón de la idea)
js/reportes.js      Reportes de usuarias (localStorage)
js/mapa.js          Mapa Leaflet y marcadores
js/rutas.js         Rutas a pie (OSRM/FOSSGIS) y tarjetas de rutas
js/sos.js           SOS, contacto de confianza, acompañamiento
js/app.js           Conecta todo
```

Tecnologías: HTML, CSS y JavaScript sin frameworks, más [Leaflet](https://leafletjs.com), OpenStreetMap y el servidor público de rutas a pie de FOSSGIS. No usa claves de API.

## Limitaciones y mejoras futuras
- Los puntos son **datos de ejemplo**. El siguiente paso es cargar datos reales: luminarias municipales, CAI de Policía, comercio 24 h y Puntos Violeta.
- Los reportes se guardan solo en el navegador. Con un backend serían compartidos entre todas las usuarias, y podrían moderarse y expirar con el tiempo.
- Ponderar por hora del día, alertas en tiempo real y compartir el trayecto en vivo.
- Si el servidor de rutas no responde, se muestra una línea recta como respaldo.
- Para tener siempre alternativas que comparar, además de la ruta directa se piden desvíos por cada lado de la línea recta (`js/rutas.js`).

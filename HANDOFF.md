# HANDOFF — Maratón IA UdeC 2026: "Ruta Nocturna Segura"

Documento de traspaso para que otro agente continúe el trabajo con todo el contexto.
Fecha: 2026-11-04.

## 1. Encargo original (del equipo)

> Maratón con IA. Hay que desarrollar una solución hecha con código para la problemática:
> **"Ruta nocturna segura para mujeres en el espacio público seguro"**.
> Repositorio: https://github.com/HoseptRodriguez/MarathonUdec2026.git
> El equipo trabaja con **Live Share en VS Code**.
> Requisitos: hacerlo **rápido**, **sin gastar muchos tokens**, que quede **perfecto** y con **código fácil de entender**.

## 2. Estado actual (verificado el 2026-11-04)

- **MVP implementado y en `main`.** Están hechas las funciones 1 a 7 de la sección 3, incluido el modo acompañamiento. Ver `README.md`.
- Se probó en Chrome headless: devuelve 2 rutas reales a pie, calcula el puntaje y no da errores de JS.
- Cambios respecto del plan:
  - Ciudad base: **Concepción**.
  - Los puntos están en `data/puntos.js` (no `.json`) para que funcione también abriendo el archivo sin servidor.
  - Rutas a pie con el servidor de FOSSGIS (`routing.openstreetmap.de/routed-foot`), porque `router.project-osrm.org` solo calcula rutas en auto.
  - Mapa base OSM oscurecido con CSS, porque CARTO ahora exige API key.
  - Se agregó `js/app.js`, que conecta todo.
- Se ejecuta en VS Code con la extensión Live Server, recomendada en `.vscode/extensions.json`.
- Pendiente o mejorable: los datos de ejemplo hacen que ambas rutas del demo salgan "segura" (conviene ajustar los puntos para mostrar contraste); faltan pruebas en un celular real y verificar el SOS por WhatsApp en un teléfono.

## 3. Solución propuesta (MVP)

App web de una sola página que ayuda a una mujer a elegir la ruta más segura de noche entre dos puntos, y a pedir ayuda si la necesita.

### Funciones clave
1. **Mapa** (Leaflet + OpenStreetMap, sin API key) centrado en la ciudad (p. ej. Concepción / Chillán, Chile — *por confirmar con el equipo*).
2. **Origen y destino**: clic en el mapa (o "usar mi ubicación").
3. **Rutas**: pedir rutas a pie al servicio público OSRM (`https://router.project-osrm.org/route/v1/foot/...?alternatives=true&geometries=geojson`).
4. **Puntaje de seguridad** de cada ruta, calculado con puntos de un archivo `data/puntos.json`:
   - Suman: postes de luz / zonas iluminadas, carabineros, comercios 24 h, "puntos violeta" / refugios.
   - Restan: reportes de zonas inseguras (poca luz, acoso, sitio eriazo).
   - Regla simple: para cada punto a < 50 m de la ruta, sumar su peso; normalizar por longitud. Mostrar **Segura / Media / Riesgosa** con color verde / amarillo / rojo.
5. **Reportar zona insegura**: botón → clic en el mapa → tipo de reporte → se guarda en `localStorage` y se dibuja.
6. **Botón SOS**: comparte la ubicación actual por WhatsApp (`https://wa.me/?text=...`) a un contacto de confianza guardado, y muestra números de emergencia (Chile: 133 Carabineros, 1455 Fono Orientación Violencia contra la Mujer, 131 SAMU — *verificar*).
7. **Modo acompañamiento** (opcional si sobra tiempo): temporizador "avísame si no llego en X min" → si no se confirma llegada, abre el SOS.

### Stack (mínimo, sin build)
- HTML + CSS + JavaScript puro. Leaflet por CDN (`https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` y `.css`).
- Se ejecuta abriendo `index.html` o con `npx serve .` / la extensión Live Server de VS Code (la geolocalización requiere `localhost` o HTTPS).

### Estructura de archivos propuesta
```
MarathonUdec2026/
├── index.html        # Estructura: mapa, panel lateral, botones SOS/Reportar
├── css/estilos.css   # Tema oscuro (uso nocturno), botones grandes, móvil primero
├── js/mapa.js        # Iniciar Leaflet, marcadores de origen/destino
├── js/rutas.js       # Llamada a OSRM y dibujo de rutas alternativas
├── js/seguridad.js   # Cálculo del puntaje de seguridad (función pura, fácil de explicar)
├── js/reportes.js    # Reportes de usuarias en localStorage
├── js/sos.js         # Botón SOS, contacto de confianza, números de emergencia
├── data/puntos.json  # Puntos de ejemplo (luz, carabineros, comercios 24 h, zonas inseguras)
└── README.md         # Problema, solución, cómo ejecutar, capturas, equipo
```

### Principios de código (pedidos por el equipo)
- Funciones cortas, nombres en español, un comentario breve por función.
- Sin frameworks ni dependencias salvo Leaflet.
- Diseño accesible: contraste alto, botones grandes, funciona en celular.

## 4. Próximos pasos (en orden)
1. Confirmar ciudad base con el equipo y crear `data/puntos.json` con ~20–30 puntos de ejemplo cerca del centro.
2. `index.html` + `css/estilos.css` + `js/mapa.js` (mapa funcionando).
3. `js/rutas.js` (rutas OSRM con alternativas).
4. `js/seguridad.js` (puntaje y colores) — es el corazón de la propuesta.
5. `js/reportes.js` y `js/sos.js`.
6. `README.md` para el jurado (problema, impacto, cómo usar, limitaciones, mejoras futuras: datos reales de luminarias municipales, reportes compartidos en backend, alertas en tiempo real).
7. Probar en navegador (también en vista móvil) y hacer commit + push a `main`.

## 5. Notas para el siguiente agente
- Responder al usuario en **español**.
- No hacer commit/push sin que el equipo lo pida (el resto del equipo edita por Live Share).
- OSRM público puede ser lento o tener límite de uso; si falla, mostrar un mensaje claro y dibujar una línea recta como respaldo.
- Los datos de `puntos.json` son **de ejemplo**; dejarlo dicho en el README.

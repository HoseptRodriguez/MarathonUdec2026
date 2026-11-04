# HANDOFF: Aura, ruta nocturna segura (Maratón IA UdeC 2026)

Documento de traspaso para que otro agente continúe con todo el contexto.
Última actualización: 2026-11-04 (refactor a MVC).

## 1. Encargo
- Maratón con IA. Problemática: **ruta nocturna segura para mujeres en el espacio público**.
- El equipo trabaja con **Live Share en VS Code**. Pide rapidez, pocos tokens, resultado pulido y **código fácil de entender**.
- Idioma: **español de Colombia**, tanto en la interfaz como en las respuestas al equipo.
- La app se llama **Aura** y debe servir en **toda Colombia**. La ciudad del demo es **Fusagasugá (Cundinamarca)**.
- El equipo autorizó hacer commit y push a `main` sin preguntar.

## 2. Dónde está
- Carpeta local: `C:\Users\KTFUS\MarathonUdec2026` (es la que se abre en VS Code).
- Repositorio: https://github.com/HoseptRodriguez/MarathonUdec2026, rama `main`.
- Cómo ejecutarlo: VS Code → extensión **Live Server** (recomendada en `.vscode/extensions.json`) → clic derecho en `index.html` → **Open with Live Server**. También se puede abrir `index.html` directamente, pero sin `localhost`/HTTPS no funciona el GPS.

## 3. Qué hace (todo implementado y probado)
1. **Origen automático**: al abrir, usa el GPS como origen ("Mi ubicación").
2. **Destino por texto**: el campo "Hasta" busca direcciones y lugares en Colombia con Nominatim (`countrycodes=co`), dando prioridad a la zona visible del mapa. "Desde" también se puede editar.
3. **Opción de pin**: los botones "Origen" y "Destino" eligen qué marca el próximo toque en el mapa.
4. **Rutas a pie puntuadas**: Segura, Media o Riesgosa según los puntos a menos de 60 m (iluminación, comercio 24 h, CAI/Policía, Punto Violeta, zonas inseguras). El servidor de rutas casi siempre devuelve una sola, así que también se piden desvíos por cada lado.
5. **Reportar zona insegura**: se guarda en localStorage, se dibuja y vuelve a calcular las rutas.
6. **Reporte a la Secretaría de la Mujer**: detecta el municipio (geocodificación inversa de Nominatim), arma un texto formal y permite enviarlo por WhatsApp al contacto de confianza, por correo (`mailto`) o copiarlo. Descarga todos los reportes en un **.xlsx real** (SheetJS 0.18.5 de cdnjs). El contacto se guarda solo mientras se escribe.
7. **SOS**: envía la ubicación por WhatsApp al contacto de confianza y llama a la línea 123 (emergencias) o a la 155 (orientación a mujeres víctimas de violencia).
8. **Acompañamiento**: si no se confirma la llegada en X minutos, se abre el SOS.
9. **Demo**: el botón "Ver demo" traza rutas del Parque Principal (Plaza Mayor, 4.3439103, -74.3619659) a la Universidad de Cundinamarca (4.3359848, -74.3712360). Salen segura (2,0 km), media (2,4 km) y riesgosa (1,9 km, la más corta).
10. **Sin emojis**: se usan íconos de **Lucide** (ISC) en `img/iconos/` y una foto de portada de Wikimedia Commons (CC0) en `img/portada.jpg`. Los créditos están al pie del panel.

## 4. Arquitectura: Modelo-Vista-Controlador
Pedido explícito del equipo. Se usan scripts globales sin módulos ES, para que funcione con doble clic (file://). El orden en index.html es: Modelo, luego Vista, luego Controlador.
- **Modelo** (`data/`, `js/modelo/`): seguridad.js (pesos y puntaje, evaluarRutas), rutas.js (FOSSGIS + desvíos), reportes.js (localStorage), lugares.js (Nominatim: buscarLugar(texto, centro), obtenerMunicipio), sos.js (GPS, contacto, enlaceWhatsApp), secretaria.js (prepararReporteSecretaria, filasExcel). **No usa document ni Leaflet** (verificado con grep).
- **Vista** (`js/vista/`): iconos.js (TIPOS, htmlMarcador), mapa.js (Leaflet: dibujarPuntos, ponerMarcador, dibujarRutas, encuadrar, alTocarMapa), panel.js (instruccion, mostrarListaRutas, ventanas, descargarExcel).
- **Controlador** (`js/controlador/app.js`): estado (origen, destino, rutas, modoClic, modoReporte, temporizador) y todos los eventos.

## 5. Decisiones técnicas
- Rutas: `https://routing.openstreetmap.de/routed-foot/route/v1/driving/...`, porque `router.project-osrm.org` solo calcula rutas en auto.
- Mapa base: teselas OSM con `filter: invert(1) hue-rotate(180deg)`, porque CARTO dark exige API key.
- Puntos en `.js` y no en `.json`, para que funcione con `file://`.
- Ninguna API necesita clave.

## 6. Pendientes
- **Correo oficial** de la Secretaría/Oficina de la Mujer de Fusagasugá en `data/entidades.js`: no se encontró uno verificado, así que no hay que inventarlo.
- Verificar con el equipo las líneas 123 y 155.
- Probar en un celular físico, en especial el GPS (requiere HTTPS o localhost) y que el SOS abra WhatsApp.
- Un solo reporte sobre la ruta verde no le cambia el nivel; harían falta 2 o 3. Se podría subir el peso de los reportes.
- Los reportes viven en el localStorage de **cada navegador y cada origen**: los hechos en file:// no aparecen en Live Server (127.0.0.1:5500) y viceversa, ni en el navegador de otro compañero. Para compartirlos se necesita un backend.
- Ideas futuras: datos reales (luminarias, CAI), backend para compartir reportes entre usuarias, ponderar por hora.

## 7. Cómo se probó
Chrome headless con DevTools Protocol, simulando el GPS con `Emulation.setGeolocationOverride`, clics con `mapa.fire('click', ...)` y capturas de pantalla. Sin errores de JS en ninguno de los flujos: demo, destino escrito, pin, reporte con Secretaría, buscador y vista de celular de 390 px.

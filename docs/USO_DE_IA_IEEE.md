# Aura: rutas nocturnas seguras para mujeres en Colombia desarrolladas con asistencia de inteligencia artificial

**Autores:** [Nombres de las integrantes y los integrantes del equipo], Maratón de IA UdeC 2026, Fusagasugá, Colombia.

---

***Resumen*—** Este documento describe el desarrollo de Aura, una aplicación web que recomienda rutas peatonales nocturnas más seguras para mujeres. Aura permite reportar zonas inseguras, enviar esos reportes a la Secretaría de la Mujer del municipio y pedir ayuda mediante un botón SOS. Se declara de forma explícita el uso de inteligencia artificial (IA) generativa: el código, las pruebas y la documentación fueron producidos con el asistente de programación Claude Code [1] a partir de instrucciones del equipo, que definió el problema, los requisitos y las decisiones, y revisó los resultados. Se detallan la metodología, la división de responsabilidades entre el equipo y la IA, los mecanismos de verificación (39 pruebas automatizadas y pruebas de extremo a extremo en navegador) y las limitaciones éticas y técnicas.

***Términos clave*—** inteligencia artificial generativa, seguridad urbana, violencia de género, sistemas de información geográfica, aplicaciones web, desarrollo asistido por IA.

---

## I. Introducción

El acoso y la inseguridad en el espacio público condicionan la movilidad de las mujeres, en especial de noche. Las aplicaciones de mapas convencionales recomiendan la ruta **más corta**, no la **más segura**.

Aura aborda este problema en Fusagasugá (Cundinamarca) y es extensible a cualquier municipio de Colombia. El reto se resolvió en una maratón con tiempo limitado, en la que el equipo usó IA generativa como herramienta principal de desarrollo. Siguiendo la política de IEEE sobre contenido generado por IA [2], ese uso se declara en este documento y en la sección de Agradecimientos.

## II. Descripción de la solución

Aura es una aplicación web con arquitectura **Modelo-Vista-Controlador** tanto en el navegador como en el servidor (Node.js sin dependencias). Sus funciones son:

1. **Cuentas de usuaria:** contraseñas cifradas con scrypt y autorización de tratamiento de datos según la Ley 1581 de 2012 [3].
2. **Origen y destino:** el origen se obtiene por GPS y el destino se busca por dirección con Nominatim [4].
3. **Rutas puntuadas:** se calculan rutas a pie con OSRM [5] sobre OpenStreetMap [6] y se clasifican como segura, media o riesgosa. El puntaje es la suma ponderada, por kilómetro, de los puntos de apoyo y de riesgo a menos de 60 m de la ruta.
4. **Reportes compartidos:** se muestran anónimamente en el mapa de todas las usuarias. Se pueden enviar por WhatsApp o por correo a la Secretaría de la Mujer, y descargar en Excel [7].
5. **SOS y acompañamiento:** el botón SOS comparte la ubicación con el contacto de confianza y da acceso a las líneas 123 y 155. El modo acompañamiento abre el SOS si la usuaria no confirma su llegada.

El mapa se dibuja con Leaflet [8] y los íconos son de Lucide [9].

## III. Metodología de uso de la IA

### A. Herramienta
Se usó **Claude Code** [1], de Anthropic, con el modelo *Claude Opus 5.5* (`claude-opus-5-5`). Claude Code es un agente de programación que lee y escribe archivos, ejecuta comandos y pruebas, y publica cambios en Git. El equipo trabajó en Visual Studio Code con Live Share.

### B. Proceso iterativo
El desarrollo avanzó en ciclos cortos. En cada uno, el equipo dio una instrucción en lenguaje natural y la IA implementó, probó y publicó el cambio. Las iteraciones, en orden, fueron:

1. Plan inicial y documento de traspaso entre agentes (`HANDOFF.md`).
2. Producto mínimo: mapa, rutas, puntaje, reportes, SOS y acompañamiento.
3. Cambio de la ciudad a Fusagasugá; datos de ejemplo que producen rutas de distinto nivel y botón de demostración desde el Parque Principal.
4. Adaptación a Colombia (CAI, líneas 123 y 155, indicativo 57) y reportes a la Secretaría de la Mujer.
5. Origen automático por GPS y destino por dirección; reemplazo de emojis por íconos y fotografía de bancos libres.
6. Reestructuración a Modelo-Vista-Controlador.
7. Envío por WhatsApp al contacto de confianza y descarga en Excel real (.xlsx).
8. Servidor con cuentas de usuaria y reportes compartidos.
9. Corrección del arranque cuando el puerto está ocupado, pruebas unitarias y manuales.

### C. División de responsabilidades

| Actividad | Equipo humano | IA (Claude Code) |
|---|---|---|
| Definición del problema y del público objetivo | Sí | No |
| Requisitos (ciudad, nombre "Aura", MVC, inicio de sesión, Excel, WhatsApp) | Sí | Propuso alternativas |
| Diseño de la arquitectura y del algoritmo de puntaje | Aprobó | Propuso e implementó |
| Escritura del código fuente | No | Sí |
| Pruebas automatizadas y de navegador | Revisión | Sí |
| Detección y corrección de errores | Reportó fallas | Diagnosticó y corrigió |
| Documentación (README, manuales, este documento) | Revisión | Borrador |
| Decisión de publicar cambios en el repositorio | Autorizó | Ejecutó |

## IV. Verificación del trabajo generado por IA

El código generado por IA no se aceptó sin evidencia. Se aplicaron cinco controles:

1. **Pruebas unitarias e integración** con `node:test` [10]: 39 pruebas, 39 aprobadas. Cubren el cálculo de seguridad, las rutas (con red simulada), el reporte a la Secretaría, cuentas y sesiones, reportes y la API completa por HTTP, incluida la protección de archivos.
2. **Pruebas de extremo a extremo** en Chrome sin interfaz (DevTools Protocol), con GPS simulado. El recorrido fue: registro de dos usuarias, contacto de confianza, reporte, enlace de WhatsApp, descarga de Excel, cierre de sesión y persistencia de la sesión. No hubo errores de JavaScript.
3. **Revisión visual** con capturas de pantalla, en escritorio y en celular (390 px).
4. **Verificación de fuentes:** coordenadas reales consultadas en OpenStreetMap, por ejemplo el Parque Principal (Plaza Mayor) y la Universidad de Cundinamarca. No se incluyó ningún correo institucional que no pudiera verificarse.
5. **Fallas reales detectadas por el equipo y corregidas:**
   - el número de WhatsApp no se guardaba si no se pulsaba "Guardar";
   - el CSV se abría mal en Excel;
   - la creación de cuenta fallaba porque el puerto 3000 estaba ocupado por otro programa.

## V. Consideraciones éticas y limitaciones

- **Datos de ejemplo:** los puntos de seguridad de Fusagasugá son ilustrativos, no oficiales. Una ruta "segura" en Aura no garantiza seguridad real.
- **Privacidad:** los reportes son anónimos para las demás usuarias, las contraseñas se cifran y se solicita la autorización de la Ley 1581 de 2012 [3]. Antes de una puesta en producción falta la política de tratamiento de datos y la publicación con HTTPS.
- **Sesgos:** el puntaje depende de la densidad de datos. Zonas con pocos reportes o pocos datos pueden parecer más riesgosas o más seguras de lo que son.
- **Dependencia de servicios externos:** las teselas, Nominatim y OSRM públicos tienen políticas de uso justo [4].
- **Responsabilidad:** la IA no figura como autora, según las pautas de IEEE [2]. La responsabilidad sobre el contenido es del equipo.

## VI. Conclusiones

La IA generativa permitió construir, en una sola jornada, una aplicación funcional con arquitectura MVC, servidor con cuentas, pruebas automatizadas y documentación. El aporte humano fue decisivo en la definición del problema, los requisitos y la detección de fallas en el uso real. Los siguientes pasos son:

- integrar datos oficiales (luminarias, CAI, Puntos Violeta);
- publicar la aplicación con HTTPS y base de datos administrada;
- validarla con mujeres de Fusagasugá.

## Agradecimientos

*Declaración de uso de IA (según la política de IEEE sobre contenido generado por IA [2]):* el código fuente, las pruebas automatizadas, el README, los manuales técnico y de usuaria y el borrador de este documento fueron generados con el asistente Claude Code (Anthropic, modelo Claude Opus 5.5) [1], a partir de instrucciones del equipo. El equipo definió el problema y los requisitos, revisó y probó los resultados y es responsable de su contenido. La fotografía de portada es "Bogotá city and street lights", de AltaGamba (Unsplash), dominio público CC0, vía Wikimedia Commons [11].

## Referencias

[1] Anthropic, "Claude Code," 2026. [En línea]. Disponible: https://www.anthropic.com/claude-code. Accedido: 4 nov. 2026.

[2] IEEE, "Author guidelines for artificial intelligence (AI)-generated text," IEEE Open. [En línea]. Disponible: https://open.ieee.org/author-guidelines-for-artificial-intelligence-ai-generated-text/. Accedido: 4 nov. 2026.

[3] Congreso de la República de Colombia, "Ley Estatutaria 1581 de 2012, por la cual se dictan disposiciones generales para la protección de datos personales," Diario Oficial, oct. 2012. [En línea]. Disponible: https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981

[4] OpenStreetMap Foundation, "Nominatim usage policy." [En línea]. Disponible: https://operations.osmfoundation.org/policies/nominatim/. Accedido: 4 nov. 2026.

[5] Project OSRM, "Open Source Routing Machine." [En línea]. Disponible: https://project-osrm.org/. Servidor peatonal de FOSSGIS: https://routing.openstreetmap.de/. Accedido: 4 nov. 2026.

[6] OpenStreetMap contributors, "Copyright and license." [En línea]. Disponible: https://www.openstreetmap.org/copyright. Accedido: 4 nov. 2026.

[7] SheetJS LLC, "SheetJS Community Edition documentation." [En línea]. Disponible: https://docs.sheetjs.com/. Accedido: 4 nov. 2026.

[8] V. Agafonkin, "Leaflet: an open-source JavaScript library for interactive maps," v1.9.4. [En línea]. Disponible: https://leafletjs.com/. Accedido: 4 nov. 2026.

[9] Lucide contributors, "Lucide icons," ISC License, v0.460.0. [En línea]. Disponible: https://lucide.dev/. Accedido: 4 nov. 2026.

[10] OpenJS Foundation, "Node.js test runner (node:test)." [En línea]. Disponible: https://nodejs.org/api/test.html. Accedido: 4 nov. 2026.

[11] AltaGamba, "Bogotá city and street lights (Unsplash).jpg," Wikimedia Commons, CC0. [En línea]. Disponible: https://commons.wikimedia.org/wiki/File:Bogot%C3%A1_city_and_street_lights_(Unsplash).jpg. Accedido: 4 nov. 2026.

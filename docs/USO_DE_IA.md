# Uso de Inteligencia Artificial en el Desarrollo de Aura: Ruta Nocturna Segura para Mujeres

## Resumen

Este documento describe el desarrollo de Aura, una aplicación web que recomienda rutas peatonales nocturnas más seguras para mujeres en Fusagasugá y el resto de Colombia. Aura permite reportar zonas inseguras, enviar esos reportes a la Secretaría de la Mujer del municipio y pedir ayuda mediante un botón SOS. Se declara de forma explícita el uso de inteligencia artificial (IA) generativa: el código, las pruebas y la documentación se produjeron con el asistente de programación Claude Code (Anthropic, 2026), a partir de instrucciones del equipo, que definió el problema, los requisitos y las decisiones, y revisó los resultados. Se detallan la metodología, la división de responsabilidades entre el equipo y la IA, los mecanismos de verificación (47 pruebas automatizadas y pruebas en navegador sobre la aplicación publicada) y las limitaciones éticas y técnicas.

*Palabras clave:* inteligencia artificial generativa, seguridad urbana, violencia de género, sistemas de información geográfica, desarrollo asistido por IA.

## Introducción

El acoso y la inseguridad en el espacio público condicionan la movilidad de las mujeres, en especial de noche. Las aplicaciones de mapas convencionales recomiendan la ruta **más corta**, no la **más segura**.

Aura aborda este problema en Fusagasugá (Cundinamarca) y es extensible a cualquier municipio de Colombia. El reto se resolvió en una maratón con tiempo limitado, en la que el equipo usó IA generativa como herramienta principal de desarrollo. Por transparencia académica, este documento declara ese uso y cita la herramienta como lo indica la séptima edición de las normas APA.

## Descripción de la Solución

Aura está publicada en https://aura-mujeres.vercel.app. Es una aplicación web con arquitectura Modelo-Vista-Controlador tanto en el navegador como en el servidor (Node.js sin dependencias). Sus funciones son:

1. **Cuentas de usuaria:** contraseñas cifradas, autorización de tratamiento de datos (Congreso de la República de Colombia, 2012) y opción de eliminar la cuenta con todos sus datos.
2. **Origen y destino:** el origen se obtiene por GPS y el destino se busca por dirección con Nominatim (OpenStreetMap Foundation, s. f.).
3. **Rutas puntuadas:** se calculan rutas a pie con OSRM (Project OSRM, s. f.) sobre datos de OpenStreetMap (OpenStreetMap contributors, s. f.) y se clasifican como segura, media o riesgosa. El puntaje es la suma ponderada, por kilómetro, de los puntos de apoyo y de riesgo a menos de 60 m de la ruta.
4. **Reportes compartidos:** se muestran anónimamente en el mapa de todas las usuarias. Se pueden enviar por WhatsApp o por correo a la Secretaría de la Mujer y descargar en Excel (SheetJS LLC, s. f.).
5. **SOS y acompañamiento:** el botón SOS comparte la ubicación con el contacto de confianza y da acceso a las líneas 123 y 155.

El mapa se dibuja con Leaflet (Agafonkin, 2023) y los íconos provienen de Lucide (Lucide Contributors, s. f.).

## Metodología de Uso de la IA

### Herramienta

Se usó Claude Code (Anthropic, 2026), con el modelo Claude Opus 5.5. Claude Code es un agente de programación que lee y escribe archivos, ejecuta comandos y pruebas, y publica cambios en Git. El equipo trabajó en Visual Studio Code con Live Share.

### Proceso Iterativo

El desarrollo avanzó en ciclos cortos. En cada uno, el equipo dio una instrucción en lenguaje natural y la IA implementó, probó y publicó el cambio. Las iteraciones fueron:

1. Plan inicial y documento de traspaso entre agentes.
2. Producto mínimo: mapa, rutas, puntaje, reportes, SOS y acompañamiento.
3. Cambio de la ciudad a Fusagasugá y botón de demostración desde el Parque Principal.
4. Adaptación a Colombia (CAI, líneas 123 y 155, indicativo 57) y reportes a la Secretaría de la Mujer.
5. Origen automático por GPS y destino por dirección; íconos y fotografía de bancos libres.
6. Reestructuración a Modelo-Vista-Controlador.
7. Envío por WhatsApp al contacto de confianza y descarga en Excel.
8. Servidor con cuentas de usuaria y reportes compartidos.
9. Pruebas unitarias, manuales y publicación en Vercel con base de datos Upstash Redis (Upstash, s. f.).
10. Política de tratamiento de datos y opción de eliminar la cuenta.

### División de Responsabilidades

| Actividad | Equipo humano | IA (Claude Code) |
|---|---|---|
| Definición del problema y del público objetivo | Sí | No |
| Requisitos (ciudad, nombre "Aura", MVC, inicio de sesión, Excel, WhatsApp) | Sí | Propuso alternativas |
| Diseño de la arquitectura y del algoritmo de puntaje | Aprobó | Propuso e implementó |
| Escritura del código fuente | No | Sí |
| Pruebas automatizadas y en navegador | Revisión | Sí |
| Detección y corrección de errores | Reportó fallas | Diagnosticó y corrigió |
| Documentación (manuales, política y este documento) | Revisión | Borrador |
| Aceptación de términos de servicios y publicación | Aceptó y autorizó | Ejecutó |

## Verificación del Trabajo Generado por IA

El código generado por IA no se aceptó sin evidencia. Se aplicaron cinco controles:

1. **Pruebas automatizadas:** 47 pruebas con el ejecutor de pruebas de Node.js (OpenJS Foundation, s. f.), todas aprobadas. Cubren el cálculo de seguridad, las rutas, el reporte a la Secretaría, cuentas y sesiones, reportes, la base de datos en la nube (simulada), la API completa y la protección de archivos.
2. **Pruebas en navegador sobre la aplicación publicada:** registro desde el formulario, mensajes de error, reporte, eliminación de la cuenta y política de datos. Los datos de prueba se borraron después.
3. **Revisión visual:** capturas de pantalla en escritorio y en celular.
4. **Verificación de fuentes:** las coordenadas reales se consultaron en OpenStreetMap. No se incluyó ningún correo institucional que no pudiera verificarse.
5. **Fallas reales corregidas.** Algunas las detectó el equipo y otras las pruebas:
   - el contacto de WhatsApp no se guardaba sin pulsar "Guardar";
   - el CSV se abría mal en Excel;
   - el puerto 3000 estaba ocupado por otro programa;
   - la caída del servidor externo de librerías (unpkg) impedía crear cuentas. Se resolvió incluyendo las librerías en el propio proyecto.

## Consideraciones Éticas y Limitaciones

- **Datos de ejemplo:** los puntos de seguridad de Fusagasugá son ilustrativos, no oficiales. Una ruta "segura" en Aura no garantiza seguridad real.
- **Privacidad:** los reportes son anónimos para las demás usuarias y las contraseñas se cifran. La aplicación publica una política de tratamiento de datos conforme a la Ley 1581 de 2012 (Congreso de la República de Colombia, 2012), cuyas responsables son las autoras y el autor de este documento.
- **Sesgos:** el puntaje depende de la densidad de datos. Las zonas con pocos reportes pueden parecer más riesgosas o más seguras de lo que son.
- **Dependencia de servicios externos:** el mapa, Nominatim y OSRM públicos tienen políticas de uso justo (OpenStreetMap Foundation, s. f.).
- **Autoría:** la IA no figura como autora. La responsabilidad sobre el contenido es del equipo.

## Conclusiones

La IA generativa permitió construir y publicar en una sola jornada una aplicación funcional con arquitectura Modelo-Vista-Controlador, cuentas de usuaria, base de datos en la nube, pruebas automatizadas y documentación. El aporte humano fue decisivo en la definición del problema y de los requisitos, en la aceptación de los servicios y en la detección de fallas en el uso real. Los siguientes pasos son:

- integrar datos oficiales de luminarias, CAI y Puntos Violeta;
- validar la aplicación con mujeres de Fusagasugá.

## Declaración de Uso de Inteligencia Artificial

El código fuente, las pruebas automatizadas, los manuales técnico y de usuaria, la política de tratamiento de datos y el borrador de este documento se generaron con Claude Code (Anthropic, 2026), a partir de instrucciones de Natalia Velasquez, Isabela Lombana y Hosept Rodriguez. El equipo revisó y probó los resultados y es responsable de su contenido. La fotografía de portada de la aplicación es de AltaGamba (s. f.), de dominio público.

## Referencias

Agafonkin, V. (2023). *Leaflet* (Versión 1.9.4) [Software]. https://leafletjs.com/

AltaGamba. (s. f.). *Bogotá city and street lights* [Fotografía]. Wikimedia Commons. https://commons.wikimedia.org/wiki/File:Bogot%C3%A1_city_and_street_lights_(Unsplash).jpg

Anthropic. (2026). *Claude Code* (Modelo Claude Opus 5.5) [Asistente de programación con inteligencia artificial]. https://www.anthropic.com/claude-code

Congreso de la República de Colombia. (2012, 17 de octubre). *Ley Estatutaria 1581 de 2012, por la cual se dictan disposiciones generales para la protección de datos personales*. Función Pública. https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981

Lucide Contributors. (s. f.). *Lucide* (Versión 0.460.0) [Software]. https://lucide.dev/

OpenJS Foundation. (s. f.). *Test runner*. Documentación de Node.js. https://nodejs.org/api/test.html

OpenStreetMap contributors. (s. f.). *Copyright and license*. OpenStreetMap. https://www.openstreetmap.org/copyright

OpenStreetMap Foundation. (s. f.). *Nominatim usage policy*. https://operations.osmfoundation.org/policies/nominatim/

Project OSRM. (s. f.). *Open Source Routing Machine*. https://project-osrm.org/

SheetJS LLC. (s. f.). *SheetJS Community Edition* (Versión 0.18.5) [Software]. https://docs.sheetjs.com/

Upstash. (s. f.). *Upstash Redis*. https://upstash.com/docs/redis/overall/getstarted

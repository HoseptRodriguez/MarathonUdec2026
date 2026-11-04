# Aura · Ruta nocturna segura

Maratón IA UdeC 2026 · Problemática: **ruta nocturna segura para mujeres en el espacio público**.

**Usar Aura:** https://aura-mujeres.vercel.app

Equipo: Natalia Velasquez, Isabela Lombana y Hosept Rodriguez.

## El problema
En Fusagasugá (Cundinamarca), como en muchas ciudades, de noche muchas mujeres eligen su camino a pie con miedo y sin información: no saben qué calles están iluminadas, dónde hay comercio abierto o un CAI de Policía, ni qué lugares han tenido reportes de acoso. Las apps de mapas sugieren la ruta **más corta**, no la **más segura**.

## La solución
Una app web que:
0. **Detecta el origen automáticamente** (GPS) y busca el destino escrito; marcar en el mapa sigue siendo opcional.
1. **Recomienda la ruta más segura** entre dos puntos. Compara rutas a pie alternativas y les asigna un nivel Segura / Media / Riesgosa.
2. **Explica por qué**: cuenta los puntos de apoyo y riesgo cercanos a cada ruta (iluminación, comercio 24 h, CAI/Policía, Puntos Violeta, zonas inseguras).
3. **Permite reportar zonas inseguras**. Los reportes se ven en el mapa y bajan la nota de las rutas que pasan cerca.
4. **Tiene un botón SOS** que envía la ubicación por WhatsApp a un contacto de confianza y llama con un toque a la línea 123 (emergencias) y a la 155 (orientación a mujeres víctimas de violencia).
5. **Ofrece un modo acompañamiento**: si no confirmas que llegaste en X minutos, se abre el SOS.
6. **Envía reportes a la Secretaría de la Mujer**: arma un reporte formal (fecha, hora, municipio, situación, descripción y ubicación) y lo envía por WhatsApp al contacto de confianza registrado, por correo o copiándolo. Los correos oficiales por municipio se configuran en `data/entidades.js`. También se pueden descargar todos los reportes en un archivo de Excel (.xlsx).
7. **Funciona en toda Colombia**: tiene un buscador de ciudades y barrios, las rutas a pie sirven en cualquier municipio y las líneas 123 y 155 son nacionales. Los puntos de ejemplo solo están en Fusagasugá.

## Cómo se calcula la seguridad
En `js/seguridad.js`, cada punto a menos de **60 m** de la ruta suma su peso:

| Tipo | Peso |
|---|---|
| Zona iluminada | +1 |
| Comercio 24 h | +2 |
| CAI / Policía | +3 |
| Punto Violeta | +3 |
| Zona insegura | −4 |

El total se divide por los kilómetros de la ruta. Si da 4 o más, la ruta es **segura**; entre 1 y 4, **media**; menos de 1, **riesgosa**.

## Cómo ejecutarlo (VS Code)
Requisito: [Node.js](https://nodejs.org) 18 o superior. No hay que instalar paquetes.

1. Abrir la carpeta `MarathonUdec2026` en VS Code.
2. Abrir la terminal (**Terminal → New Terminal**) y escribir `npm start`.
3. Aura se abre sola en el navegador (http://localhost:3000). Si ese puerto está ocupado por otro programa, usa el siguiente libre y la terminal muestra la dirección.
4. **Crear cuenta** (nombre, correo, contraseña y autorización de datos) o **Entrar**.
5. El origen se toma solo con el GPS. Escribe el destino en "Hasta" y pulsa **Buscar ruta segura**. También puedes marcar origen o destino tocando el mapa.

Con Live Share, quien comparte la sesión ejecuta `npm start` y comparte el puerto 3000 (**Live Share → Share Server**). Así el resto del equipo puede usar la misma Aura, con las mismas cuentas y reportes.

**Pruebas unitarias:** `npm test` (39 pruebas con `node:test`, sin dependencias).

## Documentación
- [Manual de usuaria](docs/MANUAL_USUARIA.md)
- [Manual técnico](docs/MANUAL_TECNICO.md): instalación, arquitectura, base de datos, API, seguridad, pruebas y despliegue.
- [Uso de IA (APA 7)](docs/USO_DE_IA.md)

## Cuentas y reportes
- Cada mujer tiene su **cuenta**. La contraseña se guarda cifrada (scrypt) y la sesión dura 30 días en el dispositivo.
- Los **reportes se guardan en el servidor**. Todas las usuarias los ven en el mapa **sin nombre y sin descripción**, y cada una descarga en Excel solo **sus propios** reportes.
- El **contacto de confianza** se guarda en la cuenta. Si se escribe un celular de 10 dígitos, se le agrega el indicativo 57.
- Para crear la cuenta se pide la autorización de tratamiento de datos (Ley 1581 de 2012).
- Los datos quedan en `servidor/datos/` (archivos JSON), que no se suben a GitHub.

**Demo para el jurado:** botón **Ver demo**. Traza las rutas del Parque Principal (Plaza Mayor) a la Universidad de Cundinamarca:

| Ruta | Distancia | Nivel |
|---|---|---|
| Por el oeste | 2,0 km · 27 min | Segura (recomendada) |
| Desvío del oeste | 2,4 km · 32 min | Media |
| Por el sureste (la más corta) | 1,9 km · 25 min | Riesgosa |

**La ruta más corta no es la más segura.** Después se puede reportar una zona insegura sobre la ruta verde y ver cómo cambia la recomendación.

> Aura ya no funciona abriendo `index.html` con doble clic ni con Live Server: necesita su servidor (`npm start`) para las cuentas y los reportes. El GPS funciona en `localhost` o con HTTPS.

## Estructura (Modelo-Vista-Controlador)
```
index.html                 Interfaz (HTML) y orden de carga de los scripts
css/estilos.css            Estilos: tema oscuro, diseño para celular
img/                       Foto de portada e íconos (Lucide)

data/puntos.js             MODELO       Puntos de EJEMPLO en Fusagasugá
data/entidades.js          MODELO       Correos de la Secretaría de la Mujer por municipio
js/modelo/seguridad.js     MODELO       Cálculo del nivel de seguridad (el corazón de la idea)
js/modelo/rutas.js         MODELO       Rutas a pie (FOSSGIS) + desvíos
js/modelo/reportes.js      MODELO       Reportes de usuarias (localStorage)
js/modelo/lugares.js       MODELO       Búsqueda de direcciones y municipio (Nominatim)
js/modelo/sos.js           MODELO       GPS, contacto de confianza, enlace de WhatsApp
js/modelo/secretaria.js    MODELO       Texto del reporte, WhatsApp, correo y filas de Excel

js/vista/iconos.js         VISTA        Íconos y colores de cada tipo de punto
js/vista/mapa.js           VISTA        Mapa Leaflet: puntos, marcadores y rutas
js/vista/panel.js          VISTA        Panel lateral, tarjetas de rutas y ventanas

js/controlador/app.js      CONTROLADOR  Estado y eventos; conecta modelo y vista
js/modelo/api.js           MODELO       Llamadas al servidor
js/modelo/cuenta.js        MODELO       Registro, sesión y contacto de confianza
js/vista/sesion.js         VISTA        Pantalla de inicio de sesión

servidor/servidor.js       CONTROLADOR  Servidor web y rutas de la API (Node.js, sin dependencias)
servidor/usuarias.js       MODELO       Cuentas, contraseñas cifradas y sesiones
servidor/reportes.js       MODELO       Reportes (públicos sin nombre / completos para su dueña)
servidor/almacen.js        MODELO       Guarda los datos en servidor/datos/*.json
```

Regla: el **modelo** no toca la pantalla (ni DOM ni Leaflet), la **vista** no guarda estado ni llama a servidores, y el **controlador** decide qué pasa cuando la usuaria hace algo.

Imágenes: íconos de [Lucide](https://lucide.dev) (ISC) y foto de portada "Bogotá city and street lights" de AltaGamba (Unsplash, CC0) vía Wikimedia Commons.

Tecnologías: HTML, CSS y JavaScript sin frameworks, más [Leaflet](https://leafletjs.com), [SheetJS](https://sheetjs.com) (Excel), OpenStreetMap y el servidor público de rutas a pie de FOSSGIS. No usa claves de API.

## Limitaciones y mejoras futuras
- Los puntos son **datos de ejemplo**. El siguiente paso es cargar datos reales: luminarias municipales, CAI de Policía, comercio 24 h y Puntos Violeta.
- Los reportes se guardan solo en el navegador. Con un backend serían compartidos entre todas las usuarias, y podrían moderarse y expirar con el tiempo.
- Ponderar por hora del día, alertas en tiempo real y compartir el trayecto en vivo.
- Si el servidor de rutas no responde, se muestra una línea recta como respaldo.
- Para tener siempre alternativas que comparar, además de la ruta directa se piden desvíos por cada lado de la línea recta (`js/rutas.js`).

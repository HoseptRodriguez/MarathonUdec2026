# Manual técnico · Aura

Aura es una aplicación web para elegir rutas nocturnas a pie más seguras para mujeres en Colombia, con cuentas de usuaria, reportes compartidos y SOS.

- **Aplicación publicada:** https://aura-mujeres.vercel.app
- **Repositorio:** https://github.com/HoseptRodriguez/MarathonUdec2026

---

## 1. Requisitos

| Componente | Versión |
|---|---|
| Node.js | 18 o superior (probado con 24.16.0) |
| Navegador | Chrome, Edge, Firefox o Safari recientes |
| Internet | Necesario: mapa, rutas, búsqueda de direcciones y librerías (CDN) |

**No hay dependencias npm.** El servidor usa solo módulos de Node (`http`, `fs`, `crypto`).
Librerías del navegador incluidas en el proyecto (carpeta `vendor/`, para no depender de servidores externos): Leaflet 1.9.4 (Agafonkin, 2023) y SheetJS 0.18.5 (SheetJS LLC, s. f.).

---

## 2. Instalación y ejecución

```bash
git clone https://github.com/HoseptRodriguez/MarathonUdec2026.git
cd MarathonUdec2026
npm start      # inicia Aura y abre el navegador
npm test       # ejecuta las pruebas unitarias
```

`npm start` muestra en la terminal la dirección y dónde está la base de datos:

```
  Aura está lista en http://localhost:3000
  Base de datos: .../MarathonUdec2026/servidor/datos
```

Si el puerto 3000 lo usa otro programa, Aura prueba automáticamente el 3001, 3002, etc., y avisa cuál quedó.

### Variables de entorno (opcionales)

| Variable | Uso | Por defecto |
|---|---|---|
| `PORT` | Puerto inicial | `3000` |
| `CARPETA_DATOS` | Carpeta de la base de datos | `servidor/datos/` |
| `NO_ABRIR` | Si tiene valor, no abre el navegador | (vacía) |

### Trabajo en equipo con VS Code Live Share
El anfitrión ejecuta `npm start` y comparte el puerto (**Live Share → Share Server**). Las demás personas usan esa dirección y comparten así las cuentas y los reportes.

> **No** abras `index.html` con doble clic ni con Live Server: no hay servidor de cuentas. La app lo detecta (`GET /api/salud`) y muestra cómo iniciarla.

---

## 3. Arquitectura (Modelo-Vista-Controlador)

```
Navegador                                   Servidor (Node.js)
┌──────────────────────────────┐           ┌───────────────────────────────┐
│ VISTA   js/vista/            │           │ CONTROLADOR servidor.js       │
│  mapa.js · panel.js · ...    │           │  API REST + archivos estáticos│
│        ▲                     │   HTTP    │            │                  │
│ CONTROLADOR js/controlador/  │◄─────────►│ MODELO usuarias.js            │
│  app.js (estado y eventos)   │   JSON    │        reportes.js            │
│        ▼                     │           │        almacen.js ──► datos/  │
│ MODELO  js/modelo/ · data/   │           └───────────────────────────────┘
└──────────────────────────────┘
       │ servicios externos: OpenStreetMap (mapa), FOSSGIS/OSRM (rutas a pie), Nominatim (direcciones)
```

Reglas:
- El **modelo** no toca el DOM ni Leaflet.
- La **vista** solo dibuja.
- El **controlador** guarda el estado y conecta ambos.

En el navegador se usan scripts globales sin módulos ES. El orden de los `<script>` en `index.html` importa: primero el Modelo, luego la Vista y al final el Controlador.

### Archivos

| Archivo | Capa | Responsabilidad |
|---|---|---|
| `js/modelo/api.js` | Modelo | `llamarApi()`, token, `servidorDeAuraDisponible()` |
| `js/modelo/cuenta.js` | Modelo | Registro, sesión, contacto de confianza |
| `js/modelo/seguridad.js` | Modelo | Distancias, `calcularSeguridad()`, `evaluarRutas()` |
| `js/modelo/rutas.js` | Modelo | Rutas a pie (FOSSGIS) y desvíos para tener alternativas |
| `js/modelo/reportes.js` | Modelo | Reportes del servidor y `todosLosPuntos()` |
| `js/modelo/lugares.js` | Modelo | Búsqueda de direcciones y municipio (Nominatim) |
| `js/modelo/sos.js` | Modelo | GPS y enlaces de WhatsApp |
| `js/modelo/secretaria.js` | Modelo | Texto del reporte, correo y filas de Excel |
| `data/puntos.js` | Modelo | Puntos de ejemplo de Fusagasugá |
| `data/entidades.js` | Modelo | Correos de la Secretaría de la Mujer por municipio |
| `js/vista/*.js` | Vista | Íconos, mapa Leaflet, panel, pantalla de sesión |
| `js/controlador/app.js` | Controlador | Estado de la app y eventos |
| `servidor/servidor.js` | Controlador | Servidor HTTP, rutas de la API, archivos estáticos |
| `servidor/usuarias.js` | Modelo | Cuentas, contraseñas, sesiones |
| `servidor/reportes.js` | Modelo | Reportes públicos y privados |
| `servidor/almacen.js` | Modelo | Lectura y escritura de la base de datos |

---

## 4. Base de datos

`servidor/almacen.js` tiene dos modos, con las mismas funciones (`todos`, `guardarRegistro` y `borrarRegistro`):

| Dónde corre | Base de datos | Cómo se activa |
|---|---|---|
| Internet (Vercel) | **Upstash Redis** `aura-db`, plan gratuito, región iad1, sin *eviction* ni *auto upgrade* (Upstash, s. f.) | Existen `KV_REST_API_URL` y `KV_REST_API_TOKEN` |
| Computador local | Archivos JSON en `servidor/datos/` | Sin esas variables |

En Redis cada colección es un hash (`aura:usuarias`, `aura:sesiones`, `aura:reportes`) cuyo campo es el `id` y cuyo valor es el registro en JSON. Las claves de Upstash están en las variables de entorno del proyecto en Vercel y en `.env.local`, que nunca se sube a GitHub.

En el modo local, los archivos JSON se crean solos con la primera cuenta, como un objeto `{ id: registro }`:

| Archivo | Contenido |
|---|---|
| `usuarias.json` | Cuentas |
| `sesiones.json` | Sesiones abiertas |
| `reportes.json` | Reportes de zonas inseguras |

Ejemplos de registros:

```json
// usuarias.json
{ "id": "uuid", "nombre": "Ana", "correo": "ana@correo.co",
  "contrasena": "<sal hex>:<hash scrypt hex>", "contacto": "573001234567",
  "autorizaDatos": "2026-11-04T14:55:29.308Z" }

// sesiones.json
{ "huella": "<sha256 del token>", "usuariaId": "uuid", "creada": 1762268129308 }

// reportes.json
{ "id": "uuid", "usuariaId": "uuid", "fecha": "2026-11-04T14:55:29.308Z",
  "lat": 4.3413, "lng": -74.3651, "motivo": "Acoso o hostigamiento",
  "descripcion": "texto privado", "municipio": "Fusagasugá", "departamento": "Cundinamarca" }
```

- **Escritura segura:** se escribe a un archivo temporal y luego se renombra, para no dejar un archivo a medias.
- **Respaldo:** basta con copiar la carpeta `servidor/datos/`.
- **Privacidad:** `servidor/datos/` está en `.gitignore` y el servidor nunca la entrega por HTTP.
- **Producción:** con muchas usuarias conviene migrar a SQLite o PostgreSQL. Solo hay que cambiar `almacen.js`, `usuarias.js` y `reportes.js`; la API no cambia.

---

## 5. API REST

Todas las rutas responden JSON. Excepto `salud`, `registro` y `sesion`, todas exigen la cabecera `Authorization: Bearer <token>`. Los errores llegan como `{ "error": "mensaje" }`.

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /api/salud` | — | `{ app: "aura", ok: true }` |
| `POST /api/registro` | `{ nombre, correo, contrasena, autorizaDatos }` | `{ token, usuaria }` |
| `POST /api/sesion` | `{ correo, contrasena }` | `{ token, usuaria }` |
| `DELETE /api/sesion` | — | `{ ok: true }` |
| `GET /api/perfil` | — | `{ id, nombre, correo, contacto }` |
| `PUT /api/perfil` | `{ contacto }` | perfil actualizado |
| `DELETE /api/perfil` | — | borra la cuenta, sus sesiones y sus reportes (derecho de supresión) |
| `GET /api/reportes` | — | reportes de todas, **sin dueña ni descripción** |
| `GET /api/reportes/mios` | — | reportes completos de la usuaria |
| `POST /api/reportes` | `{ lat, lng, motivo, descripcion, municipio, departamento }` | reporte creado |

Códigos HTTP:

| Código | Significado |
|---|---|
| 400 | Datos inválidos |
| 401 | Sin sesión o credenciales erradas |
| 404 | Ruta inexistente |
| 413 | Cuerpo de más de 10 KB |
| 500 | Error interno |

---

## 6. Seguridad y datos personales

- **Contraseñas:** scrypt con sal aleatoria de 16 bytes y comparación en tiempo constante (`timingSafeEqual`).
- **Sesiones:** token aleatorio de 32 bytes. En la base de datos solo se guarda su huella SHA-256 y caduca a los 30 días.
- **Validación:** correo, contraseña de mínimo 8 caracteres y autorización de datos obligatoria. Los reportes solo se aceptan dentro de Colombia y los textos se recortan (motivo 100 y descripción 500 caracteres).
- **Archivos públicos:** solo `index.html`, `css/`, `js/`, `img/` y `data/`. Se bloquean `..`, `servidor/`, `package.json` y `.git`.
- **Privacidad:** en el mapa común los reportes no muestran la dueña ni la descripción, y cada usuaria descarga solo los suyos.
- **Ley 1581 de 2012 (habeas data):** se registra la fecha de la autorización. Para producción falta publicar la política de tratamiento de datos de la entidad responsable.
- **HTTPS:** obligatorio en producción. El GPS del navegador solo funciona en `localhost` o con HTTPS.

---

## 7. Algoritmo de seguridad de rutas

1. Se piden rutas a pie al servidor de FOSSGIS (`routing.openstreetmap.de/routed-foot`). Como suele devolver una sola, se piden además dos desvíos que pasan por un punto a cada lado de la línea recta, a un 30 % de su largo. Si el servidor no responde, se usa una línea recta marcada como "aproximada".
2. Para cada ruta se buscan los puntos a **menos de 60 m** de algún tramo (distancia punto-segmento).
3. Se suman los pesos de esos puntos:

   | Punto | Peso |
   |---|---|
   | Luz | +1 |
   | Comercio 24 h | +2 |
   | Policía | +3 |
   | Punto Violeta | +3 |
   | Zona insegura | −4 |

4. La suma se divide por los km de la ruta (mínimo 0,5 km).
5. El nivel sale de ese puntaje: **segura** si es ≥ 4, **media** si es ≥ 1 y **riesgosa** si es menor. Las rutas se ordenan de mayor a menor puntaje.

Para ajustar el algoritmo, cambia `PESOS` y `RADIO_METROS` en `js/modelo/seguridad.js`.

---

## 8. Pruebas

```bash
npm test
```

Usa el ejecutor nativo `node:test`, sin dependencias. Cada prueba usa una base de datos temporal y no toca `servidor/datos/`.

| Archivo | Qué prueba |
|---|---|
| `pruebas/seguridad.test.js` | Distancias, cercanía a la ruta, niveles y orden de rutas |
| `pruebas/rutas.test.js` | Conversión de rutas, desvíos y respaldo sin conexión (fetch simulado) |
| `pruebas/secretaria.test.js` | Texto del reporte, correo, WhatsApp y filas de Excel |
| `pruebas/servidor-usuarias.test.js` | Registro, validaciones, cifrado, sesiones, indicativo 57 |
| `pruebas/servidor-reportes.test.js` | Validaciones, privacidad de reportes públicos, reportes por usuaria |
| `pruebas/api.test.js` | API completa por HTTP y protección de archivos |

Resultado al 2026-11-04: **47 pruebas, 47 aprobadas** (incluye Upstash Redis simulado, eliminación de cuenta y librerías locales).

---

## 9. Mantenimiento

- **Agregar puntos de apoyo o riesgo:** edita `data/puntos.js` (`tipo`: luz, comercio, policia, violeta o inseguro).
- **Agregar el correo de una Secretaría de la Mujer:** en `data/entidades.js`, con la clave del municipio en minúsculas y sin tildes. Usa solo correos oficiales verificados.
- **Cambiar la ciudad inicial del mapa:** `CENTRO` en `js/vista/mapa.js`.
- **Cambiar el demo:** `DEMO_ORIGEN` y `DEMO_DESTINO` en `js/controlador/app.js`.

---

## 10. Publicación en internet

Aura está publicada en **https://aura-mujeres.vercel.app** (proyecto `aura-mujeres` en Vercel, con HTTPS).

| Archivo | Función en la publicación |
|---|---|
| `vercel.json` | Ejecuta `servidor/construir.js`, publica la carpeta `publico/` y envía `/api/*` a `api/aura.js` |
| `servidor/construir.js` | Copia a `publico/` solo la app (index.html, manifest, css, js, img, data) |
| `api/aura.js` | Función de Vercel que atiende la API con el mismo código del servidor local |
| `.vercelignore` | No sube datos locales, pruebas ni el HANDOFF |

Para publicar una nueva versión, desde la carpeta del proyecto:

```bash
npm test
vercel deploy --prod
```

Para respaldar la base de datos, usa el panel de Upstash en Vercel (Storage → aura-db).

---

## 11. Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| "Aura no está conectada a su servidor" | Se abrió con doble clic, con Live Server o en el puerto de otro programa | Ejecutar `npm start` y abrir la dirección que muestra la terminal |
| La terminal dice "El puerto 3000 está ocupado…" | Otro programa usa el puerto | Normal: usar la dirección nueva (3001, …) |
| No se pudo crear la cuenta | Faltan datos o la autorización, o el correo ya existe | Leer el mensaje en rojo de la pantalla |
| "La base de datos de Aura no está configurada" (en Vercel) | Faltan las variables de Upstash | Revisar Storage → aura-db conectada a aura-mujeres y volver a publicar |
| "Usar mi ubicación" no funciona | El sitio no es `localhost` ni HTTPS, o no se dio el permiso | Publicar con HTTPS y aceptar el permiso del navegador |
| Las rutas salen punteadas ("aproximada") | No hay conexión con el servidor de rutas | Revisar internet; es un respaldo automático |
| El Excel no se descarga | No cargó SheetJS (sin internet) o no hay reportes | Revisar la conexión; hacer al menos un reporte |

---

## 12. Limitaciones conocidas

- Los puntos de Fusagasugá son **de ejemplo**; falta integrar datos reales de luminarias, CAI y comercio.
- No hay recuperación de contraseña porque requiere envío de correos.
- El plan gratuito de Upstash tiene límites de comandos y de tamaño. Con muchas usuarias habrá que subir de plan.
- Los servicios públicos de OpenStreetMap (teselas, Nominatim y FOSSGIS) tienen políticas de uso justo (OpenStreetMap Foundation, s. f.). Con mucho tráfico se necesita un servidor propio o un proveedor.
- Falta el correo oficial de la Secretaría de la Mujer de Fusagasugá en `data/entidades.js`.
- La política de tratamiento de datos (Congreso de la República de Colombia, 2012) está en `politica.html`, con Natalia Velasquez, Isabela Lombana y Hosept Rodriguez como responsables. Falta definir el correo de contacto.

## Nota sobre el uso de inteligencia artificial

El código y este manual se elaboraron con la asistencia de Claude Code (Anthropic, 2026), a partir de las instrucciones del equipo, que revisó y probó los resultados.

## Referencias

Agafonkin, V. (2023). *Leaflet* (Versión 1.9.4) [Software]. https://leafletjs.com/

Anthropic. (2026). *Claude Code* (Modelo Claude Opus 5.5) [Asistente de programación con inteligencia artificial]. https://www.anthropic.com/claude-code

Congreso de la República de Colombia. (2012, 17 de octubre). *Ley Estatutaria 1581 de 2012, por la cual se dictan disposiciones generales para la protección de datos personales*. Función Pública. https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=49981

Lucide Contributors. (s. f.). *Lucide* (Versión 0.460.0) [Software]. https://lucide.dev/

OpenJS Foundation. (s. f.). *Test runner*. Documentación de Node.js. https://nodejs.org/api/test.html

OpenStreetMap Foundation. (s. f.). *Nominatim usage policy*. https://operations.osmfoundation.org/policies/nominatim/

Project OSRM. (s. f.). *Open Source Routing Machine*. https://project-osrm.org/

SheetJS LLC. (s. f.). *SheetJS Community Edition* (Versión 0.18.5) [Software]. https://docs.sheetjs.com/

Upstash. (s. f.). *Upstash Redis*. https://upstash.com/docs/redis/overall/getstarted

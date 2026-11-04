# HANDOFF: Aura, ruta nocturna segura (Maratón IA UdeC 2026)

Documento de traspaso para que otro agente continúe con todo el contexto.
Última actualización: 2026-11-04 (cuentas de usuarias y servidor).

## 1. Encargo
- Maratón con IA. Problemática: **ruta nocturna segura para mujeres en el espacio público**.
- El equipo trabaja con **Live Share en VS Code**. Pide rapidez, pocos tokens, resultado pulido y **código fácil de entender**.
- Idioma: **español de Colombia**, tanto en la interfaz como en las respuestas al equipo.
- La app se llama **Aura**. Es para las mujeres de **Fusagasugá y de toda Colombia**: cada una con **su cuenta y sus reportes**.
- Arquitectura pedida: **Modelo-Vista-Controlador**.
- El equipo autorizó hacer commit y push a `main` sin preguntar.
- Manuales (usuaria y técnico) y documento de uso de IA en formato IEEE: **hechos** en `docs/`.
- Pruebas unitarias: `npm test` (39/39 en `pruebas/`).

## 2. Dónde está y cómo se ejecuta
- **Publicada (2026-11-04):** https://aura-mujeres.vercel.app. Es el proyecto Vercel `aura-mujeres` del equipo `hosept-rodriguez`, con la base Upstash Redis `aura-db` (plan gratuito, iad1, eviction=false, autoUpgrade=false). Las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN` están en Vercel y en `.env.local` (ignorado por git). Para publicar: `npm test && vercel deploy --prod`. Se probó en producción el registro, la sesión, el contacto y un reporte; luego se borraron los datos de prueba.
- Equipo: Natalia Velasquez, Isabela Lombana y Hosept Rodriguez. Manuales en Word (APA 7) en el Escritorio del usuario; se generan con un script de python-docx que no está en el repositorio. Si se piden otra vez, se puede rehacer a partir de `docs/*.md`.
- Carpeta local: `C:\Users\KTFUS\MarathonUdec2026` (es la que se abre en VS Code).
- Repositorio: https://github.com/HoseptRodriguez/MarathonUdec2026, rama `main`.
- Ejecutar: en la terminal, `npm start` (Node 18+, **sin dependencias**). Abre el navegador solo; si el puerto 3000 está ocupado, prueba 3001, 3002, etc. **En el PC del usuario, el 3000 lo ocupa otra app de pm2**: por eso falló la primera creación de cuenta.
- Base de datos: archivos JSON en `servidor/datos/` (usuarias, sesiones, reportes); se crea con la primera cuenta. Ver `docs/MANUAL_TECNICO.md` §4.
- Variables de entorno opcionales: `PORT` (puerto, por defecto 3000) y `CARPETA_DATOS` (dónde guardar los JSON, por defecto `servidor/datos/`).
- Ya **no** funciona con doble clic ni con Live Server (si se abre con file://, la pantalla de sesión lo avisa).
- Con Live Share: el anfitrión corre `npm start` y comparte el puerto 3000 (Share Server).

## 3. Qué hace (todo implementado y probado)
1. **Cuentas**: registro con nombre, correo, contraseña (mínimo 8 caracteres) y autorización de datos (Ley 1581 de 2012). También inicio y cierre de sesión. La sesión dura 30 días (token en localStorage; el servidor guarda solo su hash SHA-256). Las contraseñas se guardan con scrypt y sal.
2. **Origen automático** por GPS y **destino por texto** (Nominatim, `countrycodes=co`). El pin en el mapa es opcional (botones Origen y Destino).
3. **Rutas a pie puntuadas**: Segura, Media o Riesgosa según los puntos a menos de 60 m. Se usa FOSSGIS y, como casi siempre devuelve una sola ruta, se piden también desvíos por cada lado.
4. **Reportes compartidos**: se guardan en el servidor. Todas las usuarias los ven en el mapa **sin nombre ni descripción**; cada una descarga en Excel (.xlsx, SheetJS 0.18.5) **solo los suyos**. Los reportes fuera de Colombia se rechazan.
5. **Reporte a la Secretaría de la Mujer**: detecta el municipio y arma un texto formal que se puede enviar por WhatsApp al contacto de confianza, por correo o copiándolo.
6. **Contacto de confianza** guardado en la cuenta, mientras se escribe (con espera de 600 ms). A un celular de 10 dígitos que empieza por 3 se le agrega el 57.
7. **SOS** (WhatsApp con la ubicación, líneas 123 y 155) y **acompañamiento** (si no se confirma la llegada, se abre el SOS).
8. **Demo**: Parque Principal (Plaza Mayor, 4.3439103, -74.3619659) → Universidad de Cundinamarca (4.3359848, -74.3712360). Salen segura (2,0 km), media (2,4 km) y riesgosa (1,9 km, la más corta).
9. Sin emojis: íconos **Lucide** (ISC) en `img/iconos/` y foto CC0 de Wikimedia Commons en `img/portada.jpg`.

## 4. Arquitectura: Modelo-Vista-Controlador
**Navegador** (scripts globales sin módulos ES; el orden en index.html es Modelo, Vista, Controlador):
- **Modelo** (`data/`, `js/modelo/`): api.js (llamarApi, token), cuenta.js (crearCuenta, entrar, recuperarSesion, salir, cargarContacto, guardarContacto), seguridad.js (puntaje, evaluarRutas), rutas.js, reportes.js (actualizarReportes, guardarReporte, misReportes, todosLosPuntos), lugares.js (Nominatim), sos.js (GPS, enlaces de WhatsApp), secretaria.js (prepararReporteSecretaria, filasExcel). No usa document ni Leaflet.
- **Vista** (`js/vista/`): iconos.js, mapa.js (Leaflet), panel.js (panel, ventanas, descargarExcel), sesion.js (pantalla de sesión).
- **Controlador** (`js/controlador/app.js`): estado y eventos. Arranca con recuperarSesion() y luego iniciarApp().

**Servidor** (`servidor/`, Node puro):
- servidor.js (CONTROLADOR): sirve solo index.html, css/, js/, img/ y data/ (bloquea servidor/ y ..). La API es un objeto `API` de rutas.
- usuarias.js, reportes.js y almacen.js (MODELO): los datos se guardan en JSON con escritura atómica.

API: `POST /api/registro`, `POST /api/sesion`, `DELETE /api/sesion`, `GET|PUT /api/perfil`, `GET /api/reportes` (públicos), `GET /api/reportes/mios`, `POST /api/reportes`. Todo excepto registro y sesión exige `Authorization: Bearer <token>`.

## 5. Decisiones técnicas
- Rutas: `routing.openstreetmap.de/routed-foot`, porque `router.project-osrm.org` solo calcula rutas en auto.
- Mapa base: OSM con `filter: invert(1) hue-rotate(180deg)`, porque CARTO dark exige API key.
- Datos en archivos JSON para no instalar nada durante la maratón; en producción conviene una base de datos (SQLite o Postgres).
- `servidor/datos/` está en `.gitignore`: nunca se suben datos de usuarias.

## 6. Pendientes
- Política de tratamiento de datos (Ley 1581): falta saber quién es la persona o entidad responsable.
- Correo oficial de la Secretaría/Oficina de la Mujer de Fusagasugá en `data/entidades.js`: no se encontró uno verificado, no hay que inventarlo.
- Verificar con el equipo las líneas 123 y 155.
- Recuperar contraseña: no implementado (requiere envío de correos).
- Un solo reporte sobre la ruta verde no le cambia el nivel; harían falta 2 o 3.
- Probar en un celular físico.

## 7. Cómo se probó (2026-11-04)
- API con curl:
  - Registro sin autorización, correo duplicado y contraseña errada son rechazados.
  - Un reporte fuera de Colombia es rechazado.
  - Otra usuaria ve el reporte sin dueña ni descripción, y su lista "mios" sale vacía.
  - `servidor/*` y `/css/../servidor/...` devuelven 404.
  - La contraseña queda cifrada.
- Navegador (Chrome headless + DevTools Protocol, GPS simulado): registro de Ana, contacto, reporte, WhatsApp con el número, Excel con el reporte, cierre de sesión, registro de Bea (ve 1 reporte en el mapa y 0 propios) y recarga con la sesión mantenida. Sin errores de JS.

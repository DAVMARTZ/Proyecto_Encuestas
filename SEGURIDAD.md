# Informe de seguridad

Alcance: backend `Proyecto_Encuestas` y front `ProyectoEncuestas_Front`.
Fecha de la revisión: 8 de noviembre de 2026.

---

## 1. Resumen

| Medición | Antes | Después |
|---|---|---|
| Ataques por HTTP resistidos | 169 de 195 | **196 de 196** |
| Vulnerabilidades altas en dependencias de producción (backend) | 2 | **0** |
| Vulnerabilidades altas en dependencias de producción (front) | 7 | **0** |
| Errores internos (500) provocados por los ataques | 2 tipos | **0** |
| Cabeceras de seguridad en la API | 0 de 6 | **6 de 6** |

Autenticación, permisos, acceso a datos de otros usuarios, asignación masiva e inyección SQL ya resistían en la medición inicial. Los fallos estaban en límites de recursos, cabeceras, manejo de entradas extremas y exposición de datos menores.

Quedan **decisiones y configuraciones externas** que no se resuelven con código; están en la sección 7.

---

## 2. Cómo se evaluó

1. **Análisis de dependencias** con `npm audit`, en ambos proyectos.
2. **Búsqueda de secretos** en los archivos versionados y en todo el historial de Git de ambos repositorios.
3. **Revisión de código** en busca de patrones de riesgo: consultas directas, HTML sin sanear, almacenamiento de tokens, logs y dependencias externas.
4. **Ataques reales por HTTP** con la suite `pruebas/seguridad.js`, ejecutada primero sobre el código sin corregir y después sobre el código final.
5. **Pruebas de regresión:** 83 comprobaciones funcionales y 52 peticiones de Postman, dos veces.
6. **Recorrido en el navegador** de las pantallas del administrador y del estudiante.

Las pruebas usaron el servidor real, PostgreSQL temporal y el emulador oficial de Firebase. No se tocó la base de desarrollo ni el proyecto real de Firebase. Además, con la configuración real, se confirmó que un token con firma falsa es rechazado.

### Cobertura de la suite

| Categoría | Qué ataca |
|---|---|
| A. Autenticación | Tokens ausentes, basura, de otro proyecto, expirados o sin sujeto; esquemas incorrectos; usuario inactivo; apropiarse del correo del administrador |
| B. Autorización | Matriz de 46 rutas: sin token y como estudiante |
| C. Acceso a datos de otros | Perfiles ajenos, borradores y encuestas inactivas |
| D. Asignación masiva | Rol, estado, dueño, UID, correo y `__proto__` enviados en el cuerpo |
| E. Inyección | SQL en rutas, consultas y cuerpo; objetos en lugar de textos; HTML; bytes nulos; prototipos |
| F. Reglas de negocio | Responder borradores, doble respuesta, 6 envíos simultáneos, editar publicadas |
| G. Límites de recursos | Cuerpos, textos y listas enormes; JSON muy anidado |
| H. Fugas de información | Trazas, mensajes de base de datos, cabeceras, CORS, datos internos |
| I. Límite de peticiones | Ráfagas |

---

## 3. Hallazgos y solución

| # | Severidad | Hallazgo | Solución | Estado |
|---|---|---|---|---|
| 1 | Alta | Vulnerabilidades altas en `joi` y `body-parser` | Actualización con `npm audit fix` | Corregido |
| 2 | Alta | Vulnerabilidades altas en `@angular/router` y `@grpc/grpc-js` | Angular 22.2 y `overrides` para `grpc-js`, sin saltos de versión mayor | Corregido |
| 3 | Alta | Sin límite de peticiones | Límite por IP y por minuto, configurable con `RATE_LIMIT_MAX` | Corregido |
| 4 | Media | Los logs registraban consultas con sus parámetros, incluidos datos personales | `logging: false`, y los errores solo registran su mensaje | Corregido |
| 5 | Media | Script externo de `sweetalert2` cargado desde un CDN sin verificación de integridad | Eliminado: la aplicación ya usa el paquete instalado | Corregido |
| 6 | Media | Textos y listas sin tamaño máximo (7 casos) | Límites en todos los validadores Joi | Corregido |
| 7 | Media | Bytes nulos y textos demasiado largos causaban error 500 | Filtro en el cuerpo recibido y traducción a error 400 | Corregido |
| 8 | Media | El listado de roles era público | Solo administradores | Corregido |
| 9 | Media | El interceptor enviaba el token a cualquier destino HTTP | Solo se envía a la URL de la API | Corregido |
| 10 | Baja | Sin cabeceras de seguridad y con `X-Powered-By` | Middleware propio de cabeceras | Corregido |
| 11 | Baja | `/health` revelaba las tecnologías usadas | Solo responde `{ "status": "UP" }` | Corregido |
| 12 | Baja | Los estudiantes recibían el ID del creador y el total de respuestas | Se retiran de sus respuestas | Corregido |
| 13 | Baja | Una opción llamada `__proto__` no se contaba en las estadísticas | Conteo sobre un objeto sin prototipo | Corregido |
| 14 | Baja | La API aceptaba peticiones antes de conectar la base de datos | Primero se conecta, luego se escucha | Corregido |
| 15 | Baja | Se aceptaba `urlencoded`, que la aplicación no usa | Eliminado | Corregido |
| 16 | Baja | El repositorio del front no ignoraba `node_modules` en la raíz | `.gitignore` en la raíz | Corregido |

Durante las pruebas se detectó además un error en la primera versión del filtro de bytes nulos: se desbordaba con JSON muy anidado. Se reescribió para revisar el cuerpo sin interpretarlo.

### Controles que ya estaban correctos

- Consultas parametrizadas por TypeORM, sin SQL construido con entradas del usuario.
- Validación del token en cada petición, con el rol tomado de la base de datos.
- Cuentas enlazadas por UID, nunca por correo.
- Una respuesta por usuario garantizada también con un índice único.
- Sin uso de `innerHTML`, `bypassSecurityTrust` ni `localStorage` en el front.
- Archivos `.env` fuera de Git.

---

## 4. Implementación

**Backend**

| Archivo | Cambio |
|---|---|
| `web/securityMiddleware.ts` (nuevo) | Cabeceras, límite de peticiones y filtro de bytes nulos |
| `web/app.ts` | Orden de middlewares, límite de 5 MB, CORS y `/health` mínimo |
| `routes/RoleRoutes.ts` | Consulta de roles solo para administradores |
| `util/http-utils.ts` | Más errores de PostgreSQL controlados y logs sin datos |
| `config/data-base.ts`, `index.ts` | Logs de consultas apagados y arranque ordenado |
| `config/environment-vars.ts` | Variable `RATE_LIMIT_MAX` |
| Validadores en `util/` | Tamaños máximos |
| `SurveyApplication.ts` | Datos reducidos para quien responde |
| `pruebas/seguridad.js` (nuevo) | Suite de seguridad, con el comando `npm run test:security` |

Cabeceras aplicadas: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy`, `Strict-Transport-Security` y `Cache-Control: no-store`.

**Límites**

| Campo | Máximo |
|---|---|
| Cuerpo de la petición | 5 MB |
| Foto de perfil | PNG, JPEG o WEBP, unos 3 MB |
| Título de encuesta | 200 caracteres |
| Descripción | 1000 caracteres |
| Enunciado de pregunta | 500 caracteres |
| Texto de opción | 300 caracteres |
| Respuesta abierta | 2000 caracteres |
| Preguntas por encuesta | 100 |
| Opciones por pregunta | 50 |
| Detalles por envío | 500 |
| Peticiones por IP | 600 por minuto |

**Front:** interceptor restringido a la API, script del CDN eliminado, Angular actualizado y límite en la respuesta abierta.

---

## 5. Limpieza

**Backend**
- Eliminados `nodemon` y `nodemon.json`, que no se usaban.
- Eliminados los campos duplicados `statusUser`, `statusSurvey`, `statusQuestion` y `statusResponseOption`.
- Eliminados los métodos `delete*` sin uso en puertos, adaptadores y aplicaciones.
- `UserController` usa la misma forma que los demás controladores, y `UserRoutes` quedó sin envoltorios repetidos.
- Quitados bloques `try/catch` que solo repetían el error en `UserAdapter`, y una carga duplicada de `dotenv`.

**Front**
- Eliminados `item.model.ts`, `tipo-encuesta.model.ts` y el componente sin uso `admin/questions`.
- Corregidos los nombres de clase en los archivos de prueba, que no compilaban.
- Idioma del documento cambiado a español.

---

## 6. Cómo repetir las pruebas

1. En una carpeta vacía, crea `firebase.json` y arranca el emulador:

```json
{ "emulators": { "auth": { "host": "127.0.0.1", "port": 9099 }, "ui": { "enabled": false } } }
```

```powershell
npx firebase-tools emulators:start --only auth --project demo-encuestas
```

2. Crea una base llamada `encuestas_prueba` y ejecuta `init_database.sql`.

3. En una terminal, desde este proyecto, levanta la API de prueba:

```powershell
$env:PORT="3001"; $env:DB_NAME="encuestas_prueba"; $env:FIREBASE_PROJECT_ID="demo-encuestas"; $env:FIREBASE_AUTH_EMULATOR_HOST="127.0.0.1:9099"; $env:RATE_LIMIT_MAX="800"; npx tsx src/index.ts
```

4. En otra terminal, ejecuta la suite:

```powershell
$env:API_URL="http://127.0.0.1:3001/api"; $env:FIREBASE_PROJECT_ID="demo-encuestas"; $env:RATE_LIMIT_MAX="800"; $env:TEST_DB_NAME="encuestas_prueba"; $env:TEST_DB_PASSWORD="TU_CLAVE_DE_POSTGRES"; npm run test:security
```

La suite se niega a ejecutarse si la API o el emulador no son locales, o si el nombre de la base no contiene `prueba` o `test`.

---

## 7. Lo que requiere una decisión o una configuración externa

**Decisiones de producto**

| # | Riesgo | Recomendación |
|---|---|---|
| 1 | Firebase permite registrarse con un correo sin comprobar que sea propio, por lo que alguien podría responder usando el correo de otra persona que aún no se haya registrado | Exigir verificación de correo. Requiere un flujo nuevo en el front y que las cuentas actuales verifiquen su correo |
| 2 | Cualquier persona con un correo puede registrarse y ver las encuestas publicadas | Limitar el registro al dominio institucional |

**Configuración en la consola de Firebase y Google Cloud** (no es visible desde el código)

| # | Acción |
|---|---|
| 3 | Revisar que las reglas de Firestore solo permitan a cada usuario leer y escribir su propio documento en `users` |
| 4 | Restringir la API key web a los dominios de la aplicación |

**Repositorio del front**

| # | Acción |
|---|---|
| 5 | `environment.development.ts` está versionado, aunque el equipo definió que no debe subirse. La API key web no es una contraseña, pero conviene sacarlo: agrégalo a `encuestas-ue/.gitignore` y ejecuta `git rm --cached encuestas-ue/src/environment/environment.development.ts` |

**Antes de publicar en producción**

| # | Acción |
|---|---|
| 6 | Servir la API y el front solo por HTTPS |
| 7 | Crear en PostgreSQL un usuario con permisos mínimos, en lugar de `postgres` |
| 8 | Si la API queda detrás de un proxy, configurar `trust proxy`, para que el límite cuente la IP real |
| 9 | Ajustar `RATE_LIMIT_MAX` si muchos estudiantes comparten una sola IP en el campus |
| 10 | Definir `FRONTEND_URL` y `NODE_ENV=production` |
| 11 | Agregar `Content-Security-Policy` en el hosting del front, cuando se conozca el dominio |

**Riesgos aceptados**

| # | Riesgo | Motivo |
|---|---|---|
| 12 | Quedan 7 vulnerabilidades moderadas en dependencias del backend (`glob` y `minimatch` por `typeorm`; `gaxios` y otras por el módulo de Firestore de `firebase-admin`) | No son alcanzables: las entidades se registran como clases, sin rutas con comodines, y la API no usa Firestore. Corregirlas exige migrar a TypeORM 1.x, un cambio mayor que debe planearse aparte |
| 13 | La clave JWT antigua sigue en el historial público de Git | Ya no tiene uso: el sistema dejó de usar JWT propios |
| 14 | Una cuenta deshabilitada solo en la consola de Firebase sigue activa hasta que venza su token (máximo 1 hora) | Comprobarlo en cada petición exige credenciales de servicio. Para bloquear al instante se usa **Inactivar** en la aplicación |
| 15 | El límite de peticiones se guarda en la memoria de cada proceso | Suficiente con un solo servidor; varias instancias necesitarían un almacén compartido |

**Mantenimiento**

| # | Acción |
|---|---|
| 16 | La columna `password_hash` ya no se usa. En la base local se puede limpiar con `UPDATE users SET password_hash = NULL WHERE user_id = 1;` |
| 17 | La carpeta `infraestrucure` tiene un error ortográfico. No se renombró para evitar conflictos con las ramas del equipo |
| 18 | La guía `docs/GUIA_INTEGRACION_BACKEND_ZULLIE.md` del front describe rutas antiguas |

---

## 8. Límites de esta revisión

- Se probaron cuentas del emulador de Firebase. El login con Microsoft y las reglas reales de Firestore no se pudieron probar.
- El emulador no comprueba firmas de tokens; esa comprobación se verificó aparte con la configuración real del proyecto.
- No se hicieron pruebas de carga ni una auditoría externa de penetración.
- El front se revisó con análisis de código y recorrido funcional; la suite de ataques se ejecuta contra la API.

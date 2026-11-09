# Registro de cambios del backend

**Elaborado por:** Natalia Farfan
**Fecha:** 8 de noviembre de 2026
**Proyecto:** Backend de Encuestas (Node.js, TypeScript, Express, TypeORM y PostgreSQL)

---

## 1. Decisiones de negocio

| # | Decisión |
| :-- | :-- |
| 1 | Para responder una encuesta se exige sesión iniciada. |
| 2 | Cada usuario responde una sola vez cada encuesta. |
| 3 | Las encuestas tienen un estado Borrador real. |
| 4 | Solo existen los roles `ADMIN` (id 1) y `STUDENT` (id 2). |
| 5 | Los borrados son siempre lógicos. |
| 6 | QR, recuperación de contraseña y consulta por estudiantes se definen al revisar el front. |
| 7 | El inicio de sesión, el registro y la recuperación de contraseña se hacen con Firebase. |

---

## 2. Seguridad y sesión

- El backend valida en cada petición el token de Firebase con `firebase-admin`, usando solo el ID del proyecto (`FIREBASE_PROJECT_ID`). La aplicación no arranca sin esa variable.
- Se retiraron el login y el registro propios del backend, los tokens JWT y el manejo de contraseñas.
- En su primer ingreso, cada usuario se crea como `STUDENT`, y `PUT /users/:id` ya no modifica correo ni contraseña.
- Las cuentas se enlazan solo por UID de Firebase, nunca por correo, para que nadie herede una cuenta registrando su correo.
- Se eliminó la asignación automática del rol administrador cuando faltaba el rol `STUDENT`.
- En cada petición autenticada se comprueba en la base de datos que el usuario siga activo, y el rol se toma de la base de datos y no del token.
- Un token inválido o expirado responde `401`, y un usuario inactivo responde `403`.
- Los roles base no se pueden renombrar ni inactivar, y un administrador no puede inactivar su propia cuenta.
- Nadie puede cambiar su propio rol o estado.

---

## 3. Permisos por endpoint

| Recurso | Acción | Acceso |
| :-- | :-- | :-- |
| Usuarios | Inicio de sesión y registro | En Firebase |
| Usuarios | `GET /users/me` | Usuario autenticado |
| Usuarios | Listar y buscar por correo | `ADMIN` |
| Usuarios | Ver y editar por ID | El propio usuario o `ADMIN` |
| Usuarios | Inactivar y reactivar | `ADMIN` |
| Roles | Consultar | Público |
| Roles | Crear, editar, inactivar y reactivar | `ADMIN` |
| Encuestas | `GET /surveys` y `GET /surveys/:id` | Usuario autenticado (solo publicadas, salvo `ADMIN`) |
| Encuestas | Crear, editar, publicar, inactivar y reactivar | `ADMIN` |
| Preguntas y opciones | Todas las rutas directas | `ADMIN` |
| Respuestas | Enviar | Usuario autenticado |
| Respuestas | Consultar resultados y estadísticas | `ADMIN` |

---

## 4. Ciclo de vida de la encuesta

| Valor de `status` | Estado |
| :-- | :-- |
| `2` | Borrador |
| `1` | Publicada |
| `0` | Inactiva |

- Toda encuesta nace en borrador y su creador siempre es el usuario autenticado.
- Solo en borrador se editan la encuesta, sus preguntas y sus opciones.
- Para publicar se necesita al menos una pregunta activa, y las preguntas que no son abiertas necesitan al menos una opción activa.
- El estado solo cambia con `publish`, `activate` y `deactivate`; `PUT` no lo modifica.
- Una encuesta inactiva se reactiva como publicada.
- Quien no es administrador solo ve encuestas publicadas, con sus preguntas y opciones activas.
- `GET /surveys/:id` entrega las preguntas y opciones ordenadas por `displayOrder`.
- `GET /surveys` ya no incluye el campo `questions`; el detalle está en `GET /surveys/:id`.

---

## 5. Validación de respuestas

Al enviar una respuesta se valida que:

- La encuesta esté publicada y dentro de su fecha de cierre.
- El usuario no la haya respondido antes (`409`), incluso con envíos simultáneos.
- Cada pregunta pertenezca a la encuesta y esté activa.
- Cada opción pertenezca a su pregunta y esté activa.
- Las preguntas abiertas tengan texto, y las demás tengan una opción válida.
- Solo las preguntas de selección múltiple admitan varias respuestas, sin opciones repetidas.
- Se contesten todas las preguntas obligatorias.

El `userId` siempre se toma del token.

Además, al crear encuestas se valida el tipo de pregunta y que la fecha de cierre sea futura. Si no se indica `displayOrder`, se asigna automáticamente, y no se permiten dos opciones con el mismo orden.

---

## 6. Contrato HTTP de errores

Todos los errores responden JSON con la forma `{ "error": "mensaje" }`.

| Código | Significado |
| :-- | :-- |
| `400` | Datos inválidos o acción no permitida en el estado actual. |
| `401` | Sin token, o token inválido o expirado. |
| `403` | Permisos insuficientes o usuario inactivo. |
| `404` | El recurso o la ruta no existen. |
| `409` | Registro duplicado o encuesta ya respondida. |
| `413` | Cuerpo de la petición demasiado grande. |
| `500` | Error interno; el detalle solo queda en los logs. |

- La traducción de errores a códigos HTTP está centralizada en `src/infraestrucure/util/http-utils.ts`.
- Se agregó un manejador global en `src/infraestrucure/web/app.ts` para rutas inexistentes y JSON malformado.
- Los IDs de la URL se validan: valores como `/surveys/1abc` responden `400`.
- Los mensajes internos de PostgreSQL ya no llegan al cliente.

---

## 7. Base de datos y configuración

| Archivo | Descripción |
| :-- | :-- |
| `init_database.sql` | Restaurado y actualizado. Crea solo lo que no existe y no borra datos. |
| `ajuste_base_existente.sql` | Actualiza bases creadas con la versión anterior de `init_database.sql`, cuyos estados son numéricos. |
| `ajuste_firebase.sql` | Agrega `users.firebase_uid` y hace opcional `password_hash` en bases ya creadas. No borra datos. |
| `.env.example` | Plantilla de variables de entorno, incluida `FIREBASE_PROJECT_ID`. |
| `package-lock.json` | Se empieza a versionar para tener instalaciones reproducibles. |

- En `survey_responses` se agregó la regla de que toda respuesta activa tenga usuario, y un índice único por encuesta y usuario entre las respuestas activas.
- En `surveys`, el estado admite `0`, `1` y `2`, con borrador por defecto.
- La semilla crea `ADMIN` y `STUDENT`. El administrador se enlaza con su cuenta de Firebase mediante su UID.
- La base local de desarrollo es `proyecto_encuestas`, creada con `init_database.sql`. El servidor conecta correctamente con ella.

---

## 8. Archivos modificados

**Retirados:** `AuthApplication.ts`, `jwt-middleware.ts`, `user_validation.ts`

**Capa de dominio:** `Role.ts`, `Survey.ts`, `SurveyResponsePort.ts`, `User.ts`, `UserPort.ts`

**Capa de aplicación:** `QuestionApplication.ts`, `ResponseOptionApplication.ts`, `RoleApplication.ts`, `SurveyApplication.ts`, `SurveyResponseApplication.ts`, `UserApplication.ts`

**Infraestructura:**

- `adapter/`: `SurveyAdapter.ts`, `SurveyResponseAdapter.ts`, `UserAdapter.ts`
- `config/`: `environment-vars.ts`, `firebase.ts` (nuevo)
- `controller/`: los seis controladores
- `entities/`: `Survey.ts`, `User.ts`
- `routes/`: los seis archivos de rutas
- `util/`: `http-utils.ts` (nuevo), `questionValidator.ts`, `survey-update-validation.ts`, `surveyResponseValidator.ts`, `surveyValidator.ts`, `user-update-validation.ts`
- `web/`: `app.ts`, `authMiddleware.ts`, `roleMiddleware.ts`

**Documentación y proyecto:** `.gitignore`, `DEV3.MD`, `README.MD`, `Proyecto_Encuestas.postman_collection.json`

---

## 9. Verificación

Se comprobó con el servidor real sobre una instancia temporal de PostgreSQL 18 y el emulador oficial de Firebase, independientes de la base de desarrollo y del proyecto real:

- Compilación de TypeScript sin errores.
- 63 comprobaciones correctas de 63: sesión con Firebase, primer ingreso, permisos, ciclo de la encuesta, validación de respuestas, códigos HTTP y scripts SQL.
- La colección de Postman se reorganizó en 9 carpetas que siguen el ciclo de la encuesta e inicia sesión en Firebase. Sus 49 peticiones se ejecutaron sin fallos, y se puede repetir.
- Con la configuración real del proyecto, un token con firma falsa es rechazado.
- Se confirmó que `init_database.sql` se puede repetir sin perder datos.
- Se confirmó que `ajuste_base_existente.sql` no aplica cambios si hay envíos que incumplen las reglas nuevas.

---

## 10. Pendientes

- **Base anterior:** `Proyecto_Encuestas` se conserva sin cambios. Tiene un esquema antiguo, con los estados guardados como texto, y sus tablas están vacías; el código actual no la usa.
- **Paginación de listados:** se definirá al revisar el consumo desde el front.
- **Producción:** publicar en servidor, generar la app Android y definir la URL real de la API.
- **Seguridad:** decisiones y configuraciones externas listadas en `SEGURIDAD.md`.

---

## 11. Integración con el front

El repositorio `ProyectoEncuestas_Front` quedó conectado a este backend:

- El administrador de la base `proyecto_encuestas` está enlazado con su cuenta de Firebase.
- `GET /surveys` ahora indica `questionCount` y `answered` para el usuario de la sesión.
- El rol se lee de `GET /users/me`, y `/admin` está protegido con un guard de administrador.
- Se retiraron del front los modos `bypassAuthForDev` y `devForceRole`.
- El servicio de encuestas usa `/api/surveys` y traduce los campos entre el backend y el front.
- Se conectaron las pantallas de encuestas disponibles, responder, QR, lista de encuestas, crear encuesta, panel y resultados.
- La lista de encuestas permite publicar, inactivar y reactivar.
- Las preguntas de escala se crean con las opciones del 1 al 5.
- El recorrido completo se probó en el navegador con una copia del front, el emulador de Firebase y una base temporal: creación, publicación, registro, respuesta, una respuesta por usuario, panel y resultados.

---

## 12. Proyecto completo

**Gestión de encuestas**

- Pantalla de detalle de solo lectura, disponible en cualquier estado.
- Edición de título, descripción, fecha, preguntas y opciones, solo en borrador. Lo que se quita se da de baja de forma lógica.
- Una encuesta publicada sin respuestas puede volver a borrador con `PATCH /surveys/:id/draft`.
- El formulario de creación incluye la fecha de cierre.

**Dashboard**

- Resumen general de encuestas por estado y total de respuestas.
- Promedio, porcentaje de satisfacción y participación sobre los estudiantes activos.
- Respuestas positivas (4 y 5), neutras (3) y negativas (1 y 2), en total y por pregunta.
- Resultados de selección múltiple y comentarios de preguntas abiertas.
- Filtros por estado de la encuesta y por rango de fechas (`?from=` y `?to=` en las estadísticas).

**Estudiantes**

- Pantalla "Mis respuestas", con `GET /users/me/responses`.
- Tras iniciar sesión se vuelve a la encuesta del QR, y una encuesta ya respondida muestra un aviso.
- Un usuario inactivo ve un mensaje claro y se cierra su sesión.

**Cierre técnico**

- CORS restringido con `FRONTEND_URL`, que por defecto es `http://localhost:4200`.
- El cuerpo de las peticiones se limita a 5 MB, y el avatar valida tipo y tamaño.
- `dev2.MD` quedó marcado como documento obsoleto.

**Verificación:** 83 comprobaciones del backend correctas, 52 peticiones de Postman ejecutadas dos veces sin fallos, y recorrido de todas las pantallas nuevas en el navegador con datos de prueba, sobre servicios temporales independientes de la base de desarrollo y del proyecto real.

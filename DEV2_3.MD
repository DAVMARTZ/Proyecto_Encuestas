Perfil de Usuario (Dev 2) y Gestión de Encuestas (Dev 3), construidos bajo los principios de la Arquitectura Hexagonal (Ports & Adapters).

Desarrollador 2 — Módulo de Perfil de UsuarioEste módulo permite a los usuarios autenticados consultar y modificar su propia información personal de forma segura, garantizando que nadie pueda alterar datos ajenos.

Estructura y Descripción de ArchivosCapa 
/ CarpetaArchivoResponsabilidadDominiosrc/domain/ProfilePort.ts
Define el contrato (puerto) con las operaciones de perfil (getProfile, updateProfile), aislando las reglas de negocio de la base de datos.
Aplicaciónsrc/application/ProfileApplication.ts
Contiene los casos de uso y validaciones previas (ej. verificar que existan datos válidos para actualizar antes de tocar la base de datos).
Infraestructura (Adapter)src/infraestrucure/adapter/ProfileAdapter.ts
Implementa el puerto utilizando TypeORM para interactuar directamente con la tabla usuarios en PostgreSQL.
Infraestructura (Controller)src/infraestrucure/controller/ProfileController.tsManeja la comunicación HTTP (req/res), gestiona códigos de estado y procesa excepciones.Infraestructura (Routes)src/infraestrucure/routes/ProfileRoutes.ts
Define las rutas Express e inyecta el middleware de seguridad.Descripción de Métodos Clave (ProfileApplication.ts)getProfile(userId): Valida la existencia del usuario en la base de datos a través del puerto y retorna la información esencial omitiendo datos sensibles como la contraseña.updateProfile(userId, data): Verifica que el objeto de actualización contenga al menos un campo válido antes de enviarlo al adaptador para persistir los cambios.

Desarrollador 3 — Módulo de Gestión de EncuestasEncargado de administrar el ciclo de vida completo de una encuesta (Crear, Consultar, Editar, Publicar y Desactivar), aplicando reglas de negocio estrictas sobre los estados.Estructura y Descripción de ArchivosCapa / CarpetaArchivoResponsabilidadDominiosrc/domain/Survey.ts
Define las interfaces puras de las encuestas y el enumerador de estados (Borrador, Publicada, Inactiva).
Dominiosrc/domain/SurveyPort.ts
Establece el contrato de persistencia que el adaptador de base de datos debe cumplir.Aplicaciónsrc/application/SurveyApplication.ts
Aplica las reglas del ciclo de vida: toda encuesta nace en Borrador y se bloquea la edición si ya se encuentra publicada.
Infraestructura (Adapter)src/infraestrucure/adapter/SurveyAdapter.ts
Ejecuta las consultas reales en PostgreSQL utilizando la entidad TypeORM Encuesta.Infraestructura (Entity)src/infraestrucure/entities/Encuesta.ts
Mapea la tabla encuestas de la base de datos respetando tipos UUID y ENUMs.Infraestructura (Controller)src/infraestrucure/controller/SurveyController.ts
Recibe las peticiones HTTP y devuelve respuestas estructuradas.Infraestructura (Routes)src/infraestrucure/routes/SurveyRoutes.ts
Agrupa las rutas de encuestas protegiéndolas con autenticación JWT.Descripción de Métodos Clave (SurveyApplication.ts)createSurvey(data): Fuerza por defecto el estado inicial a Borrador y valida que el tipo de encuesta sea obligatorio.updateSurvey(id, data): Consulta la encuesta y evalúa su estado actual. Si es distinto de Borrador, lanza un error rechazando la modificación.publishSurvey(id): Transiciona el estado de la encuesta de Borrador a Publicada para que comience a recibir respuestas.deactivateSurvey(id): Ejecuta un borrado lógico cambiando el estado a Inactiva, preservando el historial de respuestas pasadas.

Ejemplos de Consultas en PostmanNota previa: Para todas las peticiones a continuación 
1. Registrar un Nuevo Usuario

Método: POST

URL: http://localhost:3001/api/register

Headers: Content-Type: application/json

Body (JSON):

JSON
{
  "nombre": "Zulliexxxxx",
  "correo": "zullie@example.com",
  "password": "Password123",
  "status": 1,
  "rol": "Docente"
}
(Este endpoint te devolverá un mensaje de éxito, el ID del usuario y un token JWT que debes copiar para tus siguientes peticiones).

2. Iniciar Sesión (Login)

Método: POST

URL: http://localhost:3001/api/login

Headers: Content-Type: application/json

Body (JSON):

JSON
{
  "correo": "zullie@example.com",
  "password": "Password123"
}

(Al igual que el registro, te devolverá el token de acceso si las credenciales son correctas)., debes configurar la pestaña Authorization en Postman seleccionando Bearer Token y pegando el token JWT obtenido al iniciar sesión.1. Módulo Perfil (Dev 2)Consultar mi perfilMétodo: GETURL: http://localhost:3001/api/profileBody: NingunoActualizar mi perfilMétodo: PUTURL: http://localhost:3001/api/profileHeaders: Content-Type: application/jsonBody (JSON):json{
  "nombre": "ZullXXX XXXXX",
  "foto_perfil": "https://mi-sitio.com/avatar.jpg"
}
Usa el código con precaución.2. Módulo de Encuestas (Dev 3)Crear Encuesta (Nace en Borrador)Método: POSTURL: http://localhost:3001/api/surveysHeaders: Content-Type: application/jsonBody (JSON): (Asegúrate de colocar UUIDs reales existentes en tus tablas items y tipos_encuesta)json{
  "item_id": "XXXXXXXXXXXXXXXXXXXXXX",
  "tipo_encuesta_id": "XXXXXXXXXXXXXXXXXX",
  "titulo": "Evaluación Docente Periodo I",
  "descripcion": "Encuesta obligatoria para medir desempeño académico."
}
Usa el código con precaución.Listar todas las encuestasMétodo: GETURL: http://localhost:3001/api/surveysBody: NingunoConsultar detalle de una encuestaMétodo: GETURL: http://localhost:3001/api/surveys/AQUI-EL-UUID-DE-LA-ENCUESTABody: NingunoEditar Encuesta (Solo permitido si está en Borrador)Método: PUTURL: http://localhost:3001/api/surveys/AQUI-EL-UUID-DE-LA-ENCUESTAHeaders: Content-Type: application/jsonBody (JSON):json{
  "titulo": "Evaluación Docente Periodo I (Actualizada)",
  "descripcion": "Se agregaron instrucciones adicionales."
}
Usa el código con precaución.Publicar EncuestaMétodo: PATCHURL: http://localhost:3001/api/surveys/AQUI-EL-UUID-DE-LA-ENCUESTA/publishBody: NingunoDesactivar Encuesta (Borrado Lógico)Método: PATCHURL: http://localhost:3001/api/surveys/AQUI-EL-UUID-DE-LA-ENCUESTA/deactivateBody: Ninguno

## 🏗️ Arquitectura del Proyecto

El proyecto sigue los principios de la **Arquitectura Hexagonal **:

```text
src/
├── domain/                  # Núcleo de negocio (Interfaces, Entidades puras, Puertos)
│   ├── Survey.ts
│   ├── SurveyPort.ts
│   ├── SurveyResponse.ts
├── application/             # Casos de uso de la aplicación
│   ├── SurveyApplication.ts
│   └── SurveyResponseApplication.ts
└── infraestrucure/          # Adaptadores e infraestructura externa
    ├── adapter/             # Implementación de persistencia con TypeORM
    │   ├── SurveyAdapter.ts
    │   └── SurveyResponseAdapter.ts
    ├── config/              # Base de datos y variables de entorno
    │   ├── data-base.ts
    │   └── enviroment-vars.ts
    ├── controller/          # Controladores HTTP (Express)
    │   ├── SurveyController.ts
    │   ├── SurveyResponseController.ts
    │  
    ├── entities/            # Mapeo ORM (TypeORM Entities)
    │   ├── QuestionEntity.ts
    │   ├── ResponseDetailEntity.ts
    │   ├── ResponseOptionEntity.ts
    │   ├── Survey.ts (SurveyEntity)
    │   ├── SurveyResponseEntity.ts
    │   └── UserEntity.ts
    ├── routes/              # Endpoints HTTP
    │   ├── SurveyRoutes.ts
    │   └── UserRoutes.ts
    └── util/                # Middlewares y esquemas de validación (Joi)
        ├── surveyValidator.ts
        ├── surveyResponseValidator.ts
        └── user_validation.ts



Descripción de Archivos y Componentes🔷
 Dominio (src/domain/)Survey.ts: 
 Define la interfaz Survey y el enum SurveyStatus (Borrador, Publicada, Desactivada).
 SurveyPort.ts: Contrato/Puerto que define los métodos que cualquier adaptador de persistencia debe cumplir (save, findAll, findById, update, updateStatus).
 SurveyResponse.ts: Estructura de dominio para respuestas individuales y colectivas a encuestas.🔷 
 Aplicación (src/application/)SurveyApplication.ts: Caso de uso que contiene las reglas de negocio principales.Regla clave: Solo se permite actualizar contenido de encuestas en estado Borrador.
 🔷 Infraestructura (src/infraestrucure/)1. Adaptadores (infraestrucure/adapter/)
 SurveyAdapter.ts: Implementa SurveyPort. Traduce objetos de Dominio a SurveyEntity mediante TypeORM repository.SurveyResponseAdapter.ts: Maneja la persistencia en cascada de SurveyResponseEntity junto con ResponseDetailEntity.
 2. Entidades TypeORM (infraestrucure/entities/)Survey.ts (SurveyEntity): Mapea la tabla surveys. Contiene relaciones OneToMany con QuestionEntity.
 QuestionEntity.ts: Mapea questions. Relación ManyToOne con SurveyEntity y OneToMany con ResponseOptionEntity.
 ResponseOptionEntity.ts: Mapea response_options. Relación ManyToOne con QuestionEntity.
 SurveyResponseEntity.ts: Mapea survey_responses. Guarda la cabecera del envío. Relación OneToMany con ResponseDetailEntity (con cascade: true).
 ResponseDetailEntity.ts: Mapea response_details. Guarda el detalle enviado por cada pregunta.
 UserEntity.ts: Mapea la tabla users con atributos id_user, name_user, email_user, password_user y status_user.3. Configuración (infraestrucure/config/)
 data-base.ts: Inicializa AppDataSource registrando explícitamente todas las entidades para evitar fallos de metadatos.enviroment-vars.ts: Carga y valida variables de entorno mediante Joi (PORT, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).4. Validadores (infraestrucure/util/)
 surveyValidator.ts: Middleware Joi que asegura que el body contenga title, description, closeDate y userId.
 
surveyResponseValidator.ts: Middleware Joi que exige surveyId y un arreglo details no vacío.🛠️

 Guía para Futuras Modificaciones / MantenimientoEn caso de requerir evoluciones en el sistema, modifica los siguientes archivos según la necesidad:Requerimiento FuturoArchivo(s) a ModificarFunción / PropiedadAgregar un nuevo estado a la encuestasrc/domain/Survey.tssrc/infraestrucure/util/surveyValidator.tsActualizar SurveyStatus enum y la regla .valid(...) de Joi.Cambiar lógica para editar encuestas publicadassrc/application/SurveyApplication.tsMétodo updateSurvey() (remover o ajustar la validación de estado Borrador).Agregar nuevos campos al usuariosrc/infraestrucure/entities/UserEntity.tssrc/domain/User.tsAgregar propiedad con @Column({ name: 'nuevo_campo' }).Agregar lógica de autenticación (JWT/OAuth)src/infraestrucure/routes/Insertar middleware authMiddleware en la cadena de ejecución antes del controlador.Cambiar proveedor de Base de Datossrc/infraestrucure/config/data-base.tsCambiar la propiedad type: 'postgres' por mysql, sqlite, etc.
 
 🚀 Guía de Pruebas en Postman (API Reference)Base URL: http://localhost:3001/api1. Módulo de UsuariosPOST /users - Crear UsuarioJSON{
  "name": "xxxxxxxxx",
  "email": "zxxxxxxe@example.com",
  "password": "Password123!",
  "status": 1
}
GET /users - Obtener UsuariosGET /users/:id - Obtener Usuario por IDGET /users/email/:email - Obtener Usuario por Email2. Módulo de EncuestasPOST /surveys - Crear EncuestaJSON{
  "title": "Encuesta de Satisfacción 2026",
  "description": "Evaluación trimestral sobre el rendimiento del sistema.",
  "closeDate": "2xxx-12-xxxx23:59:59.xxxxxxZ",
  "userId": "dxxxx1ee-6c54-4b01-90e6-d7xxxxxx51"
}
GET /surveys - Obtener Todas las EncuestasGET /surveys/:id - Obtener Encuesta por IDPUT /surveys/:id - Actualizar Encuesta (Solo Borrador)PATCH /surveys/:id/publish - Publicar EncuestaPATCH /surveys/:id/deactivate - Desactivar Encuesta3. Módulo de RespuestasPOST /surveys/:id/responses - Enviar RespuestasJSON{
  "surveyId": "a0eebc99-9c0b-4ef8-bb6d-6bxxxxxx0a11",
  "userId": "dxxxxxxxe-6c54-4b01-90e6-d7xxxxx851",
  "details": [
    {
      "questionId": "bxxxxxxx99-9c0b-4ef8-bb6d-6bbxxxxxx22",
      "optionId": "d3xxxx9-9c0b-4ef8-bb6d-6bxxxxx0a44"
    },
    {
      "questionId": "c2eebc99-9c0b-4ef8-bb6d-6bbxxxxxxxa33",
      "responseText": "Excelente rendimiento en el backend."
    }
  ]
}
GET /surveys/:id/responses - Consultar Respuestas de la Encuesta
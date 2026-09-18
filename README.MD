# 📋 Backend Encuestas

Backend REST API construido con **Node.js + TypeScript + Express + PostgreSQL**, siguiendo los principios de la **Arquitectura Hexagonal (Ports & Adapters)**.

---

## 🧠 ¿Qué es la Arquitectura Hexagonal?

La Arquitectura Hexagonal (también llamada **Ports & Adapters**) fue propuesta por Alistair Cockburn. Su objetivo principal es **aislar el núcleo de negocio (dominio)** de cualquier detalle externo como bases de datos, frameworks HTTP, o librerías de terceros.

La idea es simple:

> **El dominio no sabe que existe Express, ni PostgreSQL, ni TypeORM. Solo conoce sus propias reglas.**

Esto se logra a través de:

- **Puertos (Ports)**: Interfaces que definen *cómo* se comunica el dominio con el exterior.
- **Adaptadores (Adapters)**: Implementaciones concretas de esos puertos (la BD real, el controlador HTTP, etc.).

```
┌─────────────────────────────────────────────────────────┐
│                     INFRAESTRUCTURA                     │
│  ┌──────────┐   ┌───────────────────────────────────┐  │
│  │  HTTP    │   │          ADAPTADORES               │  │
│  │ Express  │──▶│  Controller ──▶ Application        │  │
│  │ Routes   │   │                    │               │  │
│  └──────────┘   │              ┌─────▼──────┐        │  │
│                 │              │   DOMINIO  │        │  │
│                 │              │  (Puerto)  │        │  │
│                 │              └─────┬──────┘        │  │
│                 │                    │               │  │
│                 │          UserAdapter (TypeORM)      │  │
│                 └──────────────────┬───────────────-─┘  │
│                                    ▼                    │
│                              PostgreSQL DB              │
└─────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estructura del Proyecto

```
Backend_Encuestas/
├── src/
│   ├── index.ts                        ← Punto de entrada de la app
│   ├── domain/                         ← 🔴 Núcleo del negocio (sin dependencias externas)
│   │   ├── User.ts                     ← Interface/modelo puro del dominio
│   │   └── UserPort.ts                 ← Puerto (contrato de comunicación)
│   ├── application/                    ← 🟡 Casos de uso y lógica de negocio
│   │   ├── UserApplication.ts          ← Orquesta operaciones de usuarios y registro
│   │   └── AuthApplication.ts          ← Generación y verificación de tokens JWT
│   └── infraestrucure/                 ← 🟢 Todo lo externo (Express, DB, etc.)
│       ├── adapter/
│       │   └── UserAdapter.ts          ← Implementa UserPort usando TypeORM
│       ├── bootstrap/
│       │   └── server.bootstrap.ts     ← Inicialización del servidor HTTP
│       ├── config/
│       │   ├── data-base.ts            ← Configuración de TypeORM + PostgreSQL
│       │   └── environment-vars.ts     ← Carga y valida variables de entorno (Joi)
│       ├── controller/
│       │   └── UserController.ts       ← Maneja peticiones HTTP (req/res)
│       ├── entities/
│       │   └── User.ts                 ← Entidad TypeORM (tabla users: 7 columnas)
│       ├── routes/
│       │   └── UserRoutes.ts           ← Rutas Express + inyección de dependencias + middlewares
│       ├── util/
│       │   ├── user_validation.ts      ← Validación de body al crear/registrar usuario (Joi)
│       │   ├── user-update-validation.ts ← Validación parcial al actualizar
│       │   └── email-validation.ts     ← Validación del email en params
│       └── web/
│           ├── app.ts                  ← Configuración de Express, CORS y prefijo /api
│           ├── authMiddleware.ts       ← Middleware de autenticación con JWT (Bearer token)
│           └── roleMiddleware.ts       ← Middleware de autorización por roles (RBAC)
├── .env                                ← Variables de entorno (NO subir a Git)
├── .env.example                        ← Plantilla de variables de entorno (SÍ subir)
├── .gitignore
├── nodemon.json                        ← Config de nodemon para desarrollo
├── package.json
├── tsconfig.json
└── README.MD
```

---

## 📁 Descripción Detallada de Cada Carpeta

### 🔴 `src/domain/` — El Núcleo (No toca nada externo)

Es la capa más interna. **No importa Express, TypeORM, ni ninguna librería.** Solo define las reglas y contratos del negocio.

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `User.ts` | Define la interface `User` con los campos del modelo de negocio (`id`, `name`, `email`, `password`, `status`) | Interfaces y tipos puros del dominio. Sin decoradores, sin ORM |
| `UserPort.ts` | Define el **Puerto** `UserPort`: una interface con los métodos que la app necesita (`createUser`, `updateUser`, `deleteUser`, etc.) | Solo interfaces/contratos. Nunca implementaciones |

> ⚠️ **Regla de oro**: Nada en `domain/` debe importar algo de `infraestrucure/` o `application/`. El dominio es completamente independiente.

---

### 🟡 `src/application/` — Casos de Uso

Contiene la **lógica de negocio orquestada**. Sabe qué operaciones existen, en qué orden ejecutarlas y qué validaciones aplicar. Se comunica con el dominio a través del **puerto**.

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `UserApplication.ts` | Clase que recibe un `UserPort` por constructor (inyección de dependencias) y ejecuta los casos de uso: `createUser`, `register` (con token JWT), `login`, `updateUser`, etc. | Clases de casos de uso. Lógica de negocio como validaciones de reglas, hashing con bcrypt, flujos multi-paso |
| `AuthApplication.ts` | Provee métodos estáticos `generateToken` y `verifyToken` usando **jsonwebtoken** para firmar y validar tokens JWT con id, correo y rol del usuario | Lógica de autenticación, generación y validación de tokens de sesión |

> **Ejemplo real en el proyecto**: Antes de crear un usuario, `UserApplication` llama a `getUserByEmail` para verificar que el email no esté registrado. Esta es una **regla de negocio**, no una validación de formato HTTP.

---

### 🟢 `src/infraestrucure/` — Todo lo Externo

Es la capa más externa. Aquí vive todo lo que depende de tecnologías concretas. Se puede reemplazar sin tocar el dominio ni la aplicación.

#### 📁 `adapter/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `UserAdapter.ts` | **Implementa** la interface `UserPort` usando TypeORM. Convierte entre la entidad ORM (`UserEntity`) y el modelo de dominio (`User`). Es el puente entre la BD y el dominio | Clases que implementan los puertos del dominio. Un adapter por fuente de datos o servicio externo |

> El adapter tiene dos métodos privados clave: `toDomain()` (convierte entidad ORM → dominio) y `toEntity()` (convierte dominio → entidad ORM). Esto garantiza que el dominio nunca vea columnas de base de datos como `user_id` o `password_hash`.

#### 📁 `bootstrap/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `server.bootstrap.ts` | Clase `ServerBootstrap` que recibe la app de Express e inicializa el servidor HTTP en el puerto configurado | Lógica de arranque de servicios (HTTP server, conexiones iniciales, etc.) |

#### 📁 `config/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `data-base.ts` | Crea el `DataSource` de TypeORM con la configuración de PostgreSQL y exporta la función `connectDB()` | Configuración de conexiones: ORM, cache, message brokers, etc. |
| `environment-vars.ts` | Usa **Joi** para validar que todas las variables de entorno requeridas existan al iniciar la app. Si falta alguna, lanza error inmediatamente | Validación y tipado fuerte de variables de entorno. Evita errores en tiempo de ejecución |

#### 📁 `controller/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `UserController.ts` | Recibe `Request` y `Response` de Express. Llama a `UserApplication`, maneja errores HTTP y devuelve respuestas JSON | Solo lógica de transporte HTTP: parsear parámetros, manejar status codes, formatear respuestas |

> El controller **no contiene lógica de negocio**. Si hay un error de email duplicado, lo lanza `UserApplication`; el controller solo lo captura y lo convierte en un `HTTP 500` o `400`.

#### 📁 `entities/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `User.ts` | Entidad TypeORM que mapea fielmente a la tabla `users` en PostgreSQL con sus 7 columnas: `user_id`, `name`, `email`, `password_hash`, `created_at`, `status_user`, `role`. Define el enum `RolUsuario` (`administrador`, `usuario`) | Entidades ORM con decoradores. Una entidad por tabla de base de datos |

> Esta entidad es **diferente** del `User` del dominio. Usa los nombres reales de columna de BD (`user_id`, `password_hash`, `status_user`) mientras que el dominio usa nombres limpios (`id`, `password`, `status`). El `UserAdapter` hace la traducción transparente.

#### 📁 `routes/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `UserRoutes.ts` | Define las rutas Express (`/login`, `/register`, `/users`, etc.) e inyecta middlewares de autenticación (`authenticateToken`) y autorización de roles (`authorizeRole`) | Definición de rutas + composición (wiring) de capas + middlewares de seguridad |

> Este es el punto de composición: `new UserAdapter()` → `new UserApplication(adapter)` → `new UserController(app)`. Así se conectan las capas sin acoplarse entre ellas.

#### 📁 `util/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `user_validation.ts` | Valida y parsea el body de la petición para crear/registrar usuario usando **Joi** (incluyendo validación de `role`) | Validaciones de entrada HTTP (formato, campos requeridos, tipos) |
| `user-update-validation.ts` | Valida el body de actualización parcial (`Partial<User>`) | Validaciones para operaciones parciales |
| `email-validation.ts` | Valida que el email en los params de la URL tenga formato correcto | Validaciones de parámetros de ruta o query |

#### 📁 `web/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `app.ts` | Clase `App` que instancia Express, registra middlewares globales (`cors`, `express.json`) y conecta las rutas bajo `/api` | Configuración central de Express: middlewares globales, prefijos, CORS |
| `authMiddleware.ts` | Extrae el header `Authorization: Bearer <token>`, verifica el token JWT y adjunta el payload a `req.user` | Middleware de autenticación global para proteger rutas privadas |
| `roleMiddleware.ts` | Middleware de autorización basado en roles (`authorizeRole(...roles)`). Valida que el usuario tenga el rol requerido | Middleware de control de acceso basado en roles (RBAC) |

---

## 🔄 Flujo de una Petición HTTP

```
Cliente HTTP (Postman / Frontend)
        │
        │  POST /api/users  { name, email, password, status }
        ▼
┌─────────────────┐
│  UserRoutes.ts  │  ← Define la ruta, hace wiring de dependencias
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  UserController.ts   │  ← Valida body con Joi (loadUserData), maneja req/res
└──────────┬───────────┘
           │  llama a this.app.createUser(user)
           ▼
┌──────────────────────────┐
│  UserApplication.ts      │  ← Aplica reglas: ¿el email ya existe?
└──────────┬───────────────┘
           │  llama a this.port.createUser(user)
           ▼                   (UserPort - contrato)
┌──────────────────────────┐
│  UserAdapter.ts          │  ← Implementa el puerto con TypeORM
└──────────┬───────────────┘
           │  userRepository.save(entity)
           ▼
┌──────────────────────────┐
│      PostgreSQL           │  ← Base de datos real
└──────────────────────────┘
```

---

## ⚙️ Requisitos Previos

Antes de correr el proyecto, necesitas tener instalado:

| Herramienta | Versión recomendada | Descarga |
|---|---|---|
| **Node.js** | v20 LTS o superior | https://nodejs.org |
| **npm** | Incluido con Node.js | — |
| **PostgreSQL** | v14 o superior | https://www.postgresql.org/download |
| **Git** | Cualquier versión reciente | https://git-scm.com |

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/DAVMARTZ/Proyecto_Encuestas.git
cd Proyecto_Encuestas
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y rellena los valores:

```bash
cp .env.example .env
```

Edita el `.env` con tus datos:

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña
DB_NAME=nombre_de_tu_base_de_datos
```

### 4. Crear la base de datos en PostgreSQL

Conéctate a PostgreSQL y crea la base de datos y el schema:

```sql
CREATE DATABASE nombre_de_tu_base_de_datos;

\c nombre_de_tu_base_de_datos

CREATE SCHEMA users;
```

> El proyecto usa `synchronize: true` en TypeORM durante desarrollo, por lo que las tablas se crean automáticamente al levantar la app.

### 5. Correr en modo desarrollo

```bash
npm run dev
```

### 6. Compilar para producción

```bash
npm run build
npm run start
```

---

## 📡 Endpoints de la API

Base URL: `http://localhost:3000/api`

### Módulo de Autenticación y Usuarios

| Método | Ruta | Acceso | Descripción | Body requerido |
|---|---|---|---|---|
| `POST` | `/login` | 🌐 Público | Iniciar sesión y obtener token JWT | `{ correo, password }` |
| `POST` | `/register` | 🌐 Público | Auto-registro de usuario con token de sesión | `{ nombre, correo, password, status, rol }` |
| `GET` | `/users` | 🔒 `administrador` | Listar todos los usuarios activos | — |
| `POST` | `/users` | 🔒 `administrador` | Crear un nuevo usuario desde panel admin | `{ nombre, correo, password, status, rol }` |
| `GET` | `/users/email/:email` | 🔒 Autenticado | Buscar usuario por correo electrónico | — |
| `GET` | `/users/:id` | 🔒 Autenticado | Obtener información de un usuario por ID | — |
| `PUT` | `/users/:id` | 🔒 `administrador` | Actualizar datos del usuario parcialmente | `{ nombre?, correo?, password?, status?, rol? }` |
| `DELETE` | `/users/:id` | 🔒 `administrador` | Baja lógica del usuario (`status_user` → 0) | — |

> 🔒 **Autenticación**: Los endpoints protegidos requieren el header `Authorization: Bearer <token>`.  
> 🛡️ **Control de roles**: Las rutas administrativas verifican mediante `authorizeRole('administrador', 'admin')` que el usuario posea dicho rol en el payload del token.

### Ejemplo de request — Registro de usuario (`POST /api/register`)

```json
POST /api/register
Content-Type: application/json

{
  "nombre": "Carlos Gómez",
  "correo": "carlos@example.com",
  "password": "Password123",
  "status": 1,
  "rol": "usuario"
}
```

### Ejemplo de response exitoso (`201 Created`)

```json
HTTP 201 Created

{
  "message": "Registro exitoso",
  "userId": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "rol": "usuario"
}
```

---

## 📦 Dependencias

### Producción

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `express` | ^5.2.1 | Framework HTTP para crear la API REST |
| `cors` | ^2.8.5 | Middleware para habilitar Cross-Origin Resource Sharing |
| `dotenv` | ^17.4.2 | Carga variables de entorno desde `.env` |
| `joi` | ^18.2.3 | Validación de esquemas (body, params, env vars) |
| `typeorm` | ^0.3.20 | ORM para interactuar con PostgreSQL |
| `pg` | ^8.23.0 | Driver de PostgreSQL para Node.js |
| `bcryptjs` | ^2.4.3 | Hashing y verificación segura de contraseñas |
| `jsonwebtoken` | ^9.0.2 | Generación y verificación de tokens de autenticación JWT |

### Desarrollo

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `typescript` | ^7.0.2 | Compilador de TypeScript |
| `tsx` | ^4.23.1 | Ejecuta TypeScript directamente sin compilar (usado en `npm run dev`) |
| `ts-node` | ^10.9.2 | Alternativa a tsx para ejecutar TS |
| `nodemon` | ^3.1.14 | Reinicia automáticamente el servidor al detectar cambios |
| `@types/express` | ^5.0.6 | Tipos de TypeScript para Express |
| `@types/cors` | ^2.8.17 | Tipos de TypeScript para CORS |
| `@types/bcryptjs` | ^2.4.6 | Tipos de TypeScript para bcryptjs |
| `@types/jsonwebtoken` | ^9.0.7 | Tipos de TypeScript para jsonwebtoken |

---

## 📝 Scripts Disponibles

```bash
npm run dev      # Modo desarrollo con hot-reload (nodemon + tsx)
npm run build    # Compila TypeScript → JavaScript en /dist
npm run start    # Ejecuta la versión compilada desde /dist
```

---

## 🗄️ Modelo de Base de Datos

### Tabla: `users` (7 columnas)

| Columna | Tipo SQL | Tipo ORM / TS | Restricciones | Descripción |
|---|---|---|---|---|
| `user_id` | `UUID` | string | PK, Generated UUID | Identificador único del usuario |
| `name` | `VARCHAR(255)` | string | NOT NULL | Nombre completo |
| `email` | `VARCHAR(255)` | string | NOT NULL, UNIQUE | Correo electrónico único |
| `password_hash` | `VARCHAR(255)` | string | NOT NULL | Contraseña con hash bcrypt |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | Date | DEFAULT CURRENT_TIMESTAMP | Fecha y hora de creación |
| `status_user` | `INTEGER` | number | DEFAULT 1 | Estado del usuario: `1` = activo, `0` = baja lógica |
| `role` | `VARCHAR(50)` | RolUsuario | DEFAULT 'usuario' | Rol del usuario (`administrador`, `usuario`) |

> 💡 **Baja lógica**: Los usuarios nunca se eliminan físicamente de la base de datos; la operación `deleteUser` actualiza `status_user = 0`.

---

## 🔒 Variables de Entorno Requeridas

| Variable | Tipo | Requerida | Default | Descripción |
|---|---|---|---|---|
| `PORT` | number | ✅ | — | Puerto donde corre el servidor |
| `DB_HOST` | string | ✅ | — | Host de PostgreSQL |
| `DB_PORT` | number | ❌ | `5432` | Puerto de PostgreSQL |
| `DB_USER` | string | ✅ | — | Usuario de la BD |
| `DB_PASSWORD` | string | ❌ | `""` | Contraseña de la BD |
| `DB_NAME` | string | ✅ | — | Nombre de la base de datos |
| `JWT_SECRET` | string | ✅ | — | Clave secreta para firmar tokens JWT |

La validación de estas variables se realiza con **Joi** al iniciar la aplicación en [`environment-vars.ts`](src/infraestrucure/config/environment-vars.ts). Si falta alguna variable requerida, la app no arranca y muestra el error específico.

---

## 📜 Historial de Cambios Recientes

### 🔐 Autenticación, Roles y Normalización de BD
1. **Normalización de Entidad `User` con la Base de Datos:**
   - La entidad `User` en `src/infraestrucure/entities/User.ts` se adaptó fielmente a las 7 columnas reales de la tabla `users` (`user_id`, `name`, `email`, `password_hash`, `created_at`, `status_user`, `role`).
   - Se configuró el enum de TypeScript `RolUsuario` con dos roles permitidos: `administrador` y `usuario`, manteniendo la columna en base de datos como `VARCHAR(50)` para evitar errores de sincronización de tipos nativos.
2. **Actualización de Mapeos en `UserAdapter`:**
   - Se ajustaron los métodos `toDomain()` y `toEntity()` y todas las consultas (`where: { user_id }`, `where: { email }`, `where: { status_user: 1 }`) para mapear transparentemente entre la entidad y el modelo de dominio sin alterar la lógica de negocio.
3. **Flujo de Auto-Registro (`register`):**
   - Se implementó `register()` en `UserApplication` y `UserController`, generando y devolviendo un token JWT con la sesión lista y el rol asignado (`userId`, `token`, `rol`).
4. **Middleware de Control de Acceso por Roles (RBAC):**
   - Se creó `src/infraestrucure/web/roleMiddleware.ts` con la función `authorizeRole(...roles)`, validando que el rol presente en el token JWT coincida con los permisos requeridos.
5. **Completitud y Protección de `UserRoutes`:**
   - Se registraron todas las rutas del CRUD que faltaban (`GET /users/:id`, `PUT /users/:id`, `DELETE /users/:id`).
   - Se protegió el acceso a las operaciones sensibles (`GET /users`, `POST /users`, `PUT /users/:id`, `DELETE /users/:id`) únicamente para usuarios con rol `administrador`.

---

## 🧩 ¿Cómo agregar un nuevo módulo con esta arquitectura?

Si quisieras agregar, por ejemplo, el módulo de **Encuestas**, deberías seguir este orden:

1. **`domain/`** → Crear `Survey.ts` (interface) y `SurveyPort.ts` (contrato de métodos)
2. **`application/`** → Crear `SurveyApplication.ts` con la lógica de negocio
3. **`infraestrucure/entities/`** → Crear la entidad TypeORM `Survey.ts`
4. **`infraestrucure/adapter/`** → Crear `SurveyAdapter.ts` que implemente `SurveyPort`
5. **`infraestrucure/controller/`** → Crear `SurveyController.ts`
6. **`infraestrucure/routes/`** → Crear `SurveyRoutes.ts` con el wiring y las rutas
7. **`infraestrucure/web/app.ts`** → Registrar las nuevas rutas

---

## 👤 Autor

**Malory Farfan**  
Proyecto Backend — Arquitectura Hexagonal con Node.js + TypeScript


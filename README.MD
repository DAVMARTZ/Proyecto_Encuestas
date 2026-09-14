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
│   │   └── UserApplication.ts          ← Orquesta operaciones usando el puerto
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
│       │   └── User.ts                 ← Entidad TypeORM (mapeo a tabla en BD)
│       ├── routes/
│       │   └── UserRoutes.ts           ← Define rutas Express + inyecta dependencias
│       ├── util/
│       │   ├── user_validation.ts      ← Validación de body al crear usuario (Joi)
│       │   ├── user-update-validation.ts ← Validación parcial al actualizar
│       │   └── email-validation.ts     ← Validación del email en params
│       └── web/
│           └── app.ts                  ← Clase App: middlewares + rutas de Express
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
| `UserApplication.ts` | Clase que recibe un `UserPort` por constructor (inyección de dependencias) y ejecuta los casos de uso: validar email duplicado antes de crear, verificar existencia antes de actualizar, etc. | Clases de casos de uso. Lógica de negocio como validaciones de reglas, flujos multi-paso |

> **Ejemplo real en el proyecto**: Antes de crear un usuario, `UserApplication` llama a `getUserByEmail` para verificar que el email no esté registrado. Esta es una **regla de negocio**, no una validación de formato HTTP.

---

### 🟢 `src/infraestrucure/` — Todo lo Externo

Es la capa más externa. Aquí vive todo lo que depende de tecnologías concretas. Se puede reemplazar sin tocar el dominio ni la aplicación.

#### 📁 `adapter/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `UserAdapter.ts` | **Implementa** la interface `UserPort` usando TypeORM. Convierte entre la entidad ORM (`UserEntity`) y el modelo de dominio (`User`). Es el puente entre la BD y el dominio | Clases que implementan los puertos del dominio. Un adapter por fuente de datos o servicio externo |

> El adapter tiene dos métodos privados clave: `toDomain()` (convierte entidad ORM → dominio) y `toEntity()` (convierte dominio → entidad ORM). Esto garantiza que el dominio nunca vea columnas de base de datos como `id_user` o `email_user`.

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
| `User.ts` | Clase decorada con `@Entity`, `@Column`, `@PrimaryGeneratedColumn` de TypeORM. Mapea directamente a la tabla `users` en PostgreSQL con columnas `id_user`, `name_user`, `email_user`, `password_user`, `status_user` | Entidades ORM con decoradores. Una entidad por tabla de base de datos |

> Esta entidad es **diferente** del `User` del dominio. Usa nombres de columna de BD (`name_user`) mientras que el dominio usa nombres limpios (`name`). El `UserAdapter` hace la traducción.

#### 📁 `routes/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `UserRoutes.ts` | Define las rutas Express (`POST /users`, `GET /users`, etc.) y hace la **inyección de dependencias manual**: instancia `UserAdapter` → `UserApplication` → `UserController` | Definición de rutas + composición (wiring) de capas. Es el único lugar donde se ensamblan las piezas |

> Este es el punto de composición: `new UserAdapter()` → `new UserApplication(adapter)` → `new UserController(app)`. Así se conectan las capas sin acoplarse entre ellas.

#### 📁 `util/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `user_validation.ts` | Valida y parsea el body de la petición para crear usuario usando **Joi** | Validaciones de entrada HTTP (formato, campos requeridos, tipos) |
| `user-update-validation.ts` | Valida el body de actualización parcial (`Partial<User>`) | Validaciones para operaciones parciales |
| `email-validation.ts` | Valida que el email en los params de la URL tenga formato correcto | Validaciones de parámetros de ruta o query |

#### 📁 `web/`

| Archivo | Qué hace | Qué debe ir aquí |
|---|---|---|
| `app.ts` | Clase `App` que instancia Express, registra middlewares (`express.json()`) y conecta las rutas bajo el prefijo `/api` | Configuración central de Express: middlewares globales, prefijos, CORS, etc. |

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

| Método | Ruta | Descripción | Body |
|---|---|---|---|
| `POST` | `/users` | Crear un nuevo usuario | `{ name, email, password, status }` |
| `GET` | `/users` | Obtener todos los usuarios activos | — |
| `GET` | `/users/email/:email` | Buscar usuario por email | — |
| `GET` | `/users/:id` | Obtener usuario por ID | — |
| `PUT` | `/users/:id` | Actualizar usuario parcialmente | `{ name?, email?, password?, status? }` |
| `DELETE` | `/users/:id` | Baja lógica del usuario (status → 0) | — |

### Ejemplo de request — Crear usuario

```json
POST /api/users
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "miPassword123",
  "status": 1
}
```

### Ejemplo de response exitoso

```json
HTTP 201 Created

{
  "message": "Usuario creado con exito",
  "userId": 1
}
```

---

## 📦 Dependencias

### Producción

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `express` | ^5.2.1 | Framework HTTP para crear la API REST |
| `dotenv` | ^17.4.2 | Carga variables de entorno desde `.env` |
| `joi` | ^18.2.3 | Validación de esquemas (body, env vars) |
| `pg` | ^8.23.0 | Driver de PostgreSQL para Node.js (requerido por TypeORM) |

### Desarrollo

| Paquete | Versión | Para qué sirve |
|---|---|---|
| `typescript` | ^7.0.2 | Compilador de TypeScript |
| `tsx` | ^4.23.1 | Ejecuta TypeScript directamente sin compilar (usado en `npm run dev`) |
| `ts-node` | ^10.9.2 | Alternativa a tsx para ejecutar TS |
| `nodemon` | ^3.1.14 | Reinicia automáticamente el servidor al detectar cambios |
| `@types/express` | ^5.0.6 | Tipos de TypeScript para Express |

---

## 📝 Scripts Disponibles

```bash
npm run dev      # Modo desarrollo con hot-reload (nodemon + tsx)
npm run build    # Compila TypeScript → JavaScript en /dist
npm run start    # Ejecuta la versión compilada desde /dist
```

---

## 🗄️ Modelo de Base de Datos

### Schema: `users`
### Tabla: `users`

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id_user` | `INTEGER` | PK, AUTO_INCREMENT | Identificador único |
| `name_user` | `VARCHAR(255)` | NOT NULL | Nombre completo |
| `email_user` | `VARCHAR(255)` | NOT NULL, UNIQUE | Email (único) |
| `password_user` | `VARCHAR(255)` | NOT NULL | Contraseña |
| `status_user` | `INTEGER` | DEFAULT 1 | 1 = activo, 0 = baja lógica |

> El proyecto implementa **baja lógica**: los usuarios nunca se eliminan físicamente, solo se cambia `status_user` a `0`.

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

La validación de estas variables se realiza con **Joi** al iniciar la aplicación en [`environment-vars.ts`](src/infraestrucure/config/environment-vars.ts). Si falta alguna variable requerida, la app no arranca y muestra el error específico.

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

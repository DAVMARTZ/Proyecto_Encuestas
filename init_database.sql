-- =============================================================================
-- ESQUEMA NORMALIZADO - PROYECTO ENCUESTAS (POSTGRESQL)
-- Identificadores: SERIAL (INTEGER AUTOINCREMENTAL)
-- Estado: Campo numérico SMALLINT
--   Todas las tablas: 1 = ACTIVO, 0 = INACTIVO
--   Encuestas:        2 = BORRADOR, 1 = PUBLICADA, 0 = INACTIVA
-- Borrado Lógico: Prohibición de eliminación física
--
-- Es seguro ejecutarlo varias veces: solo crea lo que no existe y no borra datos.
-- Si ya tienes la base creada con la versión anterior, ejecuta ajuste_base_existente.sql
-- =============================================================================

-- 1. Tabla: roles
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    status SMALLINT NOT NULL DEFAULT 1,
    CONSTRAINT chk_status_role CHECK (status IN (0, 1))
);

-- 2. Tabla: users
-- Mantiene exclusivamente los campos especificados: id numérico, name, email, password_hash, created_at, status_user (0/1), role_id y foto (photo_data BYTEA + photo_mime_type)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),      -- En desuso: las contraseñas las administra Firebase
    firebase_uid VARCHAR(128) UNIQUE, -- Identificador de la cuenta en Firebase
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_user SMALLINT NOT NULL DEFAULT 1,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    photo_data BYTEA,               -- Binario comprimido con gzip (varbinary en postgres)
    photo_mime_type VARCHAR(50),     -- Tipo MIME de la foto
    CONSTRAINT chk_status_user CHECK (status_user IN (0, 1))
);

-- 3. Tabla: surveys
CREATE TABLE IF NOT EXISTS surveys (
    survey_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    close_date TIMESTAMPTZ,
    status SMALLINT NOT NULL DEFAULT 2,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_status_survey CHECK (status IN (0, 1, 2)),
    CONSTRAINT chk_survey_close_date CHECK (close_date IS NULL OR close_date >= created_at)
);

-- 4. Tabla: questions
CREATE TABLE IF NOT EXISTS questions (
    question_id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL,
    status SMALLINT NOT NULL DEFAULT 1,
    survey_id INTEGER NOT NULL REFERENCES surveys(survey_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_status_question CHECK (status IN (0, 1)),
    CONSTRAINT chk_question_type CHECK (question_type IN ('Escala', 'Abierta', 'Seleccion Multiple'))
);

-- 5. Tabla: response_options
CREATE TABLE IF NOT EXISTS response_options (
    option_id SERIAL PRIMARY KEY,
    option_text VARCHAR(300) NOT NULL,
    display_order INTEGER NOT NULL,
    status SMALLINT NOT NULL DEFAULT 1,
    question_id INTEGER NOT NULL REFERENCES questions(question_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_status_response_option CHECK (status IN (0, 1)),
    CONSTRAINT uq_question_option_order UNIQUE (question_id, display_order)
);

-- 6. Tabla: survey_responses
-- user_id admite NULL solo para conservar envíos históricos ya inactivados: toda respuesta activa tiene usuario
CREATE TABLE IF NOT EXISTS survey_responses (
    survey_response_id SERIAL PRIMARY KEY,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status SMALLINT NOT NULL DEFAULT 1,
    survey_id INTEGER NOT NULL REFERENCES surveys(survey_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_status_response CHECK (status IN (0, 1)),
    CONSTRAINT chk_response_user CHECK (status = 0 OR user_id IS NOT NULL)
);

-- 7. Tabla: response_details
CREATE TABLE IF NOT EXISTS response_details (
    detail_id SERIAL PRIMARY KEY,
    response_text TEXT,
    status SMALLINT NOT NULL DEFAULT 1,
    survey_response_id INTEGER NOT NULL REFERENCES survey_responses(survey_response_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    question_id INTEGER NOT NULL REFERENCES questions(question_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    option_id INTEGER REFERENCES response_options(option_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_status_detail CHECK (status IN (0, 1)),
    CONSTRAINT chk_response_detail_content CHECK (response_text IS NOT NULL OR option_id IS NOT NULL)
);

-- =============================================================================
-- ÍNDICES PARA MEJORA DE RENDIMIENTO EN LLAVES FORÁNEAS Y ESTADOS
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status_user ON users(status_user);
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_questions_survey_id ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_response_options_question_id ON response_options(question_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_response_details_survey_response_id ON response_details(survey_response_id);

-- Cada usuario responde una sola vez cada encuesta (solo cuentan los envíos activos)
CREATE UNIQUE INDEX IF NOT EXISTS uq_survey_response_user ON survey_responses(survey_id, user_id) WHERE status = 1;

-- =============================================================================
-- DATOS SEMILLA INICIALES (ROLES Y USUARIO ADMINISTRADOR)
-- =============================================================================
INSERT INTO roles (role_id, name, description, status) VALUES
(1, 'ADMIN', 'Administrador con acceso a todas las funcionalidades del sistema', 1),
(2, 'STUDENT', 'Estudiante que puede consultar y responder encuestas asignadas', 1)
ON CONFLICT DO NOTHING;

-- Sincronizar secuencia de roles
SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));

-- IMPORTANTE: el administrador se enlaza con su cuenta de Firebase después de ejecutar este script:
-- UPDATE users SET firebase_uid = 'UID_DE_LA_CUENTA_EN_FIREBASE' WHERE user_id = 1;
INSERT INTO users (user_id, name, email, status_user, role_id) VALUES
(1, 'Administrador del Sistema', 'admin@encuestas.com', 1, 1)
ON CONFLICT DO NOTHING;

-- Sincronizar secuencia de users
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

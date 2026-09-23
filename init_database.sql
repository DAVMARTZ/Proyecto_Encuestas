-- =============================================================================
-- ESQUEMA NORMALIZADO - PROYECTO ENCUESTAS (POSTGRESQL)
-- Identificadores: SERIAL (INTEGER AUTOINCREMENTAL)
-- Estado: Campo numérico/bit SMALLINT (1 = ACTIVO, 0 = INACTIVO)
-- Borrado Lógico: Prohibición de eliminación física
-- =============================================================================

DROP TABLE IF EXISTS response_details CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS response_options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. Tabla: roles
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    status SMALLINT NOT NULL DEFAULT 1,
    CONSTRAINT chk_status_role CHECK (status IN (0, 1))
);

-- 2. Tabla: users
-- Mantiene exclusivamente los campos especificados: id numérico, name, email, password_hash, created_at, status_user (0/1), role_id y foto (photo_data BYTEA + photo_mime_type)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_user SMALLINT NOT NULL DEFAULT 1,
    role_id INTEGER NOT NULL REFERENCES roles(role_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    photo_data BYTEA,               -- Binario comprimido con gzip (varbinary en postgres)
    photo_mime_type VARCHAR(50),     -- Tipo MIME de la foto
    CONSTRAINT chk_status_user CHECK (status_user IN (0, 1))
);

-- 3. Tabla: surveys
CREATE TABLE surveys (
    survey_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    close_date TIMESTAMPTZ,
    status SMALLINT NOT NULL DEFAULT 1,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_status_survey CHECK (status IN (0, 1)),
    CONSTRAINT chk_survey_close_date CHECK (close_date IS NULL OR close_date >= created_at)
);

-- 4. Tabla: questions
CREATE TABLE questions (
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
CREATE TABLE response_options (
    option_id SERIAL PRIMARY KEY,
    option_text VARCHAR(300) NOT NULL,
    display_order INTEGER NOT NULL,
    status SMALLINT NOT NULL DEFAULT 1,
    question_id INTEGER NOT NULL REFERENCES questions(question_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_status_response_option CHECK (status IN (0, 1)),
    CONSTRAINT uq_question_option_order UNIQUE (question_id, display_order)
);

-- 6. Tabla: survey_responses
CREATE TABLE survey_responses (
    survey_response_id SERIAL PRIMARY KEY,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status SMALLINT NOT NULL DEFAULT 1,
    survey_id INTEGER NOT NULL REFERENCES surveys(survey_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    user_id INTEGER REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_status_response CHECK (status IN (0, 1))
);

-- 7. Tabla: response_details
CREATE TABLE response_details (
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
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status_user ON users(status_user);
CREATE INDEX idx_surveys_user_id ON surveys(user_id);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_questions_survey_id ON questions(survey_id);
CREATE INDEX idx_response_options_question_id ON response_options(question_id);
CREATE INDEX idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX idx_response_details_survey_response_id ON response_details(survey_response_id);

-- =============================================================================
-- DATOS SEMILLA INICIALES (ROLES Y USUARIO ADMINISTRADOR)
-- =============================================================================
INSERT INTO roles (role_id, name, description, status) VALUES
(1, 'ADMIN', 'Administrador con acceso a todas las funcionalidades del sistema', 1),
(2, 'STUDENT', 'Estudiante que puede consultar y responder encuestas asignadas', 1)
ON CONFLICT (role_id) DO NOTHING;

-- Sincronizar secuencia de roles
SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));

INSERT INTO users (user_id, name, email, password_hash, status_user, role_id) VALUES
(1, 'Administrador del Sistema', 'admin@encuestas.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 1, 1)
ON CONFLICT (user_id) DO NOTHING;

-- Sincronizar secuencia de users
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

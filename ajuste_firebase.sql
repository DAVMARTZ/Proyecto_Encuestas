-- =============================================================================
-- AJUSTE PARA ENLAZAR LOS USUARIOS CON FIREBASE
-- Para bases creadas antes de integrar Firebase.
--
-- No borra tablas, columnas ni filas. Se puede ejecutar más de una vez.
-- DROP NOT NULL solo quita la obligación de que password_hash tenga valor.
-- =============================================================================

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(128) UNIQUE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

COMMIT;

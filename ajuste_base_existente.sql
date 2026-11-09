-- =============================================================================
-- AJUSTE PARA BASES CREADAS CON LA VERSIÓN ANTERIOR DE init_database.sql
-- Agrega el estado BORRADOR y la regla de una respuesta por usuario.
--
-- No borra tablas ni filas. Va en una transacción: si algo falla, no cambia nada.
-- Se ejecuta una sola vez.
--
-- Antes de ejecutarlo, revisa si hay envíos que incumplan las reglas nuevas:
--
--   -- Envíos activos anónimos
--   SELECT survey_response_id, survey_id FROM survey_responses
--   WHERE status = 1 AND user_id IS NULL;
--
--   -- Usuarios con más de un envío activo en la misma encuesta
--   SELECT survey_id, user_id, COUNT(*) FROM survey_responses
--   WHERE status = 1 AND user_id IS NOT NULL
--   GROUP BY survey_id, user_id HAVING COUNT(*) > 1;
--
-- Si aparecen filas, se inactivan de forma lógica (status = 0) los envíos que
-- no se quieran conservar como activos, indicando su survey_response_id:
--
--   UPDATE survey_responses SET status = 0 WHERE survey_response_id IN (...);
-- =============================================================================

BEGIN;

-- Encuestas: se reemplaza solo la regla de estados para admitir 2 = BORRADOR.
-- Esto no toca las filas: las encuestas actuales conservan su estado.
ALTER TABLE surveys DROP CONSTRAINT IF EXISTS chk_status_survey;
ALTER TABLE surveys ADD CONSTRAINT chk_status_survey CHECK (status IN (0, 1, 2));
ALTER TABLE surveys ALTER COLUMN status SET DEFAULT 2;

-- Respuestas: toda respuesta activa debe tener usuario
ALTER TABLE survey_responses ADD CONSTRAINT chk_response_user CHECK (status = 0 OR user_id IS NOT NULL);

-- Respuestas: cada usuario responde una sola vez cada encuesta
CREATE UNIQUE INDEX uq_survey_response_user ON survey_responses(survey_id, user_id) WHERE status = 1;

COMMIT;

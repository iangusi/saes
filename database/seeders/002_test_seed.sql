USE saes2;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE proceso_academico;
TRUNCATE TABLE periodo_proceso;
TRUNCATE TABLE encuesta_docente_respuesta;
TRUNCATE TABLE encuesta_docente_pregunta;
TRUNCATE TABLE encuesta_docente;
SET FOREIGN_KEY_CHECKS = 1;


-- 1. Insert academic processes
INSERT INTO proceso_academico (id_proceso, nombre, descripcion) VALUES
(1, 'reinscripcion', 'Proceso de reinscripción de alumnos'),
(2, 'baja_materia', 'Proceso de baja de unidades de aprendizaje'),
(3, 'evaluacion_docente', 'Proceso de evaluación de profesores por parte de los alumnos');

-- 2. Insert process periods for active period (id_periodo = 8, which is 2026-1)
-- We will set them to be active right now for testing
INSERT INTO periodo_proceso (id_periodo_proceso, id_periodo, id_proceso, fecha_inicio, fecha_fin, activo) VALUES
(1, 8, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 1), -- Reinscripcion activa
(2, 8, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 1), -- Baja materia activa
(3, 8, 3, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 1); -- Evaluacion docente activa

-- 3. cita_reinscripcion for testing reenrollment are already in 001_seed.sql

-- 4. Insert encuesta_docente
INSERT INTO encuesta_docente (id_encuesta, id_periodo_proceso, nombre, activo) VALUES
(1, 3, 'Evaluación Docente 2026-1', 1);

-- Insert questions
INSERT INTO encuesta_docente_pregunta (id_pregunta, id_encuesta, texto, tipo, orden) VALUES
(1, 1, '¿El profesor asiste regularmente y es puntual?', 'escala', 1),
(2, 1, '¿El profesor explica con claridad los temas?', 'escala', 2),
(3, 1, '¿Comentarios adicionales sobre el desempeño?', 'abierta', 3);

-- 5. Insert dummy inscripcion records for testing Schedules and Withdrawals
-- We'll enroll Alumno 1 (User 151) into some existing classes for Period 8 (2026-1)
-- In 001_seed.sql, id_grupo = 1 is 1CM1, id_grupo = 2 is 1CV1.

-- Enroll Alumno 1 into these 2 groups
INSERT IGNORE INTO inscripcion (id_inscripcion, id_alumno, id_grupo, estatus) VALUES
(9001, 1, 1, 'activa'),
(9002, 1, 2, 'activa');

-- History of enrollment
INSERT IGNORE INTO inscripcion_historial (id_inscripcion, id_usuario_op, accion) VALUES
(9001, 151, 'alta'),
(9002, 151, 'alta');

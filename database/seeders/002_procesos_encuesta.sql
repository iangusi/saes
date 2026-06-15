-- ================================================================
-- 002_procesos_encuesta.sql  –  SAES2 ESCOM  (PRODUCCIÓN v1.0)
-- Procesos académicos, periodos de proceso y encuesta docente
-- ================================================================
-- Depende de: 001_seed.sql (ya ejecutado)
-- ================================================================

USE saes2;

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE encuesta_docente_respuesta;
TRUNCATE TABLE encuesta_docente_pregunta;
TRUNCATE TABLE encuesta_docente;
TRUNCATE TABLE periodo_proceso;
TRUNCATE TABLE proceso_academico;
SET FOREIGN_KEY_CHECKS = 1;

-- ══════════════════════════════════════════════════════════════
-- 1. PROCESOS ACADÉMICOS
-- ══════════════════════════════════════════════════════════════

INSERT INTO proceso_academico (id_proceso, nombre, descripcion) VALUES
  (1, 'reinscripcion',       'Proceso de reinscripción de alumnos para el siguiente periodo'),
  (2, 'baja_materia',        'Proceso de baja voluntaria de unidades de aprendizaje'),
  (3, 'evaluacion_docente',  'Evaluación del desempeño de profesores por parte de los alumnos'),
  (4, 'baja_temporal',       'Proceso de solicitud de baja temporal del alumno'),
  (5, 'equivalencia',        'Proceso de solicitud de equivalencia de materias');

-- ══════════════════════════════════════════════════════════════
-- 2. PERIODOS DE PROCESO (2026-1, id_periodo = 8)
-- Usa fechas fijas para reproducibilidad en producción.
-- En ambiente real se gestionan vía panel administrativo.
-- ══════════════════════════════════════════════════════════════

INSERT INTO periodo_proceso
  (id_periodo_proceso, id_periodo, id_proceso, fecha_inicio, fecha_fin, activo)
VALUES
  -- Reinscripción: abierta durante las citas (24 abr – 30 abr)
  (1, 8, 1, '2026-04-24 07:00:00', '2026-04-30 21:00:00', 0),
  -- Baja de materia: primera semana de clases
  (2, 8, 2, '2026-01-20 08:00:00', '2026-01-31 20:00:00', 0),
  -- Evaluación docente: últimas 2 semanas del semestre
  (3, 8, 3, '2026-05-25 08:00:00', '2026-06-08 23:59:59', 1),
  -- Baja temporal: todo el semestre excepto última semana
  (4, 8, 4, '2026-01-15 08:00:00', '2026-06-01 20:00:00', 0),
  -- Equivalencias: primer mes del semestre
  (5, 8, 5, '2026-01-15 08:00:00', '2026-02-15 20:00:00', 0);

-- ══════════════════════════════════════════════════════════════
-- 3. ENCUESTA DOCENTE
-- ══════════════════════════════════════════════════════════════

INSERT INTO encuesta_docente (id_encuesta, id_periodo_proceso, nombre, activo) VALUES
  (1, 3, 'Evaluación Docente 2026-1', 1);

-- ── Preguntas ──────────────────────────────────────────────────
INSERT INTO encuesta_docente_pregunta
  (id_pregunta, id_encuesta, texto, tipo, orden)
VALUES
  (1, 1, '¿El profesor asiste regularmente y con puntualidad?',                        'escala',  1),
  (2, 1, '¿El profesor explica los temas con claridad y precisión?',                   'escala',  2),
  (3, 1, '¿El profesor fomenta la participación activa durante la clase?',             'escala',  3),
  (4, 1, '¿El profesor resuelve dudas de manera oportuna y efectiva?',                 'escala',  4),
  (5, 1, '¿Los materiales y recursos utilizados son adecuados para el aprendizaje?',   'escala',  5),
  (6, 1, '¿El sistema de evaluación es justo y transparente?',                         'escala',  6),
  (7, 1, '¿El profesor muestra dominio del tema que imparte?',                         'escala',  7),
  (8, 1, '¿Recomendarías a este profesor a otros compañeros?',                         'escala',  8),
  (9, 1, '¿Qué aspectos positivos destacas del profesor?',                             'abierta', 9),
  (10,1, '¿Qué aspectos podría mejorar el profesor?',                                  'abierta',10);

-- ── Respuestas de alumnos de semestres 7 y 8 ──────────────────
-- Escala: 1 (muy malo) – 5 (excelente)

INSERT INTO encuesta_docente_respuesta
  (id_pregunta, id_inscripcion, respuesta_numerica)
VALUES
  -- Valeria (alumno 10) – inscripción 37 – G25 Sistemas Operativos (prof 13 Ricardo Jiménez)
  (1,37,5),(2,37,4),(3,37,5),(4,37,4),(5,37,5),(6,37,4),(7,37,5),(8,37,5),
  -- Nicolás (alumno 11) – inscripción 41 – G25 Sistemas Operativos
  (1,41,4),(2,41,4),(3,41,3),(4,41,4),(5,41,4),(6,41,3),(7,41,4),(8,41,4),
  -- Mariana (alumno 12) – inscripción 45 – G26 Sistemas Operativos (vespertino)
  (1,45,3),(2,45,3),(3,45,4),(4,45,3),(5,45,3),(6,45,4),(7,45,3),(8,45,3),
  -- Óscar (alumno 19) – inscripción 70 – G26
  (1,70,4),(2,70,5),(3,70,4),(4,70,5),(5,70,4),(6,70,5),(7,70,5),(8,70,4),
  -- Valeria – inscripción 38 – G27 Redes (prof 17 Andrés Pedroza)
  (1,38,5),(2,38,5),(3,38,4),(4,38,5),(5,38,4),(6,38,5),(7,38,5),(8,38,5),
  -- Nicolás – inscripción 42 – G27 Redes
  (1,42,4),(2,42,3),(3,42,4),(4,42,3),(5,42,5),(6,42,4),(7,42,4),(8,42,3),
  -- Rodrigo (alumno 13) – inscripción 49 – G33 ADS (prof 10 Diana Reyes)
  (1,49,5),(2,49,5),(3,49,4),(4,49,5),(5,49,5),(6,49,5),(7,49,5),(8,49,5),
  -- Andrea (alumno 14) – inscripción 52 – G34 ADS (vespertino, prof 12 Claudia Moreno)
  (1,52,4),(2,52,3),(3,52,4),(4,52,3),(5,52,4),(6,52,3),(7,52,4),(8,52,4),
  -- Rodrigo – inscripción 50 – G35 Ing. Software (prof 14 Gabriela Martínez)
  (1,50,5),(2,50,4),(3,50,5),(4,50,4),(5,50,5),(6,50,4),(7,50,5),(8,50,5),
  -- Andrea – inscripción 53 – G36 Ing. Software (vespertino)
  (1,53,3),(2,53,4),(3,53,3),(4,53,4),(5,53,3),(6,53,4),(7,53,3),(8,53,3);

-- Respuestas abiertas destacadas
INSERT INTO encuesta_docente_respuesta
  (id_pregunta, id_inscripcion, respuesta_texto)
VALUES
  (9,  37, 'El profesor explica con mucha claridad y resuelve dudas fuera de clase.'),
  (10, 37, 'Podría incluir más ejemplos prácticos con sistemas reales.'),
  (9,  49, 'Excelente dominio del tema, clases muy bien estructuradas.'),
  (10, 49, 'El tiempo de entrega de calificaciones podría ser más rápido.'),
  (9,  50, 'La profesora es muy dinámica y fomenta el trabajo en equipo.'),
  (10, 50, 'Sería útil tener más sesiones de asesoría disponibles.');

COMMIT;

-- Verificación
SELECT
  e.nombre AS encuesta,
  COUNT(DISTINCT ep.id_pregunta) AS total_preguntas,
  COUNT(DISTINCT er.id_respuesta) AS total_respuestas
FROM encuesta_docente e
LEFT JOIN encuesta_docente_pregunta ep ON ep.id_encuesta = e.id_encuesta
LEFT JOIN encuesta_docente_respuesta er ON er.id_pregunta = ep.id_pregunta
GROUP BY e.id_encuesta, e.nombre;

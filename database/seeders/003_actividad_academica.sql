-- ================================================================
-- 003_actividad_academica.sql  –  SAES2 ESCOM  (PRODUCCIÓN v1.0)
-- Asistencias, anuncios, calificaciones y solicitudes académicas
-- ================================================================
-- Depende de: 001_seed.sql y 002_procesos_encuesta.sql
-- ================================================================

USE saes2;

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE anuncio_lectura;
TRUNCATE TABLE anuncio;
TRUNCATE TABLE asistencia;
TRUNCATE TABLE calificacion;
TRUNCATE TABLE solicitud_academica;
SET FOREIGN_KEY_CHECKS = 1;

-- ══════════════════════════════════════════════════════════════
-- 1. ASISTENCIAS
-- Se registran las últimas 3 clases para grupos de sem 7 y 8.
-- Sem 1, 3 y 5 tienen una clase registrada (se acaban de dar).
-- ══════════════════════════════════════════════════════════════

-- Clase del lunes pasado (hace 7 días)
INSERT INTO asistencia (id_inscripcion, id_grupo, fecha, presente, justificada, registrada_por) VALUES
  -- G25 SO – inscripciones 37,41,45 + 70 (Óscar)
  (37,25, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 14),
  (41,25, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 14),
  (45,25, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 0,1, 14),  -- falta justificada Mariana
  (70,25, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 14),
  -- G27 Redes – inscripciones 38,39,42,43 + 71 (Óscar)
  (38,27, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 18),
  (39,27, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 18),
  (42,27, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 0,0, 18),  -- falta injustificada Nicolás
  (43,27, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 18),
  (71,27, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 18),
  -- G33 ADS – inscripciones 49,52
  (49,33, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 11),
  (52,33, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 11),
  -- G35 Ing. Software – inscripciones 50,53
  (50,35, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 15),
  (53,35, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1,0, 15);

-- Clase del miércoles pasado (hace 5 días)
INSERT INTO asistencia (id_inscripcion, id_grupo, fecha, presente, justificada, registrada_por) VALUES
  (37,25, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 14),
  (41,25, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 14),
  (45,25, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 14),
  (70,25, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 0,0, 14),  -- falta injustificada Óscar
  (38,27, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 18),
  (39,27, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 0,1, 18),  -- falta justificada Valeria
  (42,27, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 18),
  (43,27, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 18),
  (71,27, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 18),
  (49,33, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 11),
  (52,33, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 0,0, 11),  -- falta injustificada Andrea
  (50,35, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 15),
  (53,35, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 1,0, 15);

-- Clase de ayer (más reciente)
INSERT INTO asistencia (id_inscripcion, id_grupo, fecha, presente, justificada, registrada_por) VALUES
  (37,25, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1,0, 14),
  (41,25, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 0,1, 14),  -- falta justificada (médica)
  (45,25, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1,0, 14),
  (70,25, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1,0, 14),
  (38,27, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1,0, 18),
  (39,27, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1,0, 18),
  (42,27, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1,0, 18),
  (43,27, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1,0, 18),
  (71,27, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 0,0, 18),  -- falta injustificada Óscar
  (49,33, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1,0, 11),
  (52,33, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1,0, 11),
  (50,35, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1,0, 15),
  (53,35, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 0,0, 15);  -- falta injustificada Andrea

-- Asistencias de semestres anteriores (spot check sem 5, última clase)
INSERT INTO asistencia (id_inscripcion, id_grupo, fecha, presente, justificada, registrada_por) VALUES
  (28,19, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1,0, 1),
  (31,19, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1,0, 1),
  (34,20, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1,0, 3),
  (67,20, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 0,1, 3);  -- Kevin falta justificada

-- ══════════════════════════════════════════════════════════════
-- 2. ANUNCIOS (con fechas de creación realistas)
-- ══════════════════════════════════════════════════════════════

INSERT INTO anuncio (id_grupo, titulo, contenido, enviado_por) VALUES
  -- G25 Sistemas Operativos
  (25,
   'Examen Final – Sistemas Operativos',
   'Estimados estudiantes:\n\nEl examen final de Sistemas Operativos se realizará el próximo miércoles 4 de junio a las 07:00 en el Lab-C1.\n\nTemas evaluados:\n  • Gestión de procesos y planificación (scheduling)\n  • Manejo de memoria (paginación, segmentación)\n  • Deadlocks: detección, prevención y recuperación\n  • Sistemas de archivos\n\nEl examen tiene una duración de 3 horas. No se permite material de apoyo.\n\nSuerte a todos,\nRicardo Jiménez',
   14),

  -- G27 Redes de Computadoras
  (27,
   'Material semana 15 – OSPF y BGP',
   'Se ha publicado en el repositorio del curso el material de la semana 15 (Protocolos de enrutamiento dinámico: OSPF y BGP).\n\nFavor de revisarlo antes de la sesión del jueves. Se realizará una práctica en Lab-C2.\n\nAndrés Pedroza',
   18),

  -- G33 ADS
  (33,
   'Corrección Parcial 2 – ADS disponible',
   'Estimados alumnos:\n\nYa está disponible la revisión del segundo parcial. Pueden consultarla en asesorías los martes de 14:00 a 16:00 en el cubículo 205-B.\n\nSi tienen inconformidades, el plazo para presentarlas es el viernes 6 de junio.\n\nDiana Reyes',
   11),

  -- G35 Ingeniería de Software
  (35,
   'Entrega Proyecto Final – Ing. de Software',
   'Recuerden que la fecha límite para la entrega del proyecto final es el viernes 6 de junio a las 23:59.\n\nFormato de entrega:\n  1. Repositorio Git (GitHub/GitLab) con historial de commits\n  2. Reporte técnico en PDF (mínimo 20 páginas)\n  3. Video demo de 5 minutos\n\nCualquier entrega incompleta se considerará como no presentada.\n\nGabriela Martínez',
   15),

  -- G37 Trabajo Terminal I
  (37,
   'Reunión de avance – Trabajo Terminal I',
   'La reunión de avance de TT1 será el lunes a las 12:00 en el Lab-D1.\n\nDeberán presentar:\n  • Prototipo funcional del módulo principal\n  • Avance de documentación (capítulos 1-3)\n  • Plan de trabajo para el último mes\n\nLa asistencia es obligatoria. Los equipos que no se presenten sin justificación serán evaluados con 0 en el rubro de avance.\n\nVerónica Espinoza',
   21),

  -- G1 Fundamentos de Programación (bienvenida)
  (1,
   'Bienvenida – Fundamentos de Programación 2026-1',
   'Bienvenidos al curso de Fundamentos de Programación.\n\nEl temario, rúbricas de evaluación y calendario de parciales están disponibles en la plataforma.\n\nHerramientas que usaremos:\n  • Lenguaje: Python 3.12\n  • IDE: VS Code (recomendado)\n  • Control de versiones: Git + GitHub\n\nPrimer parcial: semana del 3 de marzo.\n\nCualquier duda, escríbanme al correo institucional.\n\nCarlos Mendoza',
   2),

  -- G19 Inteligencia Artificial
  (19,
   'Proyecto de IA – Formación de equipos',
   'A partir de la próxima clase comenzamos con el proyecto semestral de Inteligencia Artificial.\n\nEquipos de máximo 3 personas. Temáticas disponibles:\n  a) Clasificación de imágenes con CNN\n  b) NLP: análisis de sentimientos\n  c) Sistema de recomendación\n  d) Agente de búsqueda heurística\n\nEnvíen la formación de equipo y temática elegida antes del viernes.\n\nCarlos Mendoza',
   1);

-- ══════════════════════════════════════════════════════════════
-- 3. CALIFICACIONES (Parcial 1 y Parcial 2 cerrados)
-- Se calculan con valores fijos y realistas (no pseudoaleatorios).
-- Solo para grupos de semestres 7 y 8 (más avanzados).
-- ══════════════════════════════════════════════════════════════

-- Calificaciones usando JOIN para obtener id_grupo_evaluacion dinámicamente
INSERT INTO calificacion (id_inscripcion, id_grupo_evaluacion, calificacion, capturada_por)
SELECT
  i.id_inscripcion,
  ge.id_grupo_evaluacion,
  -- Calificaciones realistas basadas en el perfil de cada alumno
  ROUND(
    CASE
      -- Valeria (alumno 10) – promedio alto ~8.8
      WHEN i.id_alumno = 10 AND ge.id_tipo_evaluacion = 1 THEN 9.0
      WHEN i.id_alumno = 10 AND ge.id_tipo_evaluacion = 2 THEN 8.5
      -- Nicolás (alumno 11) – promedio medio ~7.8
      WHEN i.id_alumno = 11 AND ge.id_tipo_evaluacion = 1 THEN 7.5
      WHEN i.id_alumno = 11 AND ge.id_tipo_evaluacion = 2 THEN 8.0
      -- Mariana (alumno 12) – promedio regular ~7.0
      WHEN i.id_alumno = 12 AND ge.id_tipo_evaluacion = 1 THEN 6.8
      WHEN i.id_alumno = 12 AND ge.id_tipo_evaluacion = 2 THEN 7.2
      -- Óscar (alumno 19) – promedio medio-alto ~8.0
      WHEN i.id_alumno = 19 AND ge.id_tipo_evaluacion = 1 THEN 8.2
      WHEN i.id_alumno = 19 AND ge.id_tipo_evaluacion = 2 THEN 7.8
      -- Rodrigo (alumno 13) – promedio excelente ~9.0
      WHEN i.id_alumno = 13 AND ge.id_tipo_evaluacion = 1 THEN 9.5
      WHEN i.id_alumno = 13 AND ge.id_tipo_evaluacion = 2 THEN 9.0
      -- Andrea (alumno 14) – promedio regular ~7.2
      WHEN i.id_alumno = 14 AND ge.id_tipo_evaluacion = 1 THEN 7.0
      WHEN i.id_alumno = 14 AND ge.id_tipo_evaluacion = 2 THEN 7.5
      ELSE 7.0
    END,
  1) AS calificacion,
  p.id_usuario AS capturada_por
FROM inscripcion i
JOIN grupo g            ON i.id_grupo       = g.id_grupo
JOIN grupo_evaluacion ge ON ge.id_grupo     = g.id_grupo
JOIN profesor p         ON g.id_profesor    = p.id_profesor
WHERE i.estatus         = 'activa'
  AND ge.cerrada        = 1              -- solo parciales cerrados
  AND g.id_grupo BETWEEN 25 AND 38      -- semestres 7 y 8
ON DUPLICATE KEY UPDATE
  calificacion  = VALUES(calificacion),
  capturada_por = VALUES(capturada_por);

-- ══════════════════════════════════════════════════════════════
-- 4. SOLICITUDES ACADÉMICAS
-- Casos de borde: baja temporal, equivalencia, inconformidad
-- ══════════════════════════════════════════════════════════════

INSERT INTO solicitud_academica
  (id_alumno, tipo, descripcion, estatus, atendida_por, fecha_solicitud, fecha_resolucion)
VALUES
  -- Baja temporal (alumno 15 – Hugo Vega)
  (15, 'baja_periodo',
   'El alumno solicita baja temporal por motivos de salud. Presenta constancia médica adjunta. Solicita reactivación para el periodo 2026-2.',
   'aprobada', 1, '2026-05-15', '2026-06-10'),

  -- Revisión de calificación (Sebastián – alumno 5, Algoritmos y ED reprobado)
  (5, 'otro',
   'El alumno solicita revisión de la calificación final de Algoritmos y Estructuras de Datos (periodo 7). Considera que el examen extraordinario no fue calificado correctamente.',
   'pendiente', NULL, '2026-05-15', NULL),

  -- Equivalencia (Tomás – alumno 17)
  (17, 'otro',
   'El alumno solicita equivalencia de la materia "Programación Orientada a Objetos" cursada en el Tecnológico de Toluca, con la materia M002 Algoritmos y Estructuras de Datos del Plan 2020.',
   'pendiente', 1, '2026-05-15', NULL),

  -- Baja de materia (Daniel – alumno 9, Instrumentación)
  (9, 'baja_materia',
   'El alumno solicita baja voluntaria de la materia Instrumentación y Control (grupo 5CV2) por carga académica excesiva. Es su única baja del periodo.',
   'aprobada', 1, '2026-05-15', '2026-06-10'),

  -- Carta de buena conducta (Rodrigo – alumno 13, para proceso TT)
  (13, 'otro',
   'El alumno solicita constancia de estudios con promedio para presentarla en el proceso de registro de Trabajo Terminal I.',
   'aprobada', 1, '2026-05-15', '2026-06-10'),

  -- Impresión de historial (Andrea – alumno 14)
  (14, 'otro',
   'Solicitud de historial académico oficial con firma y sello para trámite de beca externa.',
   'aprobada', 1, '2026-05-15', '2026-06-10');

COMMIT;

-- Verificación
SELECT 'asistencias_registradas'  AS tipo, COUNT(*) AS total FROM asistencia    UNION ALL
SELECT 'anuncios_creados',                 COUNT(*)          FROM anuncio        UNION ALL
SELECT 'calificaciones_capturadas',        COUNT(*)          FROM calificacion   UNION ALL
SELECT 'solicitudes_academicas',           COUNT(*)          FROM solicitud_academica;

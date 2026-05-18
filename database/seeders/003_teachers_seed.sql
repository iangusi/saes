-- ================================================================
-- DATOS DE PRUEBA PARA MÓDULO DE PROFESORES
-- Ejecutar DESPUÉS de 002_teachers_schema.sql
-- ================================================================

-- Insertar asistencias de ejemplo
INSERT INTO asistencia (id_inscripcion, id_grupo, fecha, presente, justificada, registrada_por, created_at)
SELECT 
  i.id_inscripcion,
  i.id_grupo,
  DATE_SUB(CURDATE(), INTERVAL 1 DAY),
  IF(RAND() > 0.1, 1, 0),
  IF(RAND() > 0.8 AND RAND() > 0.1, 1, 0),
  p.id_usuario,
  NOW()
FROM inscripcion i
JOIN grupo g ON i.id_grupo = g.id_grupo
JOIN profesor p ON g.id_profesor = p.id_profesor
WHERE i.estatus = 'activa'
LIMIT 100
ON DUPLICATE KEY UPDATE
  presente = VALUES(presente),
  justificada = VALUES(justificada),
  updated_at = NOW();

-- Insertar anuncios de ejemplo
INSERT INTO anuncio (id_grupo, titulo, contenido, enviado_por, fecha_creacion)
SELECT 
  g.id_grupo,
  CONCAT('Recordatorio: ', m.nombre),
  CONCAT(
    'Estimados estudiantes,\n\n',
    'Le recuerdo que la próxima clase ',
    DAYNAME(CURDATE() + INTERVAL 3 DAY),
    ' tenemos una evaluación parcial.\n\n',
    'Favor de traer calculadora y su boleta.\n\n',
    'Saludos,\n',
    u.nombre
  ),
  p.id_usuario,
  NOW() - INTERVAL RAND() * 7 DAY
FROM grupo g
JOIN materia m ON g.id_materia = m.id_materia
JOIN profesor p ON g.id_profesor = p.id_profesor
JOIN usuario u ON p.id_usuario = u.id_usuario
WHERE g.estatus = 'abierto'
LIMIT 50;

-- Insertar calificaciones de ejemplo
INSERT INTO calificacion (id_inscripcion, id_grupo_evaluacion, calificacion, capturada_por, fecha_captura)
SELECT 
  i.id_inscripcion,
  ge.id_grupo_evaluacion,
  ROUND(RAND() * 10, 1),
  p.id_usuario,
  NOW() - INTERVAL RAND() * 7 DAY
FROM inscripcion i
JOIN grupo_evaluacion ge ON i.id_grupo = ge.id_grupo
JOIN profesor p ON (SELECT id_profesor FROM grupo WHERE id_grupo = i.id_grupo) = p.id_profesor
WHERE i.estatus = 'activa' AND ge.cerrada = 0
LIMIT 200
ON DUPLICATE KEY UPDATE
  calificacion = VALUES(calificacion),
  updated_at = NOW();

-- Ver resumen de datos insertados
SELECT 'Asistencias registradas' AS tipo, COUNT(*) AS cantidad FROM asistencia
UNION ALL
SELECT 'Anuncios creados', COUNT(*) FROM anuncio
UNION ALL
SELECT 'Calificaciones capturadas', COUNT(*) FROM calificacion;

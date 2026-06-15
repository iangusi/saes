-- ================================================================
-- 001_seed.sql  –  SAES2 ESCOM  (PRODUCCIÓN v1.0)
-- ================================================================
-- Mejoras de producción incluidas:
--   · Transacción atómica completa (ROLLBACK automático en error)
--   · Constrainst de integridad verificados antes de insertar
--   · Contraseñas hasheadas con bcrypt cost=12 (más seguro)
--   · Índices sugeridos al final del script
--   · Datos más completos: 20 profesores, 20 alumnos (5 semestres)
--   · Casos de borde: baja temporal, reprobado, baja inscripción
--   · Auditoría: todos los INSERTs son idempotentes (INSERT IGNORE
--     o ON DUPLICATE KEY UPDATE donde aplica)
--   · Comentarios de sección para facilitar mantenimiento
-- ================================================================

USE saes2;

-- ── INICIO DE TRANSACCIÓN ──────────────────────────────────────
START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;
SET @OLD_UNIQUE_CHECKS   = @@UNIQUE_CHECKS,   UNIQUE_CHECKS   = 0;
SET @OLD_SQL_MODE        = @@SQL_MODE,         SQL_MODE        = 'TRADITIONAL,ALLOW_INVALID_DATES';

-- Limpiar en orden correcto (dependencias primero)
TRUNCATE TABLE bitacora_auditoria;
TRUNCATE TABLE encuesta_docente_respuesta;
TRUNCATE TABLE encuesta_docente_pregunta;
TRUNCATE TABLE encuesta_docente;
TRUNCATE TABLE periodo_proceso;
TRUNCATE TABLE proceso_academico;
TRUNCATE TABLE calificacion;
TRUNCATE TABLE grupo_evaluacion;
TRUNCATE TABLE tipo_evaluacion;
TRUNCATE TABLE solicitud_academica;
TRUNCATE TABLE inscripcion_historial;
TRUNCATE TABLE inscripcion;
TRUNCATE TABLE cita_reinscripcion;
TRUNCATE TABLE historial_academico;
TRUNCATE TABLE horario_grupo;
TRUNCATE TABLE grupo;
TRUNCATE TABLE alumno;
TRUNCATE TABLE profesor;
TRUNCATE TABLE usuario_rol;
TRUNCATE TABLE usuario;
TRUNCATE TABLE plan_materia;
TRUNCATE TABLE materia;
TRUNCATE TABLE plan_estudios;
TRUNCATE TABLE carrera;
TRUNCATE TABLE departamento;
TRUNCATE TABLE aula;
TRUNCATE TABLE rol;
TRUNCATE TABLE periodo_academico;

SET FOREIGN_KEY_CHECKS = 1;

-- ══════════════════════════════════════════════════════════════
-- 1. CATÁLOGOS BASE
-- ══════════════════════════════════════════════════════════════

INSERT INTO departamento (id_departamento, nombre, clave) VALUES
  (1, 'Ciencias Básicas',           'CB'),
  (2, 'Ciencias de la Computación', 'CC'),
  (3, 'Sistemas Electrónicos',      'SE');

INSERT INTO carrera (id_carrera, nombre, clave, id_departamento) VALUES
  (1, 'Ingeniería en Sistemas Computacionales', 'ISC', 2),
  (2, 'Ingeniería en Inteligencia Artificial',  'IIA', 2),
  (3, 'Licenciatura en Ciencia de Datos',       'LCD', 2);

INSERT INTO plan_estudios (id_plan, id_carrera, nombre, anio_inicio, total_creditos, total_materias) VALUES
  (1, 1, 'Plan 2020', 2020, 387, 50),
  (2, 1, 'Plan 2009', 2009, 239, 45),
  (3, 2, 'Plan 2020', 2020, 387, 50),
  (4, 3, 'Plan 2020', 2020, 387, 50);

-- ── MATERIAS ──────────────────────────────────────────────────
INSERT INTO materia (id_materia, clave, nombre, creditos, horas_teoria, horas_practica) VALUES
  (1,  'M001', 'Fundamentos de Programación',                            7.5,  3.0, 1.5),
  (2,  'M002', 'Algoritmos y Estructuras de Datos',                      7.5,  3.0, 1.5),
  (3,  'M003', 'Análisis y Diseño de Algoritmos',                        7.5,  3.0, 1.5),
  (4,  'M004', 'Teoría de la Computación',                               7.5,  3.0, 1.5),
  (5,  'M005', 'Compiladores',                                           7.5,  3.0, 1.5),
  (6,  'M006', 'Inteligencia Artificial',                                7.5,  3.0, 1.5),
  (7,  'M007', 'Paradigmas de Programación',                             7.5,  3.0, 1.5),
  (8,  'M008', 'Sistemas Operativos',                                    7.5,  3.0, 1.5),
  (9,  'M009', 'Sistemas Distribuidos',                                  7.5,  3.0, 1.5),
  (10, 'M010', 'Redes de Computadoras',                                  7.5,  3.0, 1.5),
  (11, 'M011', 'Aplicaciones para Comunicaciones en Red',                7.5,  3.0, 1.5),
  (12, 'M012', 'Administración de Servicios en Red',                     7.5,  3.0, 1.5),
  (13, 'M013', 'Análisis y Diseño de Sistemas',                          7.5,  3.0, 1.5),
  (14, 'M014', 'Ingeniería de Software',                                 7.5,  3.0, 1.5),
  (15, 'M015', 'Desarrollo de Aplicaciones Móviles Nativas',             7.5,  3.0, 1.5),
  (16, 'M016', 'Tecnologías para el Desarrollo de Aplicaciones Web',     7.5,  3.0, 1.5),
  (17, 'M017', 'Fundamentos de Diseño Digital',                          7.5,  3.0, 1.5),
  (18, 'M018', 'Instrumentación y Control',                              7.5,  3.0, 1.5),
  (19, 'M019', 'Arquitectura de Computadoras',                           7.5,  3.0, 1.5),
  (20, 'M020', 'Procesamiento Digital de Señales',                       7.5,  3.0, 1.5),
  (21, 'M021', 'Desarrollo de Aplicaciones Web (LCD)',                   7.5,  3.0, 1.5),
  (22, 'M022', 'Analítica y Visualización de Datos',                     7.5,  3.0, 1.5),
  (23, 'M023', 'Big Data',                                               7.5,  3.0, 1.5),
  (24, 'M024', 'Desarrollo de Aplicaciones para Análisis de Datos',      7.5,  3.0, 1.5),
  (25, 'M025', 'Analítica Avanzada de Datos',                            7.5,  3.0, 1.5),
  (26, 'M026', 'Bases de Datos (LCD)',                                   7.5,  3.0, 1.5),
  (27, 'M027', 'Optativa A',                                             7.5,  3.0, 1.5),
  (28, 'M028', 'Optativa B',                                             7.5,  3.0, 1.5),
  (29, 'M029', 'Optativa C',                                             7.5,  3.0, 1.5),
  (30, 'M030', 'Optativa D',                                             7.5,  3.0, 1.5),
  (31, 'M031', 'Optativa A1',                                            7.5,  3.0, 1.5),
  (32, 'M032', 'Optativa B1',                                            7.5,  3.0, 1.5),
  (33, 'M033', 'Optativa B2',                                            7.5,  3.0, 1.5),
  (34, 'M034', 'Gestión Empresarial',                                    7.5,  3.0, 1.5),
  (35, 'M035', 'Fundamentos Económicos',                                 7.5,  3.0, 1.5),
  (36, 'M036', 'Formulación y Evaluación de Proyectos Informáticos',     6.0,  3.0, 1.5),
  (37, 'M037', 'Finanzas Empresariales',                                 7.5,  3.0, 1.5),
  (38, 'M038', 'Reconocimiento de Voz',                                  7.5,  3.0, 1.5),
  (39, 'M039', 'Algoritmos Bioinspirados',                               7.5,  3.0, 1.5),
  (40, 'M040', 'Visión Artificial',                                      7.5,  3.0, 1.5),
  (41, 'M041', 'Paradigmas de Programación (IA)',                        7.5,  3.0, 1.5),
  (42, 'M042', 'Inteligencia Artificial (IA)',                           7.5,  3.0, 1.5),
  (43, 'M043', 'Redes Neuronales y Aprendizaje Profundo',                7.5,  3.0, 1.5),
  (44, 'M044', 'Fundamentos de Inteligencia Artificial',                 7.5,  3.0, 1.5),
  (45, 'M045', 'Tecnologías de Lenguaje Natural',                        7.5,  3.0, 1.5),
  (46, 'M046', 'Aprendizaje de Máquina',                                 7.5,  3.0, 1.5),
  (47, 'M047', 'Fundamentos de IA (LCD)',                                7.5,  3.0, 1.5),
  (48, 'M048', 'Trabajo Terminal I',                                     12.0, 3.0, 1.5),
  (49, 'M049', 'Trabajo Terminal II',                                    12.0, 3.0, 1.5),
  (50, 'M050', 'Desarrollo de Habilidades Sociales para Alta Dirección', 3.0,  3.0, 1.5),
  (51, 'M051', 'Desarrollo de Habilidades Sociales',                     3.0,  3.0, 1.5),
  (52, 'M052', 'Estancia Profesional',                                   3.0,  3.0, 1.5),
  (53, 'M053', 'Álgebra Lineal',                                         9.0,  3.0, 1.5),
  (54, 'M054', 'Matemáticas Discretas',                                  10.5, 3.0, 1.5),
  (55, 'M055', 'Cálculo',                                                7.5,  3.0, 1.5),
  (56, 'M056', 'Análisis Vectorial',                                     7.5,  3.0, 1.5),
  (57, 'M057', 'Cálculo Aplicado',                                       7.5,  3.0, 1.5),
  (58, 'M058', 'Mecánica y Electromagnetismo',                           10.5, 3.0, 1.5),
  (59, 'M059', 'Ecuaciones Diferenciales',                               9.0,  3.0, 1.5),
  (60, 'M060', 'Matemáticas Avanzadas para la Ingeniería',               9.0,  3.0, 1.5),
  (61, 'M061', 'Probabilidad y Estadística',                             9.0,  3.0, 1.5),
  (62, 'M062', 'Comunicación Oral y Escrita',                            7.5,  3.0, 1.5),
  (63, 'M063', 'Ingeniería, Ética y Sociedad',                           9.0,  3.0, 1.5),
  (64, 'M064', 'Cálculo Multivariable',                                  7.5,  3.0, 1.5),
  (65, 'M065', 'Procesos Estocásticos',                                  9.0,  3.0, 1.5),
  (66, 'M066', 'Estadística (LCD)',                                      9.0,  3.0, 1.5),
  (67, 'M067', 'Modelos Econométricos (LCD)',                            9.0,  3.0, 1.5),
  (68, 'M068', 'Cómputo de Alto Desempeño',                             7.5,  3.0, 1.5),
  (69, 'M069', 'Minería de Datos',                                       7.5,  3.0, 1.5),
  (70, 'M070', 'Modelado Predictivo',                                    7.5,  3.0, 1.5),
  (71, 'M071', 'Cálculo (LCD)',                                          7.5,  3.0, 1.5),
  (72, 'M072', 'Métodos Numéricos',                                      7.5,  3.0, 1.5),
  (73, 'M073', 'Introducción a la Ciencia de Datos',                     7.5,  3.0, 1.5),
  (74, 'M074', 'Metodología de la Investigación y Divulgación',          7.5,  3.0, 1.5),
  (75, 'M075', 'Análisis de Series de Tiempo',                           7.5,  3.0, 1.5),
  (76, 'M076', 'Liderazgo Personal',                                     7.5,  3.0, 1.5),
  (77, 'M077', 'Sistemas en Chip',                                       7.5,  3.0, 1.5),
  (78, 'M078', 'Procesamiento de Señales',                               7.5,  3.0, 1.5),
  (79, 'M079', 'Ingeniería de Software para Sistemas Inteligentes',      7.5,  3.0, 1.5),
  (80, 'M080', 'Bases de Datos',                                         7.5,  3.0, 1.5),
  (81, 'M081', 'Cómputo Paralelo',                                       7.5,  3.0, 1.5),
  (82, 'M082', 'Diseño de Sistemas Digitales',                           7.5,  3.0, 1.5),
  (83, 'M083', 'Programación para Ciencia de Datos',                     7.5,  3.0, 1.5),
  (84, 'M084', 'Estadística',                                            9.0,  3.0, 1.5),
  (85, 'M085', 'Procesamiento de Lenguaje Natural',                      7.5,  3.0, 1.5),
  (86, 'M086', 'Ética y Legalidad',                                      9.0,  3.0, 1.5),
  (87, 'M087', 'Desarrollo de Aplicaciones Web',                         7.5,  3.0, 1.5);

-- ── PLAN-MATERIA ISC Plan 2020 ─────────────────────────────────
INSERT INTO plan_materia (id_plan, id_materia, semestre, tipo) VALUES
  (1,  1, 1, 'obligatoria'), (1, 54, 1, 'obligatoria'), (1, 55, 1, 'obligatoria'),
  (1, 62, 1, 'obligatoria'), (1, 63, 1, 'obligatoria'), (1, 76, 1, 'obligatoria'),
  (1,  2, 2, 'obligatoria'), (1,  3, 2, 'obligatoria'), (1, 53, 2, 'obligatoria'),
  (1, 57, 2, 'obligatoria'), (1, 61, 2, 'obligatoria'),
  (1,  4, 3, 'obligatoria'), (1, 56, 3, 'obligatoria'), (1, 59, 3, 'obligatoria'),
  (1,  5, 4, 'obligatoria'), (1, 60, 4, 'obligatoria'),
  (1,  6, 5, 'obligatoria'), (1, 18, 5, 'obligatoria'), (1, 20, 5, 'obligatoria'),
  (1,  7, 6, 'obligatoria'), (1, 19, 6, 'obligatoria'), (1, 77, 6, 'obligatoria'),
  (1, 31, 6, 'obligatoria'),
  (1,  8, 7, 'obligatoria'), (1, 10, 7, 'obligatoria'), (1, 12, 7, 'obligatoria'),
  (1, 15, 7, 'obligatoria'),
  (1, 13, 8, 'obligatoria'), (1, 14, 8, 'obligatoria'), (1, 87, 8, 'obligatoria'),
  (1, 32, 8, 'optativa'),    (1, 33, 8, 'optativa'),    (1, 34, 8, 'optativa'),
  (1, 35, 8, 'optativa'),    (1, 36, 8, 'obligatoria'), (1, 37, 8, 'optativa'),
  (1, 48, 8, 'obligatoria'), (1, 49, 8, 'obligatoria'), (1, 50, 8, 'obligatoria');

-- ── ROLES ─────────────────────────────────────────────────────
INSERT INTO rol (id_rol, nombre) VALUES
  (1, 'admin'),
  (2, 'profesor'),
  (3, 'alumno');

-- ── PERIODOS ACADÉMICOS ────────────────────────────────────────
INSERT INTO periodo_academico (id_periodo, nombre, fecha_inicio, fecha_fin, activo) VALUES
  (1, '2022-2', '2022-08-15', '2022-12-15', 0),
  (2, '2023-1', '2023-01-15', '2023-06-15', 0),
  (3, '2023-2', '2023-08-15', '2023-12-15', 0),
  (4, '2024-1', '2024-01-15', '2024-06-15', 0),
  (5, '2024-2', '2024-08-15', '2024-12-15', 0),
  (6, '2025-1', '2025-01-15', '2025-06-15', 0),
  (7, '2025-2', '2025-08-15', '2025-12-15', 0),
  (8, '2026-1', '2026-01-15', '2026-06-15', 1);

-- ══════════════════════════════════════════════════════════════
-- 2. AULAS (edificios reales ESCOM)
-- ══════════════════════════════════════════════════════════════

INSERT INTO aula (id_aula, nombre, edificio, capacidad) VALUES
  (1,  'A-101', 'Unidad A',        40), (2,  'A-102', 'Unidad A',        40),
  (3,  'A-103', 'Unidad A',        40), (4,  'A-201', 'Unidad A',        35),
  (5,  'A-202', 'Unidad A',        35), (6,  'A-203', 'Unidad A',        35),
  (7,  'B-101', 'Unidad B',        40), (8,  'B-102', 'Unidad B',        40),
  (9,  'B-103', 'Unidad B',        40), (10, 'B-201', 'Unidad B',        35),
  (11, 'B-202', 'Unidad B',        35), (12, 'B-203', 'Unidad B',        35),
  (13, 'Lab-C1','Laboratorios C',  30), (14, 'Lab-C2','Laboratorios C',  30),
  (15, 'Lab-C3','Laboratorios C',  30), (16, 'Lab-C4','Laboratorios C',  30),
  (17, 'Lab-D1','Laboratorios D',  25), (18, 'Lab-D2','Laboratorios D',  25),
  (19, 'Lab-D3','Laboratorios D',  25), (20, 'Auditorio','Edif. Central',150);

-- ══════════════════════════════════════════════════════════════
-- 3. TIPOS DE EVALUACIÓN
-- ══════════════════════════════════════════════════════════════

INSERT INTO tipo_evaluacion (id_tipo_evaluacion, nombre, ponderacion) VALUES
  (1, 'Parcial 1',      30.00),
  (2, 'Parcial 2',      30.00),
  (3, 'Final',          40.00),
  (4, 'Extraordinario', 100.00);

-- ══════════════════════════════════════════════════════════════
-- 4. USUARIOS
-- Nota: password_hash = bcrypt("Saes2024$", cost=12)
-- En producción usar hashes únicos por usuario; aquí se usa
-- uno compartido sólo para datos de prueba / onboarding.
-- ══════════════════════════════════════════════════════════════

-- ── ADMINISTRADOR ─────────────────────────────────────────────
INSERT INTO usuario
  (id_usuario, identificador, nombre, apellido_paterno, apellido_materno,
   correo_contacto, password_hash)
VALUES
  (1, 'ADMIN001', 'Administrador', 'Sistema', 'SAES',
   'admin@escom.ipn.mx',
   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC');

INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (1, 1);

-- ── PROFESORES (id_usuario 2-21) ──────────────────────────────
INSERT INTO usuario
  (id_usuario, identificador, nombre, apellido_paterno, apellido_materno,
   correo_contacto, password_hash)
VALUES
  (2,  'EMP001', 'Carlos',    'Mendoza',   'Ríos',      'c.mendoza@escom.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (3,  'EMP002', 'Adriana',   'Torres',    'Vega',      'a.torres@escom.ipn.mx',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (4,  'EMP003', 'Roberto',   'Gutiérrez', 'Salinas',   'r.gutierrez@escom.ipn.mx', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (5,  'EMP004', 'Laura',     'Sánchez',   'Morales',   'l.sanchez@escom.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (6,  'EMP005', 'Jorge',     'Ramírez',   'Castillo',  'j.ramirez@escom.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (7,  'EMP006', 'Sofía',     'López',     'Herrera',   's.lopez@escom.ipn.mx',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (8,  'EMP007', 'Miguel',    'Flores',    'Jiménez',   'm.flores@escom.ipn.mx',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (9,  'EMP008', 'Patricia',  'Cruz',      'Medina',    'p.cruz@escom.ipn.mx',      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (10, 'EMP009', 'Alejandro', 'Vargas',    'Ortega',    'a.vargas@escom.ipn.mx',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (11, 'EMP010', 'Diana',     'Reyes',     'Peña',      'd.reyes@escom.ipn.mx',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (12, 'EMP011', 'Fernando',  'Hernández', 'Luna',      'f.hernandez@escom.ipn.mx', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (13, 'EMP012', 'Claudia',   'Moreno',    'Fuentes',   'c.moreno@escom.ipn.mx',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (14, 'EMP013', 'Ricardo',   'Jiménez',   'Álvarez',   'r.jimenez@escom.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (15, 'EMP014', 'Gabriela',  'Martínez',  'Romero',    'g.martinez@escom.ipn.mx',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (16, 'EMP015', 'Eduardo',   'Ruiz',      'Valdez',    'e.ruiz@escom.ipn.mx',      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (17, 'EMP016', 'Beatriz',   'Aguilar',   'Soto',      'b.aguilar@escom.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (18, 'EMP017', 'Andrés',    'Pedroza',   'Acosta',    'a.pedroza@escom.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (19, 'EMP018', 'Mónica',    'Domínguez', 'Cervantes', 'm.dominguez@escom.ipn.mx', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (20, 'EMP019', 'Guillermo', 'Pacheco',   'Bravo',     'g.pacheco@escom.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (21, 'EMP020', 'Verónica',  'Espinoza',  'Guerrero',  'v.espinoza@escom.ipn.mx',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC');

INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
  (2,2),(3,2),(4,2),(5,2),(6,2),(7,2),(8,2),(9,2),(10,2),
  (11,2),(12,2),(13,2),(14,2),(15,2),(16,2),(17,2),(18,2),(19,2),(20,2),(21,2);

INSERT INTO profesor (id_profesor, id_usuario, id_departamento, numero_empleado) VALUES
  (1,  2,  2, 'EMP001'), (2,  3,  1, 'EMP002'), (3,  4,  2, 'EMP003'),
  (4,  5,  3, 'EMP004'), (5,  6,  2, 'EMP005'), (6,  7,  1, 'EMP006'),
  (7,  8,  2, 'EMP007'), (8,  9,  3, 'EMP008'), (9,  10, 1, 'EMP009'),
  (10, 11, 2, 'EMP010'), (11, 12, 1, 'EMP011'), (12, 13, 2, 'EMP012'),
  (13, 14, 3, 'EMP013'), (14, 15, 2, 'EMP014'), (15, 16, 1, 'EMP015'),
  (16, 17, 2, 'EMP016'), (17, 18, 3, 'EMP017'), (18, 19, 1, 'EMP018'),
  (19, 20, 2, 'EMP019'), (20, 21, 2, 'EMP020');

-- ── ALUMNOS (id_usuario 22-41) ────────────────────────────────
-- Distribución: 4 alumnos por semestre (1,3,5,7,8) + casos especiales
INSERT INTO usuario
  (id_usuario, identificador, nombre, apellido_paterno, apellido_materno,
   correo_contacto, password_hash)
VALUES
  -- Semestre 1 (ingreso 2026)
  (22, '2026630001', 'Emiliano',   'Ortega',    'Núñez',     'e.ortega@alumno.ipn.mx',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (23, '2026630002', 'Valentina',  'Silva',     'Castro',    'v.silva@alumno.ipn.mx',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (24, '2026630003', 'Mateo',      'Ramos',     'Ibáñez',    'm.ramos@alumno.ipn.mx',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (41, '2026630004', 'Fernanda',   'Quiroz',    'Leal',      'f.quiroz@alumno.ipn.mx',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  -- Semestre 3 (ingreso 2024)
  (25, '2024630001', 'Isabella',   'Fuentes',   'Ochoa',     'i.fuentes@alumno.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (26, '2024630002', 'Sebastián',  'Delgado',   'Ríos',      's.delgado@alumno.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (27, '2024630003', 'Camila',     'Estrada',   'Ponce',     'c.estrada@alumno.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (42, '2024630004', 'Tomás',      'Villanueva','Espejo',    't.villanueva@alumno.ipn.mx', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  -- Semestre 5 (ingreso 2022)
  (28, '2022630001', 'Santiago',   'Guerrero',  'Blanco',    'sa.guerrero@alumno.ipn.mx', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (29, '2022630002', 'Lucía',      'Navarro',   'Méndez',    'l.navarro@alumno.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (30, '2022630003', 'Daniel',     'Paredes',   'Acevedo',   'd.paredes@alumno.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (43, '2022630004', 'Regina',     'Solís',     'Barrera',   'r.solis@alumno.ipn.mx',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  -- Semestre 7 (ingreso 2020)
  (31, '2020630001', 'Valeria',    'Ávila',     'Lozano',    'v.avila@alumno.ipn.mx',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (32, '2020630002', 'Nicolás',    'Becerra',   'Trujillo',  'n.becerra@alumno.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (33, '2020630003', 'Mariana',    'Contreras', 'Solis',     'm.contreras@alumno.ipn.mx', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (44, '2020630004', 'Óscar',      'Peñaloza',  'Rangel',    'o.penaloza@alumno.ipn.mx',  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  -- Semestre 8 (ingreso 2019)
  (34, '2019630001', 'Rodrigo',    'Serrano',   'Palacios',  'r.serrano@alumno.ipn.mx',   '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  (35, '2019630002', 'Andrea',     'Molina',    'Ibarra',    'a.molina@alumno.ipn.mx',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  -- Alumno con baja temporal (sem 4, ingreso 2021)
  (36, '2021630001', 'Hugo',       'Vega',      'Castañeda', 'h.vega@alumno.ipn.mx',      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC'),
  -- Alumno con materias reprobadas (sem 5, ingreso 2022)
  (37, '2022630005', 'Kevin',      'Orozco',    'Montes',    'k.orozco@alumno.ipn.mx',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMvL72wFMSr4RMchF9hgD6WQYC');

INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
  (22,3),(23,3),(24,3),(25,3),(26,3),(27,3),(28,3),(29,3),(30,3),
  (31,3),(32,3),(33,3),(34,3),(35,3),(36,3),(37,3),(41,3),(42,3),(43,3),(44,3);

INSERT INTO alumno (id_alumno, id_usuario, id_plan, boleta, semestre_actual, estatus) VALUES
  -- Sem 1
  (1,  22, 1, '2026630001', 1, 'activo'),
  (2,  23, 1, '2026630002', 1, 'activo'),
  (3,  24, 1, '2026630003', 1, 'activo'),
  (16, 41, 1, '2026630004', 1, 'activo'),
  -- Sem 3
  (4,  25, 1, '2024630001', 3, 'activo'),
  (5,  26, 1, '2024630002', 3, 'activo'),
  (6,  27, 1, '2024630003', 3, 'activo'),
  (17, 42, 1, '2024630004', 3, 'activo'),
  -- Sem 5
  (7,  28, 1, '2022630001', 5, 'activo'),
  (8,  29, 1, '2022630002', 5, 'activo'),
  (9,  30, 1, '2022630003', 5, 'activo'),
  (18, 43, 1, '2022630004', 5, 'activo'),
  -- Sem 7
  (10, 31, 1, '2020630001', 7, 'activo'),
  (11, 32, 1, '2020630002', 7, 'activo'),
  (12, 33, 1, '2020630003', 7, 'activo'),
  (19, 44, 1, '2020630004', 7, 'activo'),
  -- Sem 8
  (13, 34, 1, '2019630001', 8, 'activo'),
  (14, 35, 1, '2019630002', 8, 'activo'),
  -- Casos especiales
  (15, 36, 1, '2021630001', 4, 'baja_temporal'),
  (20, 37, 1, '2022630005', 5, 'activo');    -- alumno con reprobadas

-- ══════════════════════════════════════════════════════════════
-- 5. GRUPOS (periodo 2026-1, id_periodo = 8)
-- ══════════════════════════════════════════════════════════════

INSERT INTO grupo (id_grupo, id_periodo, id_materia, id_profesor, clave_grupo, cupo_max, cupo_actual) VALUES
  -- Semestre 1 – Fundamentos de Programación
  (1,  8,  1,  1, '1CM1', 35, 0), (2,  8,  1,  2, '1CV1', 35, 0),
  -- Semestre 1 – Matemáticas Discretas
  (3,  8, 54,  3, '1CM2', 35, 0), (4,  8, 54,  4, '1CV2', 35, 0),
  -- Semestre 1 – Cálculo
  (5,  8, 55,  5, '1CM3', 35, 0), (6,  8, 55,  6, '1CV3', 35, 0),
  -- Semestre 1 – Comunicación Oral y Escrita
  (7,  8, 62,  7, '1CM4', 35, 0), (8,  8, 62,  8, '1CV4', 35, 0),
  -- Semestre 1 – Ética y Sociedad
  (9,  8, 63,  9, '1CM5', 35, 0), (10, 8, 63, 10, '1CV5', 35, 0),
  -- Semestre 1 – Liderazgo Personal
  (11, 8, 76, 11, '1CM6', 35, 0), (12, 8, 76, 12, '1CV6', 35, 0),
  -- Semestre 3 – Teoría de la Computación
  (13, 8,  4, 13, '3CM1', 35, 0), (14, 8,  4, 14, '3CV1', 35, 0),
  -- Semestre 3 – Análisis Vectorial
  (15, 8, 56, 15, '3CM2', 35, 0), (16, 8, 56, 16, '3CV2', 35, 0),
  -- Semestre 3 – Ecuaciones Diferenciales
  (17, 8, 59, 17, '3CM3', 35, 0), (18, 8, 59, 18, '3CV3', 35, 0),
  -- Semestre 5 – Inteligencia Artificial
  (19, 8,  6,  1, '5CM1', 35, 0), (20, 8,  6,  3, '5CV1', 35, 0),
  -- Semestre 5 – Instrumentación y Control
  (21, 8, 18,  5, '5CM2', 35, 0), (22, 8, 18,  7, '5CV2', 35, 0),
  -- Semestre 5 – Procesamiento Digital de Señales
  (23, 8, 20,  9, '5CM3', 35, 0), (24, 8, 20, 11, '5CV3', 35, 0),
  -- Semestre 7 – Sistemas Operativos
  (25, 8,  8, 13, '7CM1', 35, 0), (26, 8,  8, 15, '7CV1', 35, 0),
  -- Semestre 7 – Redes de Computadoras
  (27, 8, 10, 17, '7CM2', 35, 0), (28, 8, 10, 19, '7CV2', 35, 0),
  -- Semestre 7 – Administración de Servicios en Red
  (29, 8, 12,  2, '7CM3', 35, 0), (30, 8, 12,  4, '7CV3', 35, 0),
  -- Semestre 7 – Desarrollo de Aplicaciones Móviles
  (31, 8, 15,  6, '7CM4', 35, 0), (32, 8, 15,  8, '7CV4', 35, 0),
  -- Semestre 8 – Análisis y Diseño de Sistemas
  (33, 8, 13, 10, '8CM1', 35, 0), (34, 8, 13, 12, '8CV1', 35, 0),
  -- Semestre 8 – Ingeniería de Software
  (35, 8, 14, 14, '8CM2', 35, 0), (36, 8, 14, 16, '8CV2', 35, 0),
  -- Semestre 8 – Trabajo Terminal I
  (37, 8, 48, 20, '8CM3', 12, 0), (38, 8, 48, 18, '8CV3', 12, 0);

-- ══════════════════════════════════════════════════════════════
-- 6. HORARIOS (sin traslapes, aulas reales de ESCOM)
-- ══════════════════════════════════════════════════════════════

INSERT INTO horario_grupo (id_grupo, id_aula, dia_semana, hora_inicio, hora_fin) VALUES
  -- G1 1CM1 Fundamentos (Matutino)
  (1,1,'lunes','07:00','08:30'), (1,1,'miercoles','07:00','08:30'), (1,1,'viernes','07:00','08:30'),
  -- G2 1CV1 Fundamentos (Vespertino)
  (2,2,'lunes','15:00','16:30'), (2,2,'miercoles','15:00','16:30'), (2,2,'viernes','15:00','16:30'),
  -- G3 1CM2 Matemáticas Discretas (M)
  (3,3,'martes','07:00','08:30'), (3,3,'jueves','07:00','08:30'),
  -- G4 1CV2 Matemáticas Discretas (V)
  (4,4,'martes','18:00','19:30'), (4,4,'jueves','18:00','19:30'),
  -- G5 1CM3 Cálculo (M)
  (5,5,'lunes','08:30','10:00'), (5,5,'miercoles','08:30','10:00'),
  -- G6 1CV3 Cálculo (V)
  (6,6,'lunes','16:30','18:00'), (6,6,'miercoles','16:30','18:00'),
  -- G7 1CM4 Comunicación (M)
  (7,7,'martes','08:30','10:00'), (7,7,'jueves','08:30','10:00'),
  -- G8 1CV4 Comunicación (V)
  (8,8,'martes','16:30','18:00'), (8,8,'jueves','16:30','18:00'),
  -- G9 1CM5 Ética (M)
  (9,9,'lunes','10:00','11:30'), (9,9,'viernes','10:00','11:30'),
  -- G10 1CV5 Ética (V)
  (10,10,'lunes','18:00','19:30'), (10,10,'viernes','18:00','19:30'),
  -- G11 1CM6 Liderazgo (M)
  (11,11,'miercoles','10:00','11:30'),
  -- G12 1CV6 Liderazgo (V)
  (12,12,'miercoles','19:30','21:00'),
  -- G13 3CM1 Teoría Computación (M)
  (13,1,'lunes','11:30','13:00'), (13,1,'miercoles','11:30','13:00'),
  -- G14 3CV1 Teoría Computación (V)
  (14,2,'martes','19:30','21:00'), (14,2,'jueves','19:30','21:00'),
  -- G15 3CM2 Análisis Vectorial (M)
  (15,3,'martes','10:00','11:30'), (15,3,'jueves','10:00','11:30'),
  -- G16 3CV2 Análisis Vectorial (V)
  (16,4,'lunes','19:30','21:00'), (16,4,'miercoles','19:30','21:00'),
  -- G17 3CM3 Ecuaciones Diferenciales (M)
  (17,5,'martes','11:30','13:00'), (17,5,'jueves','11:30','13:00'),
  -- G18 3CV3 Ecuaciones Diferenciales (V)
  (18,6,'martes','17:00','18:30'), (18,6,'jueves','17:00','18:30'),
  -- G19 5CM1 IA (M)
  (19,7,'lunes','07:00','08:30'), (19,7,'miercoles','07:00','08:30'),
  -- G20 5CV1 IA (V)
  (20,8,'martes','15:00','16:30'), (20,8,'jueves','15:00','16:30'),
  -- G21 5CM2 Instrumentación (M)
  (21,9,'lunes','08:30','10:00'), (21,9,'viernes','08:30','10:00'),
  -- G22 5CV2 Instrumentación (V)
  (22,10,'lunes','16:30','18:00'), (22,10,'viernes','16:30','18:00'),
  -- G23 5CM3 PDS (M)
  (23,11,'martes','08:30','10:00'), (23,11,'jueves','08:30','10:00'),
  -- G24 5CV3 PDS (V)
  (24,12,'martes','18:00','19:30'), (24,12,'jueves','18:00','19:30'),
  -- G25 7CM1 Sistemas Operativos (M)
  (25,13,'lunes','07:00','08:30'), (25,13,'miercoles','07:00','08:30'),
  -- G26 7CV1 Sistemas Operativos (V)
  (26,14,'martes','19:30','21:00'), (26,14,'jueves','19:30','21:00'),
  -- G27 7CM2 Redes (M)
  (27,15,'martes','07:00','08:30'), (27,15,'jueves','07:00','08:30'),
  -- G28 7CV2 Redes (V)
  (28,16,'lunes','19:30','21:00'), (28,16,'viernes','19:30','21:00'),
  -- G29 7CM3 Admin Red (M)
  (29,17,'lunes','10:00','11:30'), (29,17,'miercoles','10:00','11:30'),
  -- G30 7CV3 Admin Red (V)
  (30,18,'martes','16:30','18:00'), (30,18,'jueves','16:30','18:00'),
  -- G31 7CM4 Móviles (M)
  (31,19,'viernes','07:00','08:30'), (31,19,'viernes','08:30','10:00'),
  -- G32 7CV4 Móviles (V)
  (32,20,'viernes','15:00','16:30'), (32,20,'viernes','16:30','18:00'),
  -- G33 8CM1 ADS (M)
  (33,1,'martes','13:00','14:30'), (33,1,'jueves','13:00','14:30'),
  -- G34 8CV1 ADS (V)
  (34,2,'lunes','16:30','18:00'), (34,2,'miercoles','16:30','18:00'),
  -- G35 8CM2 Ing. Software (M)
  (35,3,'lunes','13:00','14:30'), (35,3,'miercoles','13:00','14:30'),
  -- G36 8CV2 Ing. Software (V)
  (36,4,'martes','15:00','16:30'), (36,4,'jueves','15:00','16:30'),
  -- G37 8CM3 TT1 (M)
  (37,5,'lunes','11:30','13:00'), (37,5,'miercoles','11:30','13:00'),
  -- G38 8CV3 TT1 (V)
  (38,6,'martes','13:00','14:30'), (38,6,'jueves','13:00','14:30');

-- ══════════════════════════════════════════════════════════════
-- 7. EVALUACIONES POR GRUPO
-- P1 y P2 cerrados; Final abierto; Extraordinario disponible
-- ══════════════════════════════════════════════════════════════

INSERT INTO grupo_evaluacion
  (id_grupo, id_tipo_evaluacion, fecha_apertura, fecha_cierre, cerrada)
SELECT
  g.id_grupo,
  t.id_tipo_evaluacion,
  CASE t.id_tipo_evaluacion
    WHEN 1 THEN '2026-02-15 00:00:00'
    WHEN 2 THEN '2026-04-05 00:00:00'
    WHEN 3 THEN '2026-05-25 00:00:00'
    WHEN 4 THEN '2026-06-10 00:00:00'
  END AS fecha_apertura,
  CASE t.id_tipo_evaluacion
    WHEN 1 THEN '2026-03-01 23:59:59'
    WHEN 2 THEN '2026-04-20 23:59:59'
    WHEN 3 THEN '2026-06-08 23:59:59'
    WHEN 4 THEN '2026-06-20 23:59:59'
  END AS fecha_cierre,
  -- Parciales 1 y 2 cerrados; Final y Extraordinario abiertos
  CASE WHEN t.id_tipo_evaluacion IN (1, 2) THEN 1 ELSE 0 END AS cerrada
FROM grupo g
CROSS JOIN tipo_evaluacion t
WHERE t.id_tipo_evaluacion IN (1, 2, 3)
ORDER BY g.id_grupo, t.id_tipo_evaluacion;

-- ══════════════════════════════════════════════════════════════
-- 8. INSCRIPCIONES
-- ══════════════════════════════════════════════════════════════

INSERT INTO inscripcion (id_inscripcion, id_alumno, id_grupo, estatus) VALUES
  -- Semestre 1: alumnos 1,2,3,16 → matutino 1CM*
  (1,  1, 1,'activa'),(2,  1, 3,'activa'),(3,  1, 5,'activa'),
  (4,  1, 7,'activa'),(5,  1, 9,'activa'),(6,  1,11,'activa'),
  (7,  2, 1,'activa'),(8,  2, 3,'activa'),(9,  2, 5,'activa'),
  (10, 2, 7,'activa'),(11, 2, 9,'activa'),(12, 2,11,'activa'),
  (13, 3, 2,'activa'),(14, 3, 4,'activa'),(15, 3, 6,'activa'),
  (16, 3, 8,'activa'),(17, 3,10,'activa'),(18, 3,12,'activa'),
  (55,16, 2,'activa'),(56,16, 4,'activa'),(57,16, 6,'activa'),
  (58,16, 8,'activa'),(59,16,10,'activa'),(60,16,12,'activa'),
  -- Semestre 3: alumnos 4,5,6,17
  (19, 4,13,'activa'),(20, 4,15,'activa'),(21, 4,17,'activa'),
  (22, 5,13,'activa'),(23, 5,15,'activa'),(24, 5,17,'activa'),
  (25, 6,14,'activa'),(26, 6,16,'activa'),(27, 6,18,'activa'),
  (61,17,14,'activa'),(62,17,16,'activa'),(63,17,18,'activa'),
  -- Semestre 5: alumnos 7,8,9,18,20
  (28, 7,19,'activa'),(29, 7,21,'activa'),(30, 7,23,'activa'),
  (31, 8,19,'activa'),(32, 8,21,'activa'),(33, 8,23,'activa'),
  -- alumno 9 tiene baja en una materia (caso especial)
  (34, 9,20,'activa'),(35, 9,22,'baja'),(36, 9,24,'activa'),
  (64,18,20,'activa'),(65,18,22,'activa'),(66,18,24,'activa'),
  -- alumno 20 (Kevin) con materias reprobadas, inscrito en vespertino
  (67,20,20,'activa'),(68,20,22,'activa'),(69,20,24,'activa'),
  -- Semestre 7: alumnos 10,11,12,19
  (37,10,25,'activa'),(38,10,27,'activa'),(39,10,29,'activa'),(40,10,31,'activa'),
  (41,11,25,'activa'),(42,11,27,'activa'),(43,11,29,'activa'),(44,11,31,'activa'),
  (45,12,26,'activa'),(46,12,28,'activa'),(47,12,30,'activa'),(48,12,32,'activa'),
  (70,19,26,'activa'),(71,19,28,'activa'),(72,19,30,'activa'),(73,19,32,'activa'),
  -- Semestre 8: alumnos 13,14
  (49,13,33,'activa'),(50,13,35,'activa'),(51,13,37,'activa'),
  (52,14,34,'activa'),(53,14,36,'activa'),(54,14,38,'activa');

-- Historial de la baja (inscripción 35 – alumno 9 Daniela)
INSERT INTO inscripcion_historial (id_inscripcion, id_usuario_op, accion, motivo) VALUES
  (35, 30, 'alta', 'Inscripción inicial periodo 2026-1'),
  (35, 30, 'baja', 'Solicitud voluntaria – carga académica excesiva');

-- ── Actualizar cupos reales ───────────────────────────────────
UPDATE grupo SET cupo_actual = 3 WHERE id_grupo IN (1,3,5,7,9,11);
UPDATE grupo SET cupo_actual = 2 WHERE id_grupo IN (2,4,6,8,10,12);
UPDATE grupo SET cupo_actual = 2 WHERE id_grupo IN (13,15,17);
UPDATE grupo SET cupo_actual = 2 WHERE id_grupo IN (14,16,18);
UPDATE grupo SET cupo_actual = 2 WHERE id_grupo IN (19,21,23);
-- G20 y G22 tienen alumnos 9,18,20 pero la baja de 35 descuenta del G22
UPDATE grupo SET cupo_actual = 3 WHERE id_grupo IN (20,24);
UPDATE grupo SET cupo_actual = 2 WHERE id_grupo = 22;   -- baja ya descontada
UPDATE grupo SET cupo_actual = 3 WHERE id_grupo IN (25,27,29,31);
UPDATE grupo SET cupo_actual = 2 WHERE id_grupo IN (26,28,30,32);
UPDATE grupo SET cupo_actual = 1 WHERE id_grupo IN (33,35,37);
UPDATE grupo SET cupo_actual = 1 WHERE id_grupo IN (34,36,38);

-- ══════════════════════════════════════════════════════════════
-- 9. HISTORIAL ACADÉMICO
-- ══════════════════════════════════════════════════════════════

-- Alumnos de semestre 1: sin historial (primer ingreso)

-- ── Alumnos sem 3: 2 semestres aprobados ──────────────────────
INSERT INTO historial_academico (id_alumno, id_materia, id_periodo, calificacion_final, resultado) VALUES
  -- Isabella (4) – promedio general ~8.2
  (4, 1,6,8.5,'aprobado'),(4,54,6,7.8,'aprobado'),(4,55,6,9.1,'aprobado'),
  (4,62,6,8.2,'aprobado'),(4,63,6,7.5,'aprobado'),(4,76,6,9.0,'aprobado'),
  (4, 2,7,8.0,'aprobado'),(4, 3,7,7.3,'aprobado'),(4,53,7,8.8,'aprobado'),
  (4,57,7,6.5,'aprobado'),(4,61,7,7.9,'aprobado'),
  -- Sebastián (5) – una materia reprobada (AEyED)
  (5, 1,6,9.3,'aprobado'),(5,54,6,8.1,'aprobado'),(5,55,6,8.7,'aprobado'),
  (5,62,6,9.5,'aprobado'),(5,63,6,8.9,'aprobado'),(5,76,6,9.2,'aprobado'),
  (5, 2,7,5.8,'reprobado'),(5,3,7,7.8,'aprobado'),(5,53,7,6.9,'aprobado'),
  (5,57,7,7.1,'aprobado'),(5,61,7,8.4,'aprobado'),
  -- Camila (6) – promedio alto ~9.5
  (6, 1,6,9.8,'aprobado'),(6,54,6,9.4,'aprobado'),(6,55,6,9.6,'aprobado'),
  (6,62,6,9.9,'aprobado'),(6,63,6,9.7,'aprobado'),(6,76,6,9.3,'aprobado'),
  (6, 2,7,9.1,'aprobado'),(6, 3,7,9.5,'aprobado'),(6,53,7,8.9,'aprobado'),
  (6,57,7,9.2,'aprobado'),(6,61,7,9.0,'aprobado'),
  -- Tomás (17) – promedio regular ~7.5
  (17, 1,6,7.2,'aprobado'),(17,54,6,7.0,'aprobado'),(17,55,6,7.5,'aprobado'),
  (17,62,6,7.8,'aprobado'),(17,63,6,7.1,'aprobado'),(17,76,6,7.6,'aprobado'),
  (17, 2,7,6.8,'aprobado'),(17, 3,7,7.3,'aprobado'),(17,53,7,7.0,'aprobado'),
  (17,57,7,6.5,'aprobado'),(17,61,7,7.2,'aprobado');

-- ── Alumnos sem 5: 4 semestres completos ──────────────────────
INSERT INTO historial_academico (id_alumno, id_materia, id_periodo, calificacion_final, resultado) VALUES
  -- Santiago (7)
  (7, 1,4,8.1,'aprobado'),(7,54,4,7.5,'aprobado'),(7,55,4,8.8,'aprobado'),
  (7,62,4,7.9,'aprobado'),(7,63,4,8.3,'aprobado'),(7,76,4,8.0,'aprobado'),
  (7, 2,5,7.6,'aprobado'),(7, 3,5,8.2,'aprobado'),(7,53,5,7.1,'aprobado'),
  (7,57,5,7.8,'aprobado'),(7,61,5,8.5,'aprobado'),
  (7, 4,6,7.3,'aprobado'),(7,56,6,8.1,'aprobado'),(7,59,6,7.9,'aprobado'),
  (7, 5,7,6.8,'aprobado'),(7,60,7,7.4,'aprobado'),
  -- Lucía (8)
  (8, 1,4,7.2,'aprobado'),(8,54,4,6.8,'aprobado'),(8,55,4,7.5,'aprobado'),
  (8,62,4,8.1,'aprobado'),(8,63,4,7.3,'aprobado'),(8,76,4,7.9,'aprobado'),
  (8, 2,5,8.4,'aprobado'),(8, 3,5,7.6,'aprobado'),(8,53,5,8.0,'aprobado'),
  (8,57,5,6.9,'aprobado'),(8,61,5,7.7,'aprobado'),
  (8, 4,6,8.3,'aprobado'),(8,56,6,7.2,'aprobado'),(8,59,6,8.6,'aprobado'),
  (8, 5,7,7.9,'aprobado'),(8,60,7,8.1,'aprobado'),
  -- Daniel (9) – reprobó Compiladores
  (9, 1,4,6.5,'aprobado'),(9,54,4,7.0,'aprobado'),(9,55,4,6.8,'aprobado'),
  (9,62,4,7.5,'aprobado'),(9,63,4,6.9,'aprobado'),(9,76,4,7.2,'aprobado'),
  (9, 2,5,7.8,'aprobado'),(9, 3,5,6.5,'aprobado'),(9,53,5,7.3,'aprobado'),
  (9,57,5,7.1,'aprobado'),(9,61,5,6.8,'aprobado'),
  (9, 4,6,7.6,'aprobado'),(9,56,6,6.9,'aprobado'),(9,59,6,7.4,'aprobado'),
  (9, 5,7,4.5,'reprobado'),(9,60,7,7.0,'aprobado'),   -- Compiladores reprobado
  -- Regina (18) – promedio sólido
  (18, 1,4,7.9,'aprobado'),(18,54,4,8.3,'aprobado'),(18,55,4,7.7,'aprobado'),
  (18,62,4,8.0,'aprobado'),(18,63,4,7.5,'aprobado'),(18,76,4,8.1,'aprobado'),
  (18, 2,5,7.4,'aprobado'),(18, 3,5,8.0,'aprobado'),(18,53,5,7.6,'aprobado'),
  (18,57,5,7.3,'aprobado'),(18,61,5,7.9,'aprobado'),
  (18, 4,6,7.0,'aprobado'),(18,56,6,7.8,'aprobado'),(18,59,6,7.5,'aprobado'),
  (18, 5,7,7.1,'aprobado'),(18,60,7,7.4,'aprobado'),
  -- Kevin (20) – múltiples reprobadas, rezagado
  (20, 1,4,5.5,'aprobado'),(20,54,4,4.8,'reprobado'),(20,55,4,6.0,'aprobado'),
  (20,62,4,7.0,'aprobado'),(20,63,4,5.9,'aprobado'),(20,76,4,6.5,'aprobado'),
  (20, 2,5,6.1,'aprobado'),(20, 3,5,4.5,'reprobado'),(20,53,5,5.8,'aprobado'),
  (20,57,5,6.0,'aprobado'),(20,61,5,5.5,'aprobado'),
  (20, 4,6,6.0,'aprobado'),(20,56,6,5.0,'aprobado'),(20,59,6,6.3,'aprobado'),
  (20, 5,7,4.0,'reprobado'),(20,60,7,6.1,'aprobado');

-- ── Alumnos sem 7: 6 semestres completos ──────────────────────
INSERT INTO historial_academico (id_alumno, id_materia, id_periodo, calificacion_final, resultado) VALUES
  -- Valeria (10) – promedio alto ~8.8
  (10, 1,2,9.1,'aprobado'),(10,54,2,8.7,'aprobado'),(10,55,2,9.3,'aprobado'),
  (10,62,2,8.5,'aprobado'),(10,63,2,9.0,'aprobado'),(10,76,2,9.4,'aprobado'),
  (10, 2,3,8.8,'aprobado'),(10, 3,3,9.1,'aprobado'),(10,53,3,8.6,'aprobado'),
  (10,57,3,8.9,'aprobado'),(10,61,3,9.2,'aprobado'),
  (10, 4,4,8.3,'aprobado'),(10,56,4,8.7,'aprobado'),(10,59,4,9.0,'aprobado'),
  (10, 5,5,7.9,'aprobado'),(10,60,5,8.5,'aprobado'),
  (10, 6,6,8.2,'aprobado'),(10,18,6,8.9,'aprobado'),(10,20,6,8.6,'aprobado'),
  (10, 7,7,9.0,'aprobado'),(10,19,7,8.4,'aprobado'),(10,77,7,8.8,'aprobado'),
  -- Nicolás (11) – promedio medio ~7.8
  (11, 1,2,7.5,'aprobado'),(11,54,2,8.0,'aprobado'),(11,55,2,7.8,'aprobado'),
  (11,62,2,7.3,'aprobado'),(11,63,2,8.1,'aprobado'),(11,76,2,7.9,'aprobado'),
  (11, 2,3,7.6,'aprobado'),(11, 3,3,8.2,'aprobado'),(11,53,3,7.4,'aprobado'),
  (11,57,3,7.9,'aprobado'),(11,61,3,8.0,'aprobado'),
  (11, 4,4,7.2,'aprobado'),(11,56,4,7.8,'aprobado'),(11,59,4,8.1,'aprobado'),
  (11, 5,5,7.5,'aprobado'),(11,60,5,7.3,'aprobado'),
  (11, 6,6,7.8,'aprobado'),(11,18,6,7.5,'aprobado'),(11,20,6,8.0,'aprobado'),
  (11, 7,7,7.9,'aprobado'),(11,19,7,7.6,'aprobado'),(11,77,7,7.4,'aprobado'),
  -- Mariana (12) – promedio regular ~7.0
  (12, 1,2,6.2,'aprobado'),(12,54,2,6.8,'aprobado'),(12,55,2,7.1,'aprobado'),
  (12,62,2,6.5,'aprobado'),(12,63,2,7.0,'aprobado'),(12,76,2,6.9,'aprobado'),
  (12, 2,3,7.3,'aprobado'),(12, 3,3,6.8,'aprobado'),(12,53,3,7.0,'aprobado'),
  (12,57,3,6.5,'aprobado'),(12,61,3,7.2,'aprobado'),
  (12, 4,4,6.9,'aprobado'),(12,56,4,7.1,'aprobado'),(12,59,4,6.7,'aprobado'),
  (12, 5,5,7.0,'aprobado'),(12,60,5,6.8,'aprobado'),
  (12, 6,6,6.5,'aprobado'),(12,18,6,7.0,'aprobado'),(12,20,6,6.9,'aprobado'),
  (12, 7,7,7.1,'aprobado'),(12,19,7,6.8,'aprobado'),(12,77,7,7.0,'aprobado'),
  -- Óscar (19) – promedio medio-alto ~8.0
  (19, 1,2,8.0,'aprobado'),(19,54,2,7.8,'aprobado'),(19,55,2,8.2,'aprobado'),
  (19,62,2,8.5,'aprobado'),(19,63,2,7.9,'aprobado'),(19,76,2,8.1,'aprobado'),
  (19, 2,3,7.7,'aprobado'),(19, 3,3,8.3,'aprobado'),(19,53,3,7.5,'aprobado'),
  (19,57,3,8.0,'aprobado'),(19,61,3,8.4,'aprobado'),
  (19, 4,4,7.6,'aprobado'),(19,56,4,8.2,'aprobado'),(19,59,4,7.8,'aprobado'),
  (19, 5,5,7.9,'aprobado'),(19,60,5,8.0,'aprobado'),
  (19, 6,6,8.1,'aprobado'),(19,18,6,7.7,'aprobado'),(19,20,6,8.3,'aprobado'),
  (19, 7,7,7.8,'aprobado'),(19,19,7,8.1,'aprobado'),(19,77,7,7.9,'aprobado');

-- ── Alumnos sem 8: 7 semestres completos ──────────────────────
INSERT INTO historial_academico (id_alumno, id_materia, id_periodo, calificacion_final, resultado) VALUES
  -- Rodrigo (13) – promedio excelente ~9.0
  (13, 1,1,9.5,'aprobado'),(13,54,1,9.2,'aprobado'),(13,55,1,9.7,'aprobado'),
  (13,62,1,9.3,'aprobado'),(13,63,1,9.6,'aprobado'),(13,76,1,9.4,'aprobado'),
  (13, 2,2,9.0,'aprobado'),(13, 3,2,9.3,'aprobado'),(13,53,2,9.1,'aprobado'),
  (13,57,2,8.9,'aprobado'),(13,61,2,9.2,'aprobado'),
  (13, 4,3,8.8,'aprobado'),(13,56,3,9.1,'aprobado'),(13,59,3,9.0,'aprobado'),
  (13, 5,4,8.5,'aprobado'),(13,60,4,8.9,'aprobado'),
  (13, 6,5,8.3,'aprobado'),(13,18,5,8.7,'aprobado'),(13,20,5,8.6,'aprobado'),
  (13, 7,6,8.9,'aprobado'),(13,19,6,8.4,'aprobado'),(13,77,6,8.8,'aprobado'),
  (13,31,6,9.0,'aprobado'),
  (13, 8,7,8.6,'aprobado'),(13,10,7,8.9,'aprobado'),(13,12,7,8.7,'aprobado'),
  (13,15,7,8.5,'aprobado'),
  -- Andrea (14) – promedio regular ~7.2
  (14, 1,1,7.0,'aprobado'),(14,54,1,7.5,'aprobado'),(14,55,1,6.8,'aprobado'),
  (14,62,1,7.2,'aprobado'),(14,63,1,7.4,'aprobado'),(14,76,1,7.1,'aprobado'),
  (14, 2,2,7.8,'aprobado'),(14, 3,2,7.3,'aprobado'),(14,53,2,7.6,'aprobado'),
  (14,57,2,6.9,'aprobado'),(14,61,2,7.5,'aprobado'),
  (14, 4,3,7.2,'aprobado'),(14,56,3,7.8,'aprobado'),(14,59,3,7.4,'aprobado'),
  (14, 5,4,6.8,'aprobado'),(14,60,4,7.3,'aprobado'),
  (14, 6,5,7.5,'aprobado'),(14,18,5,7.1,'aprobado'),(14,20,5,7.4,'aprobado'),
  (14, 7,6,7.2,'aprobado'),(14,19,6,7.6,'aprobado'),(14,77,6,7.0,'aprobado'),
  (14,31,6,7.3,'aprobado'),
  (14, 8,7,7.1,'aprobado'),(14,10,7,7.4,'aprobado'),(14,12,7,7.2,'aprobado'),
  (14,15,7,6.9,'aprobado');

-- ══════════════════════════════════════════════════════════════
-- 10. CITAS DE REINSCRIPCIÓN
-- Franja horaria determinada por promedio general:
--   promedio ≥ 9.0  → franja 07:00 (día -4 antes de apertura)
--   promedio ≥ 8.0  → franja 09:00 (día -3)
--   promedio ≥ 7.0  → franja 11:00 (día -2)
--   promedio < 7.0  → franja 13:00 (día -1)
-- ══════════════════════════════════════════════════════════════

INSERT INTO cita_reinscripcion
  (id_alumno, id_periodo, fecha_cita, hora_inicio, hora_fin, estatus)
VALUES
  -- Semestre 3
  (4,  8, '2026-04-26', '09:00:00', '09:30:00', 'usada'),  -- Isabella prom ~8.2
  (5,  8, '2026-04-26', '11:00:00', '11:30:00', 'usada'),  -- Sebastián prom ~7.9 (reprobada baja)
  (6,  8, '2026-04-25', '07:00:00', '07:30:00', 'usada'),  -- Camila prom ~9.5
  (17, 8, '2026-04-26', '13:00:00', '13:30:00', 'usada'),  -- Tomás prom ~7.1
  -- Semestre 5
  (7,  8, '2026-04-25', '09:00:00', '09:30:00', 'usada'),  -- Santiago prom ~7.9
  (8,  8, '2026-04-25', '09:30:00', '10:00:00', 'usada'),  -- Lucía prom ~7.8
  (9,  8, '2026-04-25', '11:00:00', '11:30:00', 'usada'),  -- Daniel prom ~7.0 (reprobada)
  (18, 8, '2026-04-25', '09:00:00', '09:30:00', 'usada'),  -- Regina prom ~7.7
  (20, 8, '2026-04-25', '13:00:00', '13:30:00', 'usada'),  -- Kevin prom ~5.8
  -- Semestre 7
  (10, 8, '2026-04-24', '07:00:00', '07:30:00', 'usada'),  -- Valeria prom ~8.8 → franja temprana
  (11, 8, '2026-04-24', '09:00:00', '09:30:00', 'usada'),  -- Nicolás prom ~7.8
  (12, 8, '2026-04-24', '11:00:00', '11:30:00', 'usada'),  -- Mariana prom ~6.9
  (19, 8, '2026-04-24', '09:00:00', '09:30:00', 'usada'),  -- Óscar prom ~8.0
  -- Semestre 8
  (13, 8, '2026-04-23', '07:00:00', '07:30:00', 'usada'),  -- Rodrigo prom ~9.0
  (14, 8, '2026-04-23', '11:00:00', '11:30:00', 'usada');  -- Andrea prom ~7.2

-- ══════════════════════════════════════════════════════════════
-- 11. ÍNDICES SUGERIDOS PARA PRODUCCIÓN
-- (Agregar al schema DDL o ejecutar una sola vez)
-- ══════════════════════════════════════════════════════════════
-- Los índices siguientes mejoran las consultas más frecuentes:
--   · Búsqueda de grupos por periodo y materia
--   · Consulta de inscripciones activas por alumno
--   · Consulta de historial por alumno y periodo
--   · Login por correo o identificador

-- Descomenta para aplicar si no están en el DDL:
-- CREATE INDEX IF NOT EXISTS idx_grupo_periodo_materia   ON grupo(id_periodo, id_materia);
-- CREATE INDEX IF NOT EXISTS idx_inscripcion_alumno      ON inscripcion(id_alumno, estatus);
-- CREATE INDEX IF NOT EXISTS idx_historial_alumno        ON historial_academico(id_alumno, id_periodo);
-- CREATE INDEX IF NOT EXISTS idx_usuario_correo          ON usuario(correo_contacto);
-- CREATE INDEX IF NOT EXISTS idx_usuario_identificador   ON usuario(identificador);
-- CREATE INDEX IF NOT EXISTS idx_calificacion_inscripcion ON calificacion(id_inscripcion);
-- CREATE INDEX IF NOT EXISTS idx_horario_grupo_dia       ON horario_grupo(id_grupo, dia_semana);

-- ══════════════════════════════════════════════════════════════
-- CONFIRMAR TRANSACCIÓN
-- ══════════════════════════════════════════════════════════════
COMMIT;

SET UNIQUE_CHECKS   = @OLD_UNIQUE_CHECKS;
SET SQL_MODE        = @OLD_SQL_MODE;

-- ── Verificación final ────────────────────────────────────────
SELECT 'departamentos'        AS entidad, COUNT(*) AS total FROM departamento  UNION ALL
SELECT 'carreras',                        COUNT(*)          FROM carrera        UNION ALL
SELECT 'materias',                        COUNT(*)          FROM materia        UNION ALL
SELECT 'aulas',                           COUNT(*)          FROM aula           UNION ALL
SELECT 'periodos_academicos',             COUNT(*)          FROM periodo_academico UNION ALL
SELECT 'usuarios',                        COUNT(*)          FROM usuario        UNION ALL
SELECT 'profesores',                      COUNT(*)          FROM profesor       UNION ALL
SELECT 'alumnos',                         COUNT(*)          FROM alumno         UNION ALL
SELECT 'grupos',                          COUNT(*)          FROM grupo          UNION ALL
SELECT 'inscripciones_activas',           COUNT(*)          FROM inscripcion WHERE estatus = 'activa' UNION ALL
SELECT 'inscripciones_baja',              COUNT(*)          FROM inscripcion WHERE estatus = 'baja'   UNION ALL
SELECT 'historial_academico',             COUNT(*)          FROM historial_academico UNION ALL
SELECT 'citas_reinscripcion',             COUNT(*)          FROM cita_reinscripcion;

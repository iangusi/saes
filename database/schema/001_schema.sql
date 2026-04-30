-- ================================================================
-- ESCOM ALIZ – Esquema de base de datos
-- MySQL 8+  |  Charset: utf8mb4  |  Collation: utf8mb4_unicode_ci
-- ================================================================

CREATE DATABASE IF NOT EXISTS saes2
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE saes2;

-- ================================================================
-- CATÁLOGOS BASE
-- ================================================================

CREATE TABLE IF NOT EXISTS departamento (
  id_departamento   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(120) NOT NULL,
  clave             VARCHAR(20)  NOT NULL,
  activo            TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_departamento_clave UNIQUE (clave)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carrera (
  id_carrera        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(150) NOT NULL,
  clave             VARCHAR(20)  NOT NULL,
  id_departamento   INT UNSIGNED NOT NULL,
  activo            TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_carrera_clave UNIQUE (clave),
  CONSTRAINT fk_carrera_departamento FOREIGN KEY (id_departamento)
    REFERENCES departamento (id_departamento)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plan_estudios (
  id_plan           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_carrera        INT UNSIGNED NOT NULL,
  nombre            VARCHAR(100) NOT NULL,
  anio_inicio       YEAR        NOT NULL,
  total_creditos    FLOAT       NOT NULL,
  total_materias    SMALLINT    NOT NULL,
  activo            TINYINT(1)  NOT NULL DEFAULT 1,
  created_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_plan_carrera FOREIGN KEY (id_carrera)
    REFERENCES carrera (id_carrera)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS materia (
  id_materia        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  clave             VARCHAR(20)  NOT NULL,
  nombre            VARCHAR(150) NOT NULL,
  creditos          FLOAT        NOT NULL,
  horas_teoria      FLOAT        NOT NULL DEFAULT 0,
  horas_practica    FLOAT        NOT NULL DEFAULT 0,
  activo            TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_materia_clave UNIQUE (clave)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plan_materia (
  id_plan_materia   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_plan           INT UNSIGNED NOT NULL,
  id_materia        INT UNSIGNED NOT NULL,
  semestre          TINYINT      NOT NULL,
  tipo              ENUM('obligatoria','optativa') NOT NULL DEFAULT 'obligatoria',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_plan_materia UNIQUE (id_plan, id_materia),
  CONSTRAINT fk_plan_materia_plan    FOREIGN KEY (id_plan)    REFERENCES plan_estudios (id_plan),
  CONSTRAINT fk_plan_materia_materia FOREIGN KEY (id_materia) REFERENCES materia (id_materia)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS materia_prerrequisito (
  id_prerrequisito  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_materia        INT UNSIGNED NOT NULL,
  id_prerrequisito_materia INT UNSIGNED NOT NULL,
  CONSTRAINT uq_prerrequisito UNIQUE (id_materia, id_prerrequisito_materia),
  CONSTRAINT fk_prereq_materia  FOREIGN KEY (id_materia)               REFERENCES materia (id_materia),
  CONSTRAINT fk_prereq_requiere FOREIGN KEY (id_prerrequisito_materia) REFERENCES materia (id_materia)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS aula (
  id_aula           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(50)  NOT NULL,
  edificio          VARCHAR(50),
  capacidad         SMALLINT     NOT NULL DEFAULT 30,
  activo            TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_aula_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

-- ================================================================
-- USUARIOS Y ROLES
-- ================================================================

CREATE TABLE IF NOT EXISTS rol (
  id_rol    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(50) NOT NULL,
  CONSTRAINT uq_rol_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  identificador     VARCHAR(20)  NOT NULL COMMENT 'boleta o número de empleado',
  nombre            VARCHAR(80)  NOT NULL,
  apellido_paterno  VARCHAR(80)  NOT NULL,
  apellido_materno  VARCHAR(80),
  correo_contacto   VARCHAR(120) NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  activo            TINYINT(1)   NOT NULL DEFAULT 1,
  reset_token       VARCHAR(255),
  reset_token_exp   DATETIME,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuario_identificador UNIQUE (identificador),
  CONSTRAINT uq_usuario_correo        UNIQUE (correo_contacto),
  INDEX idx_usuario_activo (activo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuario_rol (
  id_usuario_rol INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario     INT UNSIGNED NOT NULL,
  id_rol         INT UNSIGNED NOT NULL,
  CONSTRAINT uq_usuario_rol     UNIQUE (id_usuario, id_rol),
  CONSTRAINT fk_ur_usuario      FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT fk_ur_rol          FOREIGN KEY (id_rol)     REFERENCES rol (id_rol)
) ENGINE=InnoDB;

-- ================================================================
-- ALUMNO Y PROFESOR
-- ================================================================

CREATE TABLE IF NOT EXISTS alumno (
  id_alumno         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario        INT UNSIGNED NOT NULL,
  id_plan           INT UNSIGNED NOT NULL,
  boleta            VARCHAR(20)  NOT NULL,
  semestre_actual   TINYINT      NOT NULL DEFAULT 1,
  estatus           ENUM('activo','baja_temporal','baja_definitiva','egresado','titulado') NOT NULL DEFAULT 'activo',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_alumno_boleta    UNIQUE (boleta),
  CONSTRAINT uq_alumno_usuario   UNIQUE (id_usuario),
  CONSTRAINT fk_alumno_usuario   FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT fk_alumno_plan      FOREIGN KEY (id_plan)    REFERENCES plan_estudios (id_plan),
  INDEX idx_alumno_estatus (estatus)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS profesor (
  id_profesor       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario        INT UNSIGNED NOT NULL,
  id_departamento   INT UNSIGNED NOT NULL,
  numero_empleado   VARCHAR(20)  NOT NULL,
  estatus           ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_profesor_empleado UNIQUE (numero_empleado),
  CONSTRAINT uq_profesor_usuario  UNIQUE (id_usuario),
  CONSTRAINT fk_profesor_usuario       FOREIGN KEY (id_usuario)      REFERENCES usuario (id_usuario),
  CONSTRAINT fk_profesor_departamento  FOREIGN KEY (id_departamento) REFERENCES departamento (id_departamento)
) ENGINE=InnoDB;

-- ================================================================
-- PERIODOS Y PROCESOS ACADÉMICOS
-- ================================================================

CREATE TABLE IF NOT EXISTS periodo_academico (
  id_periodo        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(50)  NOT NULL COMMENT 'ej: 2024-1, 2024-2',
  fecha_inicio      DATE         NOT NULL,
  fecha_fin         DATE         NOT NULL,
  activo            TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_periodo_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS proceso_academico (
  id_proceso        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre            VARCHAR(80)  NOT NULL COMMENT 'ej: reinscripción, evaluación_docente, captura_calificaciones',
  descripcion       TEXT,
  CONSTRAINT uq_proceso_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS periodo_proceso (
  id_periodo_proceso INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_periodo         INT UNSIGNED NOT NULL,
  id_proceso         INT UNSIGNED NOT NULL,
  fecha_inicio       DATETIME     NOT NULL,
  fecha_fin          DATETIME     NOT NULL,
  activo             TINYINT(1)   NOT NULL DEFAULT 1,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pp_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico (id_periodo),
  CONSTRAINT fk_pp_proceso FOREIGN KEY (id_proceso) REFERENCES proceso_academico (id_proceso),
  INDEX idx_pp_proceso_activo (id_proceso, activo)
) ENGINE=InnoDB;

-- ================================================================
-- GRUPOS Y HORARIOS
-- ================================================================

CREATE TABLE IF NOT EXISTS grupo (
  id_grupo          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_periodo        INT UNSIGNED NOT NULL,
  id_materia        INT UNSIGNED NOT NULL,
  id_profesor       INT UNSIGNED NOT NULL,
  clave_grupo       VARCHAR(10)  NOT NULL,
  cupo_max          SMALLINT     NOT NULL DEFAULT 30,
  cupo_actual       SMALLINT     NOT NULL DEFAULT 0,
  estatus           ENUM('abierto','cerrado','cancelado') NOT NULL DEFAULT 'abierto',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_grupo_periodo_materia_clave UNIQUE (id_periodo, id_materia, clave_grupo),
  CONSTRAINT fk_grupo_periodo  FOREIGN KEY (id_periodo)  REFERENCES periodo_academico (id_periodo),
  CONSTRAINT fk_grupo_materia  FOREIGN KEY (id_materia)  REFERENCES materia (id_materia),
  CONSTRAINT fk_grupo_profesor FOREIGN KEY (id_profesor) REFERENCES profesor (id_profesor),
  CONSTRAINT chk_grupo_cupo CHECK (cupo_actual <= cupo_max),
  INDEX idx_grupo_periodo_estatus (id_periodo, estatus)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS horario_grupo (
  id_horario_grupo  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_grupo          INT UNSIGNED NOT NULL,
  id_aula           INT UNSIGNED NOT NULL,
  dia_semana        ENUM('lunes','martes','miercoles','jueves','viernes','sabado') NOT NULL,
  hora_inicio       TIME         NOT NULL,
  hora_fin          TIME         NOT NULL,
  CONSTRAINT uq_horario_aula_dia_hora UNIQUE (id_aula, dia_semana, hora_inicio),
  CONSTRAINT fk_hg_grupo FOREIGN KEY (id_grupo) REFERENCES grupo (id_grupo),
  CONSTRAINT fk_hg_aula  FOREIGN KEY (id_aula)  REFERENCES aula (id_aula),
  CONSTRAINT chk_horario_horas CHECK (hora_fin > hora_inicio)
) ENGINE=InnoDB;

-- ================================================================
-- INSCRIPCIONES
-- ================================================================

CREATE TABLE IF NOT EXISTS inscripcion (
  id_inscripcion    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_alumno         INT UNSIGNED NOT NULL,
  id_grupo          INT UNSIGNED NOT NULL,
  fecha_inscripcion DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  estatus           ENUM('activa','baja','baja_administrativa') NOT NULL DEFAULT 'activa',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_inscripcion_alumno_grupo UNIQUE (id_alumno, id_grupo),
  CONSTRAINT fk_inscripcion_alumno FOREIGN KEY (id_alumno) REFERENCES alumno (id_alumno),
  CONSTRAINT fk_inscripcion_grupo  FOREIGN KEY (id_grupo)  REFERENCES grupo (id_grupo),
  INDEX idx_inscripcion_alumno (id_alumno),
  INDEX idx_inscripcion_estatus (estatus)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inscripcion_historial (
  id_historial      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_inscripcion    INT UNSIGNED NOT NULL,
  id_usuario_op     INT UNSIGNED NOT NULL COMMENT 'quien ejecutó la operación',
  accion            ENUM('alta','baja','baja_administrativa') NOT NULL,
  motivo            TEXT,
  fecha_operacion   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ih_inscripcion FOREIGN KEY (id_inscripcion) REFERENCES inscripcion (id_inscripcion),
  CONSTRAINT fk_ih_usuario     FOREIGN KEY (id_usuario_op)  REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

-- ================================================================
-- CITA DE REINSCRIPCIÓN
-- ================================================================

CREATE TABLE IF NOT EXISTS cita_reinscripcion (
  id_cita           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_alumno         INT UNSIGNED NOT NULL,
  id_periodo        INT UNSIGNED NOT NULL,
  fecha_cita        DATE         NOT NULL,
  hora_inicio       TIME         NOT NULL,
  hora_fin          TIME         NOT NULL,
  estatus           ENUM('pendiente','usada','expirada') NOT NULL DEFAULT 'pendiente',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_cita_alumno_periodo UNIQUE (id_alumno, id_periodo),
  CONSTRAINT fk_cita_alumno  FOREIGN KEY (id_alumno)  REFERENCES alumno (id_alumno),
  CONSTRAINT fk_cita_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico (id_periodo)
) ENGINE=InnoDB;

-- ================================================================
-- CALIFICACIONES E HISTORIAL ACADÉMICO
-- ================================================================

CREATE TABLE IF NOT EXISTS tipo_evaluacion (
  id_tipo_evaluacion INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre             VARCHAR(50)  NOT NULL COMMENT 'ej: parcial1, parcial2, final, extraordinario',
  ponderacion        DECIMAL(5,2) NOT NULL,
  CONSTRAINT uq_tipo_evaluacion_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grupo_evaluacion (
  id_grupo_evaluacion INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_grupo            INT UNSIGNED NOT NULL,
  id_tipo_evaluacion  INT UNSIGNED NOT NULL,
  fecha_apertura      DATETIME,
  fecha_cierre        DATETIME,
  cerrada             TINYINT(1)  NOT NULL DEFAULT 0,
  CONSTRAINT uq_grupo_evaluacion UNIQUE (id_grupo, id_tipo_evaluacion),
  CONSTRAINT fk_ge_grupo            FOREIGN KEY (id_grupo)           REFERENCES grupo (id_grupo),
  CONSTRAINT fk_ge_tipo_evaluacion  FOREIGN KEY (id_tipo_evaluacion) REFERENCES tipo_evaluacion (id_tipo_evaluacion)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS calificacion (
  id_calificacion     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_inscripcion      INT UNSIGNED NOT NULL,
  id_grupo_evaluacion INT UNSIGNED NOT NULL,
  calificacion        DECIMAL(5,2),
  capturada_por       INT UNSIGNED NOT NULL COMMENT 'id_usuario del profesor',
  fecha_captura       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_calificacion_inscripcion_evaluacion UNIQUE (id_inscripcion, id_grupo_evaluacion),
  CONSTRAINT fk_cal_inscripcion      FOREIGN KEY (id_inscripcion)      REFERENCES inscripcion (id_inscripcion),
  CONSTRAINT fk_cal_grupo_evaluacion FOREIGN KEY (id_grupo_evaluacion) REFERENCES grupo_evaluacion (id_grupo_evaluacion),
  CONSTRAINT fk_cal_capturador       FOREIGN KEY (capturada_por)       REFERENCES usuario (id_usuario),
  CONSTRAINT chk_calificacion_rango CHECK (calificacion IS NULL OR (calificacion >= 0 AND calificacion <= 10))
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historial_academico (
  id_historial_acad   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_alumno           INT UNSIGNED NOT NULL,
  id_materia          INT UNSIGNED NOT NULL,
  id_periodo          INT UNSIGNED NOT NULL,
  calificacion_final  DECIMAL(5,2),
  tipo_acreditacion   ENUM('ordinario','extraordinario','titulo_suficiencia') NOT NULL DEFAULT 'ordinario',
  resultado           ENUM('aprobado','reprobado','no_presentado') NOT NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_historial_alumno_materia_periodo UNIQUE (id_alumno, id_materia, id_periodo),
  CONSTRAINT fk_ha_alumno  FOREIGN KEY (id_alumno)  REFERENCES alumno (id_alumno),
  CONSTRAINT fk_ha_materia FOREIGN KEY (id_materia) REFERENCES materia (id_materia),
  CONSTRAINT fk_ha_periodo FOREIGN KEY (id_periodo) REFERENCES periodo_academico (id_periodo),
  INDEX idx_ha_alumno (id_alumno)
) ENGINE=InnoDB;

-- ================================================================
-- EVALUACIÓN DOCENTE
-- ================================================================

CREATE TABLE IF NOT EXISTS encuesta_docente (
  id_encuesta         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_periodo_proceso  INT UNSIGNED NOT NULL,
  nombre              VARCHAR(100) NOT NULL,
  activo              TINYINT(1)   NOT NULL DEFAULT 1,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ed_periodo_proceso FOREIGN KEY (id_periodo_proceso) REFERENCES periodo_proceso (id_periodo_proceso)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS encuesta_docente_pregunta (
  id_pregunta         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_encuesta         INT UNSIGNED NOT NULL,
  texto               TEXT         NOT NULL,
  tipo                ENUM('escala','abierta') NOT NULL DEFAULT 'escala',
  orden               TINYINT      NOT NULL DEFAULT 1,
  CONSTRAINT fk_edp_encuesta FOREIGN KEY (id_encuesta) REFERENCES encuesta_docente (id_encuesta)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS encuesta_docente_respuesta (
  id_respuesta        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_pregunta         INT UNSIGNED NOT NULL,
  id_inscripcion      INT UNSIGNED NOT NULL,
  respuesta_numerica  TINYINT,
  respuesta_texto     TEXT,
  fecha_respuesta     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_respuesta_pregunta_inscripcion UNIQUE (id_pregunta, id_inscripcion),
  CONSTRAINT fk_edr_pregunta    FOREIGN KEY (id_pregunta)   REFERENCES encuesta_docente_pregunta (id_pregunta),
  CONSTRAINT fk_edr_inscripcion FOREIGN KEY (id_inscripcion) REFERENCES inscripcion (id_inscripcion),
  CONSTRAINT chk_respuesta_numerica CHECK (respuesta_numerica IS NULL OR (respuesta_numerica >= 1 AND respuesta_numerica <= 5))
) ENGINE=InnoDB;

-- ================================================================
-- SOLICITUDES ACADÉMICAS
-- ================================================================

CREATE TABLE IF NOT EXISTS solicitud_academica (
  id_solicitud        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_alumno           INT UNSIGNED NOT NULL,
  tipo                ENUM('baja_materia','baja_periodo','cambio_grupo','otro') NOT NULL,
  descripcion         TEXT,
  estatus             ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
  atendida_por        INT UNSIGNED,
  fecha_solicitud     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_resolucion    DATETIME,
  CONSTRAINT fk_sa_alumno FOREIGN KEY (id_alumno)    REFERENCES alumno (id_alumno),
  CONSTRAINT fk_sa_atencion FOREIGN KEY (atendida_por) REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

-- ================================================================
-- BITÁCORA DE AUDITORÍA
-- ================================================================

CREATE TABLE IF NOT EXISTS bitacora_auditoria (
  id_bitacora         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_usuario          INT UNSIGNED,
  accion              VARCHAR(80)  NOT NULL,
  modulo              VARCHAR(50)  NOT NULL,
  descripcion         TEXT,
  ip_origen           VARCHAR(45),
  metadata            JSON,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ba_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE SET NULL,
  INDEX idx_ba_usuario  (id_usuario),
  INDEX idx_ba_accion   (accion),
  INDEX idx_ba_modulo   (modulo),
  INDEX idx_ba_fecha    (created_at)
) ENGINE=InnoDB;

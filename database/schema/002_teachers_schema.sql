-- ================================================================
-- ASISTENCIA Y ANUNCIOS (FUNCIONALIDADES DE PROFESORES)
-- Ejecutar después del schema base (001_schema.sql)
-- ================================================================

-- Tabla de Asistencia
CREATE TABLE IF NOT EXISTS asistencia (
  id_asistencia     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_inscripcion    INT UNSIGNED NOT NULL,
  id_grupo          INT UNSIGNED NOT NULL,
  fecha             DATE         NOT NULL,
  presente          TINYINT(1)   NOT NULL DEFAULT 0,
  justificada       TINYINT(1)   NOT NULL DEFAULT 0,
  observaciones     TEXT,
  registrada_por    INT UNSIGNED NOT NULL COMMENT 'id_usuario del profesor',
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_asistencia_inscripcion_fecha UNIQUE (id_inscripcion, fecha),
  CONSTRAINT fk_asist_inscripcion FOREIGN KEY (id_inscripcion) REFERENCES inscripcion (id_inscripcion) ON DELETE CASCADE,
  CONSTRAINT fk_asist_grupo       FOREIGN KEY (id_grupo)       REFERENCES grupo (id_grupo) ON DELETE CASCADE,
  CONSTRAINT fk_asist_registrador FOREIGN KEY (registrada_por) REFERENCES usuario (id_usuario),
  INDEX idx_asist_grupo_fecha (id_grupo, fecha),
  INDEX idx_asist_alumno (id_inscripcion)
) ENGINE=InnoDB;

-- Tabla de Anuncios/Avisos
CREATE TABLE IF NOT EXISTS anuncio (
  id_anuncio        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_grupo          INT UNSIGNED NOT NULL,
  titulo            VARCHAR(150) NOT NULL,
  contenido         TEXT         NOT NULL,
  enviado_por       INT UNSIGNED NOT NULL COMMENT 'id_usuario del profesor',
  fecha_creacion    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_anuncio_grupo      FOREIGN KEY (id_grupo)      REFERENCES grupo (id_grupo) ON DELETE CASCADE,
  CONSTRAINT fk_anuncio_profesor   FOREIGN KEY (enviado_por)   REFERENCES usuario (id_usuario),
  INDEX idx_anuncio_grupo       (id_grupo),
  INDEX idx_anuncio_fecha       (fecha_creacion),
  INDEX idx_anuncio_profesor    (enviado_por)
) ENGINE=InnoDB;

-- Tabla de registro de lectura de anuncios (opcional, para seguimiento)
CREATE TABLE IF NOT EXISTS anuncio_lectura (
  id_lectura        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  id_anuncio        INT UNSIGNED NOT NULL,
  id_alumno         INT UNSIGNED NOT NULL,
  fecha_lectura     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_anuncio_lectura_alumno UNIQUE (id_anuncio, id_alumno),
  CONSTRAINT fk_al_anuncio FOREIGN KEY (id_anuncio) REFERENCES anuncio (id_anuncio) ON DELETE CASCADE,
  CONSTRAINT fk_al_alumno  FOREIGN KEY (id_alumno)  REFERENCES alumno (id_alumno) ON DELETE CASCADE,
  INDEX idx_al_anuncio (id_anuncio),
  INDEX idx_al_alumno  (id_alumno)
) ENGINE=InnoDB;

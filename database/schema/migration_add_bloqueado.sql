-- Migración: añadir columna bloqueado a usuario
-- Permite distinguir entre "dar de baja" (activo=0) y "bloquear temporalmente" (bloqueado=1)
ALTER TABLE usuario
  ADD COLUMN bloqueado TINYINT(1) NOT NULL DEFAULT 0 AFTER activo;

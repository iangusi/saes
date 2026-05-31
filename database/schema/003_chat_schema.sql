-- ================================================================
-- TABLAS DEL MÓDULO CHATBOT
-- Ejecutar DESPUÉS de 001_schema.sql
-- ================================================================

USE saes2;

CREATE TABLE IF NOT EXISTS `chat_conversacion` (
  `id_conversacion` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'UUID generado en el servidor',
  `id_usuario` int unsigned NOT NULL,
  `titulo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Se puede auto-generar del primer mensaje',
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_conversacion`),
  KEY `idx_chat_usuario` (`id_usuario`),
  CONSTRAINT `fk_chat_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_mensaje` (
  `id_mensaje` int unsigned NOT NULL AUTO_INCREMENT,
  `id_conversacion` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rol` enum('usuario','asistente','sistema') COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mensaje`),
  KEY `idx_mensaje_conversacion` (`id_conversacion`),
  KEY `idx_mensaje_creado` (`creado_en`),
  CONSTRAINT `fk_mensaje_conversacion` FOREIGN KEY (`id_conversacion`) REFERENCES `chat_conversacion` (`id_conversacion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- MIGRACION DEL MODULO CHATBOT: RESPUESTAS ESTRUCTURADAS
-- Ejecutar DESPUES de 003_chat_schema.sql
-- ================================================================

USE saes2;

ALTER TABLE chat_mensaje
  ADD COLUMN metadata_json JSON NULL AFTER contenido,
  ADD COLUMN data_json JSON NULL AFTER metadata_json,
  ADD COLUMN actions_json JSON NULL AFTER data_json,
  ADD COLUMN plan_json JSON NULL AFTER actions_json,
  ADD COLUMN agent_traces_json JSON NULL AFTER plan_json,
  ADD COLUMN tool_results_json JSON NULL AFTER agent_traces_json,
  ADD COLUMN evidence_json JSON NULL AFTER tool_results_json;

ALTER TABLE chat_conversacion
  ADD COLUMN resumen_contexto TEXT NULL AFTER titulo,
  ADD COLUMN entidades_json JSON NULL AFTER resumen_contexto,
  ADD COLUMN ultimo_intent VARCHAR(80) NULL AFTER entidades_json;

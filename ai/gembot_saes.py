import json
import os
import random
import re
from dataclasses import dataclass
from typing import Any

from dotenv import load_dotenv
from groq import Groq

load_dotenv()


WORD_SYNONYMS: dict[str, str] = {
    "reinscribirme": "reinscripcion",
    "reinscribirte": "reinscripcion",
    "reinscribirse": "reinscripcion",
    "reinscribir": "reinscripcion",
    "inscribirme": "inscripcion",
    "inscribirte": "inscripcion",
    "inscribirse": "inscripcion",
    "bajarme": "baja",
    "bajarte": "baja",
    "dictaminado": "dictamen",
    "dictaminarse": "dictamen",
    "extraordinario": "ets",
    "extraordinaria": "ets",
}


STOP_WORDS_ES = {
    "que", "como", "para", "una", "uno", "los", "las", "del", "sus", "por",
    "con", "sin", "son", "ser", "fue", "han", "hay", "mas", "pero", "ese",
    "esta", "este", "esa", "cuando", "puede", "tiene", "tener", "debe",
    "deben", "cuales", "cual", "cuanto", "tengo", "puedo", "pasa", "estan",
    "ver", "dar", "siendo", "dado", "hacer", "hago", "tuvo", "tres", "dos",
    "solo", "cada", "algo", "algun", "alguna", "mis", "eso", "cual", "sobre",
}

INTENTS = {
    "consulta_horario",
    "consulta_kardex",
    "consulta_calificaciones",
    "consulta_promedio",
    "estado_reinscripcion",
    "recomendacion_reinscripcion",
    "baja_materias",
    "consulta_perfil",
    "consulta_horario_profesor",
    "consulta_grupos_profesor",
    "lista_alumnos_grupo",
    "consulta_alumnos_reprobados",
    "consulta_calificaciones_grupo",
    "institucional_general",
    "ambigua",
    "fuera_de_alcance",
    "saludo",
}


@dataclass
class KnowledgeDocument:
    id: str
    tema: str
    titulo: str
    contenido: str
    palabras_clave: list[str]
    prioridad: str = "media"


class ChatbotESCOM:
    def __init__(self, dataset_path: str):
        self.dataset = self._cargar_dataset(dataset_path)
        self.documents = self._build_documents(self.dataset)
        self.client = self._inicializar_groq()

    def _cargar_dataset(self, path: str) -> dict[str, Any]:
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            raise ValueError(f"Error cargando dataset: {exc}") from exc

    def _inicializar_groq(self) -> Groq | None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("[WARN] GROQ_API_KEY no encontrada en .env")
            return None
        return Groq(api_key=api_key)

    def _build_documents(self, dataset: dict[str, Any]) -> list[KnowledgeDocument]:
        docs: list[KnowledgeDocument] = []

        for section, value in dataset.items():
            if section in {"saludos", "despedidas", "no_entendido"}:
                continue

            if isinstance(value, dict):
                for key, content in value.items():
                    docs.append(
                        KnowledgeDocument(
                            id=f"{section}_{key}",
                            tema=section,
                            titulo=humanize(f"{section} {key}"),
                            contenido=str(content),
                            palabras_clave=[section, key, *split_words(f"{section} {key}")],
                            prioridad="alta" if section in {"reinscripcion", "gestion"} else "media",
                        )
                    )
            else:
                docs.append(
                    KnowledgeDocument(
                        id=section,
                        tema=section,
                        titulo=humanize(section),
                        contenido=str(value),
                        palabras_clave=[section, *split_words(section)],
                    )
                )

        return docs

    # ------------------------------------------------------------------
    # INTENCION
    # ------------------------------------------------------------------
    def classify_intent(self, pregunta: str, roles: list[str] | None = None, contexto: dict[str, Any] | None = None) -> dict[str, Any]:
        roles = roles or []
        contexto = contexto or {}
        local = self._classify_locally(pregunta, roles, contexto)

        # Intents conversacionales con alta confianza — no delegar a Groq para evitar overrides
        if local.get("intent") in {"saludo", "fuera_de_alcance"}:
            return local

        if not self.client:
            return local

        try:
            rol_texto = "PROFESOR" if "profesor" in roles else "ALUMNO" if "alumno" in roles else "USUARIO"
            messages = [
                {
                    "role": "system",
                    "content": (
                        f"Clasifica preguntas del portal SAES 2.0 de ESCOM-IPN. "
                        f"El usuario tiene el rol: {rol_texto}.\n\n"
                        "INTENTS DISPONIBLES Y SU SIGNIFICADO:\n"
                        "- consulta_horario: alumno quiere ver su propio horario de clases\n"
                        "- consulta_kardex: alumno quiere ver su historial academico con materias cursadas y resultados\n"
                        "- consulta_calificaciones: alumno quiere ver sus calificaciones del periodo actual\n"
                        "- consulta_promedio: alumno quiere saber su promedio o avance de creditos\n"
                        "- estado_reinscripcion: alumno quiere saber su cita o si puede reinscribirse\n"
                        "- recomendacion_reinscripcion: alumno quiere saber que materias puede inscribir\n"
                        "- baja_materias: alumno quiere tramitar una baja de materia\n"
                        "- consulta_perfil: cualquier rol quiere ver su informacion de perfil\n"
                        "- consulta_horario_profesor: profesor quiere ver su propio horario de grupos\n"
                        "- consulta_grupos_profesor: profesor quiere ver sus grupos asignados y cupo\n"
                        "- lista_alumnos_grupo: profesor quiere ver la lista completa de alumnos de un grupo\n"
                        "- consulta_alumnos_reprobados: profesor quiere saber que alumnos van reprobando "
                        "(promedio ponderado < 6.0) en uno o todos sus grupos\n"
                        "- consulta_calificaciones_grupo: profesor quiere ver las calificaciones de todos "
                        "sus alumnos en un grupo especifico\n"
                        "- institucional_general: preguntas sobre reglamento, ETS, tramites, normativa\n"
                        "- ambigua: pregunta no es clara o necesita mas contexto\n"
                        "- fuera_de_alcance: temas sin relacion con ESCOM/SAES\n\n"
                        "REGLAS DE ROL:\n"
                        "- PROFESOR: puede preguntar sobre sus grupos, alumnos, calificaciones, reprobados, horario\n"
                        "- ALUMNO: solo puede preguntar sobre su propia informacion academica\n\n"
                        "Responde solo JSON valido con: intent, confidence, requires_database, requires_dataset, "
                        "requires_clarification, missing_fields, target, clarifying_question. "
                        f"Intents validos: {', '.join(sorted(INTENTS))}."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "pregunta": pregunta,
                            "roles": roles,
                            "contexto": contexto,
                            "fallback_local": local,
                        },
                        ensure_ascii=False,
                    ),
                },
            ]
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=380,
                temperature=0,
                response_format={"type": "json_object"},
            )
            parsed = json.loads(response.choices[0].message.content or "{}")
            return normalize_intent(parsed) or local
        except Exception as exc:
            print(f"[Groq intent error] {exc}")
            return local

    def _classify_locally(self, pregunta: str, roles: list[str], contexto: dict[str, Any]) -> dict[str, Any]:
        q = normalize(pregunta)
        is_teacher = "profesor" in roles

        if not q:
            return ambiguous("¿Qué necesitas consultar en SAES?")

        q_tokens = set(q.split())
        GREETING_TOKENS = {"hola", "hey", "hi", "saludos"}
        GREETING_PHRASES = ["buenos dias", "buenas tardes", "buenas noches", "buen dia", "que tal", "como estas"]
        CLOSING_TOKENS = {"gracias", "adios", "bye", "chao"}
        CLOSING_PHRASES = ["hasta luego", "hasta pronto", "ok gracias", "muchas gracias", "nos vemos"]

        if (any(w in q_tokens for w in GREETING_TOKENS) or any(ph in q for ph in GREETING_PHRASES)) and len(q.split()) <= 6:
            return result("saludo", 0.95, False, False, "conversacional")

        if (any(w in q_tokens for w in CLOSING_TOKENS) or any(ph in q for ph in CLOSING_PHRASES)) and len(q.split()) <= 5:
            return result("fuera_de_alcance", 0.90, False, False, "despedida")

        if any(word in q for word in [
            "chiste", "receta", "futbol", "politica", "bitcoin", "clima",
            "resultado", "partido", "equipo", "deportes", "musica", "pelicula",
            "serie", "cocina", "america", "restaurant", "restaurante",
        ]):
            return result("fuera_de_alcance", 0.86, False, False, "out_of_scope")

        if looks_like_schedule_lookup(q):
            intent = "consulta_horario_profesor" if is_teacher else "consulta_horario"
            return result(intent, 0.88, True, False, infer_target(intent, is_teacher))

        previous_intent = str(contexto.get("previousIntent") or contexto.get("previous_intent") or "")

        # Clave de grupo sola como follow-up (ej: "1CM1" tras pedir aclaración de grupo)
        TEACHER_DB_INTENTS = {"lista_alumnos_grupo", "consulta_calificaciones_grupo", "consulta_alumnos_reprobados"}
        if extract_group_key(pregunta) and previous_intent in TEACHER_DB_INTENTS:
            return result(previous_intent, 0.82, True, False, infer_target(previous_intent, is_teacher))

        if previous_intent and any(word in q for word in ["esa", "ese", "eso", "baja", "quitar"]):
            if "baja" in q or "quitar" in q:
                return result("baja_materias", 0.76, True, True, "withdrawals_status")

        # Detectar preguntas sobre plazos o fechas límite → institucional_general
        # (deben evaluarse ANTES del loop de keywords para evitar match con "calificaciones")
        DEADLINE_PATTERNS = [
            "ultimo dia", "fecha limite", "hasta cuando", "hasta cuándo", "plazo",
            "cuando puedo registrar", "cuando termina", "cuándo termina",
            "cuando cierra", "cuándo cierra", "fecha de cierre", "se puede registrar",
            "registrar calificacion", "puedo registrar",
        ]
        if any(phrase in q for phrase in DEADLINE_PATTERNS):
            return result("institucional_general", 0.84, False, True, "institutional_knowledge")

        checks = [
            ("consulta_promedio", ["promedio", "avance"], True, False),
            ("consulta_kardex", ["kardex", "historial academico"], True, False),
            ("consulta_calificaciones", ["calificacion", "calificaciones", "parcial"], True, False),
            ("estado_reinscripcion", ["cita", "estado de reinscripcion", "puedo reinscribirme"], True, True),
            ("recomendacion_reinscripcion", ["materias puedo meter", "materias puedo inscribir", "recomienda"], True, True),
            ("baja_materias", ["baja", "dar de baja", "quitar materia"], True, True),
            ("consulta_perfil", ["perfil", "mis datos", "mi informacion", "correo", "boleta", "numero de empleado"], True, False),
            # Intents de profesor: reprobados y calificaciones ANTES de lista genérica de alumnos
            ("consulta_alumnos_reprobados", ["reprobando", "reprobados", "reprobar", "reprueba", "van mal", "calificacion baja", "calificaciones bajas", "bajo promedio"], True, False),
            ("consulta_calificaciones_grupo", ["calificaciones del grupo", "calificaciones de mis alumnos", "notas del grupo", "como van mis alumnos"], True, False),
            ("lista_alumnos_grupo", ["alumnos", "lista", "inscritos"], True, False),
            ("consulta_grupos_profesor", ["mis grupos", "grupos asignados", "cupo", "materias asignadas"], True, False),
            ("institucional_general", ["reglamento", "ets", "dictamen", "requisitos", "gestion escolar", "reinscribirme", "reinscribir", "inscribirme", "extraordinaria", "extraordinario", "saberes previos"], False, True),
        ]

        for intent, words, requires_db, requires_dataset in checks:
            if any(word in q for word in words):
                if intent in {"consulta_grupos_profesor", "lista_alumnos_grupo", "consulta_alumnos_reprobados", "consulta_calificaciones_grupo"} and not is_teacher:
                    continue
                if intent == "consulta_calificaciones" and is_teacher:
                    continue  # Profesores usan consulta_calificaciones_grupo, no el intent de alumno
                return result(intent, 0.82, requires_db, requires_dataset, infer_target(intent, is_teacher))

        if "horario" in q or "clase" in q:
            intent = "consulta_horario_profesor" if is_teacher else "consulta_horario"
            return result(intent, 0.84, True, False, infer_target(intent, is_teacher))

        # Fallback para profesores: preguntas sobre grupos sin keyword exacta (ej: "que grupos tengo")
        if is_teacher and any(kw in q for kw in ["grupos", "materias tengo", "materias que tengo"]):
            return result("consulta_grupos_profesor", 0.75, True, False, "teacher_groups")

        return result("institucional_general", 0.52, False, True, "institutional_knowledge")

    # ------------------------------------------------------------------
    # PLANNER MULTIAGENTE
    # ------------------------------------------------------------------
    def plan(self, capsule: dict[str, Any]) -> dict[str, Any]:
        question = str(capsule.get("question") or capsule.get("pregunta") or "").strip()
        roles = safe_str_list(capsule.get("roles"))
        conversation = safe_dict(capsule.get("conversation"))
        entities = safe_dict(conversation.get("entities"))
        local_intent = self._classify_locally(
            question,
            roles,
            {
                "previousIntent": conversation.get("previous_intent"),
                "previous_intent": conversation.get("previous_intent"),
                **entities,
            },
        )
        fallback = build_local_plan(question, roles, local_intent)

        # Intents conversacionales — Groq no aporta valor y puede sobreescribir incorrectamente
        if local_intent.get("intent") in {"saludo", "fuera_de_alcance"}:
            return fallback

        if not self.client:
            return fallback

        try:
            role_context = str(capsule.get("role_context", ""))
            catalogs = safe_dict(capsule.get("catalogs", {}))
            tools = safe_list(catalogs.get("tools", []))
            tool_names = [t.get("name") for t in tools if isinstance(t, dict) and t.get("name")]
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Eres PlannerAgent para el chatbot academico de SAES 2.0 en ESCOM. "
                        "Decide que agentes ejecutar segun la pregunta. Devuelve SOLO JSON valido.\n\n"
                        f"CONTEXTO DEL USUARIO: {role_context}\n\n"
                        "AGENTES DISPONIBLES Y SUS CAPACIDADES:\n"
                        "- database: Obtiene datos de la base de datos. Puede usar herramientas pre-construidas "
                        f"({', '.join(tool_names) if tool_names else 'ver catalogo'}) "
                        "O escribir SQL SELECT validado para consultas especificas como calcular promedios, "
                        "identificar alumnos reprobados, o combinar tablas. "
                        "Usar cuando el usuario pide datos dinamicos de su cuenta o grupos.\n"
                        "- regulation: Busca informacion en documentos institucionales (reglamento, ETS, "
                        "tramites, fechas academicas, normativa). Usar cuando el usuario pregunta sobre "
                        "procedimientos o reglas institucionales.\n"
                        "- responder: Sintetiza todos los datos y evidencia para generar la respuesta final. "
                        "Siempre debe estar en el plan.\n\n"
                        "REGLAS DE PLANEACION:\n"
                        "1. SALUDO/DESPEDIDA/CASUAL: intent='saludo' o 'fuera_de_alcance', agents=[responder].\n"
                        "2. DATOS DE BD (horario, calificaciones, grupos, alumnos, reprobados, perfil, kardex, bajas): "
                        "agents=[database, responder].\n"
                        "3. NORMATIVA (ETS, dictamen, tramites, reglamento, fechas): agents=[regulation, responder].\n"
                        "4. COMBINADO (tramites con requisitos BD + normativa): agents=[database, regulation, responder].\n"
                        "5. PROFESORES consultando calificaciones o alumnos reprobados de TODOS sus grupos: "
                        "agents=[database, responder] SIN needs_clarification — el agente database puede "
                        "agregar datos de todos los grupos via SQL.\n"
                        "6. AMBIGUO o referencia no resuelta: needs_clarification=true, agents=[responder].\n\n"
                        "Campos requeridos: intent, confidence, needs_clarification, clarification_question, "
                        "required_context, agents, safety_flags, response_strategy. "
                        f"Intents validos: {', '.join(sorted(INTENTS))}. "
                        "Agentes validos: database, regulation, responder. "
                        "Nunca propongas escritura de datos ni acceso a datos de otro usuario."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "capsula_contexto": compact_capsule_for_model(capsule),
                            "fallback_local": fallback,
                            "intents_permitidos": sorted(INTENTS),
                        },
                        ensure_ascii=False,
                    ),
                },
            ]
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=900,
                temperature=0,
                response_format={"type": "json_object"},
            )
            parsed = json.loads(response.choices[0].message.content or "{}")
            return normalize_planner_plan(parsed, fallback)
        except Exception as exc:
            print(f"[Groq plan error] {exc}")
            return fallback

    def database_plan(self, payload: dict[str, Any]) -> dict[str, Any]:
        context = safe_dict(payload.get("context"))
        roles = safe_str_list(context.get("roles"))
        catalogs = safe_dict(context.get("catalogs"))
        tools = safe_list(catalogs.get("tools"))
        database = safe_list(catalogs.get("database"))
        goal = str(payload.get("goal") or "").strip()
        inputs = safe_dict(payload.get("inputs"))
        question = str(context.get("question") or inputs.get("question") or "").strip()

        fallback = build_local_database_plan(question, roles, inputs, tools)
        if not self.client:
            return fallback

        try:
            role_context = str(context.get("role_context", ""))
            is_teacher = "profesor" in roles

            sql_guidance = (
                "\n\nGUIA SQL PARA PROFESOR:\n"
                "Cuando el profesor pregunta por calificaciones o alumnos reprobados, escribe SQL como:\n"
                "SELECT u.nombre, u.apellido_paterno, a.boleta, g.clave_grupo,\n"
                "  ROUND(SUM(c.calificacion * te.ponderacion / 100.0) / "
                "NULLIF(SUM(te.ponderacion / 100.0), 0), 2) AS promedio\n"
                "FROM inscripcion i\n"
                "JOIN alumno a ON i.id_alumno = a.id_alumno\n"
                "JOIN usuario u ON a.id_usuario = u.id_usuario\n"
                "JOIN grupo g ON i.id_grupo = g.id_grupo\n"
                "JOIN grupo_evaluacion ge ON i.id_grupo = ge.id_grupo\n"
                "JOIN tipo_evaluacion te ON ge.id_tipo_evaluacion = te.id_tipo_evaluacion\n"
                "JOIN calificacion c ON i.id_inscripcion = c.id_inscripcion "
                "AND c.id_grupo_evaluacion = ge.id_grupo_evaluacion\n"
                "WHERE g.id_profesor = (SELECT id_profesor FROM profesor WHERE id_usuario = :authUserId)\n"
                "AND (SELECT activo FROM periodo_academico WHERE id_periodo = g.id_periodo) = 1\n"
                "AND i.estatus = 'activa'\n"
                "GROUP BY a.id_alumno, a.boleta, u.nombre, u.apellido_paterno, g.clave_grupo\n"
                "HAVING promedio < 6.0 ORDER BY promedio ASC LIMIT 100\n"
                "Para un grupo especifico agrega: AND g.clave_grupo = 'CLAVE'.\n"
                "SEGURIDAD: el filtro g.id_profesor = (SELECT id_profesor FROM profesor WHERE id_usuario = :authUserId) "
                "es OBLIGATORIO cuando se consultan datos de alumnos.\n"
            ) if is_teacher else (
                "\n\nGUIA SQL PARA ALUMNO:\n"
                "Filtrar SIEMPRE por el alumno autenticado: "
                "WHERE a.id_usuario = :authUserId o equivalente via JOIN.\n"
            )

            messages = [
                {
                    "role": "system",
                    "content": (
                        f"Eres DatabaseAgent para SAES 2.0. Rol del usuario: {'PROFESOR' if is_teacher else 'ALUMNO'}.\n"
                        f"Contexto: {role_context}\n\n"
                        "Decide la mejor forma de obtener los datos solicitados:\n"
                        "1. HERRAMIENTA pre-construida: si existe una que responde exactamente la consulta, usala.\n"
                        "2. SQL SELECT validado: para consultas especificas como calcular promedios ponderados, "
                        "filtrar por condiciones (reprobados, calificaciones > X), o combinar varias tablas "
                        "de manera que ninguna herramienta pre-construida cubre. "
                        "Es preferible SQL preciso a herramienta inexacta o generar needs_clarification.\n"
                        "3. NONE: solo si la consulta es imposible, fuera de alcance o peligrosa.\n\n"
                        "REGLAS SQL OBLIGATORIAS: solo SELECT, sin comentarios (-- # /*), sin punto y coma, "
                        "sin UNION inseguro. Declarar tablas[] y columnas[]. Usar :authUserId para seguridad.\n"
                        "IMPORTANTE: En columns[], lista SOLO columnas reales de las tablas "
                        "(ej: ['nombre', 'apellido_paterno', 'boleta', 'clave_grupo', 'calificacion', 'ponderacion']). "
                        "NO incluir aliases calculados como 'promedio' — esos van solo en el SELECT.\n"
                        f"{sql_guidance}"
                        "Formatos de respuesta:\n"
                        "Herramienta: {\"type\":\"tool\", \"tool_name\":\"...\", \"args\":{}, \"purpose\":\"...\", \"expected_result\":\"...\"}\n"
                        "SQL: {\"type\":\"sql\", \"sql\":\"SELECT...\", \"params\":{}, \"tables\":[\"...\"], \"columns\":[\"...\"], \"purpose\":\"...\", \"expected_result\":\"...\"}\n"
                        "Sin datos: {\"type\":\"none\", \"reason\":\"...\"}\n"
                        "Devuelve SOLO JSON valido."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "goal": goal,
                            "inputs": inputs,
                            "question": question,
                            "roles": roles,
                            "tools": tools,
                            "semantic_database": database,
                            "fallback_local": fallback,
                        },
                        ensure_ascii=False,
                    ),
                },
            ]
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=720,
                temperature=0,
                response_format={"type": "json_object"},
            )
            parsed = json.loads(response.choices[0].message.content or "{}")
            return normalize_database_plan(parsed, tools) or fallback
        except Exception as exc:
            print(f"[Groq database-plan error] {exc}")
            return fallback

    def regulation_agent(self, payload: dict[str, Any]) -> dict[str, Any]:
        context = safe_dict(payload.get("context"))
        inputs = safe_dict(payload.get("inputs"))
        goal = str(payload.get("goal") or "").strip()
        question = str(context.get("question") or inputs.get("question") or goal).strip()
        intent = str(inputs.get("intent") or safe_dict(payload.get("plan")).get("intent") or "institucional_general")
        docs = self.retrieve_documents(question, intent, limit=3)
        return {
            "evidence": [
                {
                    "source": doc.id,
                    "title": doc.titulo,
                    "content": truncate(str(doc.contenido), 600),
                    "data": {"tema": doc.tema, "prioridad": doc.prioridad},
                }
                for doc in docs
            ]
        }

    def responder_agent(self, payload: dict[str, Any]) -> dict[str, Any]:
        plan = safe_dict(payload.get("plan"))
        context = safe_dict(payload.get("context"))
        question = str(payload.get("question") or context.get("question") or payload.get("pregunta") or "").strip()
        tool_results = safe_list(payload.get("tool_results"))
        evidence = safe_list(payload.get("evidence"))
        fallback = build_local_response(question, plan, tool_results, evidence)

        if not self.client:
            return fallback

        try:
            roles = safe_str_list(context.get("roles", []))
            role_context = str(context.get("role_context", ""))
            is_teacher = "profesor" in roles

            analysis_rules = (
                "ANALISIS PARA PROFESOR:\n"
                "- Si los datos contienen calificaciones (campos promedio, calificacion, promedioActual, "
                "o filas con columna 'promedio'): identifica y NOMBRA explicitamente a los alumnos con "
                "promedio < 6.0. Di 'Van reprobando: [nombres con su promedio]'.\n"
                "- Si los datos incluyen multiples grupos, organiza la respuesta por grupo: "
                "'En el grupo 1CM1 (Fund. de Prog.) van reprobando: ...'\n"
                "- Formula de promedio ponderado: Parcial1*30% + Parcial2*30% + Final*40%.\n"
                "- Si los datos son una lista de alumnos sin calificaciones, menciona cuantos hay.\n"
                "- NUNCA digas 'los datos estan en la tabla' ni 'consulte el sistema'. Analiza y sintetiza.\n"
            ) if is_teacher else (
                "ANALISIS PARA ALUMNO:\n"
                "- Habla siempre en segunda persona ('tu horario', 'tus calificaciones', 'tu promedio').\n"
                "- Si hay calificaciones, menciona el promedio si esta disponible y si va aprobando o reprobando.\n"
                "- Si el kardex muestra materias reprobadas, mencionalas brevemente.\n"
            )

            messages = [
                {
                    "role": "system",
                    "content": (
                        "Eres el asistente academico de ESCOM para SAES 2.0. "
                        "Devuelve SOLO JSON: reply, status, intent, confidence, data, suggested_actions.\n\n"
                        f"CONTEXTO: {role_context}\n\n"
                        f"{analysis_rules}\n"
                        "REGLAS GENERALES:\n"
                        "- NUNCA uses frases como 'Consulte los datos autorizados en SAES' ni 'encontre esta informacion'.\n"
                        "- Si hay tool_results con datos reales: ANALIZA los datos y escribe una respuesta especifica:\n"
                        "  * horario → menciona cuantas materias y los dias/horas clave.\n"
                        "  * calificaciones_grupo / reprobados → nombra alumnos con bajo promedio.\n"
                        "  * grupos_profesor → menciona cuantos grupos y sus materias.\n"
                        "  * lista_alumnos → menciona cuantos alumnos hay en el grupo.\n"
                        "  * kardex → menciona materias cursadas, aprobadas, reprobadas y promedio.\n"
                        "  * perfil → resume la informacion clave de perfil.\n"
                        "- Si hay evidence de reglamento: SINTETIZA en 2-4 oraciones propias. No copies texto literal.\n"
                        "- Para saludos (intent=saludo): saluda calidamente y describe brevemente lo que puedes hacer segun el rol.\n"
                        "- Para fuera_de_alcance: declina amablemente y sugiere temas disponibles de ESCOM.\n"
                        "- Si no hay datos ni evidencia: status='needs_clarification', pide mas detalle.\n"
                        "- Tono: amigable, directo, institucional.\n"
                        "- Nunca inventes datos academicos reales.\n"
                        "- status validos: 'answered', 'needs_clarification', 'no_data', 'error'.\n"
                        "- intent: usa el mismo del campo plan.intent recibido, no lo cambies."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "question": question,
                            "plan": plan,
                            "tool_results": compact_tool_results_for_responder(tool_results),
                            "evidence": evidence,
                        },
                        ensure_ascii=False,
                    ),
                },
            ]
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=2500,
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            parsed = json.loads(response.choices[0].message.content or "{}")
            return normalize_response(parsed, fallback)
        except Exception as exc:
            print(f"[Groq responder error] {exc}")
            return fallback

    # ------------------------------------------------------------------
    # RESPUESTA INSTITUCIONAL
    # ------------------------------------------------------------------
    def generate_response(
        self,
        pregunta: str,
        intent: str,
        roles: list[str] | None = None,
        contexto: dict[str, Any] | None = None,
        datos: Any | None = None,
    ) -> dict[str, Any]:
        docs = self.retrieve_documents(pregunta, intent)

        if self.client:
            try:
                messages = [
                    {
                        "role": "system",
                        "content": (
                            "Eres el asistente académico oficial de ESCOM para SAES 2.0. "
                            "Responde en español, con claridad y sin inventar. Usa solo los "
                            "fragmentos institucionales y datos reales entregados. Si falta "
                            "información, dilo y pide una aclaración breve."
                        ),
                    },
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "pregunta": pregunta,
                                "intent": intent,
                                "roles": roles or [],
                                "contexto": contexto or {},
                                "datos_reales": datos,
                                "fragmentos_institucionales": [doc.__dict__ for doc in docs],
                            },
                            ensure_ascii=False,
                        ),
                    },
                ]
                response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    max_tokens=420,
                    temperature=0.2,
                )
                reply = response.choices[0].message.content.strip()
                return {"reply": reply, "documents": [doc.id for doc in docs]}
            except Exception as exc:
                print(f"[Groq respond error] {exc}")

        return {"reply": self.fallback_response(intent, docs), "documents": [doc.id for doc in docs]}

    def retrieve_documents(self, pregunta: str, intent: str, limit: int = 3) -> list[KnowledgeDocument]:
        all_words = set(split_words(pregunta))
        q_words = all_words - STOP_WORDS_ES
        if not q_words:
            q_words = all_words
        # Expandir con sinónimos para variantes verbales y morfológicas
        expanded = set()
        for w in q_words:
            expanded.add(WORD_SYNONYMS.get(w, w))
        q_words = expanded

        intent_words = set(split_words(intent.replace("_", " "))) - STOP_WORDS_ES
        scored: list[tuple[float, KnowledgeDocument]] = []

        for doc in self.documents:
            # Capa 1 — señal primaria: título + palabras clave (peso ×8)
            title_kw_words = set(split_words(" ".join([doc.tema, doc.titulo, *doc.palabras_clave])))
            title_score = len(q_words & title_kw_words) * 8

            # Capa 2 — bonus exacto: palabra clave en el id del documento (10 pts por palabra)
            id_parts = set(doc.id.replace("_", " ").split())
            id_bonus = sum(10 for w in q_words if w in id_parts)

            # Capa 3 — señal secundaria: match en contenido (peso ×2, independiente de longitud)
            content_words = set(split_words(doc.contenido))
            content_score = len(q_words & content_words) * 2

            # Capa 4 — alineación con intent específico (excluye institucional_general por ser ruidoso)
            intent_score = 0
            if intent != "institucional_general":
                intent_score = len(intent_words & title_kw_words) * 3

            # Boosts por intent concreto
            boost = 0
            if intent == "baja_materias" and doc.tema in {"reinscripcion", "gestion"}:
                boost += 3
            if intent in {"estado_reinscripcion", "recomendacion_reinscripcion"} and doc.tema == "reinscripcion":
                boost += 4

            score = title_score + id_bonus + content_score + intent_score + boost
            if score > 0:
                scored.append((score, doc))

        scored.sort(key=lambda item: item[0], reverse=True)
        return [doc for _, doc in scored[:limit]]

    def fallback_response(self, intent: str, docs: list[KnowledgeDocument]) -> str:
        if intent == "fuera_de_alcance":
            return "Lo siento, solo puedo ayudarte con temas académicos de ESCOM y funciones del portal SAES 2.0."
        if docs:
            first = docs[0]
            return f"Según la información institucional disponible sobre {first.titulo}: {first.contenido}"
        fallback = self.dataset.get("no_entendido", ["No tengo suficiente información para responder eso."])
        return random.choice(fallback) if isinstance(fallback, list) else str(fallback)

    # Compatibilidad temporal con el flujo anterior.
    def responder(
        self,
        pregunta: str,
        boleta: str | None = None,
        contexto_previo: str = "",
        token: str = "",
    ) -> str:
        roles = ["alumno"]
        intent = self.classify_intent(pregunta, roles, {"contexto_previo": contexto_previo})
        response = self.generate_response(pregunta, intent["intent"], roles, {"boleta": bool(boleta)})
        return str(response["reply"])


def build_local_plan(question: str, roles: list[str], intent_result: dict[str, Any]) -> dict[str, Any]:
    intent = str(intent_result.get("intent") or "ambigua")

    if intent in {"saludo", "fuera_de_alcance"}:
        reply_hint = str(intent_result.get("target") or "")
        return {
            "intent": intent,
            "confidence": clamp_float(intent_result.get("confidence"), 0.0, 1.0, default=0.90),
            "needs_clarification": False,
            "clarification_question": None,
            "required_context": {
                "conversation_history": False,
                "student_profile": False,
                "database": False,
                "regulation": False,
            },
            "agents": [
                {
                    "name": "responder",
                    "goal": "Responder de forma conversacional.",
                    "inputs": {"intent": intent, "target": reply_hint},
                }
            ],
            "safety_flags": [],
            "response_strategy": "Respuesta conversacional directa sin consultar datos.",
        }

    # Confianza ≤ 0.55 = clasificación por defecto (ningún keyword coincidió).
    # En ese caso no activar agentes de datos; pedir aclaración directamente.
    local_conf = clamp_float(intent_result.get("confidence"), 0.0, 1.0, default=0.55)
    if intent == "institucional_general" and local_conf <= 0.55:
        return {
            "intent": "ambigua",
            "confidence": 0.45,
            "needs_clarification": True,
            "clarification_question": "No estoy seguro de entender tu pregunta. ¿Necesitas info de tu horario, calificaciones, kardex, reinscripcion, o algun tramite escolar en ESCOM?",
            "required_context": {"conversation_history": False, "student_profile": False, "database": False, "regulation": False},
            "agents": [{"name": "responder", "goal": "Pedir aclaracion al usuario.", "inputs": {"intent": "ambigua"}}],
            "safety_flags": [],
            "response_strategy": "Pedir aclaracion.",
        }

    needs_database = bool(intent_result.get("requires_database"))
    needs_regulation = bool(intent_result.get("requires_dataset")) or bool(
        re.search(r"\b(reglamento|ets|dictamen|baja|reinscripcion|gestion escolar)\b", normalize(question))
    )
    needs_clarification = bool(intent_result.get("requires_clarification"))

    agents: list[dict[str, Any]] = []
    if not needs_clarification and needs_database:
        agents.append(
            {
                "name": "database",
                "goal": f"Obtener datos academicos reales para {intent}.",
                "inputs": {"intent": intent, "question": question},
            }
        )
    if not needs_clarification and needs_regulation:
        agents.append(
            {
                "name": "regulation",
                "goal": f"Recuperar evidencia institucional para {intent}.",
                "inputs": {"intent": intent, "question": question},
            }
        )
    agents.append(
        {
            "name": "responder",
            "goal": "Redactar respuesta final usando solo datos y evidencia recolectados.",
            "inputs": {"intent": intent},
        }
    )

    safety_flags = []
    if re.search(r"\b\d{10}\b", question):
        safety_flags.append("user_supplied_identifier_ignored")
    if re.search(r"\b(drop|delete|update|insert|alter|truncate)\b", normalize(question)):
        safety_flags.append("requested_mutating_sql")

    return {
        "intent": intent,
        "confidence": clamp_float(intent_result.get("confidence"), 0.0, 1.0, default=0.55),
        "needs_clarification": needs_clarification,
        "clarification_question": intent_result.get("clarifying_question"),
        "required_context": {
            "conversation_history": bool(re.search(r"\b(esa|ese|eso|anterior|grupo)\b", normalize(question))),
            "student_profile": "alumno" in roles and needs_database,
            "database": needs_database,
            "regulation": needs_regulation,
        },
        "agents": agents,
        "safety_flags": safety_flags,
        "response_strategy": "Planear primero, ejecutar herramientas seguras en Node y responder con evidencia disponible.",
    }


def normalize_planner_plan(raw: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    required = safe_dict(raw.get("required_context"))
    agents = [step for step in (normalize_agent_step(value) for value in safe_list(raw.get("agents"))) if step]

    if fallback.get("intent") in {"saludo", "fuera_de_alcance"}:
        return fallback

    if fallback.get("intent") in {"consulta_horario", "consulta_horario_profesor"} and raw.get("intent") == "institucional_general":
        return fallback

    if not agents and not bool(raw.get("needs_clarification")):
        agents = safe_list(fallback.get("agents"))

    return {
        "intent": str(raw.get("intent") or fallback.get("intent") or "ambigua")[:80],
        "confidence": clamp_float(raw.get("confidence"), 0.0, 1.0, default=float(fallback.get("confidence") or 0.6)),
        "needs_clarification": bool(raw.get("needs_clarification", fallback.get("needs_clarification", False))),
        "clarification_question": raw.get("clarification_question") or fallback.get("clarification_question"),
        "required_context": {
            "conversation_history": bool(required.get("conversation_history", safe_dict(fallback.get("required_context")).get("conversation_history", False))),
            "student_profile": bool(required.get("student_profile", safe_dict(fallback.get("required_context")).get("student_profile", False))),
            "database": bool(required.get("database", safe_dict(fallback.get("required_context")).get("database", False))),
            "regulation": bool(required.get("regulation", safe_dict(fallback.get("required_context")).get("regulation", False))),
        },
        "agents": agents,
        "safety_flags": [str(flag) for flag in safe_list(raw.get("safety_flags"))],
        "response_strategy": str(raw.get("response_strategy") or fallback.get("response_strategy") or "Responder con datos disponibles."),
    }


def normalize_agent_step(value: Any) -> dict[str, Any] | None:
    item = safe_dict(value)
    name = str(item.get("name") or "")
    if name not in {"database", "regulation", "responder"}:
        return None
    return {
        "name": name,
        "goal": str(item.get("goal") or "Ejecutar agente especializado."),
        "inputs": safe_dict(item.get("inputs")),
    }


def build_local_database_plan(
    question: str,
    roles: list[str],
    inputs: dict[str, Any],
    tools: list[Any],
) -> dict[str, Any]:
    tool_names = {
        str(tool.get("name"))
        for tool in tools
        if isinstance(tool, dict) and tool.get("name")
    }
    intent = str(inputs.get("intent") or "")
    tool_name = infer_tool_name(question, intent, roles)
    if not tool_name or (tool_names and tool_name not in tool_names):
        return {"type": "none", "reason": "No hay herramienta backend clara o permitida para esta solicitud."}

    group_key = extract_group_key(question) or str(inputs.get("group_key") or inputs.get("grupo") or "").strip()
    day = extract_day(question) or str(inputs.get("day") or inputs.get("dia") or "").strip()
    args = {
        **({"group_key": group_key} if group_key else {}),
        **({"day": day} if day else {}),
    }
    return {
        "type": "tool",
        "tool_name": tool_name,
        "args": args,
        "purpose": f"Consultar datos autorizados para {intent or question}.",
        "expected_result": "Datos estructurados obtenidos por una funcion existente del backend.",
    }


def normalize_database_plan(raw: dict[str, Any], tools: list[Any]) -> dict[str, Any] | None:
    item = safe_dict(raw)
    plan_type = str(item.get("type") or "")
    tool_names = {
        str(tool.get("name"))
        for tool in tools
        if isinstance(tool, dict) and tool.get("name")
    }

    if plan_type == "tool":
        tool_name = str(item.get("tool_name") or "")
        if tool_names and tool_name not in tool_names:
            return None
        return {
            "type": "tool",
            "tool_name": tool_name,
            "args": safe_dict(item.get("args")),
            "purpose": str(item.get("purpose") or "Consultar herramienta backend."),
            "expected_result": str(item.get("expected_result") or "Datos estructurados."),
        }

    if plan_type == "sql":
        sql = str(item.get("sql") or "").strip()
        if not sql.lower().startswith("select"):
            return None
        return {
            "type": "sql",
            "sql": sql,
            "params": safe_dict(item.get("params")),
            "tables": [str(value) for value in safe_list(item.get("tables"))],
            "columns": [str(value) for value in safe_list(item.get("columns"))],
            "purpose": str(item.get("purpose") or "Consulta SQL validada."),
            "expected_result": str(item.get("expected_result") or "Filas de datos."),
        }

    if plan_type == "none":
        return {"type": "none", "reason": str(item.get("reason") or "Sin consulta de datos.")}
    return None


def build_local_response(
    question: str,
    plan: dict[str, Any],
    tool_results: list[Any],
    evidence: list[Any],
) -> dict[str, Any]:
    intent = str(plan.get("intent") or "ambigua")
    confidence = clamp_float(plan.get("confidence"), 0.0, 1.0, default=0.6)

    if intent == "saludo":
        greetings = [
            "¡Hola! Soy el asistente de ESCOM. Puedo ayudarte con tu horario, calificaciones, kardex, reinscripción y trámites escolares. ¿En qué te puedo ayudar?",
            "¡Buen día! ¿En qué puedo ayudarte hoy? Pregúntame sobre tus materias, horario o cualquier trámite escolar.",
            "¡Hola! Estoy aquí para apoyarte. Puedes consultarme sobre tu situación académica en SAES.",
        ]
        return {
            "reply": random.choice(greetings),
            "status": "answered",
            "intent": intent,
            "confidence": confidence,
            "suggested_actions": [],
        }

    if intent == "fuera_de_alcance":
        agents = safe_list(plan.get("agents"))
        target = str(safe_dict(agents[0]).get("inputs", {}).get("target", "") if agents else "")
        if "despedida" in target:
            closings = [
                "¡Hasta luego! Espero haberte ayudado. ¡Éxito en tus estudios!",
                "¡Fue un placer! Recuerda que puedes consultarme cuando necesites información académica.",
                "¡Hasta pronto! No dudes en preguntar si tienes alguna duda más.",
            ]
            return {
                "reply": random.choice(closings),
                "status": "answered",
                "intent": intent,
                "confidence": confidence,
                "suggested_actions": [],
            }
        return {
            "reply": "Ese tema está fuera de mis especialidades. Puedo ayudarte con tu horario, calificaciones, kardex, reinscripción, bajas y trámites escolares de ESCOM. ¿En qué te puedo apoyar?",
            "status": "no_data",
            "intent": intent,
            "confidence": confidence,
            "suggested_actions": [],
        }

    if bool(plan.get("needs_clarification")):
        return {
            "reply": str(plan.get("clarification_question") or "Necesito un poco mas de informacion para ayudarte."),
            "status": "needs_clarification",
            "intent": intent,
            "confidence": confidence,
            "suggested_actions": [],
        }

    data = structured_data_from_tool_results(tool_results)
    tool_message = first_tool_message(tool_results)
    empty_table = isinstance(data, dict) and data.get("type") == "table" and not data.get("rows")

    if tool_message:
        return {
            "reply": tool_message,
            "status": "needs_clarification" if "necesit" in normalize(tool_message) else "answered",
            "intent": intent,
            "confidence": confidence,
            "data": data,
            "suggested_actions": suggested_actions_for_intent(intent),
        }

    if data:
        reply = _empty_reply_for_intent(intent) if empty_table else _data_reply_for_intent(intent, data)
        return {
            "reply": reply,
            "status": "no_data" if empty_table else "answered",
            "intent": intent,
            "confidence": confidence,
            "data": data,
            "suggested_actions": suggested_actions_for_intent(intent),
        }

    if evidence:
        first = safe_dict(evidence[0])
        title = str(first.get("title") or "informacion institucional")
        content = str(first.get("content") or "").strip()
        if content:
            sentences = [s.strip() for s in re.split(r"[.!?\n]", content) if len(s.strip()) > 30]
            brief = ". ".join(sentences[:2]).strip()
            if brief and not brief.endswith("."):
                brief += "."
            reply = f"Sobre {title.lower()}: {brief}"
            if len(evidence) > 1:
                otros = str(safe_dict(evidence[1]).get("title") or "temas relacionados")
                reply += f" Tambien encontre informacion sobre {otros}. ¿Quieres que profundice en algo especifico?"
        else:
            reply = f"Encontre informacion sobre {title}, pero necesito que me des mas detalles sobre que quieres saber exactamente."
        return {
            "reply": reply,
            "status": "answered" if content else "needs_clarification",
            "intent": intent,
            "confidence": confidence,
            "suggested_actions": suggested_actions_for_intent(intent),
        }

    # Intents que dependen de calificaciones: mensaje específico cuando no hay datos
    GRADE_INTENTS = {"consulta_alumnos_reprobados", "consulta_calificaciones_grupo"}
    if intent in GRADE_INTENTS:
        if tool_results:
            reply = "No hay calificaciones capturadas aún en tus grupos para el periodo activo. Una vez que se registren las calificaciones parciales o finales, podrás ver esta información."
        else:
            reply = "No pude calcular los promedios de tus alumnos en este momento. Verifica que haya calificaciones registradas en el periodo activo e intenta de nuevo."
        return {
            "reply": reply,
            "status": "no_data",
            "intent": intent,
            "confidence": confidence,
            "suggested_actions": suggested_actions_for_intent(intent),
        }

    return {
        "reply": "No tengo suficiente informacion confiable para responder eso. Puedes darme mas detalle del tramite o dato que necesitas?",
        "status": "no_data",
        "intent": intent,
        "confidence": confidence,
        "suggested_actions": [],
    }


def _empty_reply_for_intent(intent: str) -> str:
    messages = {
        "consulta_alumnos_reprobados": "En este momento no hay alumnos con promedio reprobatorio en tus grupos del periodo activo.",
        "consulta_calificaciones_grupo": "Aun no hay calificaciones registradas para ese grupo en este periodo.",
        "lista_alumnos_grupo": "No hay alumnos inscritos activos en ese grupo.",
        "consulta_horario": "No encontre clases registradas para ese dia en tu horario actual.",
        "consulta_horario_profesor": "No encontre clases para ese dia en tu horario del periodo activo.",
    }
    return messages.get(intent, "No encontre datos para esa consulta.")


def _data_reply_for_intent(intent: str, data: dict[str, Any]) -> str:
    if "horario" in intent:
        rows = data.get("rows", [])
        if rows:
            dias = sorted({row.get("Dia", "") for row in rows if row.get("Dia")})
            n = len(rows)
            dias_txt = ", ".join(dias) if dias else "varios dias"
            return f"Tienes {n} sesion(es) de clase en los siguientes dias: {dias_txt}."
    if intent in {"consulta_grupos_profesor", "consulta_grupos_profesor"}:
        items = data.get("items", [])
        return f"Tienes {len(items)} grupo(s) asignado(s) en este periodo."
    if intent == "lista_alumnos_grupo":
        rows = data.get("rows", []) or data.get("items", [])
        return f"El grupo tiene {len(rows)} alumno(s) inscrito(s)."
    if intent in {"consulta_alumnos_reprobados", "consulta_calificaciones_grupo"}:
        rows = data.get("rows", [])
        return f"Se encontraron {len(rows)} alumno(s) con calificaciones registradas."
    if intent == "consulta_kardex":
        items = data.get("items", []) or data.get("rows", [])
        return f"Tu kardex tiene {len(items)} registro(s) academico(s)."
    return "Aqui tienes la informacion academica solicitada."


def normalize_response(raw: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    item = safe_dict(raw)
    if not item.get("reply"):
        return fallback
    status = str(item.get("status") or fallback.get("status") or "answered")
    if status not in {"answered", "needs_clarification", "no_data", "error"}:
        status = "answered"
    return {
        "reply": str(item.get("reply")),
        "status": status,
        "intent": str(fallback.get("intent") or item.get("intent") or "ambigua"),
        "confidence": clamp_float(item.get("confidence"), 0.0, 1.0, default=float(fallback.get("confidence") or 0.6)),
        "data": item.get("data") if isinstance(item.get("data"), dict) else fallback.get("data"),
        "suggested_actions": safe_list(item.get("suggested_actions")) or safe_list(fallback.get("suggested_actions")),
    }


def compact_tool_results_for_responder(tool_results: list[Any]) -> list[Any]:
    compacted = []
    for tr in tool_results:
        item = safe_dict(tr)
        data = item.get("data")
        if isinstance(data, dict):
            compact_data: dict[str, Any] = {}
            for key, value in data.items():
                if isinstance(value, list):
                    compact_data[key] = value[:20]
                elif isinstance(value, dict) and len(str(value)) > 500:
                    compact_data[key] = dict(list(value.items())[:10])
                else:
                    compact_data[key] = value
            data = compact_data
        elif isinstance(data, list):
            data = data[:20]
        compacted.append({
            "source": item.get("source"),
            "name": item.get("name"),
            "purpose": item.get("purpose"),
            "data": data,
        })
    return compacted


def structured_data_from_tool_results(tool_results: list[Any]) -> dict[str, Any] | None:
    if not tool_results:
        return None
    first = safe_dict(tool_results[0])
    name = str(first.get("name") or "")
    data = first.get("data")

    # Teacher schedule: usa "horarios" (aplanado) en lugar de "horario" (alumno)
    if isinstance(data, dict) and isinstance(data.get("horarios"), list) and data.get("horarios"):
        rows = [
            {
                "Grupo": slot.get("claveGrupo") or slot.get("clave_grupo", ""),
                "Materia": slot.get("nombreMateria") or slot.get("nombre_materia", ""),
                "Dia": slot.get("dia") or slot.get("diaGrupo", ""),
                "Hora": f"{slot.get('horaInicio') or slot.get('hora_inicio', '')} - {slot.get('horaFin') or slot.get('hora_fin', '')}",
                "Aula": slot.get("nombreAula") or slot.get("nombre_aula", ""),
            }
            for slot in data["horarios"]
            if isinstance(slot, dict)
        ]
        if rows:
            return {"type": "table", "columns": ["Grupo", "Materia", "Dia", "Hora", "Aula"], "rows": rows}

    if isinstance(data, dict) and isinstance(data.get("horario"), list):
        rows = [
            {
                "Materia": slot.get("nombre_materia") or slot.get("nombreMateria"),
                "Grupo": slot.get("clave_grupo") or slot.get("claveGrupo"),
                "Profesor": " ".join(
                    str(slot.get(key) or "")
                    for key in ["nombre_profesor", "apellido_paterno_profesor", "apellido_materno_profesor"]
                ).strip(),
                "Dia": slot.get("dia_semana") or slot.get("dia"),
                "Hora": f"{slot.get('hora_inicio') or ''} - {slot.get('hora_fin') or ''}".strip(),
                "Aula": slot.get("nombre_aula") or slot.get("aula"),
            }
            for slot in data.get("horario")
            if isinstance(slot, dict)
        ]
        return {"type": "table", "columns": ["Materia", "Grupo", "Profesor", "Dia", "Hora", "Aula"], "rows": rows}

    if isinstance(data, dict) and isinstance(data.get("grupos"), list):
        items = [compact_record(group) for group in data.get("grupos")[:8] if isinstance(group, dict)]
        return {"type": "cards", "items": items}

    if isinstance(data, dict) and isinstance(data.get("students"), list):
        rows = [compact_record(student) for student in data.get("students")[:40] if isinstance(student, dict)]
        columns = list(rows[0].keys()) if rows else []
        return {"type": "table", "columns": columns, "rows": rows}

    if isinstance(data, list):
        rows = [compact_record(row) for row in data[:40] if isinstance(row, dict)]
        columns = list(rows[0].keys()) if rows else []
        return {"type": "table", "columns": columns, "rows": rows} if rows else None

    if isinstance(data, dict):
        if data.get("needs_clarification"):
            groups = data.get("groups")
            if isinstance(groups, list):
                return {"type": "cards", "items": [compact_record(group) for group in groups if isinstance(group, dict)]}
        return {
            "type": "summary",
            "items": [{"label": key, "value": stringify(value)} for key, value in list(data.items())[:12]],
        }

    return None


def first_tool_message(tool_results: list[Any]) -> str | None:
    for result in tool_results:
        data = safe_dict(safe_dict(result).get("data"))
        message = data.get("message") or data.get("mensaje")
        if message:
            return str(message)
    return None


def compact_capsule_for_model(capsule: dict[str, Any]) -> dict[str, Any]:
    context = safe_dict(capsule.get("conversation"))
    history = safe_list(context.get("history"))[-8:]
    catalogs = safe_dict(capsule.get("catalogs"))
    return {
        "question": capsule.get("question"),
        "roles": safe_str_list(capsule.get("roles")),
        "role_context": capsule.get("role_context", ""),
        "user_context": capsule.get("user_context"),
        "conversation": {
            "summary": context.get("summary"),
            "entities": context.get("entities"),
            "previous_intent": context.get("previous_intent"),
            "history": history,
        },
        "catalogs": {
            "tools": catalogs.get("tools"),
            "database": catalogs.get("database"),
            "regulations": catalogs.get("regulations"),
        },
    }


def infer_tool_name(question: str, intent: str, roles: list[str]) -> str | None:
    text = normalize(f"{question} {intent}")
    is_teacher = "profesor" in roles
    if looks_like_schedule_lookup(text):
        return "teacher.schedule" if is_teacher else "student.schedule"
    # Intents de calificaciones/reprobados: devolver None para que el LLM escriba SQL
    if intent in {"consulta_alumnos_reprobados", "consulta_calificaciones_grupo"}:
        return None
    # Verificar keywords de reprobados ANTES del match generico de 'alumno'
    if is_teacher and any(word in text for word in ["reprobando", "reprobado", "reprobados", "reprobar", "reprueba", "vanmal"]):
        return None
    if is_teacher and any(word in text for word in ["alumno", "lista", "inscrito"]):
        return "teacher.group_students"
    if is_teacher and "grupo" in text:
        return "teacher.groups"
    if is_teacher and "horario" in text:
        return "teacher.schedule"
    if "kardex" in text or "historial" in text:
        return "student.kardex"
    if is_teacher and ("calificacion" in text or "parcial" in text):
        return None  # Profesor: dejar al LLM escribir SQL para calificaciones
    if "calificacion" in text or "parcial" in text:
        return "student.grades"
    if "promedio" in text or "avance" in text:
        return "student.kardex"
    if "cita" in text or "estado_reinscripcion" in text:
        return "student.reenrollment_status"
    if "reinscripcion" in text or "meter" in text or "inscribir" in text or "recomendacion" in text:
        return "student.reenrollment_eligibility"
    if "baja" in text or "quitar" in text:
        return "student.withdrawals_status"
    if "perfil" in text or "datos" in text or "boleta" in text or "empleado" in text:
        return "teacher.profile" if is_teacher else "student.profile"
    if "horario" in text or "clase" in text:
        return "student.schedule"
    return None


def suggested_actions_for_intent(intent: str) -> list[dict[str, Any]]:
    text = normalize(intent)
    if "horario" in text:
        return [{"label": "Ver horario", "action": "navigate", "target": "/schedule"}]
    if "kardex" in text or "promedio" in text:
        return [{"label": "Ver kardex", "action": "navigate", "target": "/kardex"}]
    if "calificacion" in text:
        return [{"label": "Ver calificaciones", "action": "navigate", "target": "/grades"}]
    if "reinscripcion" in text:
        return [{"label": "Ir a reinscripcion", "action": "navigate", "target": "/reenrollment"}]
    if "baja" in text:
        return [{"label": "Ir a bajas", "action": "navigate", "target": "/withdrawals"}]
    return []


def extract_group_key(value: str) -> str | None:
    match = re.search(r"\b\d[A-Z]{2}\d\b", value, flags=re.IGNORECASE)
    return match.group(0).upper() if match else None


def extract_day(value: str) -> str | None:
    text = normalize(value)
    for day in ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]:
        if day in text:
            return day
    return None


def looks_like_schedule_lookup(value: str) -> bool:
    text = normalize(value)
    has_day = extract_day(text) is not None or "hoy" in text or "manana" in text
    has_schedule_term = any(
        word in text
        for word in ["horario", "clase", "clases", "materia", "materias", "profesor", "profesores", "docente", "docentes", "aula", "salon"]
    )
    has_personal_verb = any(word in text for word in ["tengo", "tendre", "me toca", "llevo", "voy"])
    return has_day and (has_schedule_term or has_personal_verb)


def compact_record(record: dict[str, Any]) -> dict[str, Any]:
    return {str(key): stringify(value) for key, value in list(record.items())[:12]}


def stringify(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (str, int, float, bool)):
        return str(value)
    return json.dumps(value, ensure_ascii=False)


def truncate(value: str, limit: int) -> str:
    clean = re.sub(r"\s+", " ", value).strip()
    if len(clean) <= limit:
        return clean
    return clean[: limit - 3].rstrip() + "..."


def safe_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def safe_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def safe_str_list(value: Any) -> list[str]:
    return [str(item) for item in safe_list(value)]


def clamp_float(value: Any, minimum: float, maximum: float, default: float) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        parsed = default
    return max(minimum, min(maximum, parsed))


def result(intent: str, confidence: float, requires_db: bool, requires_dataset: bool, target: str) -> dict[str, Any]:
    return {
        "intent": intent,
        "confidence": confidence,
        "requires_database": requires_db,
        "requires_dataset": requires_dataset,
        "requires_clarification": False,
        "missing_fields": [],
        "target": target,
    }


def ambiguous(question: str) -> dict[str, Any]:
    return {
        "intent": "ambigua",
        "confidence": 0.45,
        "requires_database": False,
        "requires_dataset": False,
        "requires_clarification": True,
        "missing_fields": ["tipo_de_consulta"],
        "target": "clarification",
        "clarifying_question": question,
    }


def normalize_intent(raw: dict[str, Any]) -> dict[str, Any] | None:
    intent = raw.get("intent")
    if intent not in INTENTS:
        return None
    return {
        "intent": intent,
        "confidence": max(0, min(1, float(raw.get("confidence", 0.6)))),
        "requires_database": bool(raw.get("requires_database", False)),
        "requires_dataset": bool(raw.get("requires_dataset", False)),
        "requires_clarification": bool(raw.get("requires_clarification", False)),
        "missing_fields": list(raw.get("missing_fields") or []),
        "target": raw.get("target"),
        "clarifying_question": raw.get("clarifying_question"),
    }


def infer_target(intent: str, is_teacher: bool) -> str:
    targets = {
        "consulta_horario": "student_schedule",
        "consulta_horario_profesor": "teacher_schedule",
        "consulta_kardex": "student_kardex",
        "consulta_calificaciones": "student_grades",
        "consulta_promedio": "student_kardex_summary",
        "estado_reinscripcion": "reenrollment_status",
        "recomendacion_reinscripcion": "reenrollment_eligibility",
        "baja_materias": "withdrawals_status",
        "consulta_perfil": "teacher_profile" if is_teacher else "student_profile",
        "consulta_grupos_profesor": "teacher_groups",
        "lista_alumnos_grupo": "teacher_group_students",
        "consulta_alumnos_reprobados": "teacher_failing_students",
        "consulta_calificaciones_grupo": "teacher_group_grades",
        "institucional_general": "institutional_knowledge",
    }
    return targets.get(intent, "clarification")


def split_words(value: str) -> list[str]:
    return [word for word in normalize(value).split(" ") if len(word) > 2]


def normalize(value: str) -> str:
    replacements = str.maketrans("áéíóúüñ", "aeiouun")
    return re.sub(r"\s+", " ", value.lower().translate(replacements).strip())


def humanize(value: str) -> str:
    return value.replace("_", " ").strip().capitalize()

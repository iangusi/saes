import json
import os
import random
import re
from dataclasses import dataclass
from typing import Any

from dotenv import load_dotenv
from groq import Groq

load_dotenv()


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
    "institucional_general",
    "ambigua",
    "fuera_de_alcance",
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

        if not self.client:
            return local

        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Clasifica preguntas del portal SAES 2.0. Responde solo JSON valido con: "
                        "intent, confidence, requires_database, requires_dataset, requires_clarification, "
                        "missing_fields, target, clarifying_question. Intents permitidos: "
                        f"{', '.join(sorted(INTENTS))}."
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
                max_tokens=220,
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

        if any(word in q for word in ["chiste", "receta", "futbol", "politica", "bitcoin", "clima"]):
            return result("fuera_de_alcance", 0.86, False, False, "out_of_scope")

        if looks_like_schedule_lookup(q):
            intent = "consulta_horario_profesor" if is_teacher else "consulta_horario"
            return result(intent, 0.88, True, False, infer_target(intent, is_teacher))

        previous_intent = str(contexto.get("previousIntent") or contexto.get("previous_intent") or "")
        if previous_intent and any(word in q for word in ["esa", "ese", "eso", "baja", "quitar"]):
            if "baja" in q or "quitar" in q:
                return result("baja_materias", 0.76, True, True, "withdrawals_status")

        checks = [
            ("consulta_promedio", ["promedio", "avance"], True, False),
            ("consulta_kardex", ["kardex", "historial academico"], True, False),
            ("consulta_calificaciones", ["calificacion", "calificaciones", "parcial"], True, False),
            ("estado_reinscripcion", ["cita", "estado de reinscripcion", "puedo reinscribirme"], True, True),
            ("recomendacion_reinscripcion", ["materias puedo meter", "materias puedo inscribir", "recomienda"], True, True),
            ("baja_materias", ["baja", "dar de baja", "quitar materia"], True, True),
            ("consulta_perfil", ["perfil", "mis datos", "mi informacion", "correo", "boleta", "numero de empleado"], True, False),
            ("lista_alumnos_grupo", ["alumnos", "lista", "inscritos"], True, False),
            ("consulta_grupos_profesor", ["mis grupos", "grupos asignados", "cupo"], True, False),
            ("institucional_general", ["reglamento", "ets", "dictamen", "requisitos", "gestion escolar"], False, True),
        ]

        for intent, words, requires_db, requires_dataset in checks:
            if any(word in q for word in words):
                if intent in {"consulta_grupos_profesor", "lista_alumnos_grupo"} and not is_teacher:
                    continue
                return result(intent, 0.82, requires_db, requires_dataset, infer_target(intent, is_teacher))

        if "horario" in q or "clase" in q:
            intent = "consulta_horario_profesor" if is_teacher else "consulta_horario"
            return result(intent, 0.84, True, False, infer_target(intent, is_teacher))

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

        if not self.client:
            return fallback

        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Eres PlannerAgent para un chatbot academico SAES. No respondas al alumno. "
                        "Devuelve solo JSON valido con: intent, confidence, needs_clarification, "
                        "clarification_question, required_context, agents, safety_flags, response_strategy. "
                        "Los agentes validos son database, regulation y responder. Pide aclaracion si la "
                        "pregunta depende de una referencia no resuelta. Prefiere herramientas del catalogo; "
                        "nunca propongas acciones de escritura ni consultar datos de otra persona."
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
                max_tokens=650,
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
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Eres DatabaseAgent para SAES. Devuelve solo JSON. Decide si usar una herramienta "
                        "existente o SQL SELECT validado. Formatos validos: "
                        "{type:'tool', tool_name, args, purpose, expected_result}, "
                        "{type:'sql', sql, params, tables, columns, purpose, expected_result}, "
                        "o {type:'none', reason}. Prefiere herramientas. Si usas SQL, debe ser SELECT, "
                        "sin comentarios ni punto y coma, con tablas/columnas declaradas y filtro por "
                        "usuario autenticado cuando haya datos personales usando :authUserId."
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
                max_tokens=520,
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
        docs = self.retrieve_documents(f"{question} {goal}", intent, limit=5)
        return {
            "evidence": [
                {
                    "source": doc.id,
                    "title": doc.titulo,
                    "content": truncate(str(doc.contenido), 1200),
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
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Eres ResponderAgent de SAES. Devuelve solo JSON compatible con el frontend: "
                        "reply, status, intent, confidence, data, suggested_actions. Responde en espanol. "
                        "Usa solo tool_results y evidence entregados; no inventes datos academicos. "
                        "Si falta evidencia o datos, dilo claramente y usa status no_data o needs_clarification."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "question": question,
                            "plan": plan,
                            "tool_results": tool_results,
                            "evidence": evidence,
                            "fallback_local": fallback,
                        },
                        ensure_ascii=False,
                    ),
                },
            ]
            response = self.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=620,
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

    def retrieve_documents(self, pregunta: str, intent: str, limit: int = 4) -> list[KnowledgeDocument]:
        q_words = set(split_words(pregunta))
        intent_words = set(split_words(intent.replace("_", " ")))
        scored: list[tuple[int, KnowledgeDocument]] = []

        for doc in self.documents:
            doc_words = set(split_words(" ".join([doc.tema, doc.titulo, doc.contenido, *doc.palabras_clave])))
            score = len(q_words & doc_words) * 3 + len(intent_words & doc_words)
            if intent == "baja_materias" and doc.tema in {"reinscripcion", "gestion"}:
                score += 3
            if intent in {"estado_reinscripcion", "recomendacion_reinscripcion"} and doc.tema == "reinscripcion":
                score += 4
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
        return {
            "reply": "No encontre clases registradas para ese dia en tu horario actual." if empty_table else "Consulte los datos autorizados en SAES y encontre esta informacion.",
            "status": "no_data" if empty_table else "answered",
            "intent": intent,
            "confidence": confidence,
            "data": data,
            "suggested_actions": suggested_actions_for_intent(intent),
        }

    if evidence:
        first = safe_dict(evidence[0])
        title = str(first.get("title") or "la informacion institucional disponible")
        content = str(first.get("content") or "").strip()
        reply = f"Con base en {title}: {truncate(content, 650)}" if content else "Encontre evidencia institucional relacionada, pero necesito mas detalle para darte una respuesta precisa."
        return {
            "reply": reply,
            "status": "answered" if content else "needs_clarification",
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
        "intent": str(item.get("intent") or fallback.get("intent") or "ambigua"),
        "confidence": clamp_float(item.get("confidence"), 0.0, 1.0, default=float(fallback.get("confidence") or 0.6)),
        "data": item.get("data") if isinstance(item.get("data"), dict) else fallback.get("data"),
        "suggested_actions": safe_list(item.get("suggested_actions")) or safe_list(fallback.get("suggested_actions")),
    }


def structured_data_from_tool_results(tool_results: list[Any]) -> dict[str, Any] | None:
    if not tool_results:
        return None
    first = safe_dict(tool_results[0])
    name = str(first.get("name") or "")
    data = first.get("data")

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
    if is_teacher and any(word in text for word in ["alumno", "lista", "inscrito"]):
        return "teacher.group_students"
    if is_teacher and "grupo" in text:
        return "teacher.groups"
    if is_teacher and "horario" in text:
        return "teacher.schedule"
    if "kardex" in text or "historial" in text:
        return "student.kardex"
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

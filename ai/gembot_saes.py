import os
import json
import random
import requests
import base64
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class ChatbotESCOM:

    def __init__(self, dataset_path: str):
        self.dataset = self._cargar_dataset(dataset_path)
        self.dataset_str = json.dumps(self.dataset, ensure_ascii=False)
        self.client = None
        self.model = self._inicializar_groq()

    def _cargar_dataset(self, path: str) -> dict:
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            raise ValueError(f"Error cargando dataset: {e}")

    def _inicializar_groq(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("[WARN] GROQ_API_KEY no encontrada en .env")
            return None
        self.client = Groq(api_key=api_key)
        return True

    def _obtener_rol(self, token: str) -> str:
        """Decodifica el JWT y devuelve el rol del usuario."""
        try:
            payload_b64 = token.split(".")[1]
            padding = 4 - len(payload_b64) % 4
            if padding != 4:
                payload_b64 += "=" * padding
            payload = json.loads(base64.b64decode(payload_b64).decode("utf-8"))
            roles = payload.get("roles", [])
            if "profesor" in roles:
                return "profesor"
            if "alumno" in roles:
                return "alumno"
        except Exception as e:
            print(f"[JWT error] {e}")
        return "alumno"

    def _system_prompt(self) -> str:
        return f"""Eres un asistente virtual académico oficial de ESCOM \
(Escuela Superior de Cómputo del Instituto Politécnico Nacional).

Tu única fuente de verdad es la siguiente base de conocimiento institucional en JSON:

{self.dataset_str}

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE sobre los temas cubiertos en ese JSON: reglamento escolar, \
inscripción, reinscripción, responsabilidades de profesores, gestión escolar y \
funciones del portal SAES 2.0.
2. Si la pregunta está fuera de esos temas (política, matemáticas, tecnología en \
general, etc.), responde: "Lo siento, solo puedo ayudarte con temas académicos de \
ESCOM como reglamento, inscripciones, reinscripciones y gestión escolar."
3. Para datos personales que NO hayas recibido como contexto, indica que puede \
consultarlos en las secciones del portal SAES. NO inventes datos numéricos.
4. Responde siempre en español, de forma clara, amable y profesional.
5. Si el JSON tiene la información exacta, úsala o parafraséala fielmente.
6. Sé conciso: respuestas directas, sin relleno innecesario."""

    def _consultar_backend(self, endpoint: str, token: str) -> dict | None:
        try:
            response = requests.get(
                f"http://localhost:3000{endpoint}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5,
            )
            if response.status_code == 200:
                return response.json()
            print(f"[Backend {endpoint}] status: {response.status_code}")
            return None
        except Exception as e:
            print(f"[Backend error] {e}")
            return None

    # ------------------------------------------------------------------
    # CONSULTAS REALES — ALUMNO
    # ------------------------------------------------------------------
    def _responder_alumno(self, pregunta_lower: str, token: str) -> str | None:

        if "horario" in pregunta_lower:
            data = self._consultar_backend("/api/students/me/schedule", token)
            if data and "data" in data:
                horario = data["data"].get("horario", [])
                if not horario:
                    return "No encontré materias inscritas en tu horario actual."
                lines = ["Tu horario actual es:\n"]
                for clase in horario:
                    lines.append(
                        f"• {clase['dia_semana'].capitalize()} | "
                        f"{clase['hora_inicio']} - {clase['hora_fin']} | "
                        f"{clase['nombre_materia']} | "
                        f"Aula: {clase['nombre_aula']}"
                    )
                return "\n".join(lines)

        if "kardex" in pregunta_lower:
            data = self._consultar_backend("/api/students/me/kardex", token)
            if data and "data" in data:
                materias = data["data"].get("materias", [])
                if not materias:
                    return "No encontré materias en tu kardex."
                lines = ["Tu kardex:\n"]
                for m in materias[:15]:
                    lines.append(
                        f"• {m['nombre_materia']} | "
                        f"Calificación: {m['calificacion_final']} | "
                        f"{m['resultado']}"
                    )
                return "\n".join(lines)

        if "calificacion" in pregunta_lower or "calificaciones" in pregunta_lower:
            data = self._consultar_backend("/api/students/me/grades", token)
            if data and "data" in data:
                califs = data["data"]
                if not califs:
                    return "No encontré calificaciones registradas."
                lines = ["Tus calificaciones actuales:\n"]
                for c in califs[:15]:
                    tipo = c.get("tipo_evaluacion") or "Sin evaluación"
                    calif = c.get("calificacion")
                    calif_str = str(calif) if calif is not None else "Sin calificación"
                    lines.append(f"• {c['nombre_materia']} | {tipo}: {calif_str}")
                return "\n".join(lines)

        if "promedio" in pregunta_lower:
            data = self._consultar_backend("/api/students/me/kardex", token)
            if data and "data" in data:
                promedio = data["data"].get("promedio", 0)
                avance = data["data"].get("avancePorcentaje", 0)
                return (
                    f"Tu promedio general es {promedio}.\n"
                    f"Llevas un avance del {avance}% de la carrera."
                )

        return None

    # ------------------------------------------------------------------
    # CONSULTAS REALES — PROFESOR
    # ------------------------------------------------------------------
    def _responder_profesor(self, pregunta_lower: str, token: str) -> str | None:

        # Horario / grupos del profesor
        if "horario" in pregunta_lower or "grupo" in pregunta_lower or "clase" in pregunta_lower:
            data = self._consultar_backend("/api/teachers/me/schedule", token)
            if data and "data" in data:
                # El endpoint devuelve { grupos: [...], horarios: [...] }
                grupos = data["data"].get("grupos", [])
                horarios = data["data"].get("horarios", [])

                if not grupos:
                    return "No encontré grupos asignados en el periodo activo."

                # Resumen de grupos
                lines = [f"Tienes {len(grupos)} grupo(s) asignado(s):\n"]
                for g in grupos:
                    lines.append(
                        f"• {g.get('claveGrupo', '')} — {g.get('nombreMateria', '')} "
                        f"({g.get('cupoActual', 0)}/{g.get('cupoMax', 0)} alumnos)"
                    )

                # Detalle de sesiones ordenadas
                if horarios:
                    dias_orden = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]
                    horarios_sorted = sorted(
                        horarios,
                        key=lambda h: (
                            dias_orden.index(h.get("diaGrupo", "lunes"))
                            if h.get("diaGrupo") in dias_orden else 9,
                            h.get("horaInicio", "")
                        )
                    )
                    lines.append("\nSesiones por día:\n")
                    for h in horarios_sorted:
                        lines.append(
                            f"• {h.get('diaGrupo', '').capitalize()} "
                            f"{h.get('horaInicio', '')} - {h.get('horaFin', '')} | "
                            f"{h.get('claveGrupo', '')} {h.get('nombreMateria', '')} | "
                            f"Aula: {h.get('nombreAula', '')}"
                            + (f" ({h.get('edificio')})" if h.get('edificio') else "")
                        )

                return "\n".join(lines)

        # Perfil del profesor
        if "perfil" in pregunta_lower or "mis datos" in pregunta_lower or "mi información" in pregunta_lower:
            data = self._consultar_backend("/api/teachers/me", token)
            if data and "data" in data:
                d = data["data"]
                return (
                    f"Tu perfil:\n"
                    f"• Nombre: {d.get('nombre', '')} {d.get('apellidoPaterno', '')}\n"
                    f"• Número de empleado: {d.get('numeroEmpleado', '')}\n"
                    f"• Departamento: {d.get('departamento', '')}\n"
                    f"• Estatus: {d.get('estatus', '')}"
                )

        # Alumnos de un grupo — detecta si mencionan "alumnos" + "grupo"
        if "alumno" in pregunta_lower and ("grupo" in pregunta_lower or "lista" in pregunta_lower):
            # Primero obtenemos los grupos para saber el id
            data = self._consultar_backend("/api/teachers/me/schedule", token)
            if data and "data" in data:
                grupos = data["data"].get("grupos", [])
                if not grupos:
                    return "No tienes grupos asignados en el periodo activo."
                if len(grupos) == 1:
                    grupo = grupos[0]
                    grupo_id = grupo.get("idGrupo")
                    alumnos_data = self._consultar_backend(
                        f"/api/teachers/groups/{grupo_id}/students", token
                    )
                    if alumnos_data and "data" in alumnos_data:
                        alumnos = alumnos_data["data"]
                        if not alumnos:
                            return f"No hay alumnos inscritos en {grupo.get('claveGrupo')}."
                        lines = [f"Alumnos en {grupo.get('claveGrupo')} — {grupo.get('nombreMateria')}:\n"]
                        for a in alumnos:
                            lines.append(
                                f"• {a.get('boleta')} — "
                                f"{a.get('nombre')} {a.get('apellidoPaterno')} {a.get('apellidoMaterno') or ''}"
                            )
                        return "\n".join(lines)
                else:
                    # Más de un grupo, listar opciones
                    lines = ["Tienes varios grupos. ¿De cuál quieres ver los alumnos?\n"]
                    for g in grupos:
                        lines.append(f"• {g.get('claveGrupo')} — {g.get('nombreMateria')}")
                    return "\n".join(lines)

        return None

    # ------------------------------------------------------------------
    # PARSEAR HISTORIAL
    # ------------------------------------------------------------------
    def _parsear_contexto(self, contexto_previo: str) -> list[dict]:
        if not contexto_previo.strip():
            return []

        mensajes = []
        for linea in contexto_previo.strip().split("\n"):
            linea = linea.strip()
            if linea.startswith("Usuario:"):
                contenido = linea[len("Usuario:"):].strip()
                if contenido:
                    mensajes.append({"role": "user", "content": contenido})
            elif linea.startswith("Asistente:"):
                contenido = linea[len("Asistente:"):].strip()
                if contenido:
                    mensajes.append({"role": "assistant", "content": contenido})
        return mensajes

    # ------------------------------------------------------------------
    # RESPUESTA PRINCIPAL
    # ------------------------------------------------------------------
    def responder(
        self,
        pregunta: str,
        boleta: str | None = None,
        contexto_previo: str = "",
        token: str = "",
    ) -> str:

        pregunta_lower = pregunta.lower()
        rol = self._obtener_rol(token) if token else "alumno"

        # 1. Intentar responder con datos reales de la BD según el rol
        if token:
            if rol == "profesor":
                datos_reales = self._responder_profesor(pregunta_lower, token)
            else:
                datos_reales = self._responder_alumno(pregunta_lower, token)

            if datos_reales is not None:
                return datos_reales

        # 2. Usar el LLM con el dataset como contexto
        if self.model and self.client:
            try:
                historial = self._parsear_contexto(contexto_previo)

                messages = [{"role": "system", "content": self._system_prompt()}]
                messages.extend(historial)

                pregunta_final = pregunta
                if boleta:
                    pregunta_final = f"[{rol.capitalize()} con ID {boleta}] {pregunta}"

                messages.append({"role": "user", "content": pregunta_final})

                response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    max_tokens=512,
                )
                return response.choices[0].message.content.strip()

            except Exception as e:
                print(f"[Groq error] {e}")

        # 3. Fallback
        fallback = self.dataset.get(
            "no_entendido",
            ["Lo siento, no pude procesar tu pregunta. Intenta de nuevo."],
        )
        return random.choice(fallback) if isinstance(fallback, list) else str(fallback)
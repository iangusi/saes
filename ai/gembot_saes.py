import os
import json
import random
import requests
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class ChatbotESCOM:

    def __init__(self, dataset_path: str):
        self.dataset = self._cargar_dataset(dataset_path)
        self.client = self._inicializar_openai()

    # ---------------------------------------------------------
    # DATASET
    # ---------------------------------------------------------

    def _cargar_dataset(self, path: str):

        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)

        except Exception as e:
            raise ValueError(f"Error cargando dataset: {e}")

    # ---------------------------------------------------------
    # OPENAI
    # ---------------------------------------------------------

    def _inicializar_openai(self):

        api_key = os.getenv("OPENAI_API_KEY")

        if not api_key:
            return None

        try:
            return OpenAI(api_key=api_key)
        except:
            return None

    # ---------------------------------------------------------
    # CONSULTA BACKEND NODE
    # ---------------------------------------------------------

    def _consultar_backend(self, endpoint: str, token: str):

        try:

            response = requests.get(
                f"http://localhost:3000{endpoint}",
                headers={
                    "Authorization": f"Bearer {token}"
                }
            )

            if response.status_code == 200:
                return response.json()

            print(f"[Backend status] {response.status_code}")
            return None

        except Exception as e:
            print(f"[Backend error] {e}")
            return None

    # ---------------------------------------------------------
    # REGLAS LOCALES
    # ---------------------------------------------------------

    def _reglas_directas(self, pregunta: str):

        t = pregunta.lower()

        respuestas = {
            "reinscripción": "La reinscripción se realiza desde el módulo de Reinscripción.",
            "baja": "Puedes solicitar baja de materias desde el módulo 'Bajas'.",
            "oferta": "La oferta académica se encuentra en el módulo 'Oferta'.",
            "documentos": "Puedes consultar tus documentos en la sección 'Documentos'.",
            "escom": "ESCOM es la Escuela Superior de Cómputo del Instituto Politécnico Nacional.",
            "ipn": "El IPN es el Instituto Politécnico Nacional.",
        }

        for clave, respuesta in respuestas.items():

            if clave in t:
                return respuesta

        return None

    # ---------------------------------------------------------
    # RESPUESTA PRINCIPAL
    # ---------------------------------------------------------

    def responder(
        self,
        pregunta: str,
        boleta: str | None = None,
        contexto_previo: str = "",
        token: str = "",
    ) -> str:

        pregunta_lower = pregunta.lower()

        # ---------------------------------------------------------
        # HORARIO REAL
        # ---------------------------------------------------------

        if "horario" in pregunta_lower and token:

            data = self._consultar_backend(
                "/api/students/me/schedule",
                token
            )

            if data and "data" in data:

                horario = data["data"].get("horario", [])

                if not horario:
                    return "No encontré materias inscritas en tu horario."

                respuesta = "Tu horario actual es:\n\n"

                for clase in horario:

                    respuesta += (
                        f"- {clase['dia_semana'].capitalize()} | "
                        f"{clase['hora_inicio']} - {clase['hora_fin']} | "
                        f"{clase['nombre_materia']} | "
                        f"Aula: {clase['nombre_aula']}\n"
                    )

                return respuesta

        # ---------------------------------------------------------
        # KARDEX REAL
        # ---------------------------------------------------------

        if "kardex" in pregunta_lower and token:

            data = self._consultar_backend(
                "/api/students/me/kardex",
                token
            )

            if data and "data" in data:

                materias = data["data"].get("materias", [])

                if not materias:
                    return "No encontré materias en tu kardex."

                respuesta = "Tu kardex actual:\n\n"

                for m in materias[:10]:

                    respuesta += (
                        f"- {m['nombre_materia']} | "
                        f"Calificación: {m['calificacion_final']} | "
                        f"Resultado: {m['resultado']}\n"
                    )

                return respuesta

        # ---------------------------------------------------------
        # CALIFICACIONES REALES
        # ---------------------------------------------------------

        if "calificacion" in pregunta_lower and token:

            data = self._consultar_backend(
                "/api/students/me/grades",
                token
            )

            if data and "data" in data:

                calificaciones = data["data"]

                if not calificaciones:
                    return "No encontré calificaciones registradas."

                respuesta = "Tus calificaciones actuales:\n\n"

                for c in calificaciones[:10]:

                    respuesta += (
                        f"- {c['nombre_materia']} | "
                        f"{c['tipo_evaluacion']}: "
                        f"{c['calificacion']}\n"
                    )

                return respuesta

        # ---------------------------------------------------------
        # PROMEDIO
        # ---------------------------------------------------------

        if "promedio" in pregunta_lower and token:

            data = self._consultar_backend(
                "/api/students/me/kardex",
                token
            )

            if data and "data" in data:

                promedio = data["data"].get("promedio", 0)
                avance = data["data"].get("avancePorcentaje", 0)

                return (
                    f"Tu promedio general es {promedio}.\n"
                    f"Llevas un avance del {avance}% de la carrera."
                )

        # ---------------------------------------------------------
        # REGLAS LOCALES
        # ---------------------------------------------------------

        directa = self._reglas_directas(pregunta)

        if directa is not None:
            return directa

        # ---------------------------------------------------------
        # OPENAI FALLBACK
        # ---------------------------------------------------------

        if self.client:

            try:

                prompt = f"""
Eres un asistente virtual de ESCOM.

Pregunta:
{pregunta}

Responde breve y claro.
"""

                response = self.client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": "Eres un asistente de ESCOM."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.7,
                )

                return response.choices[0].message.content.strip()

            except Exception as e:
                print(f"[OpenAI error] {e}")

        # ---------------------------------------------------------
        # FALLBACK FINAL
        # ---------------------------------------------------------

        fallback = self.dataset.get(
            "no_entendido",
            ["No entendí tu pregunta."]
        )

        return random.choice(fallback)
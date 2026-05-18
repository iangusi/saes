# ai/app.py  —  Microservicio Python del Chatbot ESCOM
# Compatible con saes-main: SIN PostgreSQL, SIN CSV.
# El historial y la persistencia los maneja el backend Node (MySQL).
# Este servicio solo recibe una pregunta + contexto y responde.

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import os, json
from gembot_saes import ChatbotESCOM

app = FastAPI(title="Chatbot ESCOM – SAES 2.0", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Solo escucha desde el backend Node, no directamente del front
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset_escom.json")

_bot = ChatbotESCOM(dataset_path=DATASET_PATH)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/ai/chat")
async def ai_chat(request: Request):
    """
    Recibe del backend Node:
      - pregunta: str          (requerido)
      - boleta: str | None     (solo alumnos)
      - chat_id: str | None    (ID de conversación, informativo)
      - contexto_previo: str   (últimos mensajes, ya formateados)
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(400, "Body JSON inválido")

    pregunta = (payload.get("pregunta") or payload.get("message") or "").strip()
    if not pregunta:
        raise HTTPException(422, "Falta el campo 'pregunta'")

    boleta = str(payload.get("boleta", "")).strip() or None
    token = str(payload.get("token", "")).strip()
    print("TOKEN:", token)
    contexto_previo = str(payload.get("contexto_previo", "")).strip()

    reply = _bot.responder(
        pregunta,
        boleta=boleta,
        contexto_previo=contexto_previo,
        token=token
    )
    return {"reply": reply}


@app.post("/reload")
def reload_dataset():
    global _bot
    _bot = ChatbotESCOM(dataset_path=DATASET_PATH)
    return {"reloaded": True}

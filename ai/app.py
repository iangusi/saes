# ai/app.py - Microservicio Python del Chatbot ESCOM.
# El backend Node orquesta permisos, datos reales e historial persistente.

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import os

from gembot_saes import ChatbotESCOM

app = FastAPI(title="Chatbot ESCOM - SAES 2.0", version="4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset_escom.json")

_bot = ChatbotESCOM(dataset_path=DATASET_PATH)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/ai/intent")
async def ai_intent(request: Request):
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(400, "Body JSON inválido") from exc

    pregunta = str(payload.get("pregunta") or payload.get("message") or "").strip()
    if not pregunta:
        raise HTTPException(422, "Falta el campo 'pregunta'")

    roles = payload.get("roles")
    if not isinstance(roles, list):
        roles = []

    contexto = payload.get("contexto")
    if not isinstance(contexto, dict):
        contexto = {}

    return _bot.classify_intent(pregunta, [str(role) for role in roles], contexto)


@app.post("/ai/plan")
async def ai_plan(request: Request):
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(400, "Body JSON invalido") from exc

    question = str(payload.get("question") or payload.get("pregunta") or "").strip()
    if not question:
        raise HTTPException(422, "Falta el campo 'question'")

    return _bot.plan(payload)


@app.post("/ai/database-plan")
async def ai_database_plan(request: Request):
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(400, "Body JSON invalido") from exc

    return _bot.database_plan(payload)


@app.post("/ai/regulation")
async def ai_regulation(request: Request):
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(400, "Body JSON invalido") from exc

    return _bot.regulation_agent(payload)


@app.post("/ai/respond")
async def ai_respond(request: Request):
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(400, "Body JSON inválido") from exc

    pregunta = str(payload.get("pregunta") or payload.get("question") or payload.get("message") or "").strip()
    if not pregunta:
        raise HTTPException(422, "Falta el campo 'pregunta'")

    roles = payload.get("roles")
    if not isinstance(roles, list):
        roles = []

    contexto = payload.get("contexto")
    if not isinstance(contexto, dict):
        contexto = {}

    return _bot.responder_agent(payload)


@app.post("/ai/chat")
async def ai_chat(request: Request):
    """
    Compatibilidad temporal con el flujo anterior.
    El flujo nuevo debe usar /ai/intent y /ai/respond desde Node.
    """
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(400, "Body JSON inválido") from exc

    pregunta = str(payload.get("pregunta") or payload.get("message") or "").strip()
    if not pregunta:
        raise HTTPException(422, "Falta el campo 'pregunta'")

    reply = _bot.responder(
        pregunta,
        boleta=str(payload.get("boleta") or "").strip() or None,
        contexto_previo=str(payload.get("contexto_previo") or "").strip(),
    )
    return {"reply": reply}


@app.post("/reload")
def reload_dataset():
    global _bot
    _bot = ChatbotESCOM(dataset_path=DATASET_PATH)
    return {"reloaded": True}

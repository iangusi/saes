# Chatbot ESCOM — Microservicio IA

Asistente virtual académico de SAES 2.0 usando Groq API con LLaMA 3.3 70B.
Responde preguntas sobre reglamento, inscripciones, reinscripciones y gestión escolar de ESCOM-IPN.
También consulta datos personales del usuario (horario, kardex, calificaciones) según su rol (alumno o profesor).

## Requisitos
- Python 3.10+
- Cuenta en [console.groq.com](https://console.groq.com) para obtener API key gratis

## Configuración

### 1. Crear archivo `.env` en esta carpeta
```
GROQ_API_KEY=tu-api-key-aqui
```

### 2. Instalar dependencias
```
pip install -r requirements.txt
```

### 3. Levantar el servidor
```
uvicorn app:app --port 8000
```

El microservicio queda disponible en `http://localhost:8000`

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `app.py` | Servidor FastAPI con los endpoints del chatbot |
| `gembot_saes.py` | Lógica principal: detección de rol, consultas a BD y llamadas a Groq |
| `dataset_escom.json` | Base de conocimiento institucional (reglamento, inscripciones, etc.) |
| `requirements.txt` | Dependencias Python |
| `.env` | API key de Groq (no subir a git) |

## Documentación completa
Ver `docs/CHATBOT.md` para detalles sobre endpoints, flujo de respuesta, dataset y tablas de BD.

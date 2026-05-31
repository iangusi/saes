# Guía del Módulo de Chatbot con IA - SAES 2.0

## Descripción General

Este documento describe la implementación del chatbot con IA integrado al sistema SAES 2.0. El chatbot utiliza **Groq API** con el modelo **LLaMA 3.3 70B** para responder preguntas académicas sobre reglamento, inscripciones, reinscripciones y gestión escolar de ESCOM-IPN.

El chatbot también puede consultar datos personales del usuario (horario, kardex, calificaciones) directamente desde la base de datos a través del backend Node.js.

---

## Requisitos Funcionales Implementados

### RF-Chat: Asistente Virtual Académico
- Responde preguntas sobre reglamento escolar del IPN
- Responde sobre procesos de inscripción y reinscripción
- Responde sobre responsabilidades de profesores y gestión escolar
- Consulta datos reales del alumno: kardex, horario, calificaciones y promedio
- Consulta datos reales del profesor: horario y perfil
- Detecta el rol del usuario automáticamente desde el JWT
- Mantiene historial de conversación en la sesión

---

## Estructura de Archivos

```
saes/
└── ai/
    ├── app.py               # Servidor FastAPI (microservicio)
    ├── gembot_saes.py        # Lógica del chatbot
    ├── dataset_escom.json    # Base de conocimiento institucional
    ├── requirements.txt      # Dependencias Python
    └── .env                  # Variables de entorno (NO subir a git)
```

---

## Tecnologías Utilizadas

| Componente | Tecnología |
|------------|-----------|
| Servidor   | FastAPI + Uvicorn |
| IA         | Groq API (LLaMA 3.3 70B) |
| Lenguaje   | Python 3.10+ |

---

## Instalación y Configuración

### 1. Instalar dependencias Python
```bash
cd ai
pip install -r requirements.txt
```

### 2. Crear archivo `.env`
```bash
# ai/.env
GROQ_API_KEY=tu_api_key_aqui
```

Obtener API key gratis en: https://console.groq.com → API Keys → Create API Key

### 3. Levantar el microservicio
```bash
cd ai
uvicorn app:app --port 8000
```

El servicio queda disponible en `http://localhost:8000`

---

## Endpoints del Microservicio

```
GET  /health        # Verificar que el servicio está activo
POST /ai/chat       # Enviar mensaje y recibir respuesta
POST /reload        # Recargar el dataset sin reiniciar
```

### POST /ai/chat

**Body:**
```json
{
  "pregunta": "¿Cómo solicito una baja temporal?",
  "boleta": "2023630151",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "contexto_previo": "Usuario: hola\nAsistente: ¡Hola! ¿En qué te puedo ayudar?"
}
```

**Respuesta:**
```json
{
  "reply": "Para solicitar una baja temporal, debes presentar una solicitud por escrito..."
}
```

---

## Flujo de Respuesta

```
Usuario escribe pregunta
        ↓
Backend Node.js → POST /ai/chat (Python)
        ↓
gembot_saes.py detecta rol desde JWT (alumno/profesor)
        ↓
¿Es pregunta de datos personales? (horario, kardex, calificaciones)
        ↓ Sí                          ↓ No
Consulta backend Node             Envía a Groq con dataset
(/api/students/me/... o           como system prompt
/api/teachers/me/...)
        ↓                                ↓
Devuelve datos reales           LLaMA 3.3 genera respuesta
        ↓                                ↓
                  Respuesta al usuario
```

---

## Detección de Rol

El chatbot lee el JWT automáticamente para detectar si el usuario es alumno o profesor y consultar los endpoints correctos:

- **Alumno** → `/api/students/me/schedule`, `/api/students/me/kardex`, `/api/students/me/grades`
- **Profesor** → `/api/teachers/me/schedule`, `/api/teachers/me`

---

## Base de Conocimiento (dataset_escom.json)

El dataset contiene información institucional sobre:

| Sección | Contenido |
|---------|-----------|
| `reglamento` | Definiciones académicas del IPN |
| `inscripcion` | Fechas, requisitos, derechos y sanciones |
| `reinscripcion` | Fechas, créditos, requisitos, bajas de materias |
| `profesores` | Responsabilidades, plazos, evaluaciones |
| `gestion` | Bajas, justificantes, dictámenes, documentos |
| `saludos` | Respuestas de bienvenida |
| `despedidas` | Respuestas de cierre |
| `no_entendido` | Respuestas de fallback |

---

## Seguridad

- El archivo `.env` con la API key **nunca debe subirse a git**
- El `.gitignore` ya incluye `.env` y `ai/.env`
- Cada integrante del equipo debe usar su propia API key de Groq
- El archivo `.env.example` documenta las variables necesarias sin valores reales

---

## Tablas en Base de Datos

El módulo del chatbot requiere dos tablas que se crean automáticamente al correr `node scripts/run-schema.js`:

### `chat_conversacion`
Almacena cada conversación iniciada por un usuario.
- `id_conversacion` — UUID único de la conversación
- `id_usuario` — referencia al usuario dueño de la conversación
- `titulo` — se genera automáticamente del primer mensaje
- `creado_en` / `actualizado_en` — fechas de registro

### `chat_mensaje`
Almacena cada mensaje individual de una conversación.
- `id_mensaje` — ID autoincremental
- `id_conversacion` — referencia a la conversación
- `rol` — quién lo envió: `usuario`, `asistente` o `sistema`
- `contenido` — texto del mensaje
- `creado_en` — fecha del mensaje

Script de creación: `database/schema/003_chat_schema.sql`

---

## Notas Importantes

- El microservicio Python debe estar corriendo en el puerto 8000 para que el chatbot funcione
- Si Groq devuelve error 429 (quota), esperar unos minutos o crear una nueva API key en un proyecto distinto
- El modelo usado es `llama-3.3-70b-versatile`, el más capaz del free tier de Groq
- Groq tiene un límite de 500,000 tokens por día en el plan gratuito, suficiente para uso académico

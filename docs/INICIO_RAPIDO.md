# Inicio rápido – SAES2

## Requisitos previos
- Node.js 18+
- MySQL 8+
- npm 8+
- Python 3.10+

## 1. Instalar dependencias
```bash
cd saes2
npm install
```

## 2. Configurar variables de entorno
```bash
cp apps/api/.env.example apps/api/.env
# Edita apps/api/.env con tus credenciales MySQL y SMTP
```

## 3. Crear base de datos y aplicar esquema
```bash
npm run db:schema
npm run db:seed
```

## 4. Iniciar backend
```bash
npm run dev:api
# API disponible en http://localhost:3000
```

## 5. Iniciar frontend
```bash
npm run dev:web
# Web disponible en http://localhost:5173
```

## 6. Iniciar microservicio del Chatbot (IA)
```bash
cd ai
pip install -r requirements.txt
uvicorn app:app --port 8000
# Chatbot disponible en http://localhost:8000
```

> ⚠️ El chatbot requiere una API key de Groq. Crea tu archivo `ai/.env`:
> ```
> GROQ_API_KEY=tu_api_key_aqui
> ```
> Obtén tu key gratis en https://console.groq.com

---

## Estructura de módulos del backend

| Ruta | Módulo |
|------|--------|
| POST /api/auth/login | Autenticación |
| GET  /api/users/me | Perfil usuario |
| GET  /api/students/me | Perfil alumno |
| GET  /api/students/me/kardex | Kardex |
| GET  /api/students/me/schedule | Horario alumno |
| GET  /api/students/me/grades | Calificaciones |
| GET  /api/reenrollment/status | Estado reinscripción |
| GET  /api/reenrollment/eligibility | Materias elegibles |
| POST /api/reenrollment/submit | Inscribir materias |
| GET  /api/withdrawals/status | Estado bajas |
| POST /api/withdrawals/request | Dar de baja materia |
| GET  /api/teaching-evaluation/status | Estado evaluación docente |
| GET  /api/teaching-evaluation/form | Formulario evaluación |
| POST /api/teaching-evaluation/submit | Enviar evaluación |
| GET  /api/offer | Oferta académica |
| GET  /api/teachers/me | Perfil profesor |
| GET  /api/teachers/me/schedule | Horario profesor |
| GET  /api/teachers/groups/:id/students | Estudiantes del grupo |
| GET  /api/teachers/groups/:id/grades | Calificaciones del grupo |
| POST /api/teachers/attendance | Registrar asistencia |
| PUT  /api/teachers/grades | Actualizar calificación |
| POST /api/teachers/announcements | Crear anuncio |
| GET  /api/teachers/groups/:id/announcements | Anuncios del grupo |
| GET  /api/admin/bitacora | Bitácora de auditoría |
| POST /ai/chat | Chatbot IA |
# Inicio rápido – SAES2
## Requisitos previos
- Node.js 18+
- MySQL 8+
- npm 8+

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

## Estructura de módulos del backend
| Ruta | Módulo |
|------|--------|
| POST /api/auth/login | Autenticación |
| GET  /api/users/me | Perfil usuario |
| GET  /api/students/me | Perfil alumno |
| GET  /api/students/me/kardex | Kardex |
| GET  /api/students/me/schedule | Horario |
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
| GET  /api/admin/bitacora | Bitácora de auditoría |

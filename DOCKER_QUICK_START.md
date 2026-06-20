# 🐳 DOCKER QUICK START - SAES2

## ⚡ 30 segundos para tener todo funcionando

### Paso 1: Preparar variables
```bash
cp .env.docker .env
# Edita .env y añade: GROQ_API_KEY, credenciales SMTP, etc.
```

### Paso 2: Iniciar servicios
```bash
docker-compose up -d
```

### Paso 3: ¡Acceder!
- 🌐 Web: http://localhost
- 📡 API: http://localhost:3000
- 🤖 AI: http://localhost:8000
- 📚 API Docs: http://localhost:3000/docs

---

## 🎯 Comandos Esenciales

```bash
# Ver servicios corriendo
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Detener todo
docker-compose down

# Borrar todo (incluyendo BD)
docker-compose down -v

# Shell en un contenedor
docker-compose exec api sh
docker-compose exec ai bash
docker-compose exec db mysql -u root -p root saes2
```

---

## 📂 Archivos Creados

```
.
├── Dockerfile.ai          # 🐍 Python + FastAPI
├── Dockerfile.api         # 🟢 Node.js + Express
├── Dockerfile.web         # ⚛️ React + Nginx
├── docker-compose.yml     # 🐳 Orquestación (desarrollo)
├── docker-compose.prod.yml # 🚀 Orquestación (producción)
├── nginx.conf             # 🌐 Configuración Nginx
├── docker-entrypoint.sh   # 🔧 Script de inicio
├── .dockerignore           # 📦 Archivos a ignorar
├── .env.example           # 📋 Variables de ejemplo
├── .env.docker            # 📋 Variables para Docker
├── Makefile               # 🛠️ Comandos útiles
├── DOCKER_SETUP.md        # 📖 Documentación completa
└── .github/workflows/
    └── docker-build.yml   # 🔄 CI/CD (GitHub Actions)
```

---

## 🚨 Troubleshooting Rápido

### Los contenedores no inician
```bash
docker-compose logs -f
# Busca errores, generalmente es:
# - Puerto ocupado → cambiar en .env
# - BD no lista → esperar y reintentar
# - Variables faltando → verificar .env
```

### Base de datos vacía
```bash
docker-compose exec api npm run db:schema
docker-compose exec api npm run db:seed
```

### Limpiar y empezar de cero
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Arquitectura

```
┌───────────────────────────────────────┐
│         NGINX + React (web)           │
│         :80 http://localhost          │
└───────────┬───────────────────────────┘
            │ proxy
    ┌───────┴───────┬──────────────┐
    │               │              │
┌───▼────┐  ┌─────▼─────┐  ┌─────▼──┐
│ API    │  │ AI/Chatbot│  │ MySQL  │
│Express │  │ FastAPI   │  │ :3306  │
│:3000   │  │ :8000     │  │        │
└────────┘  └───────────┘  └────────┘
```

---

## 🔑 Variables de Entorno Importantes

```env
# Base de datos
DB_PASS=tu_contraseña_segura

# JWT (Seguridad)
JWT_SECRET=clave_larga_muy_segura_minimo_32_caracteres

# API Key de Groq
GROQ_API_KEY=tu_api_key_groq

# Email SMTP
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

# URLs
FRONTEND_URL=http://localhost (desarrollo)
FRONTEND_URL=https://saes2.edu.mx (producción)
```

---

## 🚀 Deployment

### Producción
```bash
# Usar archivo de producción
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# Pre-requisitos:
# 1. .env.prod con contraseñas seguras
# 2. Variables de SSL/TLS en nginx.conf
# 3. Monitoreo y backups configurados
```

---

## 📞 Más Información

Ver **DOCKER_SETUP.md** para documentación completa.

---

## ✅ Checklist de Verificación

- [ ] `.env` configurado con todas las variables
- [ ] `make docker-build` completa sin errores
- [ ] `make docker-up` inicia todos los servicios
- [ ] `docker-compose ps` muestra 5 contenedores "Up"
- [ ] http://localhost carga sin errores
- [ ] API responde en http://localhost:3000
- [ ] AI disponible en http://localhost:8000

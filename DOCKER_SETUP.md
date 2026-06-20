# Docker Setup para SAES2

## 📋 Requisitos Previos

- **Docker Desktop** (v24.0 o superior)
- **Docker Compose** (v2.0 o superior)
- **Make** (opcional, para usar Makefile)
  - En Windows: Instala con `choco install make` o usa WSL2
  - En Mac: Ya viene incluido o instala con `brew install make`
  - En Linux: `sudo apt-get install make`

## 🚀 Inicio Rápido

### 1. Preparar Variables de Entorno

```bash
# Crear archivo .env desde la plantilla
cp .env.docker .env
```

Edita `.env` con tus credenciales (especialmente):
- `DB_PASS` - Contraseña de MySQL
- `GROQ_API_KEY` - API Key de Groq para el chatbot
- `SMTP_USER` y `SMTP_PASS` - Credenciales de email
- `JWT_SECRET` - Clave secreta para JWT (cambiar en producción)

### 2. Construir Imágenes Docker

```bash
# Opción 1: Con Makefile
make docker-build

# Opción 2: Con Docker Compose directamente
docker-compose build
```

### 3. Iniciar los Servicios

```bash
# Opción 1: Con Makefile
make docker-up

# Opción 2: Con Docker Compose
docker-compose up -d
```

### 4. Verificar que Todo Funciona

```bash
# Ver estado de contenedores
make docker-ps

# Ver logs
make docker-logs

# Acceder a los servicios
- Web:      http://localhost
- API:      http://localhost:3000
- AI/Chat:  http://localhost:8000
- Docs API: http://localhost:3000/docs
```

## 🛠️ Comandos Útiles

### Makefile (Recomendado)

```bash
# Ver todos los comandos disponibles
make help

# Reconstruir completamente
make docker-rebuild

# Ver logs en tiempo real
make docker-logs
make docker-logs-api
make docker-logs-ai
make docker-logs-db

# Acceder a contenedores
make docker-shell-api    # Shell del API
make docker-shell-ai     # Shell del AI (Python)
make docker-shell-db     # MySQL client

# Inicializar base de datos
make db-init             # Corre schema y seeders
```

### Docker Compose Directo

```bash
# Ver contenedores en ejecución
docker-compose ps

# Ver logs
docker-compose logs -f                # Todos
docker-compose logs -f api            # Solo API
docker-compose logs -f ai             # Solo AI
docker-compose logs -f web            # Solo Web
docker-compose logs -f db             # Solo DB

# Acceder a contenedores
docker-compose exec api sh
docker-compose exec ai bash
docker-compose exec db bash
docker-compose exec web sh

# Ejecutar comandos en contenedor
docker-compose exec api npm run db:schema
docker-compose exec api npm run db:seed

# Detener servicios
docker-compose down                   # Con preservación de volúmenes
docker-compose down -v                # Con eliminación de volúmenes

# Reiniciar
docker-compose restart
```

## 📊 Arquitectura de Servicios

```
┌─────────────────────────────────────────────────────────┐
│                    WEB (Nginx + React)                  │
│                   http://localhost:80                   │
└────────────┬─────────────────────────────────┬──────────┘
             │                                  │
      ┌──────▼──────┐                    ┌─────▼────────┐
      │   API       │                    │   AI/Chatbot │
      │ (Express)   │                    │   (FastAPI)  │
      │:3000        │                    │   :8000      │
      └──────┬──────┘                    └──────────────┘
             │
      ┌──────▼──────────────┐
      │   Database MySQL    │
      │   (saes2)           │
      │   :3306             │
      └─────────────────────┘
```

## 🔐 Variables de Entorno

### Database (`.env`)
```env
DB_ROOT_PASSWORD=root                    # Contraseña root de MySQL
DB_USER=root                             # Usuario de MySQL
DB_PASS=root                             # Contraseña del usuario
DB_HOST=db                               # Host (en Docker, es el nombre del servicio)
DB_PORT=3306                             # Puerto MySQL
DB_NAME=saes2                            # Nombre de la base de datos
```

### API
```env
NODE_ENV=development                     # development | production
PORT=3000                                # Puerto del API
JWT_SECRET=your_secret_key_32_chars      # Clave para JWT (cambiar en prod)
JWT_EXPIRES_IN=8h                        # Expiración de tokens
SMTP_HOST=smtp.gmail.com                 # Servidor SMTP
SMTP_PORT=587                            # Puerto SMTP
SMTP_USER=your_email@gmail.com           # Email remitente
SMTP_PASS=your_app_password              # Contraseña de aplicación
SMTP_FROM=noreply@saes2.edu.mx           # Email "From"
FRONTEND_URL=http://localhost            # URL del frontend (para reset password)
```

### AI/Chatbot
```env
GROQ_API_KEY=gsk_...                     # API Key de Groq (requerido)
```

### Web
```env
WEB_PORT=80                              # Puerto de Nginx
VITE_API_URL=http://localhost:3000       # URL del API (para el cliente)
VITE_AI_URL=http://localhost:8000        # URL del AI (para el cliente)
```

## 🐛 Troubleshooting

### Puerto ya está en uso
```bash
# Encontrar qué está usando el puerto
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# Cambiar puerto en .env
API_PORT=3001
WEB_PORT=8080
```

### Contenedor no inicia
```bash
# Ver logs detallados
docker-compose logs -f [service-name]

# Eliminar y reconstruir
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Problemas de base de datos
```bash
# Conectarse a MySQL
make docker-shell-db

# O directamente
docker-compose exec db mysql -u root -p root saes2
```

### Limpiar todo y empezar de cero
```bash
make docker-clean
make docker-build
make docker-up
```

## 🚀 Desarrollo Local

### Con Hot Reload (desarrollo)

Para **API**, editaremos el `docker-compose.yml` para usar volúmenes:
```yaml
# Ya está configurado con volumen en desarrollo
volumes:
  - ./apps/api/src:/app/apps/api/src:ro
```

Para **AI**, los cambios se reflejan directamente:
```yaml
volumes:
  - ./ai:/app
```

### Ejecutar scripts de base de datos

```bash
# Aplicar schema
make db-schema

# Cargar seeders
make db-seed

# Ambos a la vez
make db-init
```

## 📦 Imágenes Multi-stage

Todas las imágenes usan multi-stage builds para optimizar tamaño:

- **Dockerfile.ai**: Python slim + FastAPI (≈500MB)
- **Dockerfile.api**: Node 20-alpine + Express (≈300MB)
- **Dockerfile.web**: Node 20-alpine (build) + Nginx (≈50MB)

## 🔄 CI/CD Ready

Los Dockerfiles están optimizados para:
- ✅ GitHub Actions
- ✅ GitLab CI
- ✅ Jenkins
- ✅ Any Docker registry (DockerHub, ECR, GCR)

## 📝 Deployment a Producción

### En desarrollo (.env)
```env
NODE_ENV=development
GROQ_API_KEY=your_dev_key
JWT_SECRET=dev_secret
```

### En producción (crear `.env.prod`)
```env
NODE_ENV=production
DB_PASS=strong_password_here
JWT_SECRET=long_secret_key_32_chars_minimum_change_this
GROQ_API_KEY=your_prod_key
SMTP_USER=production_email@domain.com
SMTP_PASS=production_app_password
FRONTEND_URL=https://saes2.edu.mx
```

Entonces ejecutar:
```bash
docker-compose --env-file .env.prod up -d
```

## 📞 Soporte

Para issues o preguntas sobre Docker:
1. Revisa los logs: `make docker-logs`
2. Verifica variables de entorno: `cat .env`
3. Reconstruye sin caché: `make docker-rebuild`

## ✅ Checklist Pre-Deployment

- [ ] `.env` configurado con variables seguras
- [ ] `JWT_SECRET` es una clave larga y segura
- [ ] SMTP configurado correctamente
- [ ] GROQ_API_KEY válida
- [ ] Base de datos inicializada (`make db-init`)
- [ ] Todos los servicios en `docker-compose ps` dicen "Up"
- [ ] Acceso a http://localhost sin errores

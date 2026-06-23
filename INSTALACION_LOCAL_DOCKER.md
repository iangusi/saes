# 🐳 Guía de Instalación Local con Docker - SAES2

## 📖 Introducción

Esta guía te muestra cómo instalar y ejecutar **SAES2 completo** en tu computadora utilizando Docker, sin necesidad de instalar Node.js, Python, MySQL o cualquier otra dependencia localmente.

### ¿Por qué Docker?
- ✅ **Una sola línea de comando** para instalar todo
- ✅ Ambiente **100% idéntico** para todos los desarrolladores
- ✅ **Sin conflictos de versiones** entre proyectos
- ✅ Fácil **cleanup** (borrar todo y empezar de cero)

---

## 📋 Requisitos Previos

Antes de comenzar, necesitas tener instalado en tu computadora:

### 1. **Docker Desktop**
- **Windows/Mac:** [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** `sudo apt-get install docker.io docker-compose`

**Verificar instalación:**
```powershell
docker --version
# Output: Docker version 24.0.0, build abcd1234

docker-compose --version
# Output: Docker Compose version 2.0.0
```

### 2. **Git** (opcional pero recomendado)
- [Descargar Git](https://git-scm.com/)

**Verificar instalación:**
```powershell
git --version
# Output: git version 2.40.0
```

### 3. **Editor de Texto**
- VSCode, Sublime, Notepad++, o cualquiera

---

## 🚀 Instalación Paso a Paso

### PASO 1: Obtener el Código (5 minutos)

**Opción A: Con Git**
```powershell
# Clonar el repositorio
git clone https://github.com/tu-usuario/saes.git
cd saes
```

**Opción B: Descargar ZIP**
1. Descarga el archivo ZIP del repositorio
2. Descomprime en una carpeta
3. Abre PowerShell en esa carpeta

---

### PASO 2: Preparar Variables de Entorno (5 minutos)

Todas las configuraciones se controlan mediante un archivo `.env`.

```powershell
# 1. Copiar la plantilla
cp .env.docker .env

# 2. Abrir el archivo con tu editor
notepad .env
# (O usa tu editor favorito)
```

**El archivo `.env` debería verse así:**
```env
# Base de Datos
DB_PASS=root
DB_USER=root
DB_NAME=saes2
DB_PORT=3306

# API
API_PORT=3000
PORT=3000
NODE_ENV=development

# JWT (Seguridad)
JWT_SECRET=your_super_secret_key_min_32_chars_change_in_production

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

# URLs
FRONTEND_URL=http://localhost

# Groq API (Chatbot)
GROQ_API_KEY=tu_groq_api_key_aqui
```

**⚠️ IMPORTANTE:**
- Cambia `JWT_SECRET` a algo más largo y único
- Si usas Gmail para SMTP, genera una [App Password](https://support.google.com/accounts/answer/185833)
- Obtén `GROQ_API_KEY` en [https://console.groq.com/](https://console.groq.com/)

---

### PASO 3: Construir las Imágenes Docker (5-10 minutos)

Docker va a crear 3 imágenes (contenedores) a partir de los Dockerfiles:

```powershell
# Construir todas las imágenes
docker-compose build

# O con Makefile (si lo tienes instalado)
make docker-build
```

**¿Qué está pasando?**
- Descarga imágenes base (Python, Node, MySQL, Nginx)
- Instala dependencias (npm, pip)
- Compila la aplicación
- Crea 3 imágenes: `saes-api`, `saes-ai`, `saes-web`

**Tiempo estimado:** 3-10 minutos (depende de tu conexión)

---

### PASO 4: Iniciar los Servicios (1 minuto)

```powershell
# Iniciar todos los contenedores
docker-compose up -d

# O con Makefile
make docker-up
```

**¿Qué está pasando?**
- Inicia 5 contenedores: web, api, ai, db, nginx
- Configura networking entre ellos
- Expone puertos: 80 (web), 3000 (api), 8000 (ai), 3306 (db)

**Esperar:** ~30-60 segundos a que todo inicie

---

### PASO 5: Verificar que Todo Funciona (2 minutos)

```powershell
# Ver estado de los contenedores
docker-compose ps

# Debería mostrar algo como:
# NAME          IMAGE       STATUS
# saes2-web     saes-web    Up 30s (healthy)
# saes2-api     saes-api    Up 35s (healthy)
# saes2-ai      saes-ai     Up 40s (healthy)
# saes2-db      mysql:8.4   Up 45s (healthy)
```

**Ver logs para diagnosticar problemas:**
```powershell
# Todos los logs
docker-compose logs

# Solo API
docker-compose logs api

# Solo Base de Datos
docker-compose logs db

# Últimas 50 líneas
docker-compose logs --tail 50
```

---

### PASO 6: Inicializar la Base de Datos (2 minutos)

**Primera vez solamente:**

```powershell
# Aplicar esquema (crear tablas)
docker-compose exec api npm run db:schema

# Cargar datos de ejemplo
docker-compose exec api npm run db:seed

# Actualizar contraseña de usuario (requerido)
docker-compose exec api node scripts/update-password.js
```

**¿Qué sucede?**
- Se crean las tablas: usuarios, estudiantes, profesores, calificaciones, etc.
- Se cargan datos de ejemplo para testing
- Se actualiza la contraseña del usuario admin

---

### PASO 7: Acceder a la Aplicación (¡Listo! 🎉)

Abre tu navegador y accede a:

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Web (App Principal)** | http://localhost | Interfaz React |
| **API** | http://localhost:3000 | REST API |
| **API Documentation** | http://localhost:3000/docs | Swagger UI |
| **AI Chatbot** | http://localhost:8000 | FastAPI |
| **AI Documentation** | http://localhost:8000/docs | FastAPI Docs |

---

## 🔓 Login a la Aplicación

**Usuario:** `admin@example.com`
**Contraseña:** La que definiste al ejecutar `update-password.js`

Si deseas cambiarla:
```powershell
docker-compose exec api node scripts/update-password.js
```

---

## 💻 Desarrollo Diario

### Iniciar el día
```powershell
# Inicia Docker Desktop desde tu computadora
# Luego:
docker-compose up -d

# Verifica que todo esté corriendo
docker-compose ps
```

### Durante el desarrollo
Los archivos que edites se reflejan automáticamente gracias a los **volúmenes**:
- `./apps/api/src` → cambios se reflejan en el contenedor
- `./apps/web/src` → cambios se reflejan (en algunos casos requiere rebuild)
- `./ai/` → cambios se reflejan automáticamente

### Acceder a un contenedor
```powershell
# Terminal del API (Node.js)
docker-compose exec api sh

# Terminal del AI (Python)
docker-compose exec ai bash

# MySQL CLI
docker-compose exec db mysql -u root -p root saes2

# Terminal del Web (Nginx)
docker-compose exec web sh
```

### Ejecutar comandos
```powershell
# Build del API
docker-compose exec api npm run build

# Test del API
docker-compose exec api npm test

# Ver logs en tiempo real
docker-compose logs -f api
```

### Finalizar el día
```powershell
# Parar todos los contenedores (datos persisten)
docker-compose down

# O parar sin eliminar nada
docker-compose stop
```

---

## 🔧 Tareas Comunes

### Backup de la Base de Datos
```powershell
# Crear backup
docker-compose exec db mysqldump -u root -p root saes2 > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Restaurar desde backup
docker-compose exec -T db mysql -u root -p root saes2 < backup.sql
```

### Ver datos en la Base de Datos
```powershell
# Conectar a MySQL
docker-compose exec db mysql -u root -p root saes2

# Dentro de MySQL:
SHOW TABLES;
SELECT * FROM usuarios LIMIT 5;
DESC usuarios;
EXIT;
```

### Reconstruir después de cambiar dependencias
```powershell
# Si cambias package.json o requirements.txt
docker-compose build --no-cache

# Luego reinicia
docker-compose down
docker-compose up -d
```

### Limpiar todo y empezar de cero
```powershell
# Eliminar contenedores, volúmenes y redes
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Iniciar de cero
docker-compose up -d

# Esperar e inicializar BD
docker-compose exec api npm run db:schema
docker-compose exec api npm run db:seed
```

---

## 🆘 Troubleshooting

### El puerto 3306 está en uso
```powershell
# Ver qué usa el puerto
netstat -ano | findstr :3306

# Matar el proceso (si quieres)
taskkill /PID <PID> /F

# O cambiar en .env
DB_PORT=3307
```

### La BD no inicia
```powershell
# Ver logs
docker-compose logs db

# Limpiar y reiniciar
docker-compose down -v
docker-compose up -d db

# Esperar 30 segundos
docker-compose ps
```

### El API no conecta a la BD
```powershell
# Verificar que la BD está sana
docker-compose ps

# Ver logs
docker-compose logs api

# Reiniciar API
docker-compose restart api
```

### La web no carga los datos del API
```powershell
# Verificar que API está respondiendo
curl http://localhost:3000/health

# Ver logs del Nginx
docker-compose logs web

# Reconstruir web
docker-compose build --no-cache web
docker-compose up -d web
```

---

## 🎯 Estructura de la Aplicación (dentro de Docker)

```
Dentro del Contenedor:
/app/
├── apps/
│   ├── api/          → Express.js + TypeScript
│   │   ├── src/
│   │   ├── dist/     → Compilado
│   │   └── package.json
│   └── web/          → React + Vite
│       ├── src/
│       ├── dist/     → Build producción
│       └── package.json
├── packages/
│   └── shared/       → Código compartido
├── scripts/
│   ├── create-admin.js
│   ├── run-schema.js
│   ├── run-seeders.js
│   └── update-password.js
└── database/
    ├── schema/       → Estructura BD
    └── seeders/      → Datos de ejemplo
```

---

## 📊 Arquitectura

```
Internet
   ↓
[Nginx - Puerto 80]
   ├─ GET / → React App
   ├─ POST /api/login → Express API
   ├─ GET /api/usuarios → Express API
   └─ POST /ai/chat → FastAPI
        ↓
   [Express API - Puerto 3000]
   [FastAPI - Puerto 8000]
        ↓
   [MySQL - Puerto 3306]
```

---

## ✅ Checklist de Instalación Exitosa

- [ ] Docker Desktop instalado y corriendo
- [ ] `.env` creado y configurado
- [ ] `docker-compose build` completó sin errores
- [ ] `docker-compose up -d` inició todos los servicios
- [ ] `docker-compose ps` muestra 5 contenedores "Up (healthy)"
- [ ] `http://localhost` carga sin errores
- [ ] `docker-compose exec api npm run db:schema` ejecutó correctamente
- [ ] `docker-compose exec api npm run db:seed` ejecutó correctamente
- [ ] `docker-compose exec api node scripts/update-password.js` ejecutó correctamente
- [ ] Puedo hacer login en http://localhost con admin@example.com
- [ ] Accedo a la API en http://localhost:3000/docs

---

## 🚀 Próximos Pasos

1. **Ahora que todo está funcionando:**
   - Explora la interfaz
   - Haz login
   - Prueba las funcionalidades

2. **Para desarrollo:**
   - Lee [DOCKER_COMANDOS.md](./DOCKER_COMANDOS.md) para más comandos útiles
   - Usa `docker-compose exec api sh` para debugging
   - Modifica archivos en `./apps/api/src` - se reflejan automáticamente

3. **Para producción:**
   - Lee [DOCKER_SETUP.md](./DOCKER_SETUP.md)
   - Usa `docker-compose.prod.yml`
   - Configura variables de producción en `.env.prod`

---

## 📞 Comandos Rápidos

```powershell
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Entrar en API
docker-compose exec api sh

# Entrar en BD
docker-compose exec db mysql -u root -p root saes2

# Parar
docker-compose down

# Limpiar todo
docker-compose down -v
```

---

## 🎉 ¡Felicidades!

**Has instalado exitosamente SAES2 con Docker.**

Todo lo que ves corriendo localmente funciona exactamente igual en:
- ✅ Computadora de otros developers
- ✅ Servidor de staging
- ✅ Servidor de producción

Esto es uno de los **mayores beneficios de Docker**.

---

## 📚 Documentación Adicional

- [DOCKER_SETUP.md](./DOCKER_SETUP.md) - Guía completa
- [DOCKER_COMANDOS.md](./DOCKER_COMANDOS.md) - Referencia rápida
- [DOCKER_QUICK_START.md](./DOCKER_QUICK_START.md) - Inicio en 3 pasos

---

**¡A desarrollar! 🚀**

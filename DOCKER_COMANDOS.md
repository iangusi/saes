# 🚀 DOCKER - REFERENCIA RÁPIDA POR CASO DE USO

## 📋 Tabla de Contenidos
- [Inicio Rápido](#inicio-rápido)
- [Desarrollo](#desarrollo)
- [Debugging](#debugging)
- [Base de Datos](#base-de-datos)
- [Producción](#producción)
- [Limpieza](#limpieza)

---

## Inicio Rápido

```bash
# Primera vez: copiar variables de entorno
cp .env.docker .env

# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Verificar que están corriendo
docker-compose ps

# Ver si hay errores
docker-compose logs
```

**Resultado esperado:**
```
CONTAINER ID   IMAGE            STATUS      PORTS
xxx            saes2-db         Up 1m       127.0.0.1:3306->3306/tcp
xxx            saes2-api        Up 1m       0.0.0.0:3000->3000/tcp
xxx            saes2-ai         Up 1m       0.0.0.0:8000->8000/tcp
xxx            saes2-web        Up 1m       0.0.0.0:80->80/tcp
```

---

## Desarrollo

### Ver logs
```bash
# Todos los servicios
docker-compose logs -f

# Servicio específico
docker-compose logs -f api
docker-compose logs -f ai
docker-compose logs -f web
docker-compose logs -f db

# Últimas 50 líneas
docker-compose logs -f --tail 50 api

# Con timestamps
docker-compose logs -f -t api
```

### Entrar en un contenedor
```bash
# Shell Node.js (API)
docker-compose exec api sh
docker-compose exec api bash
cd /app
npm run build
exit

# Shell Python (AI)
docker-compose exec ai bash
python app.py
exit

# Shell Nginx (Web)
docker-compose exec web sh

# MySQL CLI
docker-compose exec db mysql -u root -p root saes2
SHOW TABLES;
exit
```

### Ejecutar comandos en contenedor
```bash
# Ejecutar migrations/schema
docker-compose exec api npm run db:schema

# Ejecutar seeders
docker-compose exec api npm run db:seed

# Ambos
docker-compose exec api npm run db:schema && npm run db:seed

# Crear admin
docker-compose exec api npm run db:create-admin

# Ejecutar tests
docker-compose exec api npm test
```

### Reconstruir imagen después de cambios
```bash
# Solo si cambiaste package.json o Dockerfile
docker-compose build api

# Sin caché
docker-compose build --no-cache api

# Luego reiniciar
docker-compose down
docker-compose up -d
```

### Hot reload (Desarrollo)
```bash
# Editar ./apps/api/src/app.ts
# La aplicación debería detectar cambios automáticamente
# porque tenemos volumen mapeado

# Verificar que funciona
docker-compose logs -f api | grep "restarted"
```

---

## Debugging

### Verificar salud de servicios
```bash
# Estado detallado
docker-compose ps

# Evento de logs de un servicio específico
docker-compose logs db --tail 100

# Ver si el API está respondiendo
curl http://localhost:3000/health

# Ver si el AI está respondiendo
curl http://localhost:8000/docs

# Ver si el web carga
curl http://localhost | head -20
```

### Revisar variables de entorno en contenedor
```bash
# Variables en API
docker-compose exec api env | grep DB_

# Variables en AI
docker-compose exec ai env | grep GROQ_

# Ver todo
docker-compose exec api env | sort
```

### Ver archivos en contenedor
```bash
# Ver contenido de app.ts
docker-compose exec api cat /app/apps/api/src/app.ts

# Listar archivos
docker-compose exec api ls -la /app/apps/api/src/

# Ver logs de Node
docker-compose exec api cat /app/logs/app.log
```

### Conectar a base de datos desde fuera
```bash
# Desde tu computadora (si MySQL está expuesto)
mysql -h 127.0.0.1 -P 3306 -u root -p root saes2

# O usar la CLI dentro del contenedor
docker-compose exec db mysql -u root -p root -e "SELECT * FROM usuarios LIMIT 5;"
```

### Revisar uso de recursos
```bash
# CPU, memoria, I/O
docker stats

# Específicamente un servicio
docker stats saes2-api saes2-db

# Sin stream (una sola captura)
docker stats --no-stream
```

---

## Base de Datos

### Inicializar BD
```bash
# Crear tablas
docker-compose exec api npm run db:schema

# Insertar datos de ejemplo
docker-compose exec api npm run db:seed

# Ambos pasos
docker-compose up -d && sleep 10 && \
docker-compose exec api npm run db:schema && \
docker-compose exec api npm run db:seed
```

### Backup de datos
```bash
# Hacer backup
docker-compose exec db mysqldump -u root -p root saes2 > backup.sql

# Hacer backup comprimido
docker-compose exec db mysqldump -u root -p root saes2 | gzip > backup.sql.gz

# Restaurar desde backup
docker-compose exec db mysql -u root -p root saes2 < backup.sql

# Restaurar desde backup comprimido
gunzip -c backup.sql.gz | docker-compose exec -T db mysql -u root -p root saes2
```

### Consultas directas
```bash
# Ver usuarios
docker-compose exec db mysql -u root -p root -e "USE saes2; SELECT * FROM usuarios;"

# Contar registros
docker-compose exec db mysql -u root -p root -e "USE saes2; SELECT COUNT(*) FROM usuarios;"

# Ver estructura de tabla
docker-compose exec db mysql -u root -p root -e "USE saes2; DESCRIBE usuarios;"

# Ejecutar script SQL
docker-compose exec -T db mysql -u root -p root saes2 < script.sql
```

### Monitorear BD
```bash
# Conexiones activas
docker-compose exec db mysql -u root -p root -e "SHOW PROCESSLIST;"

# Estado del servidor
docker-compose exec db mysql -u root -p root -e "SHOW STATUS;"

# Tamaño de bases de datos
docker-compose exec db mysql -u root -p root -e "SELECT table_schema, ROUND(SUM(data_length+index_length)/1024/1024, 2) FROM information_schema.tables GROUP BY table_schema;"
```

---

## Producción

### Preparar para producción
```bash
# 1. Crear archivo .env.prod con valores seguros
cp .env.docker .env.prod

# 2. Editar .env.prod (especialmente):
#    - DB_PASS: contraseña compleja
#    - JWT_SECRET: clave larga única
#    - GROQ_API_KEY: válida
#    - FRONTEND_URL: dominio real

# 3. Usar docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 4. Verificar logs
docker-compose -f docker-compose.prod.yml logs
```

### Construir imágenes para registry
```bash
# Tag imagen para Docker Hub
docker tag saes2-api:latest username/saes2-api:latest
docker tag saes2-web:latest username/saes2-web:latest
docker tag saes2-ai:latest username/saes2-ai:latest

# Push a Docker Hub
docker push username/saes2-api:latest
docker push username/saes2-web:latest
docker push username/saes2-ai:latest

# O usar GitHub Container Registry
docker tag saes2-api:latest ghcr.io/username/saes2-api:latest
docker push ghcr.io/username/saes2-api:latest
```

### Monitorear producción
```bash
# Ver eventos
docker-compose events

# Ver logs con filtro
docker-compose logs api | grep ERROR

# Generar reporte de salud
docker-compose exec api curl http://localhost:3000/health
docker-compose exec ai curl http://localhost:8000/docs
```

### Actualizar en producción
```bash
# Reconstruir una sola imagen
docker-compose -f docker-compose.prod.yml build api

# O todas
docker-compose -f docker-compose.prod.yml build

# Aplicar cambios sin downtime (si es posible)
docker-compose -f docker-compose.prod.yml up -d --no-deps --build api
```

---

## Limpieza

### Detener servicios
```bash
# Parar sin eliminar
docker-compose stop

# Parar y eliminar (data persiste)
docker-compose down

# Parar, eliminar y limpiar volúmenes (PIERDE DATOS)
docker-compose down -v

# Eliminar también imágenes
docker-compose down -v --rmi all
```

### Limpiar espacio en disco
```bash
# Ver volúmenes
docker volume ls

# Ver imágenes
docker images

# Eliminar imágenes sin usar
docker image prune

# Eliminar volúmenes sin usar
docker volume prune

# Limpieza total (con precaución)
docker system prune -a --volumes
```

### Reconstruir completamente
```bash
# Opción 1: Limpio y nuevo
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Opción 2: Con Makefile
make docker-clean
make docker-build
make docker-up
```

---

## 🔍 Troubleshooting Rápido

| Síntoma | Solución |
|---------|----------|
| **Port X already in use** | Cambiar puerto en .env |
| **Cannot connect to DB** | `docker-compose logs db` + esperar |
| **API crashes al iniciar** | `docker-compose logs api` + revisar .env |
| **Web no carga** | Verificar nginx.conf + `docker-compose logs web` |
| **Groq API error** | Verificar GROQ_API_KEY en .env + internet |
| **Spacio disco bajo** | `docker system prune -a` |
| **Contenedor se reinicia** | Ver logs: `docker-compose logs [service]` |

---

## 📊 Comandos Útiles con Makefile

```bash
make help                  # Ver todos los comandos
make docker-up            # Iniciar
make docker-down          # Parar
make docker-logs          # Ver logs
make docker-shell-api     # Shell en API
make docker-shell-ai      # Shell en AI
make docker-shell-db      # MySQL CLI
make db-init              # Inicializar BD
make docker-clean         # Limpiar todo
make docker-rebuild       # Limpiar y reconstruir
```

---

## 💡 Tips Profesionales

1. **Siempre usar `-f` en producción:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Logs rotativos para no llenar disco:**
   ```bash
   # Ya configurado en docker-compose.prod.yml
   # logging:
   #   driver: "json-file"
   #   options:
   #     max-size: "10m"
   #     max-file: "3"
   ```

3. **Monitoreo con timestamps:**
   ```bash
   docker-compose logs -f -t --tail 100
   ```

4. **Backup automático antes de cambios:**
   ```bash
   docker-compose exec db mysqldump -u root -p root saes2 > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

5. **Recrear un servicio específico sin afectar otros:**
   ```bash
   docker-compose up -d --no-deps --build api
   ```

---

**¡Referencia completa para todas las operaciones Docker! 📚**

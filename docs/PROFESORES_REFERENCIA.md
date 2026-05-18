# Referencia Rápida - Módulo de Profesores

## Archivos Creados

### Backend
- `apps/api/src/modules/teachers/teachers.types.ts` - Tipos e interfaces
- `apps/api/src/modules/teachers/teachers.repository.ts` - Acceso a BD
- `apps/api/src/modules/teachers/teachers.service.ts` - Lógica de negocio
- `apps/api/src/modules/teachers/teachers.controller.ts` - Controladores
- `apps/api/src/modules/teachers/teachers.routes.ts` - Rutas
- `database/schema/002_teachers_schema.sql` - Nuevas tablas

### Frontend
- `apps/web/src/pages/TeacherDashboardPage.tsx` - Panel principal
- `apps/web/src/pages/TeacherSchedulePage.tsx` - Horario
- `apps/web/src/pages/TeacherAttendancePage.tsx` - Asistencia
- `apps/web/src/pages/TeacherGradesPage.tsx` - Calificaciones
- `apps/web/src/pages/TeacherAnnouncementsPage.tsx` - Anuncios
- `apps/web/src/pages/IndexPage.tsx` - Redirección por rol
- `apps/web/src/services/teachers.service.ts` - Cliente API

### Documentación
- `docs/PROFESORES.md` - Documentación completa

## Archivos Modificados

### Backend
- `apps/api/src/app.ts` - Agregado import y ruta de teachers

### Frontend
- `apps/web/src/types/api.types.ts` - Agregados tipos de profesor
- `apps/web/src/app/App.tsx` - Agregadas rutas de profesor
- `apps/web/src/components/Layout.tsx` - Menú adaptado por rol

## Base de Datos

Ejecutar:
```bash
mysql -u root -p saes2 < database/schema/002_teachers_schema.sql
```

### Nuevas Tablas
- `asistencia` - Registro de asistencia
- `anuncio` - Anuncios de profesores
- `anuncio_lectura` - Seguimiento de lectura (opcional)

## Endpoints

```
GET    /api/teachers/me                          # Perfil
GET    /api/teachers/me/schedule                 # Horario
GET    /api/teachers/groups/:groupId/students    # Estudiantes
GET    /api/teachers/groups/:groupId/grades      # Calificaciones
POST   /api/teachers/attendance                  # Registrar asistencia
PUT    /api/teachers/grades                      # Actualizar calificación
POST   /api/teachers/announcements               # Crear anuncio
GET    /api/teachers/groups/:groupId/announcements # Anuncios
```

## Rutas

```
/teacher/dashboard      # Panel principal
/teacher/schedule       # Horario y grupos
/teacher/attendance     # Asistencia
/teacher/grades         # Calificaciones
/teacher/announcements  # Anuncios
```

## Validaciones

### Asistencia
- ✓ Fecha YYYY-MM-DD
- ✓ Mínimo 1 registro
- ✓ Profesor dueño del grupo

### Calificaciones
- ✓ Rango 0-10
- ✓ No editar evaluaciones cerradas
- ✓ Profesor dueño del grupo

### Anuncios
- ✓ Título: requerido, máx 150 caracteres
- ✓ Contenido: requerido
- ✓ Profesor dueño del grupo

## Middleware

```typescript
authMiddleware           // Verifica JWT
requireRole('profesor')  // Verifica rol
```

## Tipos Principales

- `TeacherProfile` - Información del profesor
- `TeacherGroup` - Grupo con horarios
- `TeacherSchedule` - Horario completo
- `StudentFromGroup` - Estudiante en grupo
- `TeacherGradeRecord` - Calificación
- `TeacherAnnouncement` - Anuncio

## Testing Checklist

- [ ] Login como profesor
- [ ] Ver dashboard con 5 módulos
- [ ] Ver horario de grupos
- [ ] Marcar asistencia
- [ ] Editar calificaciones
- [ ] Crear anuncio
- [ ] Verificar estudiantes ven anuncio
- [ ] Verificar solo profesor puede editar

## Notas

- Sistema detecta rol automáticamente en login
- Layout muestra menú diferente para profesor
- Todas las operaciones requieren autenticación
- Las tablas tienen índices para performance
- Soporta dispositivos móviles


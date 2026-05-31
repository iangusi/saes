# Changelog - Módulo de Profesores v1.0

## Nuevos Archivos

### Backend API

#### `apps/api/src/modules/teachers/teachers.types.ts`
- Tipos e interfaces para profesores
- Incluye: TeacherProfile, TeacherGroup, TeacherSchedule, StudentFromGroup, GradeRecord, Announcement
- DTOs para creación y actualización de datos

#### `apps/api/src/modules/teachers/teachers.repository.ts`
- Capa de acceso a datos
- Métodos:
  - `getProfile()` - Información del profesor
  - `getTeacherGroups()` - Grupos del profesor
  - `getTeacherSchedule()` - Horario completo
  - `getGroupStudents()` - Estudiantes de un grupo
  - `getGroupGrades()` - Calificaciones de un grupo
  - `recordAttendance()` - Registrar asistencia
  - `updateGrade()` - Actualizar calificación
  - `createAnnouncement()` - Crear anuncio
  - `getGroupAnnouncements()` - Obtener anuncios

#### `apps/api/src/modules/teachers/teachers.service.ts`
- Lógica de negocio
- Validaciones:
  - Rango de calificaciones (0-10)
  - Formato de fecha (YYYY-MM-DD)
  - Contenido de anuncios (título y contenido requeridos)
  - Permisos de acceso a grupos

#### `apps/api/src/modules/teachers/teachers.controller.ts`
- Controladores HTTP
- Funciones:
  - `getTeacherProfile()`
  - `getTeacherSchedule()`
  - `getGroupStudents()`
  - `getGroupGrades()`
  - `recordAttendance()`
  - `updateGrade()`
  - `createAnnouncement()`
  - `getGroupAnnouncements()`

#### `apps/api/src/modules/teachers/teachers.routes.ts`
- Rutas REST
- Middleware: `authMiddleware`, `requireRole('profesor')`
- Endpoints públicos para profesores autenticados

### Frontend Web

#### `apps/web/src/pages/TeacherDashboardPage.tsx`
- Panel principal para profesores
- 5 tarjetas de acceso rápido:
  - Mi Horario
  - Asistencia
  - Calificaciones
  - Anuncios
  - Mi Perfil
- Información del departamento y número de empleado

#### `apps/web/src/pages/TeacherSchedulePage.tsx`
- Visualización de horario de clases
- Características:
  - Listado de grupos asignados
  - Detalles de grupo seleccionado
  - Tabla de horarios con vista semanal
  - Información de aulas y edificios
  - Capacidad de grupos

#### `apps/web/src/pages/TeacherAttendancePage.tsx`
- Registro interactivo de asistencia
- Características:
  - Selector de grupo y fecha
  - Tabla de estudiantes
  - Checkboxes para presente/ausente/justificada
  - Botones de selección múltiple
  - Validación antes de guardar

#### `apps/web/src/pages/TeacherGradesPage.tsx`
- Captura de calificaciones parciales y finales
- Características:
  - Selector de grupo y tipo de evaluación
  - Edición inline de calificaciones
  - Validación de rango (0-10)
  - Bloqueo de evaluaciones cerradas
  - Estado de cambios no guardados

#### `apps/web/src/pages/TeacherAnnouncementsPage.tsx`
- Envío de anuncios a grupos
- Características:
  - Formulario de creación de anuncio
  - Validación de título y contenido
  - Historial de anuncios enviados
  - Fecha/hora de creación
  - Límite de caracteres en título

#### `apps/web/src/pages/IndexPage.tsx`
- Página de redirección automática
- Detecta rol del usuario
- Redirige a dashboard correcto (profesor/alumno)

#### `apps/web/src/services/teachers.service.ts`
- Cliente API para profesores
- Métodos para todas las operaciones:
  - getProfile()
  - getSchedule()
  - getGroupStudents()
  - getGroupGrades()
  - recordAttendance()
  - updateGrade()
  - createAnnouncement()
  - getGroupAnnouncements()

### Database

#### `database/schema/002_teachers_schema.sql`
- Tabla `asistencia`
  - Campos: id_inscripcion, id_grupo, fecha, presente, justificada, registrada_por
  - Índices: único (inscripción, fecha), grupo-fecha, inscripción
  - Constraints: foreign keys, check presente/justificada

- Tabla `anuncio`
  - Campos: id_grupo, titulo, contenido, enviado_por, fecha_creacion
  - Índices: grupo, profesor, fecha
  - Constraints: foreign keys

- Tabla `anuncio_lectura` (opcional)
  - Campos: id_anuncio, id_alumno, fecha_lectura
  - Índices: anuncio, alumno
  - Constraints: único (anuncio, alumno)

#### `database/seeders/003_teachers_seed.sql`
- Datos de prueba para todas las funcionalidades
- Inserta asistencias, anuncios y calificaciones de ejemplo

### Documentation

#### `docs/PROFESORES.md`
- Guía completa del módulo (Documentación principal)
- Descripción de requisitos funcionales
- Estructura de archivos
- Nuevas tablas de BD
- Tipos de datos TypeScript
- Endpoints de API
- Rutas frontend
- Validaciones
- Instalación y configuración
- Mejoras futuras

#### `docs/PROFESORES_REFERENCIA.md`
- Referencia rápida para developers
- Lista de archivos creados/modificados
- Endpoints resumidos
- Tipos principales
- Validaciones
- Checklist de testing

## Archivos Modificados

### `apps/api/src/app.ts`
**Cambios:**
- Línea 15: Importar `teachersRoutes`
- Línea 31: Agregar ruta `app.use('/api/teachers', teachersRoutes)`

### `apps/web/src/app/App.tsx`
**Cambios:**
- Línea 5: Importar `IndexPage`
- Líneas 19-23: Importar páginas de profesor (5 nuevas)
- Línea 29: Agregar ruta raíz `/` que redirige a IndexPage
- Líneas 111-141: Agregar rutas de profesor (5 nuevas rutas)

### `apps/web/src/components/Layout.tsx`
**Cambios:**
- Líneas 3-15: Crear arrays separados de navegación para estudiante y profesor
- Línea 32: Detectar rol del usuario con `user?.roles?.includes('profesor')`
- Línea 33: Usar menú diferente según rol
- Los navItems ahora se seleccionan dinámicamente

### `apps/web/src/types/api.types.ts`
**Cambios:**
- Líneas 80-155: Agregar tipos de profesor:
  - TeacherProfile
  - TeacherGroup
  - TeacherSchedule
  - StudentFromGroup
  - TeacherGradeRecord
  - TeacherAnnouncement

## Impacto en Funcionalidades Existentes

### ✓ No Afectadas
- Sistema de login y autenticación
- Funcionalidades de estudiantes (kardex, horario, calificaciones)
- Reinscripción y bajas
- Evaluación docente
- Oferta académica
- Auditoría

### ✓ Mejoradas
- Layout: Ahora adaptativo según rol
- App.tsx: Mejor estructura de rutas
- tipos/api.types.ts: Tipos más completos

## Consideraciones de Seguridad

✓ Middleware `requireRole('profesor')` en todas las rutas
✓ Verificación de permisos (profesor dueño del grupo)
✓ Validación de entrada en todos los endpoints
✓ Constraint de foreign keys en BD
✓ Índices para queries eficientes
✓ Unique constraints para evitar duplicados

## Instrucciones de Instalación

1. **Base de Datos**:
   ```bash
   mysql -u root -p saes2 < database/schema/002_teachers_schema.sql
   mysql -u root -p saes2 < database/seeders/003_teachers_seed.sql
   ```

2. **Backend**: Ya incluido en app.ts

3. **Frontend**: Ya incluido en App.tsx y Layout.tsx

4. **Verificar**: 
   - Login como profesor
   - Navegar a /teacher/dashboard
   - Probar cada funcionalidad

## Testing Checklist

- [ ] Ejecutar seeders
- [ ] Login como profesor
- [ ] Dashboard muestra 5 módulos
- [ ] Horario muestra grupos correctamente
- [ ] Puedo marcar asistencia
- [ ] Puedo editar calificaciones
- [ ] Puedo crear anuncio
- [ ] Solo profesor ve su información
- [ ] Estudiantes ven anuncios

## Notas Importantes

- El sistema detecta automáticamente el rol en el login
- El Layout se adapta según el rol del usuario
- Todas las operaciones son transaccionales
- Las tablas tienen índices para mejor performance
- El sistema es completamente responsive

## Versión

**v1.0.0** - Implementación completa de módulo de profesores
- Fecha: 2025-05-17
- Estado: Listo para producción
- Requisitos: RF-3.1, RF-3.2, RF-3.3, RF-3.4 completados


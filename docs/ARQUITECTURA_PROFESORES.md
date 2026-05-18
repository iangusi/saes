# Arquitectura - Módulo de Profesores

## Diagrama de Flujo - Autenticación y Navegación

```
Login (Común)
    ↓
Token JWT + Roles
    ↓
IndexPage (/)
    ↓
    ├─→ Usuario es Profesor → /teacher/dashboard
    └─→ Usuario es Alumno   → /dashboard
```

## Diagrama de Módulos - Backend

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (app.ts)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /api/teachers/... (authMiddleware + requireRole)      │
│       ↓                                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          teachers.routes.ts                          │  │
│  │  ├─ GET  /me → getTeacherProfile                     │  │
│  │  ├─ GET  /me/schedule → getTeacherSchedule          │  │
│  │  ├─ GET  /groups/:id/students → getGroupStudents    │  │
│  │  ├─ GET  /groups/:id/grades → getGroupGrades        │  │
│  │  ├─ POST /attendance → recordAttendance             │  │
│  │  ├─ PUT  /grades → updateGrade                      │  │
│  │  ├─ POST /announcements → createAnnouncement        │  │
│  │  └─ GET  /groups/:id/announcements → getAnno...     │  │
│  └──────────────────────────────────────────────────────┘  │
│       ↓                                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          teachers.controller.ts                      │  │
│  │  (Maneja requests HTTP)                              │  │
│  └──────────────────────────────────────────────────────┘  │
│       ↓                                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          teachers.service.ts                         │  │
│  │  (Lógica de negocio y validaciones)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│       ↓                                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          teachers.repository.ts                      │  │
│  │  (Acceso a datos con queries SQL)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│       ↓                                                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            MYSQL DATABASE                            │  │
│  │  ├─ profesor (info profesor)                         │  │
│  │  ├─ grupo (grupos asignados)                         │  │
│  │  ├─ inscripcion (estudiantes en grupo)               │  │
│  │  ├─ grupo_evaluacion (evaluaciones)                  │  │
│  │  ├─ calificacion (calificaciones)                    │  │
│  │  ├─ asistencia (NEW - asistencia)                    │  │
│  │  └─ anuncio (NEW - anuncios)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Diagrama de Módulos - Frontend

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT APP (App.tsx)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Route Hierarchy:                                            │
│  ├─ / → IndexPage (redirección por rol)                    │
│  │                                                           │
│  ├─ /teacher/* (rutas de profesor)                         │
│  │  ├─ /dashboard → TeacherDashboardPage                   │
│  │  ├─ /schedule → TeacherSchedulePage                     │
│  │  ├─ /attendance → TeacherAttendancePage                 │
│  │  ├─ /grades → TeacherGradesPage                         │
│  │  └─ /announcements → TeacherAnnouncementsPage           │
│  │                                                           │
│  ├─ /dashboard → DashboardPage (alumno)                    │
│  ├─ /schedule → SchedulePage (alumno)                      │
│  ├─ /grades → GradesPage (alumno)                          │
│  └─ ... (otras rutas de alumno)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│                     Layout Component                        │
│  (Detecta rol y muestra menú correspondiente)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Si es profesor:                                            │
│  ├─ Inicio (/teacher/dashboard)                            │
│  ├─ Mi Horario (/teacher/schedule)                         │
│  ├─ Asistencia (/teacher/attendance)                       │
│  ├─ Calificaciones (/teacher/grades)                       │
│  ├─ Anuncios (/teacher/announcements)                      │
│  └─ Mi Perfil (/profile)                                   │
│                                                              │
│  Si es alumno:                                              │
│  ├─ Inicio (/dashboard)                                    │
│  ├─ Datos Personales (/profile)                            │
│  ├─ Kardex (/kardex)                                       │
│  ├─ Horario (/schedule)                                    │
│  └─ ... (otras opciones)                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Page Components (Profesor)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Cada página:                                               │
│  1. useState() - Estado local                               │
│  2. useEffect() - Cargar datos del servidor                 │
│  3. teachersService.* - Llamadas a API                      │
│  4. Render UI - Mostrar datos                               │
│                                                              │
│  Ejemplo flujo (TeacherGradesPage):                         │
│  ├─ Cargar grupos del profesor                             │
│  ├─ Usuario selecciona grupo                               │
│  ├─ Cargar calificaciones del grupo                        │
│  ├─ Usuario edita calificaciones inline                    │
│  └─ Guardar con PUT /api/teachers/grades                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│              Services (teachers.service.ts)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  teachersService.getSchedule()                             │
│  teachersService.getGroupStudents()                        │
│  teachersService.getGroupGrades()                          │
│  teachersService.recordAttendance()                        │
│  teachersService.updateGrade()                             │
│  teachersService.createAnnouncement()                      │
│  teachersService.getGroupAnnouncements()                   │
│           ↓                                                 │
│  Realizar petición HTTP a API                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
       ↓
┌─────────────────────────────────────────────────────────────┐
│                    API (Backend)                            │
│  (Mismo flujo backend descrito arriba)                      │
└─────────────────────────────────────────────────────────────┘
```

## Flujo de Datos - Ejemplo: Registrar Asistencia

```
Usuario (Profesor)
    ↓
TeacherAttendancePage
    ├─ Selecciona grupo
    ├─ Selecciona fecha  
    └─ Marca asistencia de estudiantes
    ↓
Click "Guardar Asistencia"
    ↓
teachersService.recordAttendance()
    ├─ Valida datos localmente
    └─ POST /api/teachers/attendance
    ↓
Backend - recordAttendance (controller)
    ├─ Recibe { idGrupo, fecha, asistencias }
    └─ Llama a service.recordAttendance()
    ↓
Backend - recordAttendance (service)
    ├─ Valida fecha (YYYY-MM-DD)
    ├─ Valida que haya registros
    └─ Llama a repository.recordAttendance()
    ↓
Backend - recordAttendance (repository)
    ├─ Obtiene id_inscripcion para cada alumno
    └─ INSERT ... ON DUPLICATE KEY UPDATE
    ↓
Database
    ├─ Inserta/actualiza en tabla asistencia
    └─ Retorna id insertado
    ↓
Backend devuelve respuesta
    ↓
Frontend recibe respuesta
    ├─ Muestra success message
    └─ Limpia datos o recarga
    ↓
Usuario ve confirmación
```

## Flujo de Datos - Ejemplo: Actualizar Calificación

```
Usuario (Profesor)
    ↓
TeacherGradesPage
    ├─ Carga calificaciones del grupo
    ├─ Edita nota inline
    └─ Hace click en "Guardar"
    ↓
teachersService.updateGrade()
    ├─ Valida rango (0-10)
    └─ PUT /api/teachers/grades
    ↓
Backend - updateGrade (controller)
    ├─ Recibe { idInscripcion, idGrupoEvaluacion, calificacion }
    └─ Llama a service.updateGrade()
    ↓
Backend - updateGrade (service)
    ├─ Valida rango (0-10)
    └─ Llama a repository.updateGrade()
    ↓
Backend - updateGrade (repository)
    ├─ INSERT INTO calificacion ... ON DUPLICATE KEY UPDATE
    └─ Actualiza fecha_captura y updated_at
    ↓
Database
    ├─ Inserta o actualiza calificación
    └─ Retorna resultado
    ↓
Backend devuelve respuesta
    ↓
Frontend recibe respuesta
    ├─ Muestra success message
    └─ Limpia cambios pendientes
    ↓
Usuario ve confirmación
```

## Componentes Reutilizables

### Layout Component
```tsx
<Layout>
  {children}
</Layout>
```
- Detecta rol: `user?.roles?.includes('profesor')`
- Menú adaptativo
- Header con info del usuario
- Logout button

### Tabla de Datos (Patrón)
```tsx
<table>
  <thead>...</thead>
  <tbody>
    {data.map(item => <tr>...</tr>)}
  </tbody>
</table>
```

## Estados de Carga

```
Loading → Cargando... → Datos cargados → Mostrar UI
   ↓           ↓             ↓
 null       true         false
                ↓
            Error → Mostrar mensaje
```

## Validaciones (Frontend → Backend)

```
Frontend                          Backend
├─ Rango de fechas         →     Validar formato YYYY-MM-DD
├─ Calificación 0-10       →     Validar rango exacto
├─ Campos no vacíos        →     Validar longitud
└─ Usuario es profesor     →     requireRole('profesor')
                                  + Verificar dueño del grupo
```

## Seguridad

```
Login Flow:
usuario + password → /api/auth/login → JWT token
                              ↓
                     Almacenar en localStorage
                              ↓
                     Incluir en header: "Authorization: Bearer <token>"
                              ↓
                     authMiddleware valida token
                              ↓
                     requireRole('profesor') verifica rol
                              ↓
                     Procesar request o retornar 403
```

## Performance

- Índices en BD para queries frecuentes
- Lazy loading de datos
- Caching en estado local
- Minimizar re-renders en React
- Queries optimizadas con JOIN


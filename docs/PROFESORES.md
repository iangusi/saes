# Guía de Funcionalidades para Profesores - SAES 2.0

## Descripción General

Este documento describe la implementación completa de las funcionalidades para profesores en el sistema SAES 2.0, incluyendo:
- Consulta de horario y grupos asignados
- Registro de asistencia de estudiantes
- Captura y modificación de calificaciones
- Envío de anuncios y avisos

---

## Requisitos Funcionales Implementados

### RF-3.1: Consulta de Horario y Grupos Asignados
**Descripción**: El profesor puede consultar su horario de clases y los grupos que tiene asignados en el periodo activo.

**Implementación**:
- Página: `TeacherSchedulePage` (`/teacher/schedule`)
- Muestra:
  - Lista de grupos asignados del periodo activo
  - Horarios por grupo (día, hora, aula, edificio)
  - Vista por día consolidada
  - Información de capacidad de grupos

**Acceso**:
```
GET /api/teachers/me/schedule
```

---

### RF-3.2: Registro de Asistencia
**Descripción**: El profesor puede acceder a la lista de alumnos inscritos en cada uno de sus grupos y registrar asistencia desde cualquier dispositivo.

**Implementación**:
- Página: `TeacherAttendancePage` (`/teacher/attendance`)
- Características:
  - Selector de grupo
  - Selector de fecha
  - Tabla interactiva de estudiantes
  - Marcado individual de asistencia/ausencia
  - Opción de justificación de faltas
  - Botones de selección múltiple (todos presentes/todos ausentes)
  - Guardado en BD

**Acceso**:
```
GET /api/teachers/groups/:groupId/students
POST /api/teachers/attendance
```

---

### RF-3.3: Captura y Modificación de Calificaciones
**Descripción**: El profesor puede capturar y modificar calificaciones parciales y finales de sus estudiantes dentro de las ventanas de tiempo habilitadas.

**Implementación**:
- Página: `TeacherGradesPage` (`/teacher/grades`)
- Características:
  - Selector de grupo
  - Filtro por tipo de evaluación
  - Tabla con estudiantes y sus calificaciones
  - Edición inline de calificaciones
  - Validación de rango (0-10)
  - Bloqueo de evaluaciones cerradas
  - Historial de cambios

**Acceso**:
```
GET /api/teachers/groups/:groupId/grades
PUT /api/teachers/grades
```

---

### RF-3.4: Envío de Anuncios
**Descripción**: El profesor puede enviar anuncios, recordatorios o avisos oficiales de forma masiva a los grupos que tiene asignados.

**Implementación**:
- Página: `TeacherAnnouncementsPage` (`/teacher/announcements`)
- Características:
  - Selector de grupo
  - Formulario de creación de anuncios
  - Validación de campos
  - Historial de anuncios enviados
  - Visualización de fecha/hora de creación
  - Envío inmediato a estudiantes

**Acceso**:
```
POST /api/teachers/announcements
GET /api/teachers/groups/:groupId/announcements
```

---

## Estructura de Carpetas y Archivos

### Backend (API)

```
apps/api/src/modules/teachers/
├── teachers.types.ts          # Tipos e interfaces
├── teachers.repository.ts     # Acceso a BD
├── teachers.service.ts        # Lógica de negocio
├── teachers.controller.ts     # Controladores
└── teachers.routes.ts         # Rutas y middleware

database/schema/
├── 001_schema.sql            # Schema original
└── 002_teachers_schema.sql   # Nuevas tablas (asistencia, anuncios)
```

### Frontend (Web)

```
apps/web/src/
├── pages/
│   ├── TeacherDashboardPage.tsx      # Dashboard de profesor
│   ├── TeacherSchedulePage.tsx       # Consulta de horario
│   ├── TeacherAttendancePage.tsx     # Registro de asistencia
│   ├── TeacherGradesPage.tsx         # Captura de calificaciones
│   └── TeacherAnnouncementsPage.tsx  # Envío de anuncios
├── services/
│   └── teachers.service.ts           # Cliente API
├── types/
│   └── api.types.ts                  # Tipos de datos
└── components/
    └── Layout.tsx                    # Actualizado para profesor
```

---

## Nuevas Tablas en Base de Datos

### `asistencia`
Registro de asistencia de estudiantes por grupo y fecha.

```sql
CREATE TABLE asistencia (
  id_asistencia INT PRIMARY KEY,
  id_inscripcion INT,
  id_grupo INT,
  fecha DATE,
  presente TINYINT(1),
  justificada TINYINT(1),
  observaciones TEXT,
  registrada_por INT,
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE (id_inscripcion, fecha)
)
```

### `anuncio`
Anuncios y avisos enviados por profesores a grupos.

```sql
CREATE TABLE anuncio (
  id_anuncio INT PRIMARY KEY,
  id_grupo INT,
  titulo VARCHAR(150),
  contenido TEXT,
  enviado_por INT,
  fecha_creacion DATETIME,
  actualizado_at DATETIME
)
```

### `anuncio_lectura` (Opcional)
Seguimiento de lectura de anuncios por estudiantes.

```sql
CREATE TABLE anuncio_lectura (
  id_lectura INT PRIMARY KEY,
  id_anuncio INT,
  id_alumno INT,
  fecha_lectura DATETIME,
  UNIQUE (id_anuncio, id_alumno)
)
```

---

## Tipos de Datos

### TeacherProfile
```typescript
interface TeacherProfile {
  idProfesor: number;
  numeroEmpleado: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  departamento: string;
  estatus: string;
}
```

### TeacherGroup
```typescript
interface TeacherGroup {
  idGrupo: number;
  claveGrupo: string;
  nombreMateria: string;
  creditosMateria: number;
  cupoMax: number;
  cupoActual: number;
  estatus: string;
  horarios: Array<{
    dia: string;
    horaInicio: string;
    horaFin: string;
    nombreAula: string;
    edificio: string | null;
  }>;
}
```

### StudentFromGroup
```typescript
interface StudentFromGroup {
  idAlumno: number;
  boleta: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
}
```

### TeacherGradeRecord
```typescript
interface TeacherGradeRecord {
  idAlumno: number;
  boleta: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  tipoEvaluacion: string;
  calificacion: number | null;
  cerrada: boolean;
  fechaCaptura: string | null;
}
```

---

## Endpoints de API

### Perfil del Profesor
```
GET /api/teachers/me
Retorna: TeacherProfile
```

### Horario del Profesor
```
GET /api/teachers/me/schedule
Retorna: TeacherSchedule
```

### Estudiantes de un Grupo
```
GET /api/teachers/groups/:groupId/students
Retorna: StudentFromGroup[]
```

### Calificaciones de un Grupo
```
GET /api/teachers/groups/:groupId/grades
Retorna: TeacherGradeRecord[]
```

### Registrar Asistencia
```
POST /api/teachers/attendance
Body: {
  idGrupo: number,
  fecha: string (YYYY-MM-DD),
  asistencias: Array<{
    idAlumno: number,
    presente: boolean,
    justificada?: boolean
  }>
}
```

### Actualizar Calificación
```
PUT /api/teachers/grades
Body: {
  idInscripcion: number,
  idGrupoEvaluacion: number,
  calificacion: number (0-10)
}
```

### Crear Anuncio
```
POST /api/teachers/announcements
Body: {
  idGrupo: number,
  titulo: string,
  contenido: string
}
Retorna: { id: number }
```

### Obtener Anuncios de un Grupo
```
GET /api/teachers/groups/:groupId/announcements
Retorna: TeacherAnnouncement[]
```

---

## Rutas Frontend

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | IndexPage | Redirección automática según rol |
| `/teacher/dashboard` | TeacherDashboardPage | Panel principal |
| `/teacher/schedule` | TeacherSchedulePage | Consulta de horario |
| `/teacher/attendance` | TeacherAttendancePage | Registro de asistencia |
| `/teacher/grades` | TeacherGradesPage | Captura de calificaciones |
| `/teacher/announcements` | TeacherAnnouncementsPage | Envío de anuncios |
| `/profile` | ProfilePage | Perfil del usuario (compartido) |

---

## Middleware y Validaciones

### Autenticación
Todas las rutas requieren:
- `authMiddleware`: Verifica JWT token
- `requireRole('profesor')`: Verifica que el usuario sea profesor

### Validaciones Backend

**Asistencia**:
- Fecha válida en formato YYYY-MM-DD
- Al menos un registro de asistencia
- Profesor debe ser dueño del grupo

**Calificaciones**:
- Rango 0-10
- No se permiten ediciones en evaluaciones cerradas
- Profesor debe ser dueño del grupo

**Anuncios**:
- Título requerido y no vacío (máx 150 caracteres)
- Contenido requerido y no vacío
- Profesor debe ser dueño del grupo

---

## Integración con el Sistema

### Detección de Rol
El sistema detecta automáticamente si el usuario es profesor o alumno:
- En el login, se almacenan los roles en el token JWT
- El Layout muestra diferentes menús según el rol
- Las rutas de profesor requieren `requireRole('profesor')`

### Compatibilidad
- Las funcionalidades de profesor son completamente independientes
- Los estudiantes solo ven sus propias calificaciones, horarios, etc.
- No hay conflicto con funcionalidades existentes

---

## Características Visuales

### Colores y Estilo
- Utiliza la paleta de colores existente (IPN Guinda)
- Mantiene coherencia con el diseño de estudiantes
- Responsive para dispositivos móviles
- Iconos para mejor UX

### Dashboard
- Tarjetas con icono y descripción
- Acceso rápido a todas las funciones
- Información del departamento y número de empleado

### Tablas
- Diseño limpio y moderno
- Filtros y búsqueda (donde aplica)
- Acciones inline (edición, guardado)
- Estados visuales (cerrado, habilitado, etc.)

---

## Instalación y Configuración

### 1. Actualizar Base de Datos
Ejecutar el nuevo script SQL:
```bash
mysql -u root -p saes2 < database/schema/002_teachers_schema.sql
```

### 2. Importar en App.ts (Backend)
```typescript
import { teachersRoutes } from './modules/teachers/teachers.routes';
app.use('/api/teachers', teachersRoutes);
```

### 3. Actualizar App.tsx (Frontend)
```typescript
import { TeacherDashboardPage } from '../pages/TeacherDashboardPage';
// ... otras importaciones

// Agregar rutas en Routes
<Route path="/teacher/dashboard" element={<Layout><TeacherDashboardPage /></Layout>} />
// ... otras rutas de profesor
```

### 4. Actualizar Layout.tsx (Frontend)
El Layout.tsx ya está actualizado para detectar el rol y mostrar el menú correspondiente.

---

## Pruebas Sugeridas

1. **Autenticación**: Login como profesor
2. **Dashboard**: Verificar que muestra los 5 módulos
3. **Horario**: Verificar grupos y horarios correctos
4. **Asistencia**: Marcar estudiantes y guardar
5. **Calificaciones**: Editar y guardar notas
6. **Anuncios**: Crear y visualizar anuncios

---

## Posibles Mejoras Futuras

1. **Reportes**: Generación de reportes de asistencia
2. **Estadísticas**: Gráficos de desempeño por grupo
3. **Notificaciones**: Sistema de notificaciones en tiempo real
4. **Descarga**: Exportar datos a Excel/PDF
5. **Evaluación cruzada**: Permitir co-profesores
6. **Retroalimentación**: Comentarios individuales a estudiantes
7. **Autocalculado**: Cálculo automático de promedios
8. **Historial**: Auditoría completa de cambios

---

## Soporte

Para reportar bugs o sugerir mejoras, contactar al equipo de desarrollo.


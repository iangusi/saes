import { useState, useEffect, useCallback } from 'react';
import {
  adminService,
  Periodo,
  PeriodoDetalle,
  PeriodoProceso,
  CitaAdmin,
  ProcesoTipo,
  CreatePeriodoDto,
  UpdatePeriodoDto,
  CreateProcessTypeDto,
  UpdateProcessTypeDto,
  CreateProcessWindowDto,
  UpdateProcessWindowDto,
  GenerateAppointmentsDto,
  ManualAppointmentDto,
} from '../../services/admin.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Badge({ active }: { active: number }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
        active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function EstatusBadge({ estatus }: { estatus: string }) {
  const color =
    estatus === 'pendiente'
      ? 'bg-yellow-100 text-yellow-700'
      : estatus === 'usada'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {estatus}
    </span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda';
const btnPrimary = 'px-4 py-2 bg-ipn-guinda text-white text-sm font-medium rounded hover:bg-ipn-guinda/90 transition-colors';
const btnSecondary = 'px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors';
const btnDanger = 'px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors';
const btnWarning = 'px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors';

// ─── Process Type Form Modal ──────────────────────────────────────────────────

function ProcessTypeFormModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: ProcesoTipo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(existing?.descripcion ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (existing) {
        const dto: UpdateProcessTypeDto = { nombre, descripcion: descripcion || undefined };
        await adminService.updateProcessType(existing.id_proceso, dto);
      } else {
        const dto: CreateProcessTypeDto = { nombre, descripcion: descripcion || undefined };
        await adminService.createProcessType(dto);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Editar tipo de proceso' : 'Nuevo tipo de proceso'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <Field label="Nombre">
          <input
            className={inputCls}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="ej. captura_calificaciones"
            required
          />
        </Field>
        <Field label="Descripción (opcional)">
          <input
            className={inputCls}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción breve del proceso"
          />
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Guardando...' : existing ? 'Guardar cambios' : 'Crear tipo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Process Types Section ────────────────────────────────────────────────────

function ProcessTypesSection({
  processTypes,
  onRefresh,
}: {
  processTypes: ProcesoTipo[];
  onRefresh: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ProcesoTipo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (pt: ProcesoTipo) => {
    if (!confirm(`¿Eliminar el tipo de proceso "${pt.nombre}"? Solo es posible si no tiene ventanas asociadas.`)) return;
    setDeletingId(pt.id_proceso);
    try {
      await adminService.deleteProcessType(pt.id_proceso);
      onRefresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'No se pudo eliminar el tipo de proceso');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm mb-6">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <span className="font-semibold text-gray-800">Tipos de proceso</span>
          <span className="text-sm text-gray-500 ml-2">({processTypes.length} registrados)</span>
        </div>
        <span className={`text-gray-400 transform transition-transform ${collapsed ? '' : 'rotate-90'}`}>▶</span>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 border-t">
          <div className="flex justify-end mt-3 mb-3">
            <button onClick={() => setShowCreate(true)} className={btnPrimary}>
              + Nuevo tipo
            </button>
          </div>
          {processTypes.length === 0 ? (
            <p className="text-sm text-gray-400">No hay tipos de proceso registrados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="pb-2">Nombre</th>
                  <th className="pb-2">Descripción</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {processTypes.map((pt) => (
                  <tr key={pt.id_proceso} className="border-t">
                    <td className="py-2 pr-4 font-medium">{pt.nombre}</td>
                    <td className="py-2 pr-4 text-gray-500">{pt.descripcion ?? '—'}</td>
                    <td className="py-2 flex gap-2">
                      <button
                        onClick={() => setEditing(pt)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(pt)}
                        disabled={deletingId === pt.id_proceso}
                        className="text-red-500 hover:underline text-xs"
                      >
                        {deletingId === pt.id_proceso ? '...' : 'Eliminar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showCreate && (
        <ProcessTypeFormModal
          onClose={() => setShowCreate(false)}
          onSaved={onRefresh}
        />
      )}
      {editing && (
        <ProcessTypeFormModal
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

// ─── Period Form Modal ────────────────────────────────────────────────────────

function PeriodFormModal({
  period,
  onClose,
  onSaved,
}: {
  period?: Periodo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(period?.nombre ?? '');
  const [fechaInicio, setFechaInicio] = useState(period?.fecha_inicio ?? '');
  const [fechaFin, setFechaFin] = useState(period?.fecha_fin ?? '');
  const [activo, setActivo] = useState(period ? Boolean(period.activo) : false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dto: CreatePeriodoDto | UpdatePeriodoDto = { nombre, fechaInicio, fechaFin, activo };
      if (period) {
        await adminService.updatePeriod(period.id_periodo, dto);
      } else {
        await adminService.createPeriod(dto as CreatePeriodoDto);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al guardar el periodo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={period ? 'Editar Periodo' : 'Nuevo Periodo'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <Field label="Nombre (ej. 2026-2)">
          <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </Field>
        <Field label="Fecha de inicio">
          <input type="date" className={inputCls} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
        </Field>
        <Field label="Fecha de fin">
          <input type="date" className={inputCls} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
        </Field>
        <Field label="Estado">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="w-4 h-4" />
            Periodo activo
          </label>
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Guardando...' : period ? 'Guardar cambios' : 'Crear periodo'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Process Window Modal ─────────────────────────────────────────────────────

function ProcessWindowModal({
  idPeriodo,
  processTypes,
  existing,
  onClose,
  onSaved,
}: {
  idPeriodo: number;
  processTypes: ProcesoTipo[];
  existing?: PeriodoProceso;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [idProceso, setIdProceso] = useState(existing?.id_proceso ?? processTypes[0]?.id_proceso ?? 0);
  const [fechaInicio, setFechaInicio] = useState(existing?.fecha_inicio?.slice(0, 16) ?? '');
  const [fechaFin, setFechaFin] = useState(existing?.fecha_fin?.slice(0, 16) ?? '');
  const [activo, setActivo] = useState(existing ? Boolean(existing.activo) : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (existing) {
        const dto: UpdateProcessWindowDto = { fechaInicio, fechaFin, activo };
        await adminService.updateProcessWindow(idPeriodo, existing.id_periodo_proceso, dto);
      } else {
        const dto: CreateProcessWindowDto = { idProceso, fechaInicio, fechaFin, activo };
        await adminService.createProcessWindow(idPeriodo, dto);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Editar ventana de proceso' : 'Agregar ventana de proceso'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {!existing && (
          <Field label="Tipo de proceso">
            <select className={inputCls} value={idProceso} onChange={(e) => setIdProceso(Number(e.target.value))} required>
              {processTypes.map((pt) => (
                <option key={pt.id_proceso} value={pt.id_proceso}>{pt.nombre}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Fecha y hora de inicio">
          <input type="datetime-local" className={inputCls} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
        </Field>
        <Field label="Fecha y hora de fin">
          <input type="datetime-local" className={inputCls} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required />
        </Field>
        <Field label="Estado">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} className="w-4 h-4" />
            Ventana activa
          </label>
        </Field>
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Generate Appointments Modal ──────────────────────────────────────────────

function GenerateAppointmentsModal({
  idPeriodo,
  reinscripcionWindow,
  onClose,
  onGenerated,
}: {
  idPeriodo: number;
  reinscripcionWindow?: PeriodoProceso;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const defaultStart = reinscripcionWindow?.fecha_inicio?.slice(0, 10) ?? '';
  const defaultEnd = reinscripcionWindow?.fecha_fin?.slice(0, 10) ?? '';

  const [fechaInicio, setFechaInicio] = useState(defaultStart);
  const [fechaFin, setFechaFin] = useState(defaultEnd);
  const [horaInicioDia, setHoraInicioDia] = useState('09:00');
  const [horaFinDia, setHoraFinDia] = useState('18:00');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ generadas: number; minutosPorAlumno: number } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dto: GenerateAppointmentsDto = {
        horaInicioDia,
        horaFinDia,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined,
      };
      const res = await adminService.generateAppointments(idPeriodo, dto);
      setResult(res);
      onGenerated();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al generar citas');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <Modal title="Citas generadas" onClose={onClose}>
        <div className="text-center py-4">
          <div className="text-5xl mb-3">✓</div>
          <p className="text-lg font-semibold text-green-700">{result.generadas} citas generadas</p>
          <p className="text-sm text-gray-500 mt-1">{result.minutosPorAlumno} minutos por alumno</p>
          <p className="text-sm text-gray-500 mt-1">Se están enviando notificaciones por correo en segundo plano.</p>
          <button onClick={onClose} className={`mt-5 ${btnPrimary}`}>Cerrar</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Generar citas de reinscripción" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {reinscripcionWindow && (
          <p className="text-sm text-blue-700 bg-blue-50 rounded px-3 py-2 mb-4">
            Ventana de reinscripción detectada: <strong>{reinscripcionWindow.fecha_inicio?.slice(0, 10)}</strong> → <strong>{reinscripcionWindow.fecha_fin?.slice(0, 10)}</strong>. Puedes ajustar las fechas.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha inicio">
            <input type="date" className={inputCls} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </Field>
          <Field label="Fecha fin">
            <input type="date" className={inputCls} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora inicio del día">
            <input type="time" className={inputCls} value={horaInicioDia} onChange={(e) => setHoraInicioDia(e.target.value)} required />
          </Field>
          <Field label="Hora fin del día">
            <input type="time" className={inputCls} value={horaFinDia} onChange={(e) => setHoraFinDia(e.target.value)} required />
          </Field>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          El sistema dividirá el rango de tiempo entre alumnos regulares (activos, sin materias reprobadas) que aún no estén inscritos en este periodo, dando prioridad a mayor promedio y semestre más avanzado. Se enviará un correo a cada alumno con su cita.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Generando...' : 'Confirmar y generar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Manual Appointment Modal ─────────────────────────────────────────────────

function ManualAppointmentModal({
  idPeriodo,
  onClose,
  onSaved,
}: {
  idPeriodo: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [boleta, setBoleta] = useState('');
  const [fechaCita, setFechaCita] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('09:30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const dto: ManualAppointmentDto = { boleta, fechaCita, horaInicio, horaFin };
      await adminService.createManualAppointment(idPeriodo, dto);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Error al asignar cita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Asignar cita manual" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <Field label="Boleta del alumno">
          <input
            type="text"
            className={inputCls}
            placeholder="ej. 2021630001"
            value={boleta}
            onChange={(e) => setBoleta(e.target.value)}
            required
          />
        </Field>
        <Field label="Fecha de cita">
          <input type="date" className={inputCls} value={fechaCita} onChange={(e) => setFechaCita(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora de inicio">
            <input type="time" className={inputCls} value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
          </Field>
          <Field label="Hora de fin">
            <input type="time" className={inputCls} value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
          </Field>
        </div>
        <p className="text-xs text-gray-500 mb-3">Se enviará notificación por correo al alumno.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>Cancelar</button>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? 'Asignando...' : 'Asignar cita'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Appointments List Modal ──────────────────────────────────────────────────

function AppointmentsModal({
  citas,
  onClose,
}: {
  citas: CitaAdmin[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Citas de reinscripción ({citas.length})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Boleta</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Hora</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id_cita} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono">{c.boleta}</td>
                  <td className="px-4 py-2">{c.nombre_alumno}</td>
                  <td className="px-4 py-2">{c.fecha_cita}</td>
                  <td className="px-4 py-2">{c.hora_inicio} – {c.hora_fin}</td>
                  <td className="px-4 py-2"><EstatusBadge estatus={c.estatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t flex justify-end">
          <button onClick={onClose} className={btnSecondary}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Period Detail Panel ──────────────────────────────────────────────────────

function PeriodDetailPanel({
  detail,
  processTypes,
  onRefresh,
}: {
  detail: PeriodoDetalle;
  processTypes: ProcesoTipo[];
  onRefresh: () => void;
}) {
  const [showAddProcess, setShowAddProcess] = useState(false);
  const [editingProcess, setEditingProcess] = useState<PeriodoProceso | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [citas, setCitas] = useState<CitaAdmin[] | null>(null);
  const [deletingPw, setDeletingPw] = useState<number | null>(null);
  const [deletingCitas, setDeletingCitas] = useState(false);

  const reinscripcionWindow = detail.processes.find((p) => p.nombre_proceso === 'reinscripcion');

  const loadCitas = async () => {
    const data = await adminService.getAppointments(detail.id_periodo);
    setCitas(data);
  };

  const handleDeletePw = async (pid: number) => {
    if (!confirm('¿Eliminar esta ventana de proceso?')) return;
    setDeletingPw(pid);
    try {
      await adminService.deleteProcessWindow(detail.id_periodo, pid);
      onRefresh();
    } finally {
      setDeletingPw(null);
    }
  };

  const handleDeleteAllCitas = async () => {
    if (!confirm(`¿Eliminar todas las citas del periodo ${detail.nombre}? Esta acción no se puede deshacer.`)) return;
    setDeletingCitas(true);
    try {
      await adminService.deleteAllAppointments(detail.id_periodo);
      onRefresh();
    } finally {
      setDeletingCitas(false);
    }
  };

  return (
    <div className="mt-4 border rounded-lg bg-white shadow-sm">
      {/* Ventanas de proceso */}
      <div className="px-5 py-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-700">Ventanas de proceso</h3>
          <button onClick={() => setShowAddProcess(true)} className="text-xs px-3 py-1.5 bg-ipn-guinda text-white rounded hover:bg-ipn-guinda/90">
            + Agregar
          </button>
        </div>
        {detail.processes.length === 0 ? (
          <p className="text-sm text-gray-400">Sin ventanas de proceso configuradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="pb-1">Proceso</th>
                <th className="pb-1">Inicio</th>
                <th className="pb-1">Fin</th>
                <th className="pb-1">Estado</th>
                <th className="pb-1"></th>
              </tr>
            </thead>
            <tbody>
              {detail.processes.map((pw) => (
                <tr key={pw.id_periodo_proceso} className="border-t">
                  <td className="py-1.5 pr-3 font-medium capitalize">{pw.nombre_proceso}</td>
                  <td className="py-1.5 pr-3 text-gray-600">{pw.fecha_inicio?.replace('T', ' ')}</td>
                  <td className="py-1.5 pr-3 text-gray-600">{pw.fecha_fin?.replace('T', ' ')}</td>
                  <td className="py-1.5 pr-3"><Badge active={pw.activo} /></td>
                  <td className="py-1.5 flex gap-2">
                    <button onClick={() => setEditingProcess(pw)} className="text-blue-600 hover:underline text-xs">Editar</button>
                    <button
                      onClick={() => handleDeletePw(pw.id_periodo_proceso)}
                      disabled={deletingPw === pw.id_periodo_proceso}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Citas de reinscripción */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium text-gray-700">Citas de reinscripción</h3>
            <p className="text-sm text-gray-400">{detail.appointmentCount} citas asignadas</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGenerate(true)}
              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Generar automáticamente
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="text-xs px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
            >
              Asignar manual
            </button>
            {detail.appointmentCount > 0 && (
              <>
                <button
                  onClick={loadCitas}
                  className="text-xs px-3 py-1.5 border border-blue-300 text-blue-600 rounded hover:bg-blue-50"
                >
                  Ver citas
                </button>
                <button
                  onClick={handleDeleteAllCitas}
                  disabled={deletingCitas}
                  className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50"
                >
                  {deletingCitas ? 'Eliminando...' : 'Eliminar todas'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      {showAddProcess && (
        <ProcessWindowModal
          idPeriodo={detail.id_periodo}
          processTypes={processTypes}
          onClose={() => setShowAddProcess(false)}
          onSaved={onRefresh}
        />
      )}
      {editingProcess && (
        <ProcessWindowModal
          idPeriodo={detail.id_periodo}
          processTypes={processTypes}
          existing={editingProcess}
          onClose={() => setEditingProcess(null)}
          onSaved={onRefresh}
        />
      )}
      {showGenerate && (
        <GenerateAppointmentsModal
          idPeriodo={detail.id_periodo}
          reinscripcionWindow={reinscripcionWindow}
          onClose={() => setShowGenerate(false)}
          onGenerated={onRefresh}
        />
      )}
      {showManual && (
        <ManualAppointmentModal
          idPeriodo={detail.id_periodo}
          onClose={() => setShowManual(false)}
          onSaved={onRefresh}
        />
      )}
      {citas && (
        <AppointmentsModal citas={citas} onClose={() => setCitas(null)} />
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PeriodsPage() {
  const [periods, setPeriods] = useState<Periodo[]>([]);
  const [processTypes, setProcessTypes] = useState<ProcesoTipo[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PeriodoDetalle | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Periodo | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [finalizingId, setFinalizingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadPeriods = useCallback(async () => {
    try {
      const [p, pt] = await Promise.all([adminService.getPeriods(), adminService.getProcessTypes()]);
      setPeriods(p);
      setProcessTypes(pt);
    } catch {
      setError('Error al cargar los periodos');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    try {
      const d = await adminService.getPeriodDetail(id);
      setDetail(d);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  const handleSelect = (id: number) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (period: Periodo) => {
    if (!confirm(`¿Eliminar el periodo "${period.nombre}"? Solo es posible si no tiene grupos asociados.`)) return;
    setDeletingId(period.id_periodo);
    try {
      await adminService.deletePeriod(period.id_periodo);
      if (selectedId === period.id_periodo) setSelectedId(null);
      await loadPeriods();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'No se pudo eliminar el periodo');
    } finally {
      setDeletingId(null);
    }
  };

  const handleFinalize = async (period: Periodo) => {
    if (
      !confirm(
        `¿Finalizar el ciclo "${period.nombre}"?\n\n` +
        `Esta acción:\n` +
        `• Marcará el periodo como inactivo\n` +
        `• Expirará las citas de reinscripción pendientes\n` +
        `• Avanzará el semestre de los alumnos inscritos\n\n` +
        `Esta operación no se puede deshacer.`
      )
    ) return;

    setFinalizingId(period.id_periodo);
    try {
      const result = await adminService.finalizePeriod(period.id_periodo);
      alert(`Ciclo "${period.nombre}" finalizado. ${result.alumnosAvanzados} alumnos avanzaron de semestre.`);
      if (selectedId === period.id_periodo) setSelectedId(null);
      await loadPeriods();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(msg ?? 'No se pudo finalizar el ciclo');
    } finally {
      setFinalizingId(null);
    }
  };

  const handleRefresh = async () => {
    await loadPeriods();
    if (selectedId) await loadDetail(selectedId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Periodos Académicos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestiona periodos, ventanas de proceso y citas de reinscripción</p>
        </div>
        <button onClick={() => setShowCreate(true)} className={btnPrimary}>
          + Nuevo periodo
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Sección de tipos de proceso */}
      {!loading && (
        <ProcessTypesSection processTypes={processTypes} onRefresh={loadPeriods} />
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando periodos...</div>
      ) : periods.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No hay periodos registrados.</div>
      ) : (
        <div className="space-y-3">
          {periods.map((p) => (
            <div key={p.id_periodo} className="bg-white border rounded-lg shadow-sm">
              <div className="flex items-center px-5 py-4 gap-4">
                <button
                  onClick={() => handleSelect(p.id_periodo)}
                  className="flex-1 text-left flex items-center gap-4"
                >
                  <span
                    className={`transform transition-transform text-gray-400 ${
                      selectedId === p.id_periodo ? 'rotate-90' : ''
                    }`}
                  >
                    ▶
                  </span>
                  <div>
                    <span className="font-semibold text-gray-800">{p.nombre}</span>
                    <span className="text-sm text-gray-500 ml-3">
                      {p.fecha_inicio} → {p.fecha_fin}
                    </span>
                  </div>
                  <Badge active={p.activo} />
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPeriod(p)}
                    className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Editar
                  </button>
                  {Boolean(p.activo) && (
                    <button
                      onClick={() => handleFinalize(p)}
                      disabled={finalizingId === p.id_periodo}
                      className={`text-sm px-3 py-1.5 rounded ${btnWarning}`}
                    >
                      {finalizingId === p.id_periodo ? 'Finalizando...' : 'Finalizar ciclo'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(p)}
                    disabled={deletingId === p.id_periodo}
                    className={`text-sm px-3 py-1.5 rounded ${btnDanger}`}
                  >
                    {deletingId === p.id_periodo ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>

              {selectedId === p.id_periodo && (
                <div className="px-5 pb-5">
                  {detailLoading ? (
                    <p className="text-sm text-gray-400 py-2">Cargando detalle...</p>
                  ) : detail ? (
                    <PeriodDetailPanel
                      detail={detail}
                      processTypes={processTypes}
                      onRefresh={handleRefresh}
                    />
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <PeriodFormModal onClose={() => setShowCreate(false)} onSaved={loadPeriods} />
      )}
      {editingPeriod && (
        <PeriodFormModal
          period={editingPeriod}
          onClose={() => setEditingPeriod(null)}
          onSaved={loadPeriods}
        />
      )}
    </div>
  );
}

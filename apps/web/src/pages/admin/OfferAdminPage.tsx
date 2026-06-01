import { useState, useEffect, useCallback } from 'react';
import {
  adminOfferService,
  adminService,
  Carrera, CreateCarreraDto, UpdateCarreraDto,
  PlanEstudios, PlanDetalle, CreatePlanDto, UpdatePlanDto, AddMateriaAlPlanDto,
  Materia, Prerrequisito, CreateMateriaDto, UpdateMateriaDto,
  GrupoAdmin, CreateGrupoDto, UpdateGrupoDto,
  HorarioGrupo, CreateHorarioDto, UpdateHorarioDto,
  DepartamentoRef, AulaRef, ProfesorRef, MateriaRef,
  Periodo,
} from '../../services/admin.service';

// ─── Helpers comunes ──────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-h-[92vh] overflow-y-auto ${
          wide ? 'max-w-3xl' : 'max-w-lg'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
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

const inputCls =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda';
const btnPrimary =
  'px-4 py-2 bg-ipn-guinda text-white text-sm font-medium rounded hover:bg-ipn-guinda/90 transition-colors';
const btnSecondary =
  'px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors';
const btnSm =
  'px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors';
const btnSmDanger = 'px-2 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors';
const btnSmPrimary = 'px-2 py-1 text-xs bg-ipn-guinda text-white rounded hover:bg-ipn-guinda/90 transition-colors';

function ActiveBadge({ activo }: { activo: number }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
        activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function EstatusGrupoBadge({ estatus }: { estatus: string }) {
  const color =
    estatus === 'abierto'
      ? 'bg-green-100 text-green-700'
      : estatus === 'cerrado'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{estatus}</span>
  );
}

function TipoMateriaBadge({ tipo }: { tipo: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
        tipo === 'obligatoria' ? 'bg-ipn-guinda/10 text-ipn-guinda' : 'bg-blue-50 text-blue-600'
      }`}
    >
      {tipo}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="text-red-600 text-sm mt-1">{msg}</p>;
}

// ─── Modales de Carreras ──────────────────────────────────────────────────────

function CarreraFormModal({
  existing,
  departamentos,
  onClose,
  onSaved,
}: {
  existing?: Carrera;
  departamentos: DepartamentoRef[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [clave, setClave] = useState(existing?.clave ?? '');
  const [idDepartamento, setIdDepartamento] = useState<number>(existing?.id_departamento ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idDepartamento) { setError('Selecciona un departamento'); return; }
    setError(''); setLoading(true);
    try {
      if (existing) {
        const dto: UpdateCarreraDto = { nombre, clave, idDepartamento };
        await adminOfferService.updateCarrera(existing.id_carrera, dto);
      } else {
        const dto: CreateCarreraDto = { nombre, clave, idDepartamento };
        await adminOfferService.createCarrera(dto);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Editar carrera' : 'Nueva carrera'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Nombre">
          <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </Field>
        <Field label="Clave">
          <input className={inputCls} value={clave} onChange={(e) => setClave(e.target.value)} required />
        </Field>
        <Field label="Departamento">
          <select className={inputCls} value={idDepartamento} onChange={(e) => setIdDepartamento(Number(e.target.value))} required>
            <option value={0}>— Seleccionar —</option>
            {departamentos.map((d) => (
              <option key={d.id_departamento} value={d.id_departamento}>{d.nombre}</option>
            ))}
          </select>
        </Field>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modales de Planes ────────────────────────────────────────────────────────

function PlanFormModal({
  existing,
  carreras,
  onClose,
  onSaved,
}: {
  existing?: PlanEstudios;
  carreras: Carrera[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [idCarrera, setIdCarrera] = useState<number>(existing?.id_carrera ?? 0);
  const [totalCreditos, setTotalCreditos] = useState<number>(existing?.total_creditos ?? 0);
  const [totalMaterias, setTotalMaterias] = useState<number>(existing?.total_materias ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCarrera) { setError('Selecciona una carrera'); return; }
    setError(''); setLoading(true);
    try {
      if (existing) {
        const dto: UpdatePlanDto = { nombre, idCarrera, totalCreditos, totalMaterias };
        await adminOfferService.updatePlan(existing.id_plan, dto);
      } else {
        const dto: CreatePlanDto = { nombre, idCarrera, totalCreditos, totalMaterias };
        await adminOfferService.createPlan(dto);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Editar plan de estudios' : 'Nuevo plan de estudios'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Nombre del plan">
          <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </Field>
        <Field label="Carrera">
          <select className={inputCls} value={idCarrera} onChange={(e) => setIdCarrera(Number(e.target.value))} required>
            <option value={0}>— Seleccionar —</option>
            {carreras.map((c) => (
              <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Total de créditos">
            <input type="number" step="any" min={1} className={inputCls} value={totalCreditos} onChange={(e) => setTotalCreditos(Number(e.target.value))} required />
          </Field>
          <Field label="Total de materias">
            <input type="number" min={1} className={inputCls} value={totalMaterias} onChange={(e) => setTotalMaterias(Number(e.target.value))} required />
          </Field>
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddMateriaAlPlanModal({
  idPlan,
  materiasList,
  onClose,
  onSaved,
}: {
  idPlan: number;
  materiasList: MateriaRef[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [idMateria, setIdMateria] = useState<number>(0);
  const [semestre, setSemestre] = useState<number>(1);
  const [tipo, setTipo] = useState<'obligatoria' | 'optativa'>('obligatoria');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idMateria) { setError('Selecciona una materia'); return; }
    setError(''); setLoading(true);
    try {
      const dto: AddMateriaAlPlanDto = { idMateria, semestre, tipo };
      await adminOfferService.addMateriaAlPlan(idPlan, dto);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al agregar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Agregar materia al plan" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Materia">
          <select className={inputCls} value={idMateria} onChange={(e) => setIdMateria(Number(e.target.value))} required>
            <option value={0}>— Seleccionar —</option>
            {materiasList.map((m) => (
              <option key={m.id_materia} value={m.id_materia}>{m.clave} — {m.nombre}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Semestre">
            <input type="number" min={1} max={20} className={inputCls} value={semestre} onChange={(e) => setSemestre(Number(e.target.value))} required />
          </Field>
          <Field label="Tipo">
            <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as any)}>
              <option value="obligatoria">Obligatoria</option>
              <option value="optativa">Optativa</option>
            </select>
          </Field>
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modales de Materias ──────────────────────────────────────────────────────

function MateriaFormModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Materia;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [clave, setClave] = useState(existing?.clave ?? '');
  const [nombre, setNombre] = useState(existing?.nombre ?? '');
  const [creditos, setCreditos] = useState<number>(existing?.creditos ?? 0);
  const [horasTeoria, setHorasTeoria] = useState<number>(existing?.horas_teoria ?? 0);
  const [horasPractica, setHorasPractica] = useState<number>(existing?.horas_practica ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (existing) {
        const dto: UpdateMateriaDto = { clave, nombre, creditos, horasTeoria, horasPractica };
        await adminOfferService.updateMateria(existing.id_materia, dto);
      } else {
        const dto: CreateMateriaDto = { clave, nombre, creditos, horasTeoria, horasPractica };
        await adminOfferService.createMateria(dto);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Editar materia' : 'Nueva materia'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Clave">
            <input className={inputCls} value={clave} onChange={(e) => setClave(e.target.value)} required />
          </Field>
          <Field label="Créditos">
            <input type="number" step="any" min={0} className={inputCls} value={creditos} onChange={(e) => setCreditos(Number(e.target.value))} required />
          </Field>
        </div>
        <Field label="Nombre">
          <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Horas teoría">
            <input type="number" step="any" min={0} className={inputCls} value={horasTeoria} onChange={(e) => setHorasTeoria(Number(e.target.value))} required />
          </Field>
          <Field label="Horas práctica">
            <input type="number" step="any" min={0} className={inputCls} value={horasPractica} onChange={(e) => setHorasPractica(Number(e.target.value))} required />
          </Field>
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddPrerrequistoModal({
  idMateria,
  materiasList,
  onClose,
  onSaved,
}: {
  idMateria: number;
  materiasList: MateriaRef[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [idPre, setIdPre] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPre) { setError('Selecciona una materia'); return; }
    setError(''); setLoading(true);
    try {
      await adminOfferService.addPrerrequisito(idMateria, idPre);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al agregar');
    } finally {
      setLoading(false);
    }
  };

  const opciones = materiasList.filter((m) => m.id_materia !== idMateria);

  return (
    <Modal title="Agregar prerrequisito" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Materia prerrequisito">
          <select className={inputCls} value={idPre} onChange={(e) => setIdPre(Number(e.target.value))} required>
            <option value={0}>— Seleccionar —</option>
            {opciones.map((m) => (
              <option key={m.id_materia} value={m.id_materia}>{m.clave} — {m.nombre}</option>
            ))}
          </select>
        </Field>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modales de Grupos ────────────────────────────────────────────────────────

function GrupoFormModal({
  existing,
  periodos,
  profesores,
  materiasList,
  defaultPeriodoId,
  onClose,
  onSaved,
}: {
  existing?: GrupoAdmin;
  periodos: Periodo[];
  profesores: ProfesorRef[];
  materiasList: MateriaRef[];
  defaultPeriodoId?: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [idPeriodo, setIdPeriodo] = useState<number>(existing?.id_periodo ?? defaultPeriodoId ?? 0);
  const [idMateria, setIdMateria] = useState<number>(existing?.id_materia ?? 0);
  const [idProfesor, setIdProfesor] = useState<number>(existing?.id_profesor ?? 0);
  const [claveGrupo, setClaveGrupo] = useState(existing?.clave_grupo ?? '');
  const [cupoMax, setCupoMax] = useState<number>(existing?.cupo_max ?? 30);
  const [estatus, setEstatus] = useState<'abierto' | 'cerrado' | 'cancelado'>(existing?.estatus ?? 'abierto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idPeriodo || !idMateria || !idProfesor) { setError('Completa todos los campos requeridos'); return; }
    setError(''); setLoading(true);
    try {
      if (existing) {
        const dto: UpdateGrupoDto = { idProfesor, claveGrupo, cupoMax, estatus };
        await adminOfferService.updateGrupo(existing.id_grupo, dto);
      } else {
        const dto: CreateGrupoDto = { idPeriodo, idMateria, idProfesor, claveGrupo, cupoMax, estatus };
        await adminOfferService.createGrupo(dto);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Editar grupo' : 'Nuevo grupo'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {!existing && (
          <Field label="Periodo">
            <select className={inputCls} value={idPeriodo} onChange={(e) => setIdPeriodo(Number(e.target.value))} required>
              <option value={0}>— Seleccionar —</option>
              {periodos.map((p) => (
                <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>
              ))}
            </select>
          </Field>
        )}
        {!existing && (
          <Field label="Materia">
            <select className={inputCls} value={idMateria} onChange={(e) => setIdMateria(Number(e.target.value))} required>
              <option value={0}>— Seleccionar —</option>
              {materiasList.map((m) => (
                <option key={m.id_materia} value={m.id_materia}>{m.clave} — {m.nombre}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Profesor">
          <select className={inputCls} value={idProfesor} onChange={(e) => setIdProfesor(Number(e.target.value))} required>
            <option value={0}>— Seleccionar —</option>
            {profesores.map((p) => (
              <option key={p.id_profesor} value={p.id_profesor}>{p.nombre_completo} ({p.numero_empleado})</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Clave del grupo">
            <input className={inputCls} value={claveGrupo} onChange={(e) => setClaveGrupo(e.target.value)} required />
          </Field>
          <Field label="Cupo máximo">
            <input type="number" min={1} className={inputCls} value={cupoMax} onChange={(e) => setCupoMax(Number(e.target.value))} required />
          </Field>
        </div>
        <Field label="Estatus">
          <select className={inputCls} value={estatus} onChange={(e) => setEstatus(e.target.value as any)}>
            <option value="abierto">Abierto</option>
            <option value="cerrado">Cerrado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </Field>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal de Horarios de Grupo ───────────────────────────────────────────────

function HorarioFormModal({
  idGrupo,
  existing,
  aulas,
  onClose,
  onSaved,
}: {
  idGrupo: number;
  existing?: HorarioGrupo;
  aulas: AulaRef[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const [idAula, setIdAula] = useState<number>(existing?.id_aula ?? 0);
  const [diaSemana, setDiaSemana] = useState(existing?.dia_semana ?? 'lunes');
  const [horaInicio, setHoraInicio] = useState(existing?.hora_inicio ?? '07:00');
  const [horaFin, setHoraFin] = useState(existing?.hora_fin ?? '08:30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idAula) { setError('Selecciona un aula'); return; }
    setError(''); setLoading(true);
    try {
      if (existing) {
        const dto: UpdateHorarioDto = { idAula, diaSemana, horaInicio, horaFin };
        await adminOfferService.updateHorario(idGrupo, existing.id_horario, dto);
      } else {
        const dto: CreateHorarioDto = { idAula, diaSemana, horaInicio, horaFin };
        await adminOfferService.createHorario(idGrupo, dto);
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={existing ? 'Editar horario' : 'Nuevo horario'} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Aula">
          <select className={inputCls} value={idAula} onChange={(e) => setIdAula(Number(e.target.value))} required>
            <option value={0}>— Seleccionar —</option>
            {aulas.map((a) => (
              <option key={a.id_aula} value={a.id_aula}>{a.edificio} — {a.nombre} (cap. {a.capacidad})</option>
            ))}
          </select>
        </Field>
        <Field label="Día de la semana">
          <select className={inputCls} value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)}>
            {dias.map((d) => (
              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hora inicio">
            <input type="time" className={inputCls} value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required />
          </Field>
          <Field label="Hora fin">
            <input type="time" className={inputCls} value={horaFin} onChange={(e) => setHoraFin(e.target.value)} required />
          </Field>
        </div>
        <ErrorMsg msg={error} />
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function HorariosModal({
  grupo,
  aulas,
  onClose,
}: {
  grupo: GrupoAdmin;
  aulas: AulaRef[];
  onClose: () => void;
}) {
  const [horarios, setHorarios] = useState<HorarioGrupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingHorario, setEditingHorario] = useState<HorarioGrupo | undefined>();

  const loadHorarios = useCallback(async () => {
    setLoading(true);
    try {
      setHorarios(await adminOfferService.getHorarios(grupo.id_grupo));
    } catch {
      setError('Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  }, [grupo.id_grupo]);

  useEffect(() => { loadHorarios(); }, [loadHorarios]);

  const handleDelete = async (idHorario: number) => {
    if (!window.confirm('¿Eliminar este horario?')) return;
    try {
      await adminOfferService.deleteHorario(grupo.id_grupo, idHorario);
      await loadHorarios();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Error al eliminar');
    }
  };

  return (
    <Modal title={`Horarios — ${grupo.clave_grupo} (${grupo.nombre_materia})`} wide onClose={onClose}>
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">Profesor: {grupo.nombre_profesor}</p>
        <button className={btnPrimary} onClick={() => { setEditingHorario(undefined); setShowForm(true); }}>
          + Agregar horario
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : (
        <>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          {horarios.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin horarios registrados</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 text-xs text-gray-500 font-medium">Día</th>
                  <th className="px-3 py-2 text-xs text-gray-500 font-medium">Inicio</th>
                  <th className="px-3 py-2 text-xs text-gray-500 font-medium">Fin</th>
                  <th className="px-3 py-2 text-xs text-gray-500 font-medium">Aula</th>
                  <th className="px-3 py-2 text-xs text-gray-500 font-medium">Edificio</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {horarios.map((h) => (
                  <tr key={h.id_horario} className="border-t border-gray-100">
                    <td className="px-3 py-2 capitalize">{h.dia_semana}</td>
                    <td className="px-3 py-2">{h.hora_inicio}</td>
                    <td className="px-3 py-2">{h.hora_fin}</td>
                    <td className="px-3 py-2">{h.nombre_aula}</td>
                    <td className="px-3 py-2">{h.edificio}</td>
                    <td className="px-3 py-2 flex gap-1 justify-end">
                      <button className={btnSm} onClick={() => { setEditingHorario(h); setShowForm(true); }}>Editar</button>
                      <button className={btnSmDanger} onClick={() => handleDelete(h.id_horario)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {showForm && (
        <HorarioFormModal
          idGrupo={grupo.id_grupo}
          existing={editingHorario}
          aulas={aulas}
          onClose={() => { setShowForm(false); setEditingHorario(undefined); }}
          onSaved={async () => { setShowForm(false); setEditingHorario(undefined); await loadHorarios(); }}
        />
      )}
    </Modal>
  );
}

// ─── Sección colapsable genérica ──────────────────────────────────────────────

function Section({
  title,
  open,
  onToggle,
  action,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer"
        onClick={onToggle}
      >
        <span className="font-semibold text-gray-800">{title}</span>
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          {action}
          <ChevronIcon open={open} />
        </div>
      </div>
      {open && <div className="border-t border-gray-100 px-5 py-4">{children}</div>}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function OfferAdminPage() {
  type Tab = 'catalogos' | 'grupos';
  const [activeTab, setActiveTab] = useState<Tab>('catalogos');

  // ── Datos comunes
  const [departamentos, setDepartamentos] = useState<DepartamentoRef[]>([]);
  const [aulas, setAulas] = useState<AulaRef[]>([]);
  const [profesores, setProfesores] = useState<ProfesorRef[]>([]);
  const [materiasList, setMateriasList] = useState<MateriaRef[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);

  // ── Catálogos
  const [secCarreras, setSecCarreras] = useState(true);
  const [secPlanes, setSecPlanes] = useState(false);
  const [secMaterias, setSecMaterias] = useState(false);

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [planes, setPlanes] = useState<PlanEstudios[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [searchMaterias, setSearchMaterias] = useState('');

  // Detalles expandibles
  const [openPlanId, setOpenPlanId] = useState<number | null>(null);
  const [planDetalle, setPlanDetalle] = useState<PlanDetalle | null>(null);
  const [openMateriaId, setOpenMateriaId] = useState<number | null>(null);
  const [prerrequisitos, setPrerrequisitos] = useState<Prerrequisito[]>([]);

  // Modales catálogos
  const [showCarreraForm, setShowCarreraForm] = useState(false);
  const [editingCarrera, setEditingCarrera] = useState<Carrera | undefined>();
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanEstudios | undefined>();
  const [showAddMateriaPlan, setShowAddMateriaPlan] = useState(false);
  const [showMateriaForm, setShowMateriaForm] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | undefined>();
  const [showAddPre, setShowAddPre] = useState(false);

  // ── Grupos
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number>(0);
  const [grupos, setGrupos] = useState<GrupoAdmin[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [showGrupoForm, setShowGrupoForm] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<GrupoAdmin | undefined>();
  const [horariosGrupo, setHorariosGrupo] = useState<GrupoAdmin | undefined>();

  const [globalError, setGlobalError] = useState('');

  // ── Carga inicial
  useEffect(() => {
    Promise.all([
      adminOfferService.getDepartamentos(),
      adminOfferService.getAulas(),
      adminOfferService.getProfesores(),
      adminOfferService.getMateriasList(),
      adminService.getPeriods(),
    ])
      .then(([deps, aul, profs, mats, pers]) => {
        setDepartamentos(deps);
        setAulas(aul);
        setProfesores(profs);
        setMateriasList(mats);
        setPeriodos(pers);
        const activo = pers.find((p) => p.activo);
        if (activo) setSelectedPeriodoId(activo.id_periodo);
      })
      .catch(() => setGlobalError('Error al cargar datos de referencia'));
  }, []);

  // ── Carga de catálogos
  const loadCarreras = useCallback(async () => {
    try { setCarreras(await adminOfferService.getCarreras()); } catch { /* silent */ }
  }, []);

  const loadPlanes = useCallback(async () => {
    try { setPlanes(await adminOfferService.getPlanes()); } catch { /* silent */ }
  }, []);

  const loadMaterias = useCallback(async () => {
    try { setMaterias(await adminOfferService.getMaterias(searchMaterias || undefined)); } catch { /* silent */ }
  }, [searchMaterias]);

  useEffect(() => { if (secCarreras) loadCarreras(); }, [secCarreras, loadCarreras]);
  useEffect(() => { if (secPlanes) loadPlanes(); }, [secPlanes, loadPlanes]);
  useEffect(() => { if (secMaterias) loadMaterias(); }, [secMaterias, loadMaterias]);

  // ── Detalle del plan
  const loadPlanDetalle = useCallback(async (idPlan: number) => {
    try {
      setPlanDetalle(await adminOfferService.getPlanDetalle(idPlan));
    } catch { /* silent */ }
  }, []);

  const togglePlanDetail = (idPlan: number) => {
    if (openPlanId === idPlan) { setOpenPlanId(null); setPlanDetalle(null); return; }
    setOpenPlanId(idPlan);
    loadPlanDetalle(idPlan);
  };

  // ── Prerrequisitos
  const loadPrerrequisitos = useCallback(async (idMateria: number) => {
    try {
      setPrerrequisitos(await adminOfferService.getPrerrequisitos(idMateria));
    } catch { /* silent */ }
  }, []);

  const toggleMateriaDetail = (idMateria: number) => {
    if (openMateriaId === idMateria) { setOpenMateriaId(null); setPrerrequisitos([]); return; }
    setOpenMateriaId(idMateria);
    loadPrerrequisitos(idMateria);
  };

  // ── Grupos
  const loadGrupos = useCallback(async () => {
    if (!selectedPeriodoId) return;
    setLoadingGrupos(true);
    try { setGrupos(await adminOfferService.getGrupos(selectedPeriodoId)); } catch { /* silent */ }
    finally { setLoadingGrupos(false); }
  }, [selectedPeriodoId]);

  useEffect(() => { if (activeTab === 'grupos') loadGrupos(); }, [activeTab, loadGrupos]);

  const handleDeleteGrupo = async (g: GrupoAdmin) => {
    if (!window.confirm(`¿Eliminar el grupo ${g.clave_grupo}?`)) return;
    try {
      await adminOfferService.deleteGrupo(g.id_grupo);
      await loadGrupos();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Error al eliminar');
    }
  };

  const handleDeleteCarrera = async (c: Carrera) => {
    if (!window.confirm(`¿Eliminar la carrera "${c.nombre}"?`)) return;
    try {
      await adminOfferService.deleteCarrera(c.id_carrera);
      await loadCarreras();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Error al eliminar');
    }
  };

  const handleDeletePlan = async (p: PlanEstudios) => {
    if (!window.confirm(`¿Eliminar el plan "${p.nombre}"?`)) return;
    try {
      await adminOfferService.deletePlan(p.id_plan);
      await loadPlanes();
      setOpenPlanId(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Error al eliminar');
    }
  };

  const handleDeleteMateria = async (m: Materia) => {
    if (!window.confirm(`¿Eliminar la materia "${m.nombre}"?`)) return;
    try {
      await adminOfferService.deleteMateria(m.id_materia);
      await loadMaterias();
      setOpenMateriaId(null);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Error al eliminar');
    }
  };

  const handleRemoveMateriaDePlan = async (idMateria: number) => {
    if (!openPlanId || !window.confirm('¿Quitar esta materia del plan?')) return;
    try {
      await adminOfferService.removeMateriaDelPlan(openPlanId, idMateria);
      await loadPlanDetalle(openPlanId);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Error al quitar');
    }
  };

  const handleRemovePrerrequisito = async (idPre: number) => {
    if (!openMateriaId || !window.confirm('¿Quitar este prerrequisito?')) return;
    try {
      await adminOfferService.removePrerrequisito(openMateriaId, idPre);
      await loadPrerrequisitos(openMateriaId);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Error al quitar');
    }
  };

  const tabCls = (t: Tab) =>
    `px-5 py-2.5 text-sm font-medium rounded-t-md transition-colors ${
      activeTab === t
        ? 'bg-white text-ipn-guinda border-t border-l border-r border-gray-200'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Oferta Académica</h1>
      <p className="text-gray-500 text-sm mb-6">Gestión de carreras, planes, materias, grupos y horarios.</p>

      {globalError && <p className="text-red-600 text-sm mb-4">{globalError}</p>}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button className={tabCls('catalogos')} onClick={() => setActiveTab('catalogos')}>Catálogos</button>
        <button className={tabCls('grupos')} onClick={() => setActiveTab('grupos')}>Grupos y Horarios</button>
      </div>

      {/* ── TAB CATÁLOGOS ─────────────────────────────────────────────────── */}
      {activeTab === 'catalogos' && (
        <div>

          {/* Sección Carreras */}
          <Section
            title="Carreras"
            open={secCarreras}
            onToggle={() => setSecCarreras((v) => !v)}
            action={
              <button className={btnPrimary} onClick={() => { setEditingCarrera(undefined); setShowCarreraForm(true); }}>
                + Nueva carrera
              </button>
            }
          >
            {carreras.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin carreras registradas</p>
            ) : (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-3 py-2 text-xs text-gray-500 font-medium">Clave</th>
                    <th className="px-3 py-2 text-xs text-gray-500 font-medium">Nombre</th>
                    <th className="px-3 py-2 text-xs text-gray-500 font-medium">Departamento</th>
                    <th className="px-3 py-2 text-xs text-gray-500 font-medium">Estatus</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {carreras.map((c) => (
                    <tr key={c.id_carrera} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono text-xs">{c.clave}</td>
                      <td className="px-3 py-2">{c.nombre}</td>
                      <td className="px-3 py-2 text-gray-500">{c.nombre_departamento}</td>
                      <td className="px-3 py-2"><ActiveBadge activo={c.activo} /></td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1 justify-end">
                          <button className={btnSm} onClick={() => { setEditingCarrera(c); setShowCarreraForm(true); }}>Editar</button>
                          <button className={btnSmDanger} onClick={() => handleDeleteCarrera(c)}>Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          {/* Sección Planes */}
          <Section
            title="Planes de Estudio"
            open={secPlanes}
            onToggle={() => setSecPlanes((v) => !v)}
            action={
              <button className={btnPrimary} onClick={() => { setEditingPlan(undefined); setShowPlanForm(true); }}>
                + Nuevo plan
              </button>
            }
          >
            {planes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin planes de estudio registrados</p>
            ) : (
              <div className="space-y-2">
                {planes.map((p) => (
                  <div key={p.id_plan} className="border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="font-medium text-gray-800">{p.nombre}</span>
                        <span className="ml-2 text-xs text-gray-400">{p.nombre_carrera}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{p.total_creditos} cred. · {p.total_materias} mat.</span>
                        <ActiveBadge activo={p.activo} />
                        <button className={btnSm} onClick={() => { setEditingPlan(p); setShowPlanForm(true); }}>Editar</button>
                        <button className={btnSmDanger} onClick={() => handleDeletePlan(p)}>Eliminar</button>
                        <button className={btnSm} onClick={() => togglePlanDetail(p.id_plan)}>
                          {openPlanId === p.id_plan ? 'Cerrar' : 'Materias'}
                        </button>
                      </div>
                    </div>

                    {openPlanId === p.id_plan && planDetalle && (
                      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <p className="text-xs font-medium text-gray-600">Materias del plan</p>
                          <button
                            className={btnSmPrimary}
                            onClick={() => { setShowAddMateriaPlan(true); }}
                          >
                            + Agregar materia
                          </button>
                        </div>
                        {planDetalle.materias.length === 0 ? (
                          <p className="text-xs text-gray-400">Sin materias en el plan</p>
                        ) : (
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="text-left">
                                <th className="pb-1 text-gray-500 font-medium">Sem.</th>
                                <th className="pb-1 text-gray-500 font-medium">Clave</th>
                                <th className="pb-1 text-gray-500 font-medium">Materia</th>
                                <th className="pb-1 text-gray-500 font-medium">Tipo</th>
                                <th className="pb-1 text-gray-500 font-medium">Cred.</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {planDetalle.materias.map((m) => (
                                <tr key={m.id_materia} className="border-t border-gray-100">
                                  <td className="py-1.5 pr-3">{m.semestre}</td>
                                  <td className="py-1.5 pr-3 font-mono">{m.clave}</td>
                                  <td className="py-1.5 pr-3">{m.nombre}</td>
                                  <td className="py-1.5 pr-3"><TipoMateriaBadge tipo={m.tipo} /></td>
                                  <td className="py-1.5 pr-3">{m.creditos}</td>
                                  <td className="py-1.5">
                                    <button className={btnSmDanger} onClick={() => handleRemoveMateriaDePlan(m.id_materia)}>Quitar</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Sección Materias */}
          <Section
            title="Materias"
            open={secMaterias}
            onToggle={() => setSecMaterias((v) => !v)}
            action={
              <button className={btnPrimary} onClick={() => { setEditingMateria(undefined); setShowMateriaForm(true); }}>
                + Nueva materia
              </button>
            }
          >
            <div className="mb-3">
              <input
                className={inputCls}
                placeholder="Buscar por nombre o clave…"
                value={searchMaterias}
                onChange={(e) => setSearchMaterias(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') loadMaterias(); }}
              />
            </div>

            {materias.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin materias registradas</p>
            ) : (
              <div className="space-y-2">
                {materias.map((m) => (
                  <div key={m.id_materia} className="border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between px-4 py-3">
                      <div>
                        <span className="font-mono text-xs text-gray-500 mr-2">{m.clave}</span>
                        <span className="font-medium text-gray-800">{m.nombre}</span>
                        <span className="ml-2 text-xs text-gray-400">{m.creditos} cred. · {m.horas_teoria}T/{m.horas_practica}P</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ActiveBadge activo={m.activo} />
                        <button className={btnSm} onClick={() => { setEditingMateria(m); setShowMateriaForm(true); }}>Editar</button>
                        <button className={btnSmDanger} onClick={() => handleDeleteMateria(m)}>Eliminar</button>
                        <button className={btnSm} onClick={() => toggleMateriaDetail(m.id_materia)}>
                          {openMateriaId === m.id_materia ? 'Cerrar' : 'Prerrequisitos'}
                        </button>
                      </div>
                    </div>

                    {openMateriaId === m.id_materia && (
                      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-medium text-gray-600">Prerrequisitos</p>
                          <button
                            className={btnSmPrimary}
                            onClick={() => setShowAddPre(true)}
                          >
                            + Agregar
                          </button>
                        </div>
                        {prerrequisitos.length === 0 ? (
                          <p className="text-xs text-gray-400">Sin prerrequisitos</p>
                        ) : (
                          <ul className="space-y-1">
                            {prerrequisitos.map((pr) => (
                              <li key={pr.id_materia} className="flex items-center justify-between text-xs">
                                <span><span className="font-mono text-gray-500 mr-1">{pr.clave}</span>{pr.nombre}</span>
                                <button className={btnSmDanger} onClick={() => handleRemovePrerrequisito(pr.id_materia)}>Quitar</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {/* ── TAB GRUPOS Y HORARIOS ─────────────────────────────────────────── */}
      {activeTab === 'grupos' && (
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Periodo:</label>
                <select
                  className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda"
                  value={selectedPeriodoId}
                  onChange={(e) => setSelectedPeriodoId(Number(e.target.value))}
                >
                  <option value={0}>— Seleccionar periodo —</option>
                  {periodos.map((p) => (
                    <option key={p.id_periodo} value={p.id_periodo}>
                      {p.nombre}{p.activo ? ' (activo)' : ''}
                    </option>
                  ))}
                </select>
                <button className={btnSecondary} onClick={loadGrupos}>Cargar</button>
              </div>
              <button
                className={btnPrimary}
                disabled={!selectedPeriodoId}
                onClick={() => { setEditingGrupo(undefined); setShowGrupoForm(true); }}
              >
                + Nuevo grupo
              </button>
            </div>

            {loadingGrupos ? (
              <p className="text-sm text-gray-500">Cargando grupos…</p>
            ) : grupos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                {selectedPeriodoId ? 'Sin grupos para este periodo' : 'Selecciona un periodo para ver los grupos'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Clave</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Materia</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Profesor</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium text-center">Cupo</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium text-center">Inscritos</th>
                      <th className="px-3 py-2 text-xs text-gray-500 font-medium">Estatus</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupos.map((g) => (
                      <tr key={g.id_grupo} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs">{g.clave_grupo}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{g.nombre_materia}</div>
                          <div className="text-xs text-gray-400">{g.clave_materia}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div>{g.nombre_profesor}</div>
                          <div className="text-xs text-gray-400">{g.numero_empleado}</div>
                        </td>
                        <td className="px-3 py-2 text-center">{g.cupo_max}</td>
                        <td className="px-3 py-2 text-center">{g.cupo_actual}</td>
                        <td className="px-3 py-2"><EstatusGrupoBadge estatus={g.estatus} /></td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1 justify-end">
                            <button className={btnSmPrimary} onClick={() => setHorariosGrupo(g)}>Horarios</button>
                            <button className={btnSm} onClick={() => { setEditingGrupo(g); setShowGrupoForm(true); }}>Editar</button>
                            <button className={btnSmDanger} onClick={() => handleDeleteGrupo(g)}>Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modales ───────────────────────────────────────────────────────── */}

      {showCarreraForm && (
        <CarreraFormModal
          existing={editingCarrera}
          departamentos={departamentos}
          onClose={() => { setShowCarreraForm(false); setEditingCarrera(undefined); }}
          onSaved={async () => { setShowCarreraForm(false); setEditingCarrera(undefined); await loadCarreras(); }}
        />
      )}

      {showPlanForm && (
        <PlanFormModal
          existing={editingPlan}
          carreras={carreras}
          onClose={() => { setShowPlanForm(false); setEditingPlan(undefined); }}
          onSaved={async () => { setShowPlanForm(false); setEditingPlan(undefined); await loadPlanes(); }}
        />
      )}

      {showAddMateriaPlan && openPlanId && (
        <AddMateriaAlPlanModal
          idPlan={openPlanId}
          materiasList={materiasList}
          onClose={() => setShowAddMateriaPlan(false)}
          onSaved={async () => { setShowAddMateriaPlan(false); await loadPlanDetalle(openPlanId); }}
        />
      )}

      {showMateriaForm && (
        <MateriaFormModal
          existing={editingMateria}
          onClose={() => { setShowMateriaForm(false); setEditingMateria(undefined); }}
          onSaved={async () => {
            setShowMateriaForm(false); setEditingMateria(undefined);
            await loadMaterias();
            // refresca la lista de referencia usada en selects
            adminOfferService.getMateriasList().then(setMateriasList).catch(() => {});
          }}
        />
      )}

      {showAddPre && openMateriaId && (
        <AddPrerrequistoModal
          idMateria={openMateriaId}
          materiasList={materiasList}
          onClose={() => setShowAddPre(false)}
          onSaved={async () => { setShowAddPre(false); await loadPrerrequisitos(openMateriaId); }}
        />
      )}

      {showGrupoForm && (
        <GrupoFormModal
          existing={editingGrupo}
          periodos={periodos}
          profesores={profesores}
          materiasList={materiasList}
          defaultPeriodoId={selectedPeriodoId || undefined}
          onClose={() => { setShowGrupoForm(false); setEditingGrupo(undefined); }}
          onSaved={async () => { setShowGrupoForm(false); setEditingGrupo(undefined); await loadGrupos(); }}
        />
      )}

      {horariosGrupo && (
        <HorariosModal
          grupo={horariosGrupo}
          aulas={aulas}
          onClose={() => setHorariosGrupo(undefined)}
        />
      )}
    </div>
  );
}

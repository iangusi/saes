import { useState, useEffect, useCallback, useRef } from 'react';
import {
  adminUsersService,
  AdminUser,
  CreateAdminUserDto,
  PlanOption,
  DepartamentoOption,
} from '../../services/admin.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ activo, bloqueado }: { activo: number; bloqueado: number }) {
  if (bloqueado) {
    return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">Bloqueado</span>;
  }
  if (!activo) {
    return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-600">Baja</span>;
  }
  return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">Activo</span>;
}

function RolesBadge({ roles }: { roles: string }) {
  const list = roles ? roles.split(',') : [];
  return (
    <div className="flex flex-wrap gap-1">
      {list.map((r) => (
        <span key={r} className="inline-block px-1.5 py-0.5 bg-ipn-guinda/10 text-ipn-guinda text-xs rounded">
          {r}
        </span>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
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
const btnDanger = 'px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors';
const btnWarning = 'px-3 py-1.5 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors';
const btnSuccess = 'px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors';

// ─── Create User Modal ────────────────────────────────────────────────────────

function CreateUserModal({
  planes,
  departamentos,
  onClose,
  onCreated,
}: {
  planes: PlanOption[];
  departamentos: DepartamentoOption[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateAdminUserDto>({
    rol: 'alumno',
    identificador: '',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo_contacto: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(field: keyof CreateAdminUserDto, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminUsersService.createUser(form);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al crear el usuario';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Nuevo usuario" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Rol *">
          <select className={inputCls} value={form.rol} onChange={(e) => set('rol', e.target.value)}>
            <option value="alumno">Alumno</option>
            <option value="profesor">Profesor</option>
            <option value="admin">Administrador</option>
            <option value="coordinador">Coordinador</option>
          </select>
        </Field>

        <Field label="Identificador (boleta / número de empleado) *">
          <input className={inputCls} value={form.identificador} onChange={(e) => set('identificador', e.target.value)} required />
        </Field>

        <Field label="Nombre(s) *">
          <input className={inputCls} value={form.nombre} onChange={(e) => set('nombre', e.target.value)} required />
        </Field>

        <Field label="Apellido paterno *">
          <input className={inputCls} value={form.apellido_paterno} onChange={(e) => set('apellido_paterno', e.target.value)} required />
        </Field>

        <Field label="Apellido materno">
          <input className={inputCls} value={form.apellido_materno ?? ''} onChange={(e) => set('apellido_materno', e.target.value)} />
        </Field>

        <Field label="Correo de contacto *">
          <input type="email" className={inputCls} value={form.correo_contacto} onChange={(e) => set('correo_contacto', e.target.value)} required />
        </Field>

        {form.rol === 'alumno' && (
          <>
            <Field label="Plan de estudios *">
              <select
                className={inputCls}
                value={form.id_plan ?? ''}
                onChange={(e) => set('id_plan', Number(e.target.value))}
                required
              >
                <option value="">Seleccionar plan</option>
                {planes.map((p) => (
                  <option key={p.id_plan} value={p.id_plan}>
                    {p.nombre_carrera} – {p.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Semestre actual *">
              <input
                type="number"
                min={1}
                max={20}
                className={inputCls}
                value={form.semestre_actual ?? ''}
                onChange={(e) => set('semestre_actual', Number(e.target.value))}
                required
              />
            </Field>
          </>
        )}

        {form.rol === 'profesor' && (
          <Field label="Departamento *">
            <select
              className={inputCls}
              value={form.id_departamento ?? ''}
              onChange={(e) => set('id_departamento', Number(e.target.value))}
              required
            >
              <option value="">Seleccionar departamento</option>
              {departamentos.map((d) => (
                <option key={d.id_departamento} value={d.id_departamento}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </Field>
        )}

        <p className="text-xs text-gray-500 mb-4 bg-gray-50 rounded p-2">
          La contraseña será generada automáticamente por el sistema y enviada al correo indicado.
        </p>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancelar</button>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? 'Creando...' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Import Excel Modal ───────────────────────────────────────────────────────

function ImportExcelModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ creados: number; errores: string[] } | null>(null);
  const [error, setError] = useState('');

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await adminUsersService.importUsersFromExcel(file);
      setResult(res);
      onImported();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al importar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Importar usuarios desde Excel" onClose={onClose}>
      <div className="mb-4 text-sm text-gray-600 bg-blue-50 rounded p-3">
        <p className="font-medium mb-1">Columnas requeridas en el archivo:</p>
        <code className="text-xs block leading-6">
          rol | identificador | nombre | apellido_paterno | apellido_materno | correo_contacto
        </code>
        <p className="mt-2 font-medium">Columnas adicionales según rol:</p>
        <code className="text-xs block leading-6">
          alumno → id_plan, semestre_actual<br />
          profesor → id_departamento
        </code>
        <p className="mt-1 text-xs text-gray-500">
          La primera fila debe ser el encabezado. La contraseña se genera automáticamente por usuario y se envía por correo.
        </p>
      </div>

      <Field label="Archivo Excel (.xlsx, .xls)">
        <input ref={fileRef} type="file" accept=".xlsx,.xls" className={inputCls} />
      </Field>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {result && (
        <div className="mb-4 p-3 rounded border border-green-200 bg-green-50">
          <p className="text-green-700 font-medium text-sm">{result.creados} usuario(s) importado(s) correctamente.</p>
          {result.errores.length > 0 && (
            <>
              <p className="text-red-600 text-sm mt-2 font-medium">{result.errores.length} error(es):</p>
              <ul className="text-xs text-red-600 mt-1 list-disc list-inside max-h-32 overflow-y-auto">
                {result.errores.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button className={btnSecondary} onClick={onClose}>Cerrar</button>
        {!result && (
          <button className={btnPrimary} onClick={handleImport} disabled={loading}>
            {loading ? 'Importando...' : 'Importar'}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [planes, setPlanes] = useState<PlanOption[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoOption[]>([]);
  const [actionError, setActionError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminUsersService.listUsers({
        search: search || undefined,
        rol: rolFilter || undefined,
        estado: (estadoFilter || undefined) as 'activo' | 'bloqueado' | 'inactivo' | 'todos' | undefined,
      });
      setUsers(data);
    } catch {
      // mantiene lista vacía
    } finally {
      setLoading(false);
    }
  }, [search, rolFilter, estadoFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    adminUsersService.getPlanes().then(setPlanes).catch(() => {});
    adminUsersService.getDepartamentos().then(setDepartamentos).catch(() => {});
  }, []);

  async function handleDeactivate(user: AdminUser) {
    if (!window.confirm(`¿Dar de baja a ${user.nombre} ${user.apellido_paterno}? Esta acción desactivará su cuenta.`)) return;
    setActionError('');
    try {
      await adminUsersService.deactivateUser(user.id_usuario);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al dar de baja';
      setActionError(msg);
    }
  }

  async function handleBlock(user: AdminUser) {
    if (!window.confirm(`¿Bloquear la cuenta de ${user.nombre} ${user.apellido_paterno}?`)) return;
    setActionError('');
    try {
      await adminUsersService.blockUser(user.id_usuario);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al bloquear';
      setActionError(msg);
    }
  }

  async function handleActivate(user: AdminUser) {
    if (!window.confirm(`¿Reactivar la cuenta de ${user.nombre} ${user.apellido_paterno}?`)) return;
    setActionError('');
    try {
      await adminUsersService.activateUser(user.id_usuario);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error al reactivar';
      setActionError(msg);
    }
  }

  const isActive = (u: AdminUser) => u.activo === 1 && u.bloqueado === 0;
  const isBlocked = (u: AdminUser) => u.bloqueado === 1;
  const isInactive = (u: AdminUser) => u.activo === 0 && u.bloqueado === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-gray-500 text-sm">Gestión de cuentas del sistema</p>
        </div>
        <div className="flex gap-2">
          <button className={btnSecondary} onClick={() => setShowImport(true)}>
            Importar Excel
          </button>
          <button className={btnPrimary} onClick={() => setShowCreate(true)}>
            + Nuevo usuario
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4 bg-white border border-gray-200 rounded-lg p-3">
        <input
          className={`${inputCls} max-w-xs`}
          placeholder="Buscar por nombre, identificador o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={`${inputCls} w-40`} value={rolFilter} onChange={(e) => setRolFilter(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="alumno">Alumno</option>
          <option value="profesor">Profesor</option>
          <option value="coordinador">Coordinador</option>
        </select>
        <select className={`${inputCls} w-36`} value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="bloqueado">Bloqueado</option>
          <option value="inactivo">Baja</option>
        </select>
      </div>

      {actionError && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{actionError}</div>
      )}

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Identificador</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Correo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Roles</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Cargando...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No se encontraron usuarios</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {u.nombre} {u.apellido_paterno}
                      {u.apellido_materno ? ` ${u.apellido_materno}` : ''}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">{u.identificador}</td>
                    <td className="px-4 py-3 text-gray-600">{u.correo_contacto}</td>
                    <td className="px-4 py-3">
                      <RolesBadge roles={u.roles} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge activo={u.activo} bloqueado={u.bloqueado} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {(isBlocked(u) || isInactive(u)) && (
                          <button className={btnSuccess} onClick={() => handleActivate(u)}>
                            Reactivar
                          </button>
                        )}
                        {isActive(u) && (
                          <button className={btnWarning} onClick={() => handleBlock(u)}>
                            Bloquear
                          </button>
                        )}
                        {(isActive(u) || isBlocked(u)) && (
                          <button className={btnDanger} onClick={() => handleDeactivate(u)}>
                            Dar de baja
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            {users.length} usuario{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          planes={planes}
          departamentos={departamentos}
          onClose={() => setShowCreate(false)}
          onCreated={fetchUsers}
        />
      )}

      {showImport && (
        <ImportExcelModal
          onClose={() => setShowImport(false)}
          onImported={fetchUsers}
        />
      )}
    </div>
  );
}

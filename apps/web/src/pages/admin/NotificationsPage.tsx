import { useState, useEffect, useRef } from 'react';
import {
  adminNotificationsService,
  adminUsersService,
  FiltroNotificacion,
  TipoFiltro,
  DestinatarioPreview,
  NotifCatalogs,
  SendNotifResult,
  AdminUser,
} from '../../services/admin.service';

const btnPrimary =
  'px-4 py-2 bg-ipn-guinda text-white text-sm font-medium rounded hover:bg-ipn-guinda/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary =
  'px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const inputCls =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda';
const selectCls =
  'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ipn-guinda bg-white';

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
          wide ? 'max-w-2xl' : 'max-w-lg'
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

const TIPOS: { value: TipoFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos los usuarios activos' },
  { value: 'rol', label: 'Por rol' },
  { value: 'carrera', label: 'Por carrera' },
  { value: 'plan', label: 'Por plan de estudios' },
  { value: 'semestre', label: 'Por semestre actual' },
  { value: 'periodo', label: 'Por periodo académico' },
  { value: 'grupo', label: 'Por grupo' },
  { value: 'profesor', label: 'Por profesor' },
  { value: 'especificos', label: 'Usuarios específicos' },
];

export function NotificationsPage() {
  const [catalogs, setCatalogs] = useState<NotifCatalogs | null>(null);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Filter state
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos');
  const [idRol, setIdRol] = useState('alumno');
  const [idCarrera, setIdCarrera] = useState('');
  const [idPlan, setIdPlan] = useState('');
  const [semestre, setSemestre] = useState('');
  const [idPeriodo, setIdPeriodo] = useState('');
  const [idGrupo, setIdGrupo] = useState('');
  const [idProfesor, setIdProfesor] = useState('');
  const [usuariosEspecificos, setUsuariosEspecificos] = useState<{ id: number; nombre: string }[]>([]);

  // User search for "específicos"
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<AdminUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Message
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');

  // Preview
  const [destinatarios, setDestinatarios] = useState<DestinatarioPreview[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Send
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<SendNotifResult | null>(null);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    adminNotificationsService
      .getCatalogs()
      .then(setCatalogs)
      .finally(() => setLoadingCatalogs(false));
  }, []);

  // Debounced user search
  useEffect(() => {
    if (tipoFiltro !== 'especificos' || userSearch.trim().length < 2) {
      setUserResults([]);
      setShowDropdown(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      adminUsersService
        .listUsers({ search: userSearch.trim() })
        .then((users) => {
          setUserResults(users.slice(0, 8));
          setShowDropdown(true);
        })
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, tipoFiltro]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset preview when filter changes
  useEffect(() => {
    setDestinatarios(null);
    setPreviewError('');
    setShowPreview(false);
  }, [tipoFiltro, idRol, idCarrera, idPlan, semestre, idPeriodo, idGrupo, idProfesor, usuariosEspecificos]);

  function buildFiltros(): FiltroNotificacion {
    switch (tipoFiltro) {
      case 'rol':
        return { tipo: 'rol', id_rol: idRol };
      case 'carrera':
        return { tipo: 'carrera', id_carrera: Number(idCarrera) };
      case 'plan':
        return { tipo: 'plan', id_plan: Number(idPlan) };
      case 'semestre':
        return { tipo: 'semestre', semestre: Number(semestre) };
      case 'periodo':
        return { tipo: 'periodo', id_periodo: Number(idPeriodo) };
      case 'grupo':
        return { tipo: 'grupo', id_grupo: Number(idGrupo) };
      case 'profesor':
        return { tipo: 'profesor', id_profesor: Number(idProfesor) };
      case 'especificos':
        return { tipo: 'especificos', ids_usuario: usuariosEspecificos.map((u) => u.id) };
      default:
        return { tipo: 'todos' };
    }
  }

  function isFiltroValid(): boolean {
    switch (tipoFiltro) {
      case 'rol':
        return !!idRol;
      case 'carrera':
        return !!idCarrera;
      case 'plan':
        return !!idPlan;
      case 'semestre':
        return !!semestre && Number(semestre) >= 1 && Number(semestre) <= 12;
      case 'periodo':
        return !!idPeriodo;
      case 'grupo':
        return !!idGrupo;
      case 'profesor':
        return !!idProfesor;
      case 'especificos':
        return usuariosEspecificos.length > 0;
      default:
        return true;
    }
  }

  async function handlePreview() {
    setLoadingPreview(true);
    setPreviewError('');
    try {
      const result = await adminNotificationsService.preview(buildFiltros());
      setDestinatarios(result.usuarios);
      setShowPreview(true);
    } catch {
      setPreviewError('Error al consultar destinatarios. Verifica los filtros.');
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setSendError('');
    try {
      const result = await adminNotificationsService.send(asunto, cuerpo, buildFiltros());
      setSendResult(result);
      setShowConfirm(false);
      setDestinatarios(null);
      setShowPreview(false);
      setAsunto('');
      setCuerpo('');
    } catch {
      setSendError('Error al enviar el comunicado. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  }

  function addUser(user: AdminUser) {
    if (!usuariosEspecificos.find((u) => u.id === user.id_usuario)) {
      setUsuariosEspecificos((prev) => [
        ...prev,
        { id: user.id_usuario, nombre: `${user.nombre} ${user.apellido_paterno}` },
      ]);
    }
    setUserSearch('');
    setShowDropdown(false);
  }

  function removeUser(id: number) {
    setUsuariosEspecificos((prev) => prev.filter((u) => u.id !== id));
  }

  const canSend =
    isFiltroValid() &&
    destinatarios !== null &&
    destinatarios.length > 0 &&
    asunto.trim().length > 0 &&
    cuerpo.trim().length > 0;

  const gruposFiltrados = catalogs?.grupos ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notificaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Envía comunicados por correo electrónico a grupos de usuarios
          </p>
        </div>
        <button
          className={btnPrimary}
          disabled={!canSend}
          onClick={() => setShowConfirm(true)}
        >
          Enviar comunicado
        </button>
      </div>

      {loadingCatalogs ? (
        <p className="text-sm text-gray-500">Cargando catálogos...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Panel de destinatarios ── */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <div className="px-5 py-4 border-b bg-gray-50 rounded-t-lg">
              <h2 className="font-semibold text-gray-700 text-sm">1. Destinatarios</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {TIPOS.map((t) => (
                <label key={t.value} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="tipoFiltro"
                    value={t.value}
                    checked={tipoFiltro === t.value}
                    onChange={() => setTipoFiltro(t.value)}
                    className="mt-0.5 accent-ipn-guinda"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{t.label}</span>

                    {/* Sub-options */}
                    {tipoFiltro === t.value && t.value !== 'todos' && (
                      <div className="mt-2">
                        {t.value === 'rol' && (
                          <select
                            className={selectCls}
                            value={idRol}
                            onChange={(e) => setIdRol(e.target.value)}
                          >
                            <option value="alumno">Alumno</option>
                            <option value="profesor">Profesor</option>
                            <option value="admin">Administrador</option>
                            <option value="coordinador">Coordinador</option>
                          </select>
                        )}

                        {t.value === 'carrera' && (
                          <select
                            className={selectCls}
                            value={idCarrera}
                            onChange={(e) => setIdCarrera(e.target.value)}
                          >
                            <option value="">— Selecciona carrera —</option>
                            {catalogs?.carreras.map((c) => (
                              <option key={c.id_carrera} value={c.id_carrera}>
                                {c.nombre} ({c.clave})
                              </option>
                            ))}
                          </select>
                        )}

                        {t.value === 'plan' && (
                          <select
                            className={selectCls}
                            value={idPlan}
                            onChange={(e) => setIdPlan(e.target.value)}
                          >
                            <option value="">— Selecciona plan —</option>
                            {catalogs?.planes.map((p) => (
                              <option key={p.id_plan} value={p.id_plan}>
                                {p.nombre} – {p.nombre_carrera}
                              </option>
                            ))}
                          </select>
                        )}

                        {t.value === 'semestre' && (
                          <input
                            type="number"
                            min={1}
                            max={12}
                            placeholder="Semestre (1-12)"
                            className={inputCls}
                            value={semestre}
                            onChange={(e) => setSemestre(e.target.value)}
                          />
                        )}

                        {t.value === 'periodo' && (
                          <select
                            className={selectCls}
                            value={idPeriodo}
                            onChange={(e) => setIdPeriodo(e.target.value)}
                          >
                            <option value="">— Selecciona periodo —</option>
                            {catalogs?.periodos.map((p) => (
                              <option key={p.id_periodo} value={p.id_periodo}>
                                {p.nombre}
                                {p.activo ? ' (activo)' : ''}
                              </option>
                            ))}
                          </select>
                        )}

                        {t.value === 'grupo' && (
                          <select
                            className={selectCls}
                            value={idGrupo}
                            onChange={(e) => setIdGrupo(e.target.value)}
                          >
                            <option value="">— Selecciona grupo —</option>
                            {gruposFiltrados.map((g) => (
                              <option key={g.id_grupo} value={g.id_grupo}>
                                {g.clave_grupo} – {g.nombre_materia} [{g.nombre_periodo}]
                              </option>
                            ))}
                          </select>
                        )}

                        {t.value === 'profesor' && (
                          <select
                            className={selectCls}
                            value={idProfesor}
                            onChange={(e) => setIdProfesor(e.target.value)}
                          >
                            <option value="">— Selecciona profesor —</option>
                            {catalogs?.profesores.map((p) => (
                              <option key={p.id_profesor} value={p.id_profesor}>
                                {p.nombre_completo} ({p.numero_empleado})
                              </option>
                            ))}
                          </select>
                        )}

                        {t.value === 'especificos' && (
                          <div className="space-y-2">
                            {/* Chips */}
                            {usuariosEspecificos.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {usuariosEspecificos.map((u) => (
                                  <span
                                    key={u.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-ipn-guinda/10 text-ipn-guinda text-xs rounded-full"
                                  >
                                    {u.nombre}
                                    <button
                                      onClick={() => removeUser(u.id)}
                                      className="hover:text-red-600 leading-none"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            {/* Search */}
                            <div className="relative" ref={searchRef}>
                              <input
                                type="text"
                                placeholder="Buscar usuario por nombre o boleta..."
                                className={inputCls}
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                onFocus={() => userResults.length > 0 && setShowDropdown(true)}
                              />
                              {searchLoading && (
                                <span className="absolute right-3 top-2.5 text-xs text-gray-400">
                                  Buscando...
                                </span>
                              )}
                              {showDropdown && userResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                                  {userResults.map((u) => (
                                    <button
                                      key={u.id_usuario}
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => addUser(u)}
                                    >
                                      <span>
                                        {u.nombre} {u.apellido_paterno}
                                      </span>
                                      <span className="text-xs text-gray-400">{u.identificador}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </label>
              ))}

              {/* Preview button */}
              <div className="pt-2 border-t mt-4">
                {previewError && <p className="text-red-600 text-xs mb-2">{previewError}</p>}
                <button
                  className={btnSecondary + ' w-full'}
                  disabled={!isFiltroValid() || loadingPreview}
                  onClick={handlePreview}
                >
                  {loadingPreview ? 'Consultando...' : 'Vista previa de destinatarios'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Panel de redacción ── */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <div className="px-5 py-4 border-b bg-gray-50 rounded-t-lg">
              <h2 className="font-semibold text-gray-700 text-sm">2. Redactar comunicado</h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Escribe el asunto del correo..."
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-0.5 text-right">{asunto.length}/200</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuerpo del mensaje</label>
                <textarea
                  className={inputCls + ' min-h-[200px] resize-y'}
                  placeholder="Escribe el contenido del comunicado..."
                  value={cuerpo}
                  onChange={(e) => setCuerpo(e.target.value)}
                  maxLength={5000}
                />
                <p className="text-xs text-gray-400 mt-0.5 text-right">{cuerpo.length}/5000</p>
              </div>
              {!canSend && (
                <div className="text-xs text-gray-400 bg-gray-50 rounded px-3 py-2 space-y-0.5">
                  {!isFiltroValid() && <p>• Completa la selección de destinatarios</p>}
                  {destinatarios === null && <p>• Genera la vista previa de destinatarios</p>}
                  {destinatarios !== null && destinatarios.length === 0 && (
                    <p>• No hay destinatarios con los filtros seleccionados</p>
                  )}
                  {!asunto.trim() && <p>• Escribe el asunto</p>}
                  {!cuerpo.trim() && <p>• Escribe el cuerpo del mensaje</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Vista previa de destinatarios ── */}
      {showPreview && destinatarios !== null && (
        <div className="mt-6 border border-gray-200 rounded-lg bg-white">
          <div className="px-5 py-4 border-b bg-gray-50 rounded-t-lg flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 text-sm">
              Destinatarios{' '}
              <span className="text-ipn-guinda font-bold">{destinatarios.length}</span>{' '}
              {destinatarios.length === 1 ? 'usuario' : 'usuarios'}
            </h2>
            <button
              className="text-gray-400 hover:text-gray-600 text-sm"
              onClick={() => setShowPreview(false)}
            >
              Ocultar
            </button>
          </div>
          {destinatarios.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              No se encontraron usuarios con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Correo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Rol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {destinatarios.map((d) => (
                    <tr key={d.id_usuario} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {d.nombre} {d.apellido_paterno}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{d.correo_contacto}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                          {d.roles || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal confirmación ── */}
      {showConfirm && (
        <Modal title="Confirmar envío" onClose={() => setShowConfirm(false)}>
          <p className="text-sm text-gray-700 mb-3">
            Estás a punto de enviar el comunicado{' '}
            <strong>"{asunto}"</strong> a{' '}
            <strong>{destinatarios?.length ?? 0} destinatario(s)</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
          {sendError && <p className="text-red-600 text-sm mb-3">{sendError}</p>}
          <div className="flex justify-end gap-2">
            <button className={btnSecondary} onClick={() => setShowConfirm(false)} disabled={sending}>
              Cancelar
            </button>
            <button className={btnPrimary} onClick={handleSend} disabled={sending}>
              {sending ? 'Enviando...' : 'Confirmar envío'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal resultado ── */}
      {sendResult && (
        <Modal title="Resultado del envío" onClose={() => setSendResult(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
              <span className="text-green-600 font-bold text-lg">{sendResult.enviados}</span>
              <span className="text-sm text-green-700">
                correo(s) enviado(s) exitosamente
              </span>
            </div>
            {sendResult.errores.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm font-medium text-red-700 mb-1">
                  {sendResult.errores.length} error(es):
                </p>
                <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside max-h-32 overflow-y-auto">
                  {sendResult.errores.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <button className={btnPrimary} onClick={() => setSendResult(null)}>
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

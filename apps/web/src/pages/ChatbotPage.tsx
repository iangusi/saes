import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

type ChatStatus = 'answered' | 'needs_clarification' | 'no_data' | 'error';
type DataType = 'table' | 'cards' | 'summary';

interface StructuredData {
  type: DataType;
  columns?: string[];
  rows?: Record<string, unknown>[];
  items?: Record<string, unknown>[];
}

interface SuggestedAction {
  label: string;
  action: 'navigate' | 'ask';
  target: string;
  payload?: Record<string, unknown>;
}

interface Mensaje {
  from: 'user' | 'bot';
  text: string;
  timestamp?: string;
  status?: ChatStatus;
  intent?: string;
  confidence?: number;
  data?: StructuredData;
  suggested_actions?: SuggestedAction[];
}

interface Conversacion {
  id_conversacion: string;
  titulo: string;
  creado_en: string;
  actualizado_en: string;
}

interface ChatbotApiResponse {
  reply: string;
  status: ChatStatus;
  intent: string;
  confidence: number;
  data?: StructuredData;
  suggested_actions: SuggestedAction[];
}

const emptyGreeting: Mensaje = {
  from: 'bot',
  text: 'Hola. Puedo ayudarte con horario, kardex, calificaciones, reinscripción, bajas y trámites escolares.',
  status: 'answered',
  intent: 'saludo',
  confidence: 1,
  suggested_actions: [
    { label: 'Mi horario', action: 'ask', target: '¿Cuál es mi horario?' },
    { label: 'Reinscripción', action: 'ask', target: '¿Qué materias puedo meter?' },
    { label: 'Bajas', action: 'ask', target: '¿Puedo dar de baja una materia?' },
  ],
};

export function ChatbotPage() {
  const navigate = useNavigate();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [chatActivo, setChatActivo] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeConversation = useMemo(
    () => conversaciones.find((c) => c.id_conversacion === chatActivo),
    [chatActivo, conversaciones]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, enviando]);

  useEffect(() => {
    cargarConversaciones();
  }, []);

  async function cargarConversaciones() {
    try {
      const res = await api.get('/chatbot/conversaciones');
      setConversaciones(res.data.data?.conversaciones ?? []);
    } catch {
      setConversaciones([]);
    }
  }

  async function crearConversacion(resetMessages = true): Promise<string> {
    const res = await api.post('/chatbot/conversaciones');
    const id = String(res.data.data?.id_conversacion);
    setChatActivo(id);
    if (resetMessages) setMensajes([emptyGreeting]);
    await cargarConversaciones();
    return id;
  }

  async function nuevaConversacion() {
    if (enviando) return;
    await crearConversacion(true);
    setSidebarOpen(false);
  }

  async function seleccionarChat(id: string) {
    setChatActivo(id);
    setCargandoHistorial(true);
    setMensajes([]);
    setSidebarOpen(false);

    try {
      const res = await api.get(`/chatbot/conversaciones/${id}/historial`);
      const historial: Mensaje[] = (res.data.data?.historial ?? []).map((m: Mensaje) => ({
        from: m.from,
        text: m.text,
        timestamp: m.timestamp,
        status: m.status,
        intent: m.intent,
        confidence: m.confidence,
        data: m.data,
        suggested_actions: m.suggested_actions ?? [],
      }));
      setMensajes(historial.length ? historial : [emptyGreeting]);
    } catch {
      setMensajes([
        {
          from: 'bot',
          text: 'No pude cargar el historial de esta conversación.',
          status: 'error',
          intent: 'error',
          confidence: 1,
          suggested_actions: [],
        },
      ]);
    } finally {
      setCargandoHistorial(false);
    }
  }

  async function eliminarConversacion(e: MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta conversación?')) return;

    try {
      await api.delete(`/chatbot/conversaciones/${id}`);
      if (chatActivo === id) {
        setChatActivo(null);
        setMensajes([]);
      }
      await cargarConversaciones();
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          from: 'bot',
          text: 'No pude eliminar la conversación.',
          status: 'error',
          intent: 'error',
          confidence: 1,
          suggested_actions: [],
        },
      ]);
    }
  }

  async function enviarMensaje(textoForzado?: string) {
    const limpio = (textoForzado ?? texto).trim();
    if (!limpio || enviando) return;

    setEnviando(true);
    setTexto('');
    setMensajes((prev) => [...prev, { from: 'user', text: limpio }]);

    try {
      const id = chatActivo ?? (await crearConversacion(false));
      const res = await api.post(`/chatbot/conversaciones/${id}/mensajes`, {
        pregunta: limpio,
      });
      const bot = normalizeBotMessage(res.data.data);
      setMensajes((prev) => [...prev, bot]);
      await cargarConversaciones();
    } catch {
      setMensajes((prev) => [
        ...prev,
        {
          from: 'bot',
          text: 'Error de conexión. Intenta de nuevo.',
          status: 'error',
          intent: 'error',
          confidence: 1,
          suggested_actions: [],
        },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }

  function handleAction(action: SuggestedAction) {
    if (action.action === 'navigate') {
      navigate(action.target);
      return;
    }
    setTexto(action.target);
  }

  return (
    <div className="h-[calc(100vh-112px)] min-h-[560px]">
      <div className="flex h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <ConversationSidebar
          conversaciones={conversaciones}
          chatActivo={chatActivo}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNew={nuevaConversacion}
          onSelect={seleccionarChat}
          onDelete={eliminarConversacion}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 md:hidden"
                aria-label="Abrir conversaciones"
              >
                <span className="text-lg leading-none">=</span>
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold text-gray-900">Asistente ESCOM</h1>
                <p className="truncate text-xs text-gray-500">
                  {activeConversation?.titulo ?? 'Nueva consulta académica'}
                </p>
              </div>
            </div>
            <span className="hidden rounded-md bg-ipn-guinda/10 px-2 py-1 text-xs font-medium text-ipn-guinda sm:inline">
              SAES 2.0
            </span>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-3 py-4 sm:px-5">
            {!chatActivo && mensajes.length === 0 && (
              <div className="mx-auto flex min-h-full max-w-3xl items-center">
                <MessageBubble message={emptyGreeting} onAction={handleAction} />
              </div>
            )}

            {cargandoHistorial && (
              <div className="py-8 text-center text-sm text-gray-500">Cargando conversación...</div>
            )}

            {!cargandoHistorial && mensajes.length > 0 && (
              <div className="mx-auto flex max-w-4xl flex-col gap-3">
                {mensajes.map((message, index) => (
                  <MessageBubble key={`${message.from}-${index}`} message={message} onAction={handleAction} />
                ))}
              </div>
            )}

            {enviando && (
              <div className="mx-auto mt-3 max-w-4xl">
                <div className="w-fit rounded-lg bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                  Consultando contexto y datos...
                </div>
              </div>
            )}
          </div>

          <footer className="border-t border-gray-200 bg-white p-3">
            <div className="mx-auto flex max-w-4xl items-end gap-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={onKey}
                placeholder="Escribe tu pregunta sobre SAES"
                disabled={enviando}
                rows={1}
                className="max-h-32 min-h-[42px] flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-ipn-guinda focus:ring-2 focus:ring-ipn-guinda/20 disabled:opacity-60"
              />
              <button
                onClick={() => enviarMensaje()}
                disabled={enviando || !texto.trim()}
                className="h-[42px] rounded-md bg-ipn-guinda px-4 text-sm font-semibold text-white transition hover:bg-ipn-guinda/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Enviar
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

function ConversationSidebar({
  conversaciones,
  chatActivo,
  open,
  onClose,
  onNew,
  onSelect,
  onDelete,
}: {
  conversaciones: Conversacion[];
  chatActivo: string | null;
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (e: MouseEvent, id: string) => void;
}) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-200 bg-white transition-transform md:static md:z-auto md:w-72 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Conversaciones</p>
            <p className="text-xs text-gray-500">{conversaciones.length} guardadas</p>
          </div>
          <button
            onClick={onNew}
            className="rounded-md bg-ipn-guinda px-3 py-2 text-xs font-semibold text-white hover:bg-ipn-guinda/90"
          >
            Nueva
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {conversaciones.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-gray-500">Sin conversaciones</p>
          ) : (
            conversaciones.map((c) => (
              <button
                key={c.id_conversacion}
                onClick={() => onSelect(c.id_conversacion)}
                className={`group mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition ${
                  chatActivo === c.id_conversacion
                    ? 'bg-ipn-guinda/10 text-ipn-guinda'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="min-w-0 flex-1 truncate font-medium">{c.titulo || 'Conversación'}</span>
                <span
                  onClick={(e) => onDelete(e, c.id_conversacion)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-400 opacity-100 hover:bg-red-50 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100"
                  title="Eliminar"
                >
                  x
                </span>
              </button>
            ))
          )}
        </div>
      </aside>
    </>
  );
}

function MessageBubble({
  message,
  onAction,
}: {
  message: Mensaje;
  onAction: (action: SuggestedAction) => void;
}) {
  const isUser = message.from === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[92%] rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[78%] ${
          isUser ? 'bg-ipn-guinda text-white' : 'bg-white text-gray-800 border border-gray-200'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>

        {!isUser && message.data && <StructuredDataView data={message.data} />}

        {!isUser && message.suggested_actions && message.suggested_actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggested_actions.map((action, index) => (
              <button
                key={`${action.label}-${index}`}
                onClick={() => onAction(action)}
                className="rounded-md border border-ipn-guinda/20 bg-ipn-guinda/5 px-2.5 py-1.5 text-xs font-semibold text-ipn-guinda hover:bg-ipn-guinda/10"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {!isUser && message.intent && (
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
            <span className="rounded-md bg-gray-100 px-2 py-1">{formatIntent(message.intent)}</span>
            {typeof message.confidence === 'number' && (
              <span className="rounded-md bg-gray-100 px-2 py-1">
                {Math.round(message.confidence * 100)}%
              </span>
            )}
            {message.status && <span className="rounded-md bg-gray-100 px-2 py-1">{message.status}</span>}
          </div>
        )}

        {message.timestamp && (
          <div className={`mt-2 text-[11px] ${isUser ? 'text-white/70' : 'text-gray-400'}`}>
            {new Date(message.timestamp).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StructuredDataView({ data }: { data: StructuredData }) {
  if (data.type === 'table' && data.rows?.length) {
    const columns = data.columns?.length ? data.columns : Object.keys(data.rows[0]);
    return (
      <div className="mt-3 overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column} className="max-w-[220px] whitespace-nowrap px-3 py-2 text-gray-700">
                    {String(row[column] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.type === 'cards' && data.items?.length) {
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {data.items.map((item, index) => (
          <div key={index} className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <p className="text-sm font-semibold text-gray-900">
              {String(item.title ?? item.Materia ?? item.label ?? 'Elemento')}
            </p>
            <div className="mt-2 space-y-1 text-xs text-gray-600">
              {Object.entries(item)
                .filter(([key]) => key !== 'title')
                .map(([key, value]) => (
                  <p key={key} className="break-words">
                    <span className="font-medium">{formatIntent(key)}:</span> {String(value ?? '')}
                  </p>
                ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.type === 'summary' && data.items?.length) {
    return (
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {data.items.map((item, index) => (
          <div key={index} className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase text-gray-500">{String(item.label ?? 'Dato')}</p>
            <p className="break-words text-sm font-semibold text-gray-900">{String(item.value ?? '')}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

function normalizeBotMessage(raw: ChatbotApiResponse | undefined): Mensaje {
  return {
    from: 'bot',
    text: raw?.reply ?? 'Sin respuesta.',
    status: raw?.status ?? 'answered',
    intent: raw?.intent ?? 'institucional_general',
    confidence: raw?.confidence ?? 0,
    data: raw?.data,
    suggested_actions: raw?.suggested_actions ?? [],
  };
}

function formatIntent(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

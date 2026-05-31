// apps/web/src/pages/ChatbotPage.tsx
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../state/auth.store';

interface Mensaje {
  from: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

interface Conversacion {
  id_conversacion: string;
  titulo: string;
  creado_en: string;
  actualizado_en: string;
}

export function ChatbotPage() {
  const user = useAuthStore((s) => s.user);

  // Listas de conversaciones
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [chatActivo, setChatActivo] = useState<string | null>(null);

  // Mensajes del chat activo
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------------
  // Scroll automático al fondo
  // ------------------------------------------------------------------
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  // ------------------------------------------------------------------
  // Cargar lista de conversaciones al montar
  // ------------------------------------------------------------------
  useEffect(() => {
    cargarConversaciones();
  }, []);

  async function cargarConversaciones() {
    try {
      const res = await api.get('/chatbot/conversaciones');
      setConversaciones(res.data.data?.conversaciones ?? []);
    } catch {
      console.error('Error cargando conversaciones');
    }
  }

  // ------------------------------------------------------------------
  // Crear nueva conversación
  // ------------------------------------------------------------------
  async function nuevaConversacion() {
    try {
      const res = await api.post('/chatbot/conversaciones');
      const id: string = res.data.data?.id_conversacion;
      await cargarConversaciones();
      seleccionarChat(id);
    } catch {
      console.error('Error creando conversación');
    }
  }

  // ------------------------------------------------------------------
  // Seleccionar conversación y cargar historial
  // ------------------------------------------------------------------
  async function seleccionarChat(id: string) {
    setChatActivo(id);
    setCargandoHistorial(true);
    setMensajes([]);
    try {
      const res = await api.get(`/chatbot/conversaciones/${id}/historial`);
      const historial: Mensaje[] = (res.data.data?.historial ?? []).map(
        (m: { from: string; text: string; timestamp: string }) => ({
          from: m.from as 'user' | 'bot',
          text: m.text,
          timestamp: m.timestamp,
        })
      );
      setMensajes(
        historial.length
          ? historial
          : [{ from: 'bot', text: '¡Hola! ¿En qué te puedo ayudar?' }]
      );
    } catch {
      setMensajes([{ from: 'bot', text: '¡Hola! ¿En qué te puedo ayudar?' }]);
    } finally {
      setCargandoHistorial(false);
    }
  }

  // ------------------------------------------------------------------
  // Eliminar conversación
  // ------------------------------------------------------------------
  async function eliminarConversacion(e: React.MouseEvent, id: string) {
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
      console.error('Error eliminando conversación');
    }
  }

  // ------------------------------------------------------------------
  // Enviar mensaje
  // ------------------------------------------------------------------
  async function enviarMensaje() {
    const limpio = texto.trim();
    if (!limpio || enviando || !chatActivo) return;

    setEnviando(true);
    setMensajes((prev) => [...prev, { from: 'user', text: limpio }]);
    setTexto('');

    try {
      const res = await api.post(`/chatbot/conversaciones/${chatActivo}/mensajes`, {
        pregunta: limpio,
      });
      const reply: string = res.data.data?.reply ?? 'Sin respuesta.';
      setMensajes((prev) => [...prev, { from: 'bot', text: reply }]);

      // Refrescar lista para actualizar el título si es el primer mensaje
      await cargarConversaciones();
    } catch {
      setMensajes((prev) => [
        ...prev,
        { from: 'bot', text: 'Error de conexión. Intenta de nuevo.' },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensaje();
    }
  }

  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------
  return (
    <div className="flex h-[calc(100vh-112px)] gap-4">
      {/* ---- Sidebar de conversaciones ---- */}
      <aside className="w-64 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-gray-100">
          <button
            onClick={nuevaConversacion}
            className="w-full bg-ipn-guinda text-white text-sm font-semibold py-2 px-3 rounded-lg hover:opacity-90 transition"
          >
            + Nueva conversación
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversaciones.length === 0 ? (
            <p className="text-xs text-gray-400 p-4 text-center">Sin conversaciones</p>
          ) : (
            conversaciones.map((c) => (
              <button
                key={c.id_conversacion}
                onClick={() => seleccionarChat(c.id_conversacion)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between group hover:bg-gray-50 transition-colors ${
                  chatActivo === c.id_conversacion
                    ? 'bg-ipn-guinda/10 border-l-4 border-ipn-guinda font-semibold text-ipn-guinda'
                    : 'text-gray-700'
                }`}
              >
                <span className="truncate flex-1 pr-1">
                  {c.titulo || 'Conversación'}
                </span>
                <span
                  onClick={(e) => eliminarConversacion(e, c.id_conversacion)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-lg leading-none px-1"
                  title="Eliminar"
                >
                  ×
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ---- Área de chat ---- */}
      <section className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Encabezado */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Asistente ESCOM</p>
            <p className="text-xs text-gray-400">
              {chatActivo
                ? 'Conversación activa'
                : 'Selecciona o crea una conversación'}
            </p>
          </div>
        </div>

        {/* Mensajes */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3"
        >
          {!chatActivo && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Crea o selecciona una conversación para comenzar
            </div>
          )}

          {cargandoHistorial && (
            <div className="text-center text-gray-400 text-sm">Cargando...</div>
          )}

          {chatActivo &&
            !cargandoHistorial &&
            mensajes.map((m, i) => (
              <div
                key={i}
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.from === 'user'
                    ? 'self-end bg-ipn-guinda text-white rounded-br-sm'
                    : 'self-start bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {m.text}
                {m.timestamp && (
                  <div className="text-[10px] opacity-50 mt-1">
                    {new Date(m.timestamp).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            ))}

          {enviando && (
            <div className="self-start bg-gray-100 text-gray-500 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm animate-pulse">
              Escribiendo…
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2 items-end">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={onKey}
            placeholder={
              chatActivo ? 'Escribe tu pregunta…' : 'Selecciona una conversación'
            }
            disabled={enviando || !chatActivo}
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ipn-guinda/30 disabled:opacity-50 max-h-32"
          />
          <button
            onClick={enviarMensaje}
            disabled={enviando || !chatActivo || !texto.trim()}
            className="bg-ipn-guinda text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
          >
            ▶
          </button>
        </div>
      </section>
    </div>
  );
}

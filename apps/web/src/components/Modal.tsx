import { useEffect, useId } from 'react';

type ModalSize = 'md' | 'lg' | 'xl';

export function Modal({
  open,
  title,
  description,
  size = 'xl',
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  size?: ModalSize;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidth =
    size === 'md' ? 'max-w-lg' : size === 'lg' ? 'max-w-3xl' : 'max-w-5xl';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <div className={`relative w-full ${maxWidth}`}>
        <div className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 id={titleId} className="text-lg font-bold text-gray-900 truncate">
                {title}
              </h3>
              {description ? (
                <p id={descriptionId} className="text-xs text-gray-500 mt-0.5">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
            >
              Cerrar
            </button>
          </div>

          <div className="p-4 max-h-[80vh] overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}


import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useSupabase } from '../context/SupabaseContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useSupabase();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-neutral-950 text-white border border-neutral-800 shadow-xl px-4 py-3.5 flex items-start gap-3 transition-all duration-200"
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">{toast.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="text-neutral-400 hover:text-white p-0.5 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

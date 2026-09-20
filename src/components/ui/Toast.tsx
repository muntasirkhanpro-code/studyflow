import { CheckCircle2, Info, TriangleAlert, XCircle, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ICONS = { success: CheckCircle2, info: Info, warning: TriangleAlert, error: XCircle };
const COLORS = { success: 'text-ok', info: 'text-accent-text', warning: 'text-warn', error: 'text-bad' };

export function ToastContainer() {
  const { toasts, removeToast } = useApp();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-20 z-[60] flex flex-col items-stretch gap-2 sm:left-auto sm:w-96 lg:bottom-6 lg:right-6">
      {toasts.map((t) => {
        const type = t.type ?? 'info';
        const Icon = ICONS[type];
        return (
          <div key={t.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-elevated p-3 shadow-lg animate-pop">
            <Icon size={18} className={`mt-0.5 shrink-0 ${COLORS[type]}`} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{t.title}</p>
              {t.message && <p className="mt-0.5 text-[13px] text-fg-2">{t.message}</p>}
              {t.action && (
                <button type="button" className="mt-1.5 text-[13px] font-medium text-accent-text hover:underline" onClick={() => { t.action?.onClick(); removeToast(t.id); }}>
                  {t.action.label}
                </button>
              )}
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => removeToast(t.id)} className="-m-1 rounded-md p-1 text-fg-3 hover:bg-hover hover:text-fg"><X size={14} aria-hidden /></button>
          </div>
        );
      })}
    </div>
  );
}

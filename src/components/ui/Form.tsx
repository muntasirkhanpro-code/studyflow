import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { Check } from 'lucide-react';

export function Field({ label, hint, error, children, className = '' }: { label: string; hint?: string; error?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-fg-2">{label}</label>
      {children(id)}
      {error ? <p role="alert" className="mt-1.5 text-[13px] text-bad">{error}</p> : hint ? <p className="mt-1.5 text-[13px] text-fg-3">{hint}</p> : null}
    </div>
  );
}

const control = 'w-full h-10 sm:h-9 rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-fg-3 transition-colors focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-60';
export function Input({ className = '', ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${control} ${className}`} {...p} />;
}
export function Select({ className = '', children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${control} pr-8 ${className}`} {...p}>{children}</select>;
}
export function Textarea({ className = '', ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${control} h-auto min-h-20 py-2 ${className}`} {...p} />;
}

export function Segmented<T extends string>({ value, onChange, options, label, className = '' }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; className?: string }) {
  return (
    <div role="group" aria-label={label} className={`inline-flex rounded-lg bg-bg-2 p-0.5 border border-line-2 ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 sm:h-8 flex-1 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${value === o.value ? 'bg-surface text-fg shadow-xs border border-line' : 'border border-transparent text-fg-2 hover:text-fg'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-8 rounded-full border px-3 text-[13px] font-medium transition-colors duration-200 ${active ? 'border-accent bg-accent-soft text-accent-text' : 'border-line text-fg-2 hover:bg-hover hover:text-fg'}`}
    >
      {children}
    </button>
  );
}

export function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="-m-1.5 shrink-0 p-1.5"
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors duration-200 ${checked ? 'border-accent bg-accent text-on-accent' : 'border-fg-3 bg-surface hover:border-accent'}`}>
        {checked && <Check size={13} strokeWidth={3} aria-hidden />}
      </span>
    </button>
  );
}

import { cn } from '@/lib/utils';

export function FormField({ label, required, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function FormInput({ label, required, className, ...props }) {
  return (
    <FormField label={label} required={required}>
      <input
        {...props}
        className={cn(
          'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          'placeholder:text-slate-400',
          className
        )}
      />
    </FormField>
  );
}

export function FormTextarea({ label, required, className, ...props }) {
  return (
    <FormField label={label} required={required}>
      <textarea
        {...props}
        className={cn(
          'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm resize-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          className
        )}
      />
    </FormField>
  );
}

export function FormSelect({ label, required, options = [], className, ...props }) {
  return (
    <FormField label={label} required={required}>
      <select
        {...props}
        className={cn(
          'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
          className
        )}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </FormField>
  );
}

export function FormRow({ children }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

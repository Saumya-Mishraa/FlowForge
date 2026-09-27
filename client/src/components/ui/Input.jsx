export function Label({ children, htmlFor, required }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
      {children}
      {required && <span className="text-primary"> *</span>}
    </label>
  );
}

export function Input({ error, className = '', ...props }) {
  return (
    <input
      className={`w-full h-10 rounded-md border bg-white px-3 text-sm text-ink placeholder:text-ink-secondary/70 transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30 ${
        error ? 'border-danger' : 'border-line'
      } ${className}`}
      {...props}
    />
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-danger">{children}</p>;
}

export function FormField({ label, htmlFor, required, error, children, hint }) {
  return (
    <div>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-secondary">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}

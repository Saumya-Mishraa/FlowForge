import { Link } from 'react-router-dom';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex bg-white">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white font-display text-sm font-semibold">
              F
            </div>
            <span className="font-display text-lg font-semibold text-ink">FlowForge</span>
          </Link>

          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-secondary">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm text-ink-secondary">{footer}</div>}
        </div>
      </div>

      <div className="hidden lg:flex flex-1 items-center justify-center bg-primary-faint relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.35]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #E91E63 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative max-w-md px-10 text-center">
          <p className="font-display text-2xl leading-snug text-ink">
            "Chain requests, pass data between them, and watch the whole workflow run."
          </p>
          <p className="mt-4 text-sm text-ink-secondary">
            Build once, run reliably — from a single request to a full API workflow.
          </p>
        </div>
      </div>
    </div>
  );
}

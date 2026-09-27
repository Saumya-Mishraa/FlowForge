import { FileText } from 'lucide-react';
import Modal from '../ui/Modal';

const METHOD_COLORS = {
  GET: 'bg-success/10 text-success',
  POST: 'bg-warning/10 text-warning',
  PUT: 'bg-primary/10 text-primary',
  PATCH: 'bg-primary/10 text-primary',
  DELETE: 'bg-danger/10 text-danger',
};

// A clean, read-only rendering of a saved request — method, endpoint,
// description, parameters, headers, and body. No public sharing link exists
// yet (that needs an unauthenticated route + a "make public" flag on
// ApiRequest, neither of which is built), but this view is intentionally
// self-contained markup so adding a public /docs/:id page later mostly
// means reusing this component server-side rather than rebuilding it.
export default function RequestDocsModal({ request, onClose }) {
  return (
    <Modal title="Request documentation" onClose={onClose} width="max-w-xl">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold rounded px-2 py-0.5 ${METHOD_COLORS[request.method] || ''}`}>
              {request.method}
            </span>
            <h3 className="font-mono text-sm text-ink break-all">{request.url}</h3>
          </div>
          <h2 className="mt-2 font-display text-lg font-semibold text-ink">{request.name}</h2>
          {request.description && <p className="mt-1 text-sm text-ink-secondary">{request.description}</p>}
        </div>

        <DocSection title="Query Parameters" rows={request.params} />
        <DocSection title="Headers" rows={request.headers} />

        {request.auth?.type && request.auth.type !== 'none' && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-1.5">Authentication</p>
            <p className="text-sm text-ink capitalize">{request.auth.type.replace(/([A-Z])/g, ' $1')}</p>
          </div>
        )}

        {request.body?.mode && request.body.mode !== 'none' && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-1.5">Request Body</p>
            <pre className="rounded-md bg-primary-faint/50 p-3 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
              {request.body.mode === 'json' ? request.body.json || '{}' : request.body.raw || '(empty)'}
            </pre>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-ink-secondary border-t border-line pt-3">
          <FileText size={13} />
          Public sharing for this doc isn't available yet — this view is only visible to you.
        </div>
      </div>
    </Modal>
  );
}

function DocSection({ title, rows }) {
  const active = (rows || []).filter((r) => r.key);
  if (!active.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary mb-1.5">{title}</p>
      <div className="rounded-md border border-line divide-y divide-line">
        {active.map((r, i) => (
          <div key={i} className="flex gap-3 px-3 py-1.5 text-sm">
            <span className="font-mono font-medium text-ink w-36 shrink-0 truncate">{r.key}</span>
            <span className="text-ink-secondary truncate">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

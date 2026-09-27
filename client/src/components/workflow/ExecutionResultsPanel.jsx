import { Check, X, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { NODE_META } from './nodeTypesMeta';

export default function ExecutionResultsPanel({ execution, isRunning }) {
  const [expandedId, setExpandedId] = useState(null);

  if (isRunning) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-secondary py-6 justify-center">
        <Loader2 size={16} className="animate-spin" /> Running workflow…
      </div>
    );
  }

  if (!execution) {
    return (
      <p className="text-sm text-ink-secondary py-6 text-center">
        Run the workflow to see execution results here.
      </p>
    );
  }

  const results = execution.nodeResults || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-semibold rounded px-2 py-0.5 ${
            execution.status === 'succeeded'
              ? 'bg-success/10 text-success'
              : execution.status === 'stopped'
              ? 'bg-warning/10 text-warning'
              : 'bg-danger/10 text-danger'
          }`}
        >
          {execution.status === 'succeeded' ? 'Workflow completed' : execution.status === 'stopped' ? 'Stopped' : 'Workflow failed'}
        </span>
        <span className="text-xs text-ink-secondary">{execution.durationMs}ms total</span>
      </div>

      <div className="space-y-1 font-mono text-sm">
        {results.map((r, i) => {
          const meta = NODE_META[r.nodeType] || {};
          const isOpen = expandedId === i;
          return (
            <div key={i} className="rounded border border-line/70">
              <button
                onClick={() => setExpandedId(isOpen ? null : i)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-primary-faint/40"
              >
                {r.status === 'success' ? (
                  <Check size={14} className="text-success shrink-0" />
                ) : (
                  <X size={14} className="text-danger shrink-0" />
                )}
                <span className="text-ink-secondary">{meta.label || r.nodeType}</span>
                {r.response?.status && (
                  <span className={r.status === 'success' ? 'text-success' : 'text-danger'}>
                    — {r.response.status}
                  </span>
                )}
                {typeof r.durationMs === 'number' && <span className="text-ink-secondary/70">— {r.durationMs}ms</span>}
                {r.output?.result !== undefined && (
                  <span className="text-ink-secondary">
                    — {r.output.result ? 'TRUE' : 'FALSE'}
                  </span>
                )}
                <span className="ml-auto text-ink-secondary/60">
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-line/70 bg-primary-faint/30 px-2.5 py-2 text-xs space-y-1">
                  {r.error && <p className="text-danger">{r.error}</p>}
                  {r.output !== undefined && r.output !== null && (
                    <pre className="whitespace-pre-wrap break-all text-ink-secondary">
                      {JSON.stringify(r.output, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
        <p className={`pt-2 font-sans text-sm font-medium ${execution.status === 'succeeded' ? 'text-ink' : 'text-danger'}`}>
          {execution.status === 'succeeded'
            ? 'Workflow completed.'
            : execution.status === 'stopped'
            ? 'Workflow stopped.'
            : `Workflow failed.${execution.error ? ` ${execution.error}` : ''}`}
        </p>
      </div>
    </div>
  );
}

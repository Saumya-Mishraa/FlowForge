import { useState } from 'react';
import { StepForward, Square, Bug } from 'lucide-react';
import Button from '../ui/Button';
import { NODE_META } from './nodeTypesMeta';
import { debugApi } from '../../api/workflows';
import { useToast } from '../../context/ToastContext';

export default function DebugPanel({ workflowId, onNodeStatusChange, onClose }) {
  const toast = useToast();
  const [session, setSession] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const start = async () => {
    setIsBusy(true);
    try {
      const res = await debugApi.start(workflowId);
      setSession(res.data);
      onNodeStatusChange?.(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not start debug session');
    } finally {
      setIsBusy(false);
    }
  };

  const step = async () => {
    if (!session) return;
    setIsBusy(true);
    try {
      const res = await debugApi.step(workflowId, session.sessionId);
      setSession(res.data);
      onNodeStatusChange?.(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Step failed');
    } finally {
      setIsBusy(false);
    }
  };

  const stop = async () => {
    if (!session) {
      onClose();
      return;
    }
    setIsBusy(true);
    try {
      const res = await debugApi.stop(workflowId, session.sessionId);
      setSession(res.data);
      onNodeStatusChange?.(res.data);
    } catch (err) {
      // Session may have already expired server-side — still close the panel.
    } finally {
      setIsBusy(false);
      onClose();
    }
  };

  const isDone = session && session.status !== 'running';

  return (
    <div className="border-t border-line bg-primary-faint/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Bug size={15} className="text-primary" /> Debug Mode
        </span>
        <button onClick={stop} className="text-ink-secondary hover:text-ink text-xs">
          Close
        </button>
      </div>

      {!session ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-ink-secondary">
            Step through this workflow one node at a time — nothing after the current node runs until you continue.
          </p>
          <Button size="sm" isLoading={isBusy} onClick={start} className="self-start sm:self-auto">
            Start
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-sm">
              {isDone ? (
                <span className={session.status === 'succeeded' ? 'text-success font-medium' : 'text-danger font-medium'}>
                  {session.status === 'succeeded' ? 'Workflow completed' : session.status === 'stopped' ? 'Stopped' : 'Workflow failed'}
                  {session.error ? ` — ${session.error}` : ''}
                </span>
              ) : (
                <span>
                  Current node: <span className="font-mono font-medium">{NODE_META[session.currentNode?.type]?.label || session.currentNode?.type}</span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!isDone && (
                <Button size="sm" icon={StepForward} isLoading={isBusy} onClick={step}>
                  Continue
                </Button>
              )}
              {!isDone && (
                <Button size="sm" variant="danger" icon={Square} onClick={stop}>
                  Stop
                </Button>
              )}
            </div>
          </div>

          {session.lastResult && (
            <div className="rounded border border-line bg-white p-2.5 text-xs">
              <p className="font-mono font-medium text-ink mb-1">
                {NODE_META[session.lastResult.nodeType]?.label} — {session.lastResult.status}
              </p>
              {session.lastResult.error && <p className="text-danger">{session.lastResult.error}</p>}
              {session.lastResult.output !== undefined && session.lastResult.output !== null && (
                <pre className="whitespace-pre-wrap break-all text-ink-secondary">
                  {JSON.stringify(session.lastResult.output, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-ink-secondary mb-1">Variables</p>
            <pre className="rounded border border-line bg-white p-2 text-xs whitespace-pre-wrap break-all max-h-32 overflow-auto">
              {JSON.stringify(session.variables, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

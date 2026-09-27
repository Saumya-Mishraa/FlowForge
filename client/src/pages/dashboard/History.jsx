import { useEffect, useState } from 'react';
import { RotateCcw, Trash2, History as HistoryIcon } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import ProjectSwitcher from '../../components/layout/ProjectSwitcher';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import ResponseViewer from '../../components/apitester/ResponseViewer';
import { useProjectContext } from '../../context/ProjectContext';
import { historyApi } from '../../api/workspace';
import { useToast } from '../../context/ToastContext';
import NoProjectState from '../../components/projects/NoProjectState';

export default function History() {
  const { activeProjectId } = useProjectContext();
  const toast = useToast();
  const [history, setHistory] = useState(null);
  const [selected, setSelected] = useState(null);
  const [rerunResult, setRerunResult] = useState(null);
  const [isRerunning, setIsRerunning] = useState(false);

  const load = () => {
    if (!activeProjectId) return;
    historyApi.list(activeProjectId).then((res) => setHistory(res.data.history));
  };

  useEffect(() => {
    setHistory(null);
    setSelected(null);
    setRerunResult(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  const remove = async (id, e) => {
    e.stopPropagation();
    await historyApi.remove(id);
    toast.success('Removed from history');
    if (selected?._id === id) setSelected(null);
    load();
  };

  const rerun = async (entry) => {
    setIsRerunning(true);
    setRerunResult(null);
    try {
      const res = await historyApi.rerun(entry._id);
      setRerunResult(res.data);
      load();
    } catch (err) {
      toast.error('Re-run failed');
    } finally {
      setIsRerunning(false);
    }
  };

  if (!activeProjectId) {
    return (
      <>
        <Topbar title="History" projectSwitcher={<ProjectSwitcher />} />
        <NoProjectState />
      </>
    );
  }

  return (
    <>
      <Topbar title="History" projectSwitcher={<ProjectSwitcher />} />
      <div className="p-6 max-w-6xl mx-auto">
        {history === null ? (
          <PageSpinner />
        ) : history.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={HistoryIcon}
                title="Nothing here yet"
                description="Your executed requests and workflows will appear here."
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
            <Card className="overflow-hidden">
              <div className="divide-y divide-line max-h-[50vh] lg:max-h-[70vh] overflow-y-auto ff-scrollbar">
                {history.map((h) => (
                  <button
                    key={h._id}
                    onClick={() => {
                      setSelected(h);
                      setRerunResult(null);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-primary-faint/50 transition-colors ${
                      selected?._id === h._id ? 'bg-primary-faint/70' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold rounded px-1.5 py-0.5 ${
                            h.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}
                        >
                          {h.method}
                        </span>
                        <span className="text-sm text-ink truncate">{h.url}</span>
                      </div>
                      <p className="text-xs text-ink-secondary mt-0.5">
                        {h.status || 'ERR'} · {h.durationMs}ms · {new Date(h.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          rerun(h);
                        }}
                        className="p-1.5 rounded text-ink-secondary hover:text-primary hover:bg-primary-soft"
                        title="Re-run"
                      >
                        <RotateCcw size={14} />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => remove(h._id, e)}
                        className="p-1.5 rounded text-ink-secondary hover:text-danger hover:bg-danger/5"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              {selected ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {selected.method} {selected.url}
                      </p>
                      {selected.environmentUsed && (
                        <p className="text-xs text-ink-secondary">Environment: {selected.environmentUsed}</p>
                      )}
                    </div>
                    <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => rerun(selected)}>
                      Re-run
                    </Button>
                  </div>
                  <ResponseViewer
                    isLoading={isRerunning}
                    response={
                      rerunResult || {
                        status: selected.status,
                        statusText: selected.statusText,
                        ok: selected.ok,
                        headers: selected.responseSnapshot?.headers || {},
                        body: selected.responseSnapshot?.data,
                        durationMs: selected.durationMs,
                        responseSizeBytes: selected.responseSizeBytes,
                        errorMessage: selected.errorMessage,
                      }
                    }
                    error=""
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-sm text-ink-secondary">
                  Select an entry to inspect its response.
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

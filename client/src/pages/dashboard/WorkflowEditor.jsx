import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ArrowLeft,
  Save,
  Play,
  Bug,
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
  Loader2,
  History as HistoryIcon,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { PageSpinner } from '../../components/ui/Feedback';
import FlowNode from '../../components/workflow/FlowNode';
import NodeConfigPanel from '../../components/workflow/NodeConfigPanel';
import ExecutionResultsPanel from '../../components/workflow/ExecutionResultsPanel';
import DebugPanel from '../../components/workflow/DebugPanel';
import { NODE_META, defaultDataForType, ADDABLE_TYPES } from '../../components/workflow/nodeTypesMeta';
import { workflowsApi, executionsApi } from '../../api/workflows';
import { useToast } from '../../context/ToastContext';

const nodeTypes = Object.fromEntries(Object.keys(NODE_META).map((type) => [type, FlowNode]));

let idCounter = 0;
function newNodeId(type) {
  idCounter += 1;
  return `${type}-${Date.now()}-${idCounter}`;
}

export default function WorkflowEditorPage() {
  return (
    <ReactFlowProvider>
      <WorkflowEditor />
    </ReactFlowProvider>
  );
}

function WorkflowEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [workflow, setWorkflow] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [execution, setExecution] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [executionLog, setExecutionLog] = useState(null);
  const [selectedExecution, setSelectedExecution] = useState(null);

  useEffect(() => {
    workflowsApi.get(id).then((res) => {
      const wf = res.data.workflow;
      setWorkflow(wf);
      setNodes(wf.nodes.map((n) => ({ ...n, type: n.type })));
      setEdges(wf.edges.map((e) => ({ ...e, id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || undefined })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  const markDirty = () => setIsDirty(true);

  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge({ ...connection, id: `e-${connection.source}-${connection.target}-${connection.sourceHandle || 'x'}` }, eds));
      markDirty();
    },
    [setEdges]
  );

  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      if (changes.some((c) => c.type !== 'select' && c.type !== 'dimensions')) markDirty();
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      if (changes.some((c) => c.type !== 'select')) markDirty();
    },
    [onEdgesChange]
  );

  const addNode = (type) => {
    const id = newNodeId(type);
    const position = { x: 200 + Math.random() * 200, y: 100 + Math.random() * 300 };
    setNodes((nds) => [...nds, { id, type, position, data: defaultDataForType(type) }]);
    setShowAddMenu(false);
    markDirty();
  };

  const updateSelectedNodeData = (newData) => {
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: newData } : n)));
    markDirty();
  };

  const deleteSelectedNode = () => {
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    markDirty();
  };

  const save = async () => {
    setIsSaving(true);
    try {
      const cleanNodes = nodes.map(({ id, type, position, data }) => ({ id, type, position, data }));
      const cleanEdges = edges.map(({ id, source, target, sourceHandle }) => ({ id, source, target, sourceHandle: sourceHandle || null }));
      await workflowsApi.update(id, { nodes: cleanNodes, edges: cleanEdges });
      setIsDirty(false);
      toast.success('Workflow saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const runValidation = async () => {
    try {
      const res = await workflowsApi.validate(id);
      setValidationErrors(res.data.errors);
      return res.data.valid;
    } catch (err) {
      return false;
    }
  };

  const run = async () => {
    if (isDirty) {
      await save();
    }
    const valid = await runValidation();
    setShowResults(true);
    setShowLogs(false);
    if (!valid) {
      toast.error('Fix validation errors before running');
      return;
    }
    setIsRunning(true);
    setExecution(null);
    try {
      const res = await workflowsApi.run(id);
      setExecution(res.data.execution);
      applyRunStatuses(res.data.execution.nodeResults);
      if (executionLog) loadExecutionLog();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Workflow run failed to start');
    } finally {
      setIsRunning(false);
    }
  };

  const loadExecutionLog = () => {
    executionsApi.list({ workflow: id }).then((res) => setExecutionLog(res.data.executions));
  };

  const openLogs = () => {
    setShowResults(false);
    setSelectedExecution(null);
    setShowLogs(true);
    loadExecutionLog();
  };

  const openLoggedExecution = async (entry) => {
    const res = await executionsApi.get(entry._id);
    setSelectedExecution(res.data.execution);
    applyRunStatuses(res.data.execution.nodeResults);
  };

  const applyRunStatuses = (nodeResults) => {
    const byId = new Map(nodeResults.map((r) => [r.nodeId, r.status]));
    setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, __runStatus: byId.get(n.id) } })));
  };

  const openDebug = async () => {
    if (isDirty) await save();
    const valid = await runValidation();
    if (!valid) {
      toast.error('Fix validation errors before debugging');
      return;
    }
    setShowDebug(true);
    setShowResults(false);
    setShowLogs(false);
  };

  const onDebugUpdate = (session) => {
    // Reflect the currently-executing / just-executed node on the canvas.
    setNodes((nds) =>
      nds.map((n) => {
        if (session.currentNode?.id === n.id) return { ...n, data: { ...n.data, __runStatus: 'running' } };
        const result = session.nodeResults?.find((r) => r.nodeId === n.id);
        return result ? { ...n, data: { ...n.data, __runStatus: result.status } } : n;
      })
    );
  };

  if (!workflow) return <PageSpinner />;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-2 sm:py-0 sm:h-14 border-b border-line bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <button onClick={() => navigate('/app/workflows')} className="text-ink-secondary hover:text-ink shrink-0">
            <ArrowLeft size={18} />
          </button>
          <span className="font-medium text-sm text-ink truncate">{workflow.name}</span>
          {isDirty && <span className="text-xs text-warning shrink-0">Unsaved changes</span>}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto ff-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 sm:overflow-visible">
          <div className="relative shrink-0">
            <Button size="sm" variant="secondary" onClick={() => setShowAddMenu((v) => !v)} icon={ChevronDown}>
              Add Node
            </Button>
            {showAddMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAddMenu(false)} />
                <div className="absolute right-0 top-10 z-20 w-52 rounded-md border border-line bg-white shadow-popover py-1">
                  {ADDABLE_TYPES.map((type) => {
                    const meta = NODE_META[type];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => addNode(type)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary-faint text-left"
                      >
                        <Icon size={14} style={{ color: meta.color }} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <Button className="shrink-0" size="sm" variant="secondary" icon={ShieldCheck} onClick={async () => { const valid = await runValidation(); toast[valid ? 'success' : 'error'](valid ? 'Workflow is valid' : 'Workflow has validation errors'); }}>
            Validate
          </Button>
          <Button className="shrink-0" size="sm" variant="secondary" icon={Save} isLoading={isSaving} onClick={save}>
            Save
          </Button>
          <Button className="shrink-0" size="sm" variant="secondary" icon={HistoryIcon} onClick={openLogs}>
            Logs
          </Button>
          <Button className="shrink-0" size="sm" variant="secondary" icon={Bug} onClick={openDebug}>
            Debug
          </Button>
          <Button className="shrink-0" size="sm" icon={isRunning ? Loader2 : Play} isLoading={isRunning} onClick={run}>
            Run Workflow
          </Button>
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-danger/5 border-b border-danger/20 px-4 py-2 flex items-start gap-2">
          <AlertTriangle size={14} className="text-danger shrink-0 mt-0.5" />
          <ul className="text-xs text-danger space-y-0.5">
            {validationErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background gap={16} color="#F1DDE4" />
            <Controls />
            <MiniMap
              nodeColor={(n) => NODE_META[n.type]?.color || '#6B6670'}
              maskColor="rgba(252, 228, 236, 0.6)"
              className="!bg-white"
            />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onChange={updateSelectedNodeData}
            onDelete={deleteSelectedNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}

        {showResults && !selectedNode && (
          <div className="fixed inset-0 z-30 sm:static sm:z-auto w-full sm:w-96 shrink-0 border-l border-line bg-white h-full overflow-y-auto ff-scrollbar p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-ink">Execution Results</span>
              <button onClick={() => setShowResults(false)} className="text-ink-secondary hover:text-ink text-xs">
                Close
              </button>
            </div>
            <ExecutionResultsPanel execution={execution} isRunning={isRunning} />
          </div>
        )}

        {showLogs && !selectedNode && (
          <div className="fixed inset-0 z-30 sm:static sm:z-auto w-full sm:w-96 shrink-0 border-l border-line bg-white h-full overflow-y-auto ff-scrollbar p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-ink">Execution Logs</span>
              <button
                onClick={() => {
                  setShowLogs(false);
                  setSelectedExecution(null);
                }}
                className="text-ink-secondary hover:text-ink text-xs"
              >
                Close
              </button>
            </div>

            {selectedExecution ? (
              <>
                <button
                  onClick={() => setSelectedExecution(null)}
                  className="text-xs text-primary hover:text-primary-hover mb-2"
                >
                  ← Back to log list
                </button>
                <ExecutionResultsPanel execution={selectedExecution} isRunning={false} />
              </>
            ) : executionLog === null ? (
              <p className="text-sm text-ink-secondary">Loading…</p>
            ) : executionLog.length === 0 ? (
              <p className="text-sm text-ink-secondary">No executions recorded yet — run this workflow to see logs here.</p>
            ) : (
              <ul className="divide-y divide-line">
                {executionLog.map((e) => (
                  <li key={e._id}>
                    <button
                      onClick={() => openLoggedExecution(e)}
                      className="w-full text-left py-2.5 hover:bg-primary-faint/40 px-1 rounded"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold rounded px-1.5 py-0.5 ${
                            e.status === 'succeeded'
                              ? 'bg-success/10 text-success'
                              : e.status === 'stopped'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-danger/10 text-danger'
                          }`}
                        >
                          {e.status}
                        </span>
                        <span className="text-xs text-ink-secondary">{e.mode}</span>
                      </div>
                      <p className="text-xs text-ink-secondary mt-1">
                        {new Date(e.createdAt).toLocaleString()} · {e.durationMs}ms
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {showDebug && (
        <DebugPanel workflowId={id} onNodeStatusChange={onDebugUpdate} onClose={() => setShowDebug(false)} />
      )}
    </div>
  );
}

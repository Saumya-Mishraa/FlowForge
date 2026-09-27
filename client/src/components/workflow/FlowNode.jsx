import { Handle, Position } from 'reactflow';
import { NODE_META } from './nodeTypesMeta';

const STATUS_RING = {
  success: 'ring-2 ring-success',
  failed: 'ring-2 ring-danger',
  running: 'ring-2 ring-warning animate-pulse',
};

function summarize(type, data) {
  switch (type) {
    case 'apiRequest':
      return data?.url ? `${data.method || 'GET'} ${data.url}` : 'No URL set';
    case 'variable':
      return data?.assignments?.length ? data.assignments.map((a) => a.key).filter(Boolean).join(', ') || 'No variables' : 'No variables';
    case 'extractVariable':
      return data?.as ? `${data.path} → ${data.as}` : 'Not configured';
    case 'condition':
      return data?.expression || 'No expression';
    case 'transform':
      return data?.output ? `${data.operation} → ${data.output}` : 'Not configured';
    case 'delay':
      return `${data?.ms ?? 0}ms`;
    case 'log':
      return data?.message || 'No message';
    default:
      return '';
  }
}

export default function FlowNode({ id, type, data, selected }) {
  const meta = NODE_META[type] || {};
  const Icon = meta.icon;
  const runStatus = data?.__runStatus; // injected transiently when displaying execution results
  const summary = summarize(type, data);

  return (
    <div
      className={`min-w-[180px] rounded-lg border bg-white shadow-card px-3 py-2.5 ${
        selected ? 'border-primary' : 'border-line'
      } ${STATUS_RING[runStatus] || ''}`}
    >
      {meta.hasInput && <Handle type="target" position={Position.Left} className="!bg-ink-secondary !w-2 !h-2" />}

      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded shrink-0"
          style={{ background: `${meta.color}1a` }}
        >
          {Icon && <Icon size={13} style={{ color: meta.color }} />}
        </div>
        <span className="text-xs font-semibold text-ink">{meta.label || type}</span>
      </div>
      {summary && <p className="mt-1.5 text-[11px] text-ink-secondary truncate max-w-[220px]">{summary}</p>}

      {meta.hasOutput === 'branch' ? (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: '35%' }}
            className="!bg-success !w-2 !h-2"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: '70%' }}
            className="!bg-danger !w-2 !h-2"
          />
          <div className="flex justify-between text-[9px] text-ink-secondary mt-1 px-0.5">
            <span className="text-success font-medium">TRUE</span>
            <span className="text-danger font-medium">FALSE</span>
          </div>
        </>
      ) : (
        meta.hasOutput && <Handle type="source" position={Position.Right} className="!bg-ink-secondary !w-2 !h-2" />
      )}
    </div>
  );
}

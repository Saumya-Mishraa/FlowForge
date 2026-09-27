import { Trash2, X, Plus } from 'lucide-react';
import { Input, FormField } from '../ui/Input';
import Button from '../ui/Button';
import KeyValueTable from '../apitester/KeyValueTable';
import AuthPanel from '../apitester/AuthPanel';
import { NODE_META } from './nodeTypesMeta';

const TRANSFORM_OPS = ['toUpperCase', 'toLowerCase', 'trim', 'toNumber', 'toString', 'jsonStringify', 'jsonParse', 'length'];

export default function NodeConfigPanel({ node, onChange, onDelete, onClose }) {
  if (!node) return null;
  const meta = NODE_META[node.type] || {};
  const data = node.data || {};

  const update = (patch) => onChange({ ...data, ...patch });

  return (
    <div className="fixed inset-0 z-30 sm:static sm:z-auto w-full sm:w-80 shrink-0 border-l border-line bg-white h-full overflow-y-auto ff-scrollbar">
      <div className="flex items-center justify-between px-4 h-12 border-b border-line">
        <span className="text-sm font-semibold text-ink">{meta.label || node.type}</span>
        <button onClick={onClose} className="text-ink-secondary hover:text-ink">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {(node.type === 'start' || node.type === 'end') && (
          <p className="text-sm text-ink-secondary">
            This node has no configuration — it just marks where the workflow {node.type === 'start' ? 'begins' : 'ends'}.
          </p>
        )}

        {node.type === 'apiRequest' && <ApiRequestNodeFields data={data} update={update} />}
        {node.type === 'variable' && <VariableNodeFields data={data} update={update} />}
        {node.type === 'extractVariable' && <ExtractVariableNodeFields data={data} update={update} />}
        {node.type === 'condition' && <ConditionNodeFields data={data} update={update} />}
        {node.type === 'transform' && <TransformNodeFields data={data} update={update} />}
        {node.type === 'delay' && <DelayNodeFields data={data} update={update} />}
        {node.type === 'log' && <LogNodeFields data={data} update={update} />}
      </div>

      {node.type !== 'start' && node.type !== 'end' && (
        <div className="border-t border-line p-4">
          <Button variant="danger" size="sm" icon={Trash2} onClick={onDelete} className="w-full">
            Delete node
          </Button>
        </div>
      )}
    </div>
  );
}

function ApiRequestNodeFields({ data, update }) {
  const auth = data.auth || { type: 'none' };
  const body = data.body || { mode: 'none' };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={data.method || 'GET'}
          onChange={(e) => update({ method: e.target.value })}
          className="h-9 rounded-md border border-line px-2 text-xs font-semibold w-24"
        >
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <Input
          className="flex-1 font-mono text-xs"
          placeholder="{{BASE_URL}}/path"
          value={data.url || ''}
          onChange={(e) => update({ url: e.target.value })}
        />
      </div>
      <FormField label="Headers">
        <KeyValueTable rows={data.headers?.length ? data.headers : [{ key: '', value: '', enabled: true }]} onChange={(headers) => update({ headers })} />
      </FormField>
      <FormField label="Auth">
        <AuthPanel auth={auth} onChange={(next) => update({ auth: next })} />
      </FormField>
      <FormField label="Body">
        <div className="flex gap-1 mb-2">
          {['none', 'json'].map((mode) => (
            <button
              key={mode}
              onClick={() => update({ body: { ...body, mode } })}
              className={`px-2 h-7 rounded text-xs font-medium ${body.mode === mode ? 'bg-primary-soft text-primary-hover' : 'text-ink-secondary hover:bg-primary-faint'}`}
            >
              {mode === 'none' ? 'None' : 'JSON'}
            </button>
          ))}
        </div>
        {body.mode === 'json' && (
          <textarea
            className="w-full h-24 rounded-md border border-line p-2 font-mono text-xs"
            placeholder='{"key": "value"}'
            value={body.json || ''}
            onChange={(e) => update({ body: { ...body, json: e.target.value } })}
          />
        )}
      </FormField>
    </div>
  );
}

function VariableNodeFields({ data, update }) {
  const assignments = data.assignments?.length ? data.assignments : [{ key: '', value: '' }];
  const set = (i, field, val) => {
    const next = assignments.map((a, idx) => (idx === i ? { ...a, [field]: val } : a));
    update({ assignments: next });
  };
  const add = () => update({ assignments: [...assignments, { key: '', value: '' }] });
  const remove = (i) => update({ assignments: assignments.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-secondary">Set one or more variables. Values may reference {'{{OTHER_VARS}}'}.</p>
      {assignments.map((a, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input placeholder="key" value={a.key} onChange={(e) => set(i, 'key', e.target.value)} />
          <Input placeholder="value" value={a.value} onChange={(e) => set(i, 'value', e.target.value)} />
          <button onClick={() => remove(i)} className="text-ink-secondary hover:text-danger">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <Button size="sm" variant="secondary" icon={Plus} onClick={add}>
        Add variable
      </Button>
    </div>
  );
}

function ExtractVariableNodeFields({ data, update }) {
  return (
    <div className="space-y-3">
      <FormField label="Path in last response" hint="e.g. response.token, response.user.id, statusCode">
        <Input placeholder="response.token" value={data.path || ''} onChange={(e) => update({ path: e.target.value })} />
      </FormField>
      <FormField label="Store as variable">
        <Input placeholder="authToken" value={data.as || ''} onChange={(e) => update({ as: e.target.value })} />
      </FormField>
    </div>
  );
}

function ConditionNodeFields({ data, update }) {
  return (
    <div className="space-y-3">
      <FormField
        label="Expression"
        hint='e.g. "statusCode == 200", "response.user.active == true", "userId exists"'
      >
        <Input
          className="font-mono text-xs"
          value={data.expression || ''}
          onChange={(e) => update({ expression: e.target.value })}
        />
      </FormField>
      <p className="text-xs text-ink-secondary">
        Connect this node's <span className="text-success font-medium">TRUE</span> and{' '}
        <span className="text-danger font-medium">FALSE</span> handles to different paths on the canvas.
      </p>
    </div>
  );
}

function TransformNodeFields({ data, update }) {
  return (
    <div className="space-y-3">
      <FormField label="Source" hint="A variable name or response.<path>">
        <Input placeholder="response.user.name" value={data.source || ''} onChange={(e) => update({ source: e.target.value })} />
      </FormField>
      <FormField label="Operation">
        <select
          value={data.operation || 'toUpperCase'}
          onChange={(e) => update({ operation: e.target.value })}
          className="w-full h-9 rounded-md border border-line px-2 text-sm"
        >
          {TRANSFORM_OPS.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Output variable name">
        <Input placeholder="upperName" value={data.output || ''} onChange={(e) => update({ output: e.target.value })} />
      </FormField>
    </div>
  );
}

function DelayNodeFields({ data, update }) {
  return (
    <FormField label="Delay (milliseconds)" hint="Capped at 60,000ms (60s)">
      <Input
        type="number"
        min={0}
        max={60000}
        value={data.ms ?? 0}
        onChange={(e) => update({ ms: Math.max(0, Math.min(60000, Number(e.target.value))) })}
      />
    </FormField>
  );
}

function LogNodeFields({ data, update }) {
  return (
    <FormField label="Message" hint="Supports {{VARIABLES}}">
      <textarea
        className="w-full h-20 rounded-md border border-line p-2 text-sm"
        value={data.message || ''}
        onChange={(e) => update({ message: e.target.value })}
      />
    </FormField>
  );
}

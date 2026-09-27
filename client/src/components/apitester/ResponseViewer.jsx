import { useMemo, useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import { Spinner } from '../ui/Feedback';

const TABS = ['Body', 'Headers', 'Raw', 'Preview'];

export default function ResponseViewer({ isLoading, response, error }) {
  const [activeTab, setActiveTab] = useState('Body');
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const prettyBody = useMemo(() => {
    if (!response) return '';
    try {
      return typeof response.body === 'string' ? response.body : JSON.stringify(response.body, null, 2);
    } catch {
      return String(response.body);
    }
  }, [response]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-secondary gap-2">
        <Spinner size={18} /> Sending request…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6">
        <AlertTriangle size={22} className="text-danger mb-2" />
        <p className="text-sm font-medium text-ink">Request failed</p>
        <p className="text-sm text-ink-secondary mt-1 max-w-sm">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-ink-secondary">
        Send a request to see the response here.
      </div>
    );
  }

  const statusColor = response.ok ? 'text-success bg-success/10' : 'text-danger bg-danger/10';

  const copy = async () => {
    await navigator.clipboard.writeText(prettyBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const highlighted = search
    ? prettyBody
        .split('\n')
        .filter((line) => line.toLowerCase().includes(search.toLowerCase()))
        .join('\n') || '(no matching lines)'
    : prettyBody;

  return (
    <div>
      <div className="flex items-center gap-3 px-1 pb-3 text-sm flex-wrap">
        <span className={`rounded px-2 py-0.5 font-semibold ${statusColor}`}>
          {response.status || 'ERR'} {response.statusText}
        </span>
        <span className="text-ink-secondary">{response.durationMs}ms</span>
        <span className="text-ink-secondary">{formatBytes(response.responseSizeBytes)}</span>
        {response.errorMessage && <span className="text-danger">{response.errorMessage}</span>}
      </div>

      <div className="flex items-center justify-between border-b border-line mb-3">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 h-9 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-ink-secondary hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 'Body' && (
          <div className="flex items-center gap-2 pb-2">
            <input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 w-32 rounded border border-line px-2 text-xs"
            />
            <button onClick={copy} className="text-ink-secondary hover:text-ink" title="Copy response">
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {activeTab === 'Body' && (
        <pre className="text-xs font-mono bg-primary-faint/50 rounded-md p-3 overflow-auto max-h-96 whitespace-pre-wrap">
          {highlighted}
        </pre>
      )}

      {activeTab === 'Headers' && (
        <div className="text-sm divide-y divide-line">
          {Object.entries(response.headers || {}).map(([k, v]) => (
            <div key={k} className="flex gap-3 py-1.5">
              <span className="font-medium text-ink w-48 shrink-0">{k}</span>
              <span className="text-ink-secondary break-all">{v}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Raw' && (
        <pre className="text-xs font-mono bg-primary-faint/50 rounded-md p-3 overflow-auto max-h-96 whitespace-pre-wrap">
          {prettyBody}
        </pre>
      )}

      {activeTab === 'Preview' && (
        <div className="rounded-md border border-line p-3 max-h-96 overflow-auto">
          {isHtml(response.headers) ? (
            <iframe title="response-preview" srcDoc={String(response.body)} className="w-full h-80 border-0" sandbox="" />
          ) : (
            <p className="text-sm text-ink-secondary">Preview is only available for HTML responses.</p>
          )}
        </div>
      )}
    </div>
  );
}

function isHtml(headers) {
  const ct = headers?.['content-type'] || headers?.['Content-Type'] || '';
  return ct.includes('text/html');
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(val < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

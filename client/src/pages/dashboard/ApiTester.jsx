import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Save, Globe2 } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import ProjectSwitcher from '../../components/layout/ProjectSwitcher';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import KeyValueTable from '../../components/apitester/KeyValueTable';
import JsonEditor from '../../components/apitester/JsonEditor';
import AuthPanel from '../../components/apitester/AuthPanel';
import ResponseViewer from '../../components/apitester/ResponseViewer';
import NoProjectState from '../../components/projects/NoProjectState';
import { useProjectContext } from '../../context/ProjectContext';
import { requestsApi, environmentsApi, collectionsApi } from '../../api/workspace';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const TABS = ['Params', 'Headers', 'Auth', 'Body'];
const BODY_MODES = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'raw', label: 'Raw' },
  { value: 'urlencoded', label: 'x-www-form-urlencoded' },
  { value: 'formData', label: 'Form Data' },
];

const emptyRow = () => ({ key: '', value: '', enabled: true });

function initialState() {
  return {
    method: 'GET',
    url: '',
    params: [emptyRow()],
    headers: [emptyRow()],
    auth: { type: 'none' },
    body: { mode: 'none', json: '', raw: '', urlencoded: [emptyRow()], formData: [emptyRow()] },
  };
}

export default function ApiTester() {
  const { activeProjectId } = useProjectContext();
  const toast = useToast();
  const location = useLocation();

  const [req, setReq] = useState(initialState());
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [activeTab, setActiveTab] = useState('Params');
  const [environments, setEnvironments] = useState([]);
  const [environmentId, setEnvironmentId] = useState('');
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [requestName, setRequestName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeProjectId) return;
    environmentsApi.list(activeProjectId).then((res) => {
      setEnvironments(res.data.environments);
      const active = res.data.environments.find((e) => e.isActive);
      setEnvironmentId(active?._id || '');
    });
    collectionsApi.list(activeProjectId).then((res) => setCollections(res.data.collections));
  }, [activeProjectId]);

  // Loading a saved request from the Collections page arrives via router
  // state rather than a URL param, since it's a full request object, not
  // just an id we'd need a second round-trip to fetch.
  useEffect(() => {
    const loaded = location.state?.loadRequest;
    if (!loaded) return;
    setReq({
      method: loaded.method,
      url: loaded.url,
      params: withTrailingRow(loaded.params),
      headers: withTrailingRow(loaded.headers),
      auth: loaded.auth || { type: 'none' },
      body: {
        mode: loaded.body?.mode || 'none',
        json: loaded.body?.json || '',
        raw: loaded.body?.raw || '',
        urlencoded: withTrailingRow(loaded.body?.urlencoded),
        formData: withTrailingRow(loaded.body?.formData),
      },
    });
    setEditingRequestId(loaded._id);
    setRequestName(loaded.name);
    setSelectedCollectionId(loaded.collection || '');
    setResponse(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  if (!activeProjectId) {
    return (
      <>
        <Topbar title="API Tester" projectSwitcher={<ProjectSwitcher />} />
        <NoProjectState />
      </>
    );
  }

  const send = async () => {
    if (!req.url.trim()) {
      toast.error('Enter a URL first');
      return;
    }
    setIsSending(true);
    setError('');
    setResponse(null);
    try {
      const res = await requestsApi.execute({
        project: activeProjectId,
        environmentId: environmentId || undefined,
        method: req.method,
        url: req.url,
        params: cleanRows(req.params),
        headers: cleanRows(req.headers),
        auth: req.auth,
        body: req.body,
      });
      setResponse(res.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'The request could not be executed.'));
    } finally {
      setIsSending(false);
    }
  };

  const saveRequest = async () => {
    if (!requestName.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        project: activeProjectId,
        collection: selectedCollectionId || undefined,
        name: requestName,
        method: req.method,
        url: req.url,
        params: cleanRows(req.params),
        headers: cleanRows(req.headers),
        auth: req.auth,
        body: req.body,
      };
      if (editingRequestId) {
        await requestsApi.update(editingRequestId, payload);
        toast.success('Request updated');
      } else {
        const res = await requestsApi.save(payload);
        setEditingRequestId(res.data.request._id);
        toast.success('Request saved to project');
      }
      setShowSaveDialog(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save request'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Topbar title="API Tester" projectSwitcher={<ProjectSwitcher />} />

      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4">
        {/* Method + URL bar */}
        <div className="flex flex-wrap gap-2">
          <select
            value={req.method}
            onChange={(e) => setReq({ ...req, method: e.target.value })}
            className="h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink w-[6.5rem] sm:w-32 shrink-0"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Input
            className="flex-1 min-w-[160px] font-mono"
            placeholder="{{BASE_URL}}/users"
            value={req.url}
            onChange={(e) => setReq({ ...req, url: e.target.value })}
          />
          <select
            value={environmentId}
            onChange={(e) => setEnvironmentId(e.target.value)}
            className="h-10 rounded-md border border-line bg-white px-2 text-sm text-ink-secondary w-full xs:w-auto sm:w-40 shrink-0"
            title="Active environment"
          >
            <option value="">No environment</option>
            {environments.map((env) => (
              <option key={env._id} value={env._id}>
                {env.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2 w-full xs:w-auto">
            <Button className="flex-1 xs:flex-none" icon={Send} isLoading={isSending} onClick={send}>
              Send
            </Button>
            <Button className="flex-1 xs:flex-none" variant="secondary" icon={Save} onClick={() => setShowSaveDialog((v) => !v)}>
              Save
            </Button>
          </div>
        </div>

        {showSaveDialog && (
          <div className="flex flex-wrap gap-2 rounded-md border border-line bg-primary-faint/40 p-3">
            <Input
              placeholder="Request name (e.g. Get Users)"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              autoFocus
              className="flex-1 min-w-[160px]"
            />
            <select
              value={selectedCollectionId}
              onChange={(e) => setSelectedCollectionId(e.target.value)}
              className="h-10 rounded-md border border-line bg-white px-2 text-sm text-ink w-full sm:w-48"
            >
              <option value="">No collection</option>
              {collections.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button size="sm" isLoading={isSaving} onClick={saveRequest} className="w-full sm:w-auto">
              {editingRequestId ? 'Update' : 'Confirm'}
            </Button>
          </div>
        )}

        {environments.length === 0 && (
          <p className="flex items-center gap-1.5 text-xs text-ink-secondary">
            <Globe2 size={13} /> No environments yet — variables like {'{{BASE_URL}}'} will be sent literally
            until you create one.
          </p>
        )}

        {/* Request editor tabs */}
        <div className="rounded-lg border border-line bg-white">
          <div className="flex border-b border-line px-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 h-11 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-ink-secondary hover:text-ink'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'Params' && (
              <KeyValueTable rows={req.params} onChange={(params) => setReq({ ...req, params })} />
            )}
            {activeTab === 'Headers' && (
              <KeyValueTable rows={req.headers} onChange={(headers) => setReq({ ...req, headers })} />
            )}
            {activeTab === 'Auth' && (
              <AuthPanel auth={req.auth} onChange={(auth) => setReq({ ...req, auth })} />
            )}
            {activeTab === 'Body' && (
              <div className="space-y-3">
                <div className="flex gap-1">
                  {BODY_MODES.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setReq({ ...req, body: { ...req.body, mode: m.value } })}
                      className={`px-3 h-8 rounded text-xs font-medium transition-colors ${
                        req.body.mode === m.value
                          ? 'bg-primary-soft text-primary-hover'
                          : 'text-ink-secondary hover:bg-primary-faint'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {req.body.mode === 'json' && (
                  <JsonEditor
                    value={req.body.json}
                    onChange={(json) => setReq({ ...req, body: { ...req.body, json } })}
                  />
                )}
                {req.body.mode === 'raw' && (
                  <textarea
                    className="w-full h-48 rounded-md border border-line p-3 font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary/30"
                    value={req.body.raw}
                    onChange={(e) => setReq({ ...req, body: { ...req.body, raw: e.target.value } })}
                  />
                )}
                {req.body.mode === 'urlencoded' && (
                  <KeyValueTable
                    rows={req.body.urlencoded}
                    onChange={(urlencoded) => setReq({ ...req, body: { ...req.body, urlencoded } })}
                  />
                )}
                {req.body.mode === 'formData' && (
                  <KeyValueTable
                    rows={req.body.formData}
                    onChange={(formData) => setReq({ ...req, body: { ...req.body, formData } })}
                  />
                )}
                {req.body.mode === 'none' && (
                  <p className="text-sm text-ink-secondary py-6 text-center">This request has no body.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Response */}
        <div className="rounded-lg border border-line bg-white p-4">
          <ResponseViewer isLoading={isSending} response={response} error={error} />
        </div>
      </div>
    </>
  );
}

function cleanRows(rows) {
  return rows.filter((r) => r.key.trim());
}

function withTrailingRow(rows) {
  const base = (rows || []).length ? [...rows] : [];
  const last = base[base.length - 1];
  if (!last || last.key || last.value) base.push(emptyRow());
  return base;
}

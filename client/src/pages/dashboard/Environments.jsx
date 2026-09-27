import { useEffect, useState } from 'react';
import { Plus, Trash2, Globe2, Check, Eye, EyeOff } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import ProjectSwitcher from '../../components/layout/ProjectSwitcher';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useProjectContext } from '../../context/ProjectContext';
import { environmentsApi } from '../../api/workspace';
import { useToast } from '../../context/ToastContext';
import NoProjectState from '../../components/projects/NoProjectState';

export default function Environments() {
  const { activeProjectId } = useProjectContext();
  const toast = useToast();
  const [environments, setEnvironments] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const load = () => {
    if (!activeProjectId) return;
    environmentsApi.list(activeProjectId).then((res) => {
      setEnvironments(res.data.environments);
      setSelectedId((prev) => prev || res.data.environments[0]?._id || null);
    });
  };

  useEffect(() => {
    setEnvironments(null);
    setSelectedId(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  const createEnvironment = async () => {
    const name = window.prompt('Environment name (e.g. Development, Production)');
    if (!name) return;
    try {
      const res = await environmentsApi.create({ project: activeProjectId, name, variables: [] });
      setEnvironments((prev) => [...(prev || []), res.data.environment]);
      setSelectedId(res.data.environment._id);
    } catch (err) {
      toast.error('Could not create environment');
    }
  };

  const deleteEnvironment = async (env) => {
    if (!window.confirm(`Delete "${env.name}"?`)) return;
    await environmentsApi.remove(env._id);
    toast.success('Environment deleted');
    load();
  };

  const activate = async (env) => {
    await environmentsApi.activate(env._id);
    load();
  };

  if (!activeProjectId) {
    return (
      <>
        <Topbar title="Environments" projectSwitcher={<ProjectSwitcher />} />
        <NoProjectState />
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Environments"
        projectSwitcher={<ProjectSwitcher />}
        actions={
          <Button size="sm" icon={Plus} onClick={createEnvironment}>
            New Environment
          </Button>
        }
      />

      <div className="p-6 max-w-6xl mx-auto">
        {environments === null ? (
          <PageSpinner />
        ) : environments.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={Globe2}
                title="No environments yet"
                description="Add a Development or Production environment to manage variables like BASE_URL and TOKEN."
                action={
                  <Button icon={Plus} onClick={createEnvironment}>
                    New Environment
                  </Button>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 md:gap-6">
            <div className="flex gap-1.5 overflow-x-auto ff-scrollbar pb-1 md:block md:space-y-1 md:pb-0 md:overflow-visible">
              {environments.map((env) => (
                <button
                  key={env._id}
                  onClick={() => setSelectedId(env._id)}
                  className={`shrink-0 md:w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors whitespace-nowrap md:whitespace-normal ${
                    selectedId === env._id ? 'bg-primary-soft text-primary-hover' : 'hover:bg-primary-faint text-ink'
                  }`}
                >
                  <span className="truncate">{env.name}</span>
                  {env.isActive && <Check size={14} className="text-success shrink-0" />}
                </button>
              ))}
            </div>

            {environments
              .filter((e) => e._id === selectedId)
              .map((env) => (
                <EnvironmentEditor
                  key={env._id}
                  environment={env}
                  onActivate={() => activate(env)}
                  onDelete={() => deleteEnvironment(env)}
                  onSaved={(updated) => {
                    setEnvironments((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
                  }}
                />
              ))}
          </div>
        )}
      </div>
    </>
  );
}

function EnvironmentEditor({ environment, onActivate, onDelete, onSaved }) {
  const toast = useToast();
  const [variables, setVariables] = useState(environment.variables);
  const [revealed, setRevealed] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setVariables(environment.variables);
  }, [environment]);

  const updateVar = (index, field, value) => {
    setVariables((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const addVar = () => setVariables((prev) => [...prev, { key: '', value: '', secret: false }]);
  const removeVar = (index) => setVariables((prev) => prev.filter((_, i) => i !== index));

  const save = async () => {
    setIsSaving(true);
    try {
      const cleaned = variables.filter((v) => v.key.trim());
      const res = await environmentsApi.update(environment._id, { variables: cleaned });
      onSaved(res.data.environment);
      toast.success('Environment saved');
    } catch (err) {
      toast.error('Could not save environment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={environment.name}
        subtitle={environment.isActive ? 'Active environment' : 'Not active'}
        action={
          <div className="flex gap-2">
            {!environment.isActive && (
              <Button size="sm" variant="secondary" onClick={onActivate}>
                Set active
              </Button>
            )}
            <Button size="sm" variant="danger" icon={Trash2} onClick={onDelete} />
          </div>
        }
      />
      <CardBody>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 text-xs font-medium text-ink-secondary px-1">
            <span>Key</span>
            <span>Value</span>
            <span className="w-8"></span>
            <span className="w-8"></span>
          </div>
          {variables.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
              <Input placeholder="BASE_URL" value={v.key} onChange={(e) => updateVar(i, 'key', e.target.value)} />
              <Input
                placeholder="https://api.example.com"
                type={v.secret && !revealed[i] ? 'password' : 'text'}
                value={v.value}
                onChange={(e) => updateVar(i, 'value', e.target.value)}
              />
              <button
                type="button"
                className="text-ink-secondary hover:text-ink"
                onClick={() => setRevealed((r) => ({ ...r, [i]: !r[i] }))}
                title={v.secret ? 'Toggle visibility' : 'Mark as secret to hide by default'}
                onDoubleClick={() => updateVar(i, 'secret', !v.secret)}
              >
                {v.secret && !revealed[i] ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                type="button"
                className="text-ink-secondary hover:text-danger"
                onClick={() => removeVar(i)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button size="sm" variant="secondary" icon={Plus} onClick={addVar}>
            Add variable
          </Button>
          <Button size="sm" isLoading={isSaving} onClick={save}>
            Save
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

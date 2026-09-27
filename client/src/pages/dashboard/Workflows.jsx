import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Workflow as WorkflowIcon, Trash2, Copy, CheckCircle2, XCircle } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import ProjectSwitcher from '../../components/layout/ProjectSwitcher';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, FormField } from '../../components/ui/Input';
import { useProjectContext } from '../../context/ProjectContext';
import { workflowsApi } from '../../api/workflows';
import { useToast } from '../../context/ToastContext';
import NoProjectState from '../../components/projects/NoProjectState';

export default function Workflows() {
  const { activeProjectId } = useProjectContext();
  const navigate = useNavigate();
  const toast = useToast();
  const [workflows, setWorkflows] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    if (!activeProjectId) return;
    workflowsApi.list(activeProjectId).then((res) => setWorkflows(res.data.workflows));
  };

  useEffect(() => {
    setWorkflows(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  const remove = async (wf) => {
    if (!window.confirm(`Delete workflow "${wf.name}"?`)) return;
    await workflowsApi.remove(wf._id);
    load();
  };

  const duplicate = async (wf) => {
    await workflowsApi.duplicate(wf._id);
    toast.success('Workflow duplicated');
    load();
  };

  if (!activeProjectId) {
    return (
      <>
        <Topbar title="Workflows" projectSwitcher={<ProjectSwitcher />} />
        <NoProjectState />
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Workflows"
        projectSwitcher={<ProjectSwitcher />}
        actions={
          <Button size="sm" icon={Plus} onClick={() => setShowCreate(true)}>
            New Workflow
          </Button>
        }
      />

      <div className="p-6 max-w-6xl mx-auto">
        {workflows === null ? (
          <PageSpinner />
        ) : workflows.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={WorkflowIcon}
                title="Build your first visual API workflow"
                description="Chain requests together, extract data between them, and branch on conditions."
                action={
                  <Button icon={Plus} onClick={() => setShowCreate(true)}>
                    New Workflow
                  </Button>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => (
              <Card key={wf._id} className="p-4">
                <button onClick={() => navigate(`/app/workflows/${wf._id}`)} className="text-left w-full">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-ink truncate">{wf.name}</h3>
                    <StatusBadge status={wf.lastRunStatus} />
                  </div>
                  <p className="mt-1 text-xs text-ink-secondary line-clamp-2 min-h-[2em]">
                    {wf.description || `${wf.nodes?.length || 0} nodes`}
                  </p>
                </button>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                  <span className="text-xs text-ink-secondary">
                    {wf.lastRunAt ? `Last run ${new Date(wf.lastRunAt).toLocaleDateString()}` : 'Never run'}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => duplicate(wf)} className="text-ink-secondary hover:text-ink p-1" title="Duplicate">
                      <Copy size={13} />
                    </button>
                    <button onClick={() => remove(wf)} className="text-ink-secondary hover:text-danger p-1" title="Delete">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateWorkflowModal
          projectId={activeProjectId}
          onClose={() => setShowCreate(false)}
          onCreated={(wf) => navigate(`/app/workflows/${wf._id}`)}
        />
      )}
    </>
  );
}

function StatusBadge({ status }) {
  if (status === 'succeeded') return <CheckCircle2 size={15} className="text-success" />;
  if (status === 'failed') return <XCircle size={15} className="text-danger" />;
  return null;
}

function CreateWorkflowModal({ projectId, onClose, onCreated }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    workflowsApi.templates().then((res) => setTemplates(res.data.templates));
  }, []);

  const create = async () => {
    if (!name.trim()) {
      toast.error('Workflow name is required');
      return;
    }
    setIsSaving(true);
    try {
      const res = await workflowsApi.create({
        project: projectId,
        name,
        templateKey: selectedTemplate || undefined,
      });
      onCreated(res.data.workflow);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not create workflow');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title="New workflow"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isSaving} onClick={create}>
            Create
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label="Name" required>
          <Input autoFocus placeholder="Order Processing" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Start from">
          <div className="space-y-1.5">
            <button
              onClick={() => setSelectedTemplate('')}
              className={`w-full text-left rounded-md border px-3 py-2 text-sm ${
                selectedTemplate === '' ? 'border-primary bg-primary-soft' : 'border-line hover:bg-primary-faint'
              }`}
            >
              <span className="font-medium">Blank workflow</span>
              <p className="text-xs text-ink-secondary">Just a Start and End node</p>
            </button>
            {templates.map((t) => (
              <button
                key={t.key}
                onClick={() => setSelectedTemplate(t.key)}
                className={`w-full text-left rounded-md border px-3 py-2 text-sm ${
                  selectedTemplate === t.key ? 'border-primary bg-primary-soft' : 'border-line hover:bg-primary-faint'
                }`}
              >
                <span className="font-medium">{t.label}</span>
                <p className="text-xs text-ink-secondary">{t.description}</p>
              </button>
            ))}
          </div>
        </FormField>
      </div>
    </Modal>
  );
}

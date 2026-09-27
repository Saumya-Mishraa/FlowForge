import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Trash2, MoreVertical } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState, Skeleton } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import { projectsApi } from '../../api/projects';
import { useToast } from '../../context/ToastContext';
import NewProjectModal from '../../components/projects/NewProjectModal';

export default function Projects() {
  const toast = useToast();
  const [projects, setProjects] = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const load = () => {
    projectsApi.list().then((res) => setProjects(res.data.projects));
  };

  useEffect(load, []);

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This removes all its collections, requests, and workflows.`)) {
      return;
    }
    try {
      await projectsApi.remove(project._id);
      toast.success('Project deleted');
      load();
    } catch (err) {
      toast.error('Could not delete project');
    }
    setOpenMenuId(null);
  };

  return (
    <>
      <Topbar
        title="Projects"
        actions={
          <Button icon={Plus} onClick={() => setShowNewProject(true)}>
            New Project
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        {projects === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={FolderKanban}
                title="Create your first project"
                description="Create your first project to start testing APIs and designing workflows."
                action={
                  <Button icon={Plus} onClick={() => setShowNewProject(true)}>
                    Create Project
                  </Button>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <Card key={p._id} className="p-5 relative group">
                <div className="flex items-start justify-between">
                  <Link to={`/app/projects/${p._id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                      <h3 className="font-medium text-ink truncate">{p.name}</h3>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-secondary line-clamp-2 min-h-[2.5em]">
                      {p.description || 'No description'}
                    </p>
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === p._id ? null : p._id)}
                      className="text-ink-secondary hover:text-ink p-1 rounded"
                      aria-label="Project options"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === p._id && (
                      <div className="absolute right-0 top-7 z-10 w-40 rounded-md border border-line bg-white shadow-popover py-1">
                        <button
                          onClick={() => handleDelete(p)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-xs text-ink-secondary border-t border-line pt-3">
                  <span>{p.collectionCount} collections</span>
                  <span>{p.requestCount} requests</span>
                  <span>{p.workflowCount} workflows</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => {
            setShowNewProject(false);
            load();
          }}
        />
      )}
    </>
  );
}

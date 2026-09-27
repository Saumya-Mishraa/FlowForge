import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Workflow,
  CheckCircle2,
  XCircle,
  Timer,
  Plus,
  FileJson,
  FolderPlus,
  FolderKanban,
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { EmptyState, Skeleton } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import { dashboardApi, projectsApi } from '../../api/projects';
import { useAuth } from '../../context/AuthContext';
import NewProjectModal from '../../components/projects/NewProjectModal';

const statCards = [
  { key: 'totalRequests', label: 'Total API Requests', icon: Send },
  { key: 'totalWorkflows', label: 'Total Workflows', icon: Workflow },
  { key: 'successfulExecutions', label: 'Successful Executions', icon: CheckCircle2 },
  { key: 'failedExecutions', label: 'Failed Executions', icon: XCircle },
  { key: 'avgResponseTimeMs', label: 'Avg Response Time', icon: Timer, suffix: 'ms' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);

  const load = () => {
    setIsLoading(true);
    dashboardApi
      .summary()
      .then((res) => setSummary(res.data))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  return (
    <>
      <Topbar title={`Welcome back, ${user?.name?.split(' ')[0] || ''}`} />

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24" />)
            : statCards.map((s) => (
                <Card key={s.key} className="p-4">
                  <div className="flex items-center gap-2 text-ink-secondary">
                    <s.icon size={15} />
                    <span className="text-xs font-medium">{s.label}</span>
                  </div>
                  <p className="mt-3 font-display text-2xl font-semibold text-ink">
                    {summary?.stats?.[s.key] ?? 0}
                    {s.suffix && summary?.stats?.[s.key] ? s.suffix : ''}
                  </p>
                </Card>
              ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <CardBody className="grid grid-cols-2 gap-3">
              <QuickAction icon={Send} label="New API Request" to="/app/api-tester" />
              <QuickAction icon={Workflow} label="New Workflow" to="/app/workflows" />
              <QuickAction icon={FileJson} label="Import OpenAPI" to="/app/collections" />
              <QuickAction icon={FolderPlus} label="Create Project" onClick={() => setShowNewProject(true)} />
            </CardBody>
          </Card>

          {/* Recent activity */}
          <Card className="lg:col-span-2">
            <CardHeader title="Recent Activity" subtitle="Your latest executed requests" />
            <CardBody>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : summary?.recentActivity?.length ? (
                <ul className="divide-y divide-line">
                  {summary.recentActivity.map((item) => (
                    <li key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                            item.ok ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}
                        >
                          {item.method}
                        </span>
                        <span className="truncate text-ink-secondary">{item.url}</span>
                      </div>
                      <span className="shrink-0 text-xs text-ink-secondary">{item.status}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={Send}
                  title="Nothing executed yet"
                  description="Your executed requests and workflows will appear here."
                />
              )}
            </CardBody>
          </Card>
        </div>

        {/* Recent projects */}
        <Card>
          <CardHeader
            title="Recent Projects"
            action={
              <Button size="sm" variant="secondary" icon={Plus} onClick={() => setShowNewProject(true)}>
                New Project
              </Button>
            }
          />
          <CardBody>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : summary?.recentProjects?.length ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.recentProjects.map((p) => (
                  <Link
                    key={p._id}
                    to={`/app/projects/${p._id}`}
                    className="rounded-md border border-line p-4 hover:border-primary/40 hover:bg-primary-faint/40 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                      <span className="font-medium text-sm text-ink">{p.name}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-secondary line-clamp-2">
                      {p.description || 'No description'}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
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
            )}
          </CardBody>
        </Card>
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

function QuickAction({ icon: Icon, label, to, onClick }) {
  const content = (
    <div className="flex flex-col items-start gap-2 rounded-md border border-line p-4 hover:border-primary/40 hover:bg-primary-faint/40 transition-colors h-full">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-soft">
        <Icon size={16} className="text-primary" />
      </div>
      <span className="text-sm font-medium text-ink">{label}</span>
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }
  return (
    <button onClick={onClick} className="text-left">
      {content}
    </button>
  );
}

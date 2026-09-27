import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderTree, Workflow, Globe2, ArrowLeft } from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import { projectsApi } from '../../api/projects';
import { useToast } from '../../context/ToastContext';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [project, setProject] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    projectsApi
      .get(id)
      .then((res) => setProject(res.data.project))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <>
        <Topbar title="Project not found" />
        <div className="p-6">
          <EmptyState
            icon={FolderTree}
            title="This project doesn't exist"
            description="It may have been deleted, or the link is incorrect."
            action={
              <Button icon={ArrowLeft} onClick={() => navigate('/app/projects')}>
                Back to Projects
              </Button>
            }
          />
        </div>
      </>
    );
  }

  if (!project) return <PageSpinner />;

  return (
    <>
      <Topbar title={project.name} />
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: project.color }} />
          <p className="text-sm text-ink-secondary">{project.description || 'No description yet.'}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader title="Collections" subtitle="Organize your saved requests" />
            <CardBody>
              <EmptyState
                icon={FolderTree}
                title="No collections yet"
                description="Create a collection to organize your API requests."
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Workflows" subtitle="Visual, multi-step API automations" />
            <CardBody>
              <EmptyState icon={Workflow} title="No workflows yet" description="Build your first visual API workflow." />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Environments" subtitle="Variables per stage" />
            <CardBody>
              <EmptyState
                icon={Globe2}
                title="No environments yet"
                description="Add a Development or Production environment to manage variables."
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

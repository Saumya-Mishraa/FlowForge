import { useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { EmptyState } from '../ui/Feedback';
import Button from '../ui/Button';
import NewProjectModal from './NewProjectModal';
import { useProjectContext } from '../../context/ProjectContext';

export default function NoProjectState() {
  const { reload, setActiveProject } = useProjectContext();
  const [showNewProject, setShowNewProject] = useState(false);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardBody>
          <EmptyState
            icon={FolderKanban}
            title="Select or create a project first"
            description="This workspace is organized by project. Create your first project to start testing APIs and designing workflows."
            action={
              <Button icon={Plus} onClick={() => setShowNewProject(true)}>
                Create Project
              </Button>
            }
          />
        </CardBody>
      </Card>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={async () => {
            setShowNewProject(false);
            await reload();
          }}
        />
      )}
    </div>
  );
}

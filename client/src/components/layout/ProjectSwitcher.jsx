import { useState } from 'react';
import { ChevronDown, FolderKanban, Plus } from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';
import NewProjectModal from '../projects/NewProjectModal';

export default function ProjectSwitcher() {
  const { projects, activeProject, setActiveProject, reload } = useProjectContext();
  const [open, setOpen] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  if (!projects) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 rounded-md border border-line bg-white px-3 text-sm font-medium text-ink hover:border-primary/40 transition-colors max-w-[200px]"
      >
        {activeProject ? (
          <>
            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: activeProject.color }} />
            <span className="truncate">{activeProject.name}</span>
          </>
        ) : (
          <>
            <FolderKanban size={15} className="text-ink-secondary" />
            <span className="text-ink-secondary">No project</span>
          </>
        )}
        <ChevronDown size={14} className="text-ink-secondary shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:left-0 sm:top-10 z-20 sm:w-64 rounded-md border border-line bg-white shadow-popover py-1">
            {projects.length === 0 && (
              <p className="px-3 py-2 text-xs text-ink-secondary">No projects yet</p>
            )}
            {projects.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  setActiveProject(p._id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary-faint text-left"
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
            <div className="border-t border-line mt-1 pt-1">
              <button
                onClick={() => {
                  setOpen(false);
                  setShowNewProject(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary-faint text-left"
              >
                <Plus size={14} /> New project
              </button>
            </div>
          </div>
        </>
      )}

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => {
            setShowNewProject(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

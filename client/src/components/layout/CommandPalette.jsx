import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Workflow,
  FolderTree,
  FileJson,
  FolderKanban,
  Settings,
  Play,
} from 'lucide-react';
import { useProjectContext } from '../../context/ProjectContext';

export default function CommandPalette() {
  const navigate = useNavigate();
  const { activeProjectId } = useProjectContext();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(
    () => [
      { id: 'new-request', label: 'New Request', icon: Send, run: () => navigate('/app/api-tester') },
      { id: 'new-workflow', label: 'New Workflow', icon: Workflow, run: () => navigate('/app/workflows') },
      { id: 'open-collection', label: 'Open Collections', icon: FolderTree, run: () => navigate('/app/collections') },
      { id: 'run-workflow', label: 'Open Workflows to Run', icon: Play, run: () => navigate('/app/workflows') },
      { id: 'import-openapi', label: 'Import OpenAPI', icon: FileJson, run: () => navigate('/app/collections') },
      { id: 'create-project', label: 'Create Project', icon: FolderKanban, run: () => navigate('/app/projects') },
      { id: 'open-settings', label: 'Open Settings', icon: Settings, run: () => navigate('/app/settings') },
    ],
    [navigate, activeProjectId]
  );

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery('');
        setActiveIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    const onCustomOpen = () => {
      setOpen(true);
      setQuery('');
      setActiveIndex(0);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('flowforge:open-command-palette', onCustomOpen);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('flowforge:open-command-palette', onCustomOpen);
    };
  }, []);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  const runCommand = (cmd) => {
    cmd.run();
    setOpen(false);
  };

  const onKeyNav = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[activeIndex]) {
      runCommand(filtered[activeIndex]);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg rounded-lg bg-white shadow-popover overflow-hidden animate-slide-up">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyNav}
          placeholder="Type a command…"
          className="w-full h-12 px-4 text-sm border-b border-line focus:outline-none"
        />
        <div className="max-h-80 overflow-y-auto ff-scrollbar py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-secondary text-center">No matching commands</p>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => runCommand(cmd)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left ${
                  i === activeIndex ? 'bg-primary-faint text-ink' : 'text-ink-secondary'
                }`}
              >
                <cmd.icon size={15} />
                {cmd.label}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-line px-4 py-2 text-[11px] text-ink-secondary flex gap-3">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}

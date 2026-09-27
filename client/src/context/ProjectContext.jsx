import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { projectsApi } from '../api/projects';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);
const STORAGE_KEY = 'ff_active_project_id';

export function ProjectProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [projects, setProjects] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState(localStorage.getItem(STORAGE_KEY) || null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await projectsApi.list();
      setProjects(res.data.projects);
      setActiveProjectId((prev) => {
        const stillExists = res.data.projects.some((p) => p._id === prev);
        const next = stillExists ? prev : res.data.projects[0]?._id || null;
        if (next) localStorage.setItem(STORAGE_KEY, next);
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    } else {
      setProjects(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, load]);

  const setActiveProject = (id) => {
    setActiveProjectId(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const activeProject = projects?.find((p) => p._id === activeProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{ projects, activeProject, activeProjectId, setActiveProject, isLoading, reload: load }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used within ProjectProvider');
  return ctx;
}

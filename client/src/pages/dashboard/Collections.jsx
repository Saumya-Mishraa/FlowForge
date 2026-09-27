import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderTree,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  FolderPlus,
  Pencil,
  FileJson,
  FileText,
} from 'lucide-react';
import Topbar from '../../components/layout/Topbar';
import ProjectSwitcher from '../../components/layout/ProjectSwitcher';
import { Card, CardBody } from '../../components/ui/Card';
import { EmptyState, PageSpinner } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import { useProjectContext } from '../../context/ProjectContext';
import { collectionsApi, requestsApi } from '../../api/workspace';
import { useToast } from '../../context/ToastContext';
import NoProjectState from '../../components/projects/NoProjectState';
import OpenApiImportModal from '../../components/apitester/OpenApiImportModal';
import RequestDocsModal from '../../components/apitester/RequestDocsModal';

const METHOD_COLORS = {
  GET: 'text-success',
  POST: 'text-warning',
  PUT: 'text-primary',
  PATCH: 'text-primary',
  DELETE: 'text-danger',
};

export default function Collections() {
  const { activeProjectId } = useProjectContext();
  const toast = useToast();
  const navigate = useNavigate();
  const [collections, setCollections] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [requestsByCollection, setRequestsByCollection] = useState({});
  const [showImport, setShowImport] = useState(false);
  const [docsRequest, setDocsRequest] = useState(null);

  const load = () => {
    if (!activeProjectId) return;
    collectionsApi.list(activeProjectId).then((res) => setCollections(res.data.collections));
  };

  useEffect(() => {
    setCollections(null);
    setExpanded({});
    setRequestsByCollection({});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  const toggleExpand = async (collectionId) => {
    const isOpen = expanded[collectionId];
    setExpanded((prev) => ({ ...prev, [collectionId]: !isOpen }));
    if (!isOpen && !requestsByCollection[collectionId]) {
      const res = await requestsApi.list(activeProjectId, collectionId);
      setRequestsByCollection((prev) => ({ ...prev, [collectionId]: res.data.requests }));
    }
  };

  const createCollection = async () => {
    const name = window.prompt('Collection name (e.g. Authentication)');
    if (!name) return;
    await collectionsApi.create({ project: activeProjectId, name });
    load();
  };

  const renameCollection = async (col) => {
    const name = window.prompt('Rename collection', col.name);
    if (!name || name === col.name) return;
    await collectionsApi.update(col._id, { name });
    load();
  };

  const duplicateCollection = async (col) => {
    await collectionsApi.duplicate(col._id);
    toast.success('Collection duplicated');
    load();
  };

  const deleteCollection = async (col) => {
    if (!window.confirm(`Delete "${col.name}" and all its requests?`)) return;
    await collectionsApi.remove(col._id);
    load();
  };

  const addFolder = async (col) => {
    const name = window.prompt('Folder name');
    if (!name) return;
    await collectionsApi.addFolder(col._id, name);
    load();
  };

  const deleteRequest = async (collectionId, requestId) => {
    await requestsApi.remove(requestId);
    const res = await requestsApi.list(activeProjectId, collectionId);
    setRequestsByCollection((prev) => ({ ...prev, [collectionId]: res.data.requests }));
  };

  const openInTester = (request) => {
    navigate('/app/api-tester', { state: { loadRequest: request } });
  };

  if (!activeProjectId) {
    return (
      <>
        <Topbar title="Collections" projectSwitcher={<ProjectSwitcher />} />
        <NoProjectState />
      </>
    );
  }

  return (
    <>
      <Topbar
        title="Collections"
        projectSwitcher={<ProjectSwitcher />}
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="secondary" icon={FileJson} onClick={() => setShowImport(true)}>
              Import OpenAPI
            </Button>
            <Button size="sm" icon={Plus} onClick={createCollection}>
              New Collection
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-4xl mx-auto">
        {collections === null ? (
          <PageSpinner />
        ) : collections.length === 0 ? (
          <Card>
            <CardBody>
              <EmptyState
                icon={FolderTree}
                title="Create a collection to organize your API requests."
                description="Collections group related requests — like Authentication, Users, or Products."
                action={
                  <Button icon={Plus} onClick={createCollection}>
                    New Collection
                  </Button>
                }
              />
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {collections.map((col) => (
              <Card key={col._id}>
                <button
                  onClick={() => toggleExpand(col._id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                >
                  <span className="flex items-center gap-2 font-medium text-sm text-ink">
                    {expanded[col._id] ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    {col.name}
                  </span>
                  <span className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <IconBtn title="Add folder" onClick={() => addFolder(col)} icon={FolderPlus} />
                    <IconBtn title="Rename" onClick={() => renameCollection(col)} icon={Pencil} />
                    <IconBtn title="Duplicate" onClick={() => duplicateCollection(col)} icon={Copy} />
                    <IconBtn title="Delete" onClick={() => deleteCollection(col)} icon={Trash2} danger />
                  </span>
                </button>

                {expanded[col._id] && (
                  <div className="border-t border-line px-4 py-3">
                    {col.folders?.length > 0 && (
                      <div className="mb-2 space-y-1">
                        {col.folders.map((f) => (
                          <p key={f._id} className="text-xs font-medium text-ink-secondary uppercase tracking-wide">
                            📁 {f.name}
                          </p>
                        ))}
                      </div>
                    )}
                    {requestsByCollection[col._id]?.length ? (
                      <ul className="divide-y divide-line">
                        {requestsByCollection[col._id].map((r) => (
                          <li key={r._id} className="flex items-center justify-between py-2 text-sm">
                            <button
                              onClick={() => openInTester(r)}
                              className="flex items-center gap-2 min-w-0 text-left hover:text-primary"
                            >
                              <span className={`text-xs font-semibold w-14 shrink-0 ${METHOD_COLORS[r.method] || ''}`}>
                                {r.method}
                              </span>
                              <span className="truncate">{r.name}</span>
                            </button>
                            <span className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setDocsRequest(r)}
                                title="View documentation"
                                className="text-ink-secondary hover:text-primary"
                              >
                                <FileText size={13} />
                              </button>
                              <button
                                onClick={() => deleteRequest(col._id, r._id)}
                                className="text-ink-secondary hover:text-danger"
                              >
                                <Trash2 size={13} />
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-ink-secondary py-2">
                        No requests saved here yet — use "Save" in the API Tester.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {showImport && (
        <OpenApiImportModal
          projectId={activeProjectId}
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            load();
          }}
        />
      )}

      {docsRequest && <RequestDocsModal request={docsRequest} onClose={() => setDocsRequest(null)} />}
    </>
  );
}

function IconBtn({ icon: Icon, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-primary-faint ${danger ? 'text-ink-secondary hover:text-danger' : 'text-ink-secondary hover:text-ink'}`}
    >
      <Icon size={14} />
    </button>
  );
}

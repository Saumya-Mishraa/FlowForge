import { useEffect, useRef, useState } from 'react';
import { Upload, Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FormField } from '../ui/Input';
import { openapiApi, collectionsApi } from '../../api/workspace';
import { useToast } from '../../context/ToastContext';

export default function OpenApiImportModal({ projectId, onClose, onImported }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [specText, setSpecText] = useState('');
  const [preview, setPreview] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [collections, setCollections] = useState([]);
  const [collectionId, setCollectionId] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    collectionsApi.list(projectId).then((res) => setCollections(res.data.collections));
  }, [projectId]);

  const handleFile = async (file) => {
    const text = await file.text();
    setSpecText(text);
  };

  const parse = async () => {
    if (!specText.trim()) {
      setError('Paste or upload a spec first');
      return;
    }
    setError('');
    setIsParsing(true);
    try {
      const res = await openapiApi.parse(specText);
      setPreview(res.data);
      setSelected(new Set(res.data.endpoints.map((e) => `${e.method} ${e.path}`)));
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not parse this spec');
      setPreview(null);
    } finally {
      setIsParsing(false);
    }
  };

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const doImport = async () => {
    setIsImporting(true);
    try {
      const res = await openapiApi.import({
        project: projectId,
        collection: collectionId || undefined,

        specText,
        selectedPaths: Array.from(selected),
      });
      toast.success(`Imported ${res.data.imported} endpoint${res.data.imported === 1 ? '' : 's'}`);
      onImported();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      title="Import OpenAPI / Swagger spec"
      onClose={onClose}
      width="max-w-2xl"
      footer={
        preview ? (
          <>
            <Button variant="secondary" onClick={() => setPreview(null)}>
              Back
            </Button>
            <Button isLoading={isImporting} disabled={selected.size === 0} onClick={doImport}>
              Import {selected.size} endpoint{selected.size === 1 ? '' : 's'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button isLoading={isParsing} onClick={parse}>
              Preview
            </Button>
          </>
        )
      }
    >
      {!preview ? (
        <div className="space-y-3">
          {error && (
            <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div>
          )}
          <p className="text-sm text-ink-secondary">
            Paste an OpenAPI 3 or Swagger 2 document (JSON or YAML), or upload a file. This build supports a
            documented subset — paths, methods, query/header parameters, and JSON request bodies. Path parameters,
            security schemes, and $ref'd external files are not auto-converted.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.yaml,.yml"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
          <Button variant="secondary" size="sm" icon={Upload} onClick={() => fileInputRef.current?.click()}>
            Upload file
          </Button>
          <textarea
            className="w-full h-56 rounded-md border border-line p-3 font-mono text-xs"
            placeholder="Paste your OpenAPI/Swagger spec here…"
            value={specText}
            onChange={(e) => setSpecText(e.target.value)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <FormField label="Add to collection">
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              className="w-full h-9 rounded-md border border-line px-2 text-sm"
            >
              <option value="">No collection (unfiled)</option>
              {collections.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label={`${preview.title} ${preview.version ? `v${preview.version}` : ''}`} hint={`Base URL: ${preview.baseUrl || '(none found)'}`}>
            <div className="max-h-72 overflow-y-auto ff-scrollbar border border-line rounded-md divide-y divide-line">
              {preview.endpoints.map((e) => {
                const key = `${e.method} ${e.path}`;
                const isSelected = selected.has(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggle(key)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-primary-faint/50"
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded border shrink-0 ${
                        isSelected ? 'bg-primary border-primary' : 'border-line'
                      }`}
                    >
                      {isSelected && <Check size={11} className="text-white" />}
                    </span>
                    <span className="text-xs font-semibold text-primary w-14 shrink-0">{e.method}</span>
                    <span className="text-sm truncate">{e.name}</span>
                    <span className="text-xs text-ink-secondary ml-auto shrink-0 font-mono">{e.path}</span>
                  </button>
                );
              })}
            </div>
          </FormField>
        </div>
      )}
    </Modal>
  );
}

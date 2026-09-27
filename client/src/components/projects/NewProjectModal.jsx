import { useState } from 'react';
import Modal from '../ui/Modal';
import { FormField, Input } from '../ui/Input';
import Button from '../ui/Button';
import { projectsApi } from '../../api/projects';
import { apiErrorMessage } from '../../api/client';
import { useToast } from '../../context/ToastContext';

const colors = ['#E91E63', '#7C3AED', '#2563EB', '#16A34A', '#D97706', '#0EA5E9'];

export default function NewProjectModal({ onClose, onCreated }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(colors[0]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await projectsApi.create({ name, description, color });
      toast.success('Project created');
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create project'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      title="Create a new project"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button isLoading={isLoading} onClick={onSubmit}>
            Create Project
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </div>
        )}
        <FormField label="Project name" htmlFor="project-name" required>
          <Input
            id="project-name"
            autoFocus
            placeholder="E-Commerce API"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </FormField>
        <FormField label="Description" htmlFor="project-description">
          <Input
            id="project-description"
            placeholder="What is this project for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
        <FormField label="Color">
          <div className="flex gap-2">
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full ring-offset-2 transition-shadow"
                style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
        </FormField>
      </form>
    </Modal>
  );
}

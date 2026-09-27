import {
  Play,
  Square,
  Send,
  Variable,
  FileSearch,
  GitBranch,
  Wand2,
  Timer,
  FileText,
} from 'lucide-react';

export const NODE_META = {
  start: { label: 'Start', icon: Play, color: '#16A34A', hasInput: false, hasOutput: true },
  apiRequest: { label: 'API Request', icon: Send, color: '#E91E63', hasInput: true, hasOutput: true },
  variable: { label: 'Variable', icon: Variable, color: '#7C3AED', hasInput: true, hasOutput: true },
  extractVariable: { label: 'Extract Variable', icon: FileSearch, color: '#2563EB', hasInput: true, hasOutput: true },
  condition: { label: 'Condition', icon: GitBranch, color: '#D97706', hasInput: true, hasOutput: 'branch' },
  transform: { label: 'Transform', icon: Wand2, color: '#0EA5E9', hasInput: true, hasOutput: true },
  delay: { label: 'Delay', icon: Timer, color: '#6B6670', hasInput: true, hasOutput: true },
  log: { label: 'Log', icon: FileText, color: '#6B6670', hasInput: true, hasOutput: true },
  end: { label: 'End', icon: Square, color: '#DC2626', hasInput: true, hasOutput: false },
};

export function defaultDataForType(type) {
  switch (type) {
    case 'apiRequest':
      return { method: 'GET', url: '', params: [], headers: [], auth: { type: 'none' }, body: { mode: 'none' } };
    case 'variable':
      return { assignments: [{ key: '', value: '' }] };
    case 'extractVariable':
      return { path: 'response.', as: '' };
    case 'condition':
      return { expression: 'statusCode == 200' };
    case 'transform':
      return { source: '', operation: 'toUpperCase', output: '' };
    case 'delay':
      return { ms: 1000 };
    case 'log':
      return { message: '' };
    default:
      return {};
  }
}

export const ADDABLE_TYPES = [
  'apiRequest',
  'variable',
  'extractVariable',
  'condition',
  'transform',
  'delay',
  'log',
];

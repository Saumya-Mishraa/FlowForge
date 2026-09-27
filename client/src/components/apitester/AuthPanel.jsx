import { Input, FormField } from '../ui/Input';

const AUTH_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apiKey', label: 'API Key' },
  { value: 'oauth2', label: 'OAuth 2 (architecture only)' },
];

export default function AuthPanel({ auth, onChange }) {
  const set = (field, value) => onChange({ ...auth, [field]: value });

  return (
    <div className="space-y-4">
      <FormField label="Auth type">
        <select
          value={auth.type}
          onChange={(e) => onChange({ ...auth, type: e.target.value })}
          className="w-full h-10 rounded-md border border-line bg-white px-3 text-sm text-ink focus:border-primary focus:ring-1 focus:ring-primary/30"
        >
          {AUTH_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </FormField>

      {auth.type === 'bearer' && (
        <FormField label="Token" hint="Supports {{VARIABLES}}">
          <Input
            placeholder="{{TOKEN}}"
            value={auth.bearerToken || ''}
            onChange={(e) => set('bearerToken', e.target.value)}
          />
        </FormField>
      )}

      {auth.type === 'basic' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Username">
            <Input value={auth.basicUsername || ''} onChange={(e) => set('basicUsername', e.target.value)} />
          </FormField>
          <FormField label="Password">
            <Input
              type="password"
              value={auth.basicPassword || ''}
              onChange={(e) => set('basicPassword', e.target.value)}
            />
          </FormField>
        </div>
      )}

      {auth.type === 'apiKey' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Key name">
            <Input placeholder="X-API-Key" value={auth.apiKeyName || ''} onChange={(e) => set('apiKeyName', e.target.value)} />
          </FormField>
          <FormField label="Key value">
            <Input value={auth.apiKeyValue || ''} onChange={(e) => set('apiKeyValue', e.target.value)} />
          </FormField>
          <FormField label="Add to">
            <select
              value={auth.apiKeyIn || 'header'}
              onChange={(e) => set('apiKeyIn', e.target.value)}
              className="w-full h-10 rounded-md border border-line bg-white px-3 text-sm text-ink"
            >
              <option value="header">Header</option>
              <option value="query">Query Param</option>
            </select>
          </FormField>
        </div>
      )}

      {auth.type === 'oauth2' && (
        <p className="text-sm text-ink-secondary rounded-md border border-line bg-primary-faint px-3 py-2">
          OAuth 2 token acquisition isn't implemented in this build — the field structure exists on the
          request model, but no flow runs behind it yet. Use Bearer Token with a manually obtained access
          token in the meantime.
        </p>
      )}
    </div>
  );
}

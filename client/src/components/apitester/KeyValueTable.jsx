import { Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';

export default function KeyValueTable({ rows, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }) {
  const update = (index, field, value) => {
    const next = rows.map((r, i) => (i === index ? { ...r, [field]: value } : r));
    // Always keep exactly one trailing empty row so typing feels continuous.
    ensureTrailingRow(next);
    onChange(next);
  };

  const remove = (index) => {
    const next = rows.filter((_, i) => i !== index);
    ensureTrailingRow(next);
    onChange(next);
  };

  const ensureTrailingRow = (list) => {
    const last = list[list.length - 1];
    if (!last || last.key || last.value) {
      list.push({ key: '', value: '', enabled: true });
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 text-xs font-medium text-ink-secondary px-1">
        <span className="w-5"></span>
        <span>{keyPlaceholder}</span>
        <span>{valuePlaceholder}</span>
        <span className="w-6"></span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
          <input
            type="checkbox"
            checked={row.enabled !== false}
            onChange={(e) => update(i, 'enabled', e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          <Input
            placeholder={keyPlaceholder}
            value={row.key}
            onChange={(e) => update(i, 'key', e.target.value)}
          />
          <Input
            placeholder={valuePlaceholder}
            value={row.value}
            onChange={(e) => update(i, 'value', e.target.value)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-ink-secondary hover:text-danger disabled:opacity-30"
            disabled={!row.key && !row.value}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

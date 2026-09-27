import Editor from '@monaco-editor/react';

export default function JsonEditor({ value, onChange, language = 'json', height = 220, readOnly = false }) {
  return (
    <div className="rounded-md border border-line overflow-hidden">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        theme="light"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          padding: { top: 10 },
        }}
      />
    </div>
  );
}

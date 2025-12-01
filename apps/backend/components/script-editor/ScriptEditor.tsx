'use client';

import { useState, useEffect } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';

interface ScriptEditorProps {
  initialScript: string;
  onSave: (script: string) => void;
  onCancel?: () => void;
  isSaving?: boolean;
  maxLength?: number;
  label?: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export function ScriptEditor({
  initialScript,
  onSave,
  onCancel,
  isSaving = false,
  maxLength,
  label = 'Script',
  placeholder = 'Enter your script here...',
  rows = 8,
  disabled = false,
}: ScriptEditorProps) {
  const [script, setScript] = useState(initialScript);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setScript(initialScript);
    setHasChanges(false);
  }, [initialScript]);

  const handleScriptChange = (value: string) => {
    setScript(value);
    setHasChanges(value !== initialScript);
  };

  const handleSave = () => {
    if (hasChanges && !isSaving) {
      onSave(script);
    }
  };

  const handleCancel = () => {
    setScript(initialScript);
    setHasChanges(false);
    onCancel?.();
  };

  const isOverLimit = maxLength ? script.length > maxLength : false;
  const characterCount = script.length;
  const characterLimit = maxLength || Infinity;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <div className="flex items-center gap-2">
          {maxLength && (
            <span
              className={`text-xs ${
                isOverLimit ? 'text-error font-semibold' : 'text-text-muted'
              }`}
            >
              {characterCount} / {characterLimit}
            </span>
          )}
        </div>
      </div>

      <textarea
        value={script}
        onChange={(e) => handleScriptChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={`w-full p-3 bg-navy-dark border ${
          isOverLimit ? 'border-error' : 'border-white-20'
        } rounded-lg text-text-primary focus:outline-none focus:ring-2 ${
          isOverLimit ? 'focus:ring-error/50' : 'focus:ring-blue-accent/50'
        } font-mono text-sm leading-relaxed resize-y disabled:opacity-50 disabled:cursor-not-allowed`}
        disabled={isSaving || disabled}
      />

      {isOverLimit && (
        <div className="flex items-center gap-2 text-error text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Script exceeds maximum length of {characterLimit} characters</span>
        </div>
      )}

      {hasChanges && (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving || isOverLimit}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-accent hover:bg-blue-accent/90 disabled:bg-blue-accent/50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white-10 hover:bg-white-20 disabled:bg-white-10/50 disabled:cursor-not-allowed text-text-primary rounded-lg font-medium text-sm transition-colors"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

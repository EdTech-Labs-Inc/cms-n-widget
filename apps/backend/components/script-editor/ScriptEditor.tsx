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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-base font-semibold text-text-primary">{label}</label>
        {maxLength && (
          <span
            className={`text-sm px-3 py-1 rounded-full ${
              isOverLimit
                ? 'bg-error/20 text-error font-semibold'
                : 'bg-white-10 text-text-secondary'
            }`}
          >
            {characterCount.toLocaleString()} / {characterLimit.toLocaleString()}
          </span>
        )}
      </div>

      <textarea
        value={script}
        onChange={(e) => handleScriptChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full p-5 h-[65vh] bg-navy-secondary border-2 ${
          isOverLimit ? 'border-error' : 'border-white-30'
        } rounded-xl text-text-primary focus:outline-none focus:ring-2 ${
          isOverLimit
            ? 'focus:ring-error/50 focus:border-error'
            : 'focus:ring-purple-glow focus:border-purple-accent focus:shadow-glow-purple'
        } font-mono text-base leading-loose tracking-wide resize-none overflow-y-auto transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-text-dim`}
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

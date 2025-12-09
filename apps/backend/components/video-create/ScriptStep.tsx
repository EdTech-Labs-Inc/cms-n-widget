'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

type ScriptSource = 'prompt' | 'script_file' | 'content_file' | null;

interface ScriptStepProps {
  script: string;
  scriptSource: ScriptSource;
  onScriptChange: (script: string, source: ScriptSource) => void;
  orgSlug: string;
}

type InputMode = 'none' | 'upload_script' | 'upload_content' | 'prompt';

export function ScriptStep({
  script,
  scriptSource,
  onScriptChange,
  orgSlug,
}: ScriptStepProps) {
  const [inputMode, setInputMode] = useState<InputMode>('none');
  const [prompt, setPrompt] = useState('');
  const [aiGuidance, setAiGuidance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scriptFileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadScriptFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(
          `/api/org/${orgSlug}/video/upload-script`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to extract script');
        }

        onScriptChange(result.data.script, 'script_file');
        setInputMode('none');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload file');
      } finally {
        setIsLoading(false);
      }
    },
    [orgSlug, onScriptChange]
  );

  const handleUploadContentFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        // First extract text from file
        const formData = new FormData();
        formData.append('file', file);

        const uploadResponse = await fetch(
          `/api/org/${orgSlug}/video/upload-script`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to extract content');
        }

        // Then generate script from content
        const generateResponse = await fetch(
          `/api/org/${orgSlug}/video/generate-script`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'content',
              content: uploadResult.data.script,
              language: 'ENGLISH',
            }),
          }
        );

        const generateResult = await generateResponse.json();

        if (!generateResult.success) {
          throw new Error(generateResult.error || 'Failed to generate script');
        }

        onScriptChange(generateResult.data.script, 'content_file');
        setInputMode('none');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file');
      } finally {
        setIsLoading(false);
      }
    },
    [orgSlug, onScriptChange]
  );

  const handleGenerateFromPrompt = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/org/${orgSlug}/video/generate-script`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'prompt',
            prompt: prompt.trim(),
            language: 'ENGLISH',
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate script');
      }

      onScriptChange(result.data.script, 'prompt');
      setInputMode('none');
      setPrompt('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate script'
      );
    } finally {
      setIsLoading(false);
    }
  }, [orgSlug, prompt, onScriptChange]);

  const handleImproveScript = useCallback(async () => {
    if (!aiGuidance.trim() || !script) return;

    setIsImproving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/org/${orgSlug}/video/improve-script`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script,
            guidance: aiGuidance.trim(),
            language: 'ENGLISH',
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to improve script');
      }

      onScriptChange(result.data.script, scriptSource);
      setAiGuidance('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to improve script');
    } finally {
      setIsImproving(false);
    }
  }, [orgSlug, script, aiGuidance, scriptSource, onScriptChange]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: 'script' | 'content') => {
      const file = e.target.files?.[0];
      if (file) {
        if (type === 'script') {
          handleUploadScriptFile(file);
        } else {
          handleUploadContentFile(file);
        }
      }
      e.target.value = '';
    },
    [handleUploadScriptFile, handleUploadContentFile]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent, action: () => void) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        action();
      }
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-500/20 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input Mode Selection (when no script yet) */}
      {!script && inputMode === 'none' && (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            Choose how to create your video script:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {/* Upload Script File */}
            <button
              type="button"
              onClick={() => setInputMode('upload_script')}
              className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-accent/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-accent" />
              </div>
              <div>
                <div className="font-medium text-text-primary">
                  Upload Script File
                </div>
                <div className="text-sm text-text-muted">
                  Upload a ready-to-use script (DOCX, TXT, PDF)
                </div>
              </div>
            </button>

            {/* Upload Content for AI */}
            <button
              type="button"
              onClick={() => setInputMode('upload_content')}
              className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className="font-medium text-text-primary">
                  Upload Content File
                </div>
                <div className="text-sm text-text-muted">
                  AI will generate a script from your article/content
                </div>
              </div>
            </button>

            {/* Generate from Prompt */}
            <button
              type="button"
              onClick={() => setInputMode('prompt')}
              className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div>
                <div className="font-medium text-text-primary">
                  Generate from Prompt
                </div>
                <div className="text-sm text-text-muted">
                  Describe your video topic and AI will write the script
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Upload Script Mode */}
      {inputMode === 'upload_script' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">Upload your script file:</p>
            <button
              type="button"
              onClick={() => setInputMode('none')}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
          </div>

          <input
            ref={scriptFileInputRef}
            type="file"
            accept=".doc,.docx,.txt,.pdf"
            onChange={(e) => handleFileInputChange(e, 'script')}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => scriptFileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full p-8 border-2 border-dashed border-white-20 rounded-xl hover:border-white-40 hover:bg-white-5 transition-colors"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
                <span className="text-sm text-text-muted">
                  Extracting text...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-text-muted" />
                <span className="text-sm text-text-muted">
                  Click to select file (DOCX, DOC, TXT, PDF)
                </span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Upload Content Mode */}
      {inputMode === 'upload_content' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Upload content for AI to generate script:
            </p>
            <button
              type="button"
              onClick={() => setInputMode('none')}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
          </div>

          <input
            ref={contentFileInputRef}
            type="file"
            accept=".doc,.docx,.txt,.pdf"
            onChange={(e) => handleFileInputChange(e, 'content')}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => contentFileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full p-8 border-2 border-dashed border-white-20 rounded-xl hover:border-white-40 hover:bg-white-5 transition-colors"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-text-muted animate-spin" />
                <span className="text-sm text-text-muted">
                  Generating script from content...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-text-muted" />
                <span className="text-sm text-text-muted">
                  Click to select content file (DOCX, DOC, TXT, PDF)
                </span>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Prompt Input Mode */}
      {inputMode === 'prompt' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Describe your video topic:
            </p>
            <button
              type="button"
              onClick={() => setInputMode('none')}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => handleKeyPress(e, handleGenerateFromPrompt)}
            placeholder="E.g., Create an engaging video about the benefits of meditation for busy professionals..."
            rows={4}
            className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm resize-y"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">Press Cmd/Ctrl+Enter to generate</p>
            <button
              type="button"
              onClick={handleGenerateFromPrompt}
              disabled={!prompt.trim() || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 disabled:bg-gold/30 disabled:cursor-not-allowed text-navy-dark rounded-lg font-medium text-sm transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Script
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Script Editor (when script exists) */}
      {script && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-text-primary">
                Your Script
              </label>
              {scriptSource && (
                <span className="text-xs px-2 py-0.5 bg-white-10 rounded text-text-muted">
                  {scriptSource === 'prompt'
                    ? 'Generated from prompt'
                    : scriptSource === 'script_file'
                      ? 'Uploaded script'
                      : 'Generated from content'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                onScriptChange('', null);
                setInputMode('none');
              }}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Start over
            </button>
          </div>

          <textarea
            value={script}
            onChange={(e) => onScriptChange(e.target.value, scriptSource)}
            rows={8}
            className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-accent/50 font-mono text-sm leading-relaxed resize-y"
          />

          <div className="text-xs text-text-muted text-right">
            {script.length} characters
          </div>

          {/* AI Improvement Section */}
          <div className="border-t border-white-20 pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <label className="text-sm font-medium text-text-primary">
                  Improve with AI
                </label>
              </div>

              <textarea
                value={aiGuidance}
                onChange={(e) => setAiGuidance(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleImproveScript)}
                placeholder="E.g., Make it more conversational, add a stronger hook, shorten to 60 seconds..."
                rows={3}
                className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm resize-y"
                disabled={isImproving}
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  {isImproving
                    ? 'AI is improving your script...'
                    : 'Describe how to improve the script'}
                </p>
                <button
                  type="button"
                  onClick={handleImproveScript}
                  disabled={!aiGuidance.trim() || isImproving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold hover:bg-gold/90 disabled:bg-gold/30 disabled:cursor-not-allowed text-navy-dark rounded-lg font-medium text-sm transition-colors"
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Improve Script
                    </>
                  )}
                </button>
              </div>

              {isImproving && (
                <div className="flex items-center gap-2 p-3 bg-gold/10 border border-gold/30 rounded-lg">
                  <Loader2 className="w-4 h-4 text-gold animate-spin" />
                  <p className="text-sm text-gold">
                    AI is analyzing your feedback and improving the script...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

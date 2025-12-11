'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Trash2,
  Languages,
  RefreshCw,
} from 'lucide-react';

type ScriptSource = 'prompt' | 'script_file' | 'content_file' | null;
type Language = 'ENGLISH' | 'MARATHI' | 'HINDI' | 'BENGALI' | 'GUJARATI';

const LANGUAGE_LABELS: Record<Language, string> = {
  ENGLISH: 'English',
  MARATHI: 'Marathi',
  HINDI: 'Hindi',
  BENGALI: 'Bengali',
  GUJARATI: 'Gujarati',
};

interface TranslationData {
  script: string;
  title: string;
}

interface ScriptStepProps {
  script: string;
  scriptSource: ScriptSource;
  onScriptChange: (script: string, source: ScriptSource) => void;
  orgSlug: string;
  // Multi-language support
  title: string;
  selectedLanguages: Language[];
  translations: Record<string, TranslationData>;
  onTranslationsChange: (translations: Record<string, TranslationData>) => void;
}

interface AttachedFile {
  file: File;
  type: 'script' | 'content';
  name: string;
}

export function ScriptStep({
  script,
  scriptSource,
  onScriptChange,
  orgSlug,
  title,
  selectedLanguages,
  translations,
  onTranslationsChange,
}: ScriptStepProps) {
  const [prompt, setPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [aiGuidance, setAiGuidance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Language tabs state
  const [activeLanguage, setActiveLanguage] = useState<Language>('ENGLISH');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingLanguages, setTranslatingLanguages] = useState<Language[]>([]);

  const scriptFileInputRef = useRef<HTMLInputElement>(null);
  const contentFileInputRef = useRef<HTMLInputElement>(null);
  const prevScriptRef = useRef<string>('');

  // Check if we need to show language tabs
  const showLanguageTabs = script && selectedLanguages.length > 1;
  const nonEnglishLanguages = selectedLanguages.filter((l) => l !== 'ENGLISH');

  // Auto-translate all non-English languages when script is first generated
  const translateAllLanguages = useCallback(async (languagesToTranslate: Language[]) => {
    if (!script || !title || languagesToTranslate.length === 0) return;

    setTranslatingLanguages(languagesToTranslate);
    const newTranslations = { ...translations };

    for (const lang of languagesToTranslate) {
      try {
        const response = await fetch(`/api/org/${orgSlug}/video/translate-script`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            script,
            title,
            targetLanguage: lang,
          }),
        });

        const result = await response.json();

        if (result.success) {
          newTranslations[lang] = {
            script: result.data.translatedScript,
            title: result.data.translatedTitle,
          };
        }
      } catch {
        // Continue with other languages if one fails
      }
    }

    onTranslationsChange(newTranslations);
    setTranslatingLanguages([]);
  }, [script, title, orgSlug, translations, onTranslationsChange]);

  // Auto-translate when script is first set and there are non-English languages
  useEffect(() => {
    const scriptJustGenerated = script && !prevScriptRef.current;
    const hasNonEnglishLanguages = nonEnglishLanguages.length > 0;

    if (scriptJustGenerated && hasNonEnglishLanguages && title) {
      // Auto-translate all non-English languages
      translateAllLanguages(nonEnglishLanguages);
    }

    prevScriptRef.current = script;
  }, [script, title, nonEnglishLanguages, translateAllLanguages]);

  // Handle translation fetch
  const handleTranslate = useCallback(async (targetLanguage: Language) => {
    if (targetLanguage === 'ENGLISH' || !script || !title) return;

    setIsTranslating(true);
    setError(null);

    try {
      const response = await fetch(`/api/org/${orgSlug}/video/translate-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          title,
          targetLanguage,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to translate');
      }

      // Update translations
      onTranslationsChange({
        ...translations,
        [targetLanguage]: {
          script: result.data.translatedScript,
          title: result.data.translatedTitle,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to translate');
    } finally {
      setIsTranslating(false);
    }
  }, [script, title, orgSlug, translations, onTranslationsChange]);

  // Handle translation edit
  const handleTranslationEdit = useCallback((language: Language, newScript: string) => {
    const currentTranslation = translations[language] || { script: '', title: '' };
    onTranslationsChange({
      ...translations,
      [language]: {
        ...currentTranslation,
        script: newScript,
      },
    });
  }, [translations, onTranslationsChange]);

  // Handle title translation edit
  const handleTitleTranslationEdit = useCallback((language: Language, newTitle: string) => {
    const currentTranslation = translations[language] || { script: '', title: '' };
    onTranslationsChange({
      ...translations,
      [language]: {
        ...currentTranslation,
        title: newTitle,
      },
    });
  }, [translations, onTranslationsChange]);

  // Extract text from a file (used internally)
  const extractTextFromFile = useCallback(
    async (file: File): Promise<string> => {
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
        throw new Error(result.error || 'Failed to extract text from file');
      }

      return result.data.script;
    },
    [orgSlug]
  );

  // Handle script file only (no prompt)
  const handleScriptFileOnly = useCallback(
    async (file: File) => {
      const extractedScript = await extractTextFromFile(file);
      onScriptChange(extractedScript, 'script_file');
    },
    [extractTextFromFile, onScriptChange]
  );

  // Handle content file only (no prompt)
  const handleContentFileOnly = useCallback(
    async (file: File) => {
      const extractedContent = await extractTextFromFile(file);

      const response = await fetch(
        `/api/org/${orgSlug}/video/generate-script`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'content',
            content: extractedContent,
            language: 'ENGLISH',
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate script');
      }

      onScriptChange(result.data.script, 'content_file');
    },
    [orgSlug, extractTextFromFile, onScriptChange]
  );

  // Handle prompt only (no file)
  const handlePromptOnly = useCallback(async () => {
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
  }, [orgSlug, prompt, onScriptChange]);

  // Handle script file with prompt guidance
  const handleScriptWithPrompt = useCallback(
    async (file: File) => {
      const extractedScript = await extractTextFromFile(file);

      const response = await fetch(
        `/api/org/${orgSlug}/video/generate-script`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'script_with_prompt',
            script: extractedScript,
            prompt: prompt.trim(),
            language: 'ENGLISH',
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate script');
      }

      onScriptChange(result.data.script, 'script_file');
    },
    [orgSlug, prompt, extractTextFromFile, onScriptChange]
  );

  // Handle content file with prompt guidance
  const handleContentWithPrompt = useCallback(
    async (file: File) => {
      const extractedContent = await extractTextFromFile(file);

      const response = await fetch(
        `/api/org/${orgSlug}/video/generate-script`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'content_with_prompt',
            content: extractedContent,
            prompt: prompt.trim(),
            language: 'ENGLISH',
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate script');
      }

      onScriptChange(result.data.script, 'content_file');
    },
    [orgSlug, prompt, extractTextFromFile, onScriptChange]
  );

  // Unified generate handler
  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPrompt = prompt.trim().length > 0;
      const hasFile = attachedFile !== null;

      if (hasFile && hasPrompt) {
        // Combined mode - file + prompt guidance
        if (attachedFile.type === 'script') {
          await handleScriptWithPrompt(attachedFile.file);
        } else {
          await handleContentWithPrompt(attachedFile.file);
        }
      } else if (hasFile) {
        // File only
        if (attachedFile.type === 'script') {
          await handleScriptFileOnly(attachedFile.file);
        } else {
          await handleContentFileOnly(attachedFile.file);
        }
      } else if (hasPrompt) {
        // Prompt only
        await handlePromptOnly();
      }

      // Clear state after successful generation
      setPrompt('');
      setAttachedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate script');
    } finally {
      setIsLoading(false);
    }
  }, [
    prompt,
    attachedFile,
    handleScriptWithPrompt,
    handleContentWithPrompt,
    handleScriptFileOnly,
    handleContentFileOnly,
    handlePromptOnly,
  ]);

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

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, type: 'script' | 'content') => {
      const file = e.target.files?.[0];
      if (file) {
        setAttachedFile({
          file,
          type,
          name: file.name,
        });
        setError(null);
      }
      e.target.value = '';
    },
    []
  );

  const handleRemoveFile = useCallback(() => {
    setAttachedFile(null);
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        const hasPrompt = prompt.trim().length > 0;
        const hasFile = attachedFile !== null;
        if (hasPrompt || hasFile) {
          handleGenerate();
        }
      }
    },
    [prompt, attachedFile, handleGenerate]
  );

  const canGenerate = prompt.trim().length > 0 || attachedFile !== null;

  // Determine loading message based on state
  const getLoadingMessage = () => {
    if (!attachedFile) return 'Generating script...';
    if (attachedFile.type === 'script') {
      return prompt.trim() ? 'Applying guidance to script...' : 'Extracting script...';
    }
    return prompt.trim() ? 'Generating script with guidance...' : 'Generating script from content...';
  };

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

      {/* Script Creation Interface (when no script yet) */}
      {!script && (
        <div className="space-y-4">
          {/* Attached File Indicator */}
          {attachedFile && (
            <div className="flex items-center gap-2 p-3 bg-white-10 rounded-lg">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                attachedFile.type === 'script' ? 'bg-blue-accent/20' : 'bg-purple-500/20'
              }`}>
                {attachedFile.type === 'script' ? (
                  <Upload className="w-4 h-4 text-blue-accent" />
                ) : (
                  <FileText className="w-4 h-4 text-purple-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {attachedFile.name}
                </p>
                <p className="text-xs text-text-muted">
                  {attachedFile.type === 'script' ? 'Script file' : 'Content file'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-1.5 hover:bg-white-10 rounded-lg transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4 text-text-muted hover:text-red-400" />
              </button>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={scriptFileInputRef}
            type="file"
            accept=".doc,.docx,.txt,.pdf"
            onChange={(e) => handleFileSelect(e, 'script')}
            className="hidden"
          />
          <input
            ref={contentFileInputRef}
            type="file"
            accept=".doc,.docx,.txt,.pdf"
            onChange={(e) => handleFileSelect(e, 'content')}
            className="hidden"
          />

          {/* Prompt Input */}
          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                attachedFile?.type === 'script'
                  ? 'Optional: Add guidance for how to adjust the script...'
                  : attachedFile?.type === 'content'
                    ? 'Optional: Add guidance for how to create the script from this content...'
                    : 'Describe your video topic, or attach a file below...'
              }
              rows={4}
              className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50 text-sm resize-y"
              disabled={isLoading}
            />
          </div>

          {/* Attachment Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => scriptFileInputRef.current?.click()}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                attachedFile?.type === 'script'
                  ? 'border-blue-accent bg-blue-accent/10 text-blue-accent'
                  : 'border-white-20 bg-white-5 hover:bg-white-10 text-text-muted hover:text-text-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">
                {attachedFile?.type === 'script' ? 'Replace Script' : 'Attach Script'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => contentFileInputRef.current?.click()}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${
                attachedFile?.type === 'content'
                  ? 'border-purple-500 bg-purple-500/10 text-purple-500'
                  : 'border-white-20 bg-white-5 hover:bg-white-10 text-text-muted hover:text-text-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">
                {attachedFile?.type === 'content' ? 'Replace Content' : 'Attach Content'}
              </span>
            </button>
          </div>

          {/* Generate Button */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-text-muted">
              {isLoading ? getLoadingMessage() : 'Press Cmd/Ctrl+Enter to generate'}
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate || isLoading}
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
                setPrompt('');
                setAttachedFile(null);
              }}
              className="text-sm text-text-muted hover:text-text-primary"
            >
              Start over
            </button>
          </div>

          {/* Language Tabs */}
          {showLanguageTabs && (
            <div className="flex items-center gap-1 p-1 bg-white-5 rounded-lg">
              {selectedLanguages.map((lang) => {
                const isBeingTranslated = translatingLanguages.includes(lang);
                const hasTranslation = lang !== 'ENGLISH' && translations[lang]?.script;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLanguage(lang)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeLanguage === lang
                        ? 'bg-white-10 text-text-primary'
                        : 'text-text-muted hover:text-text-primary hover:bg-white-5'
                    }`}
                  >
                    <Languages className="w-4 h-4" />
                    {LANGUAGE_LABELS[lang]}
                    {isBeingTranslated && (
                      <span title="Translating...">
                        <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                      </span>
                    )}
                    {!isBeingTranslated && hasTranslation && (
                      <span className="w-2 h-2 rounded-full bg-green-500" title="Translated" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Auto-translation progress */}
          {translatingLanguages.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-accent/10 border border-blue-accent/30 rounded-lg">
              <Loader2 className="w-4 h-4 text-blue-accent animate-spin" />
              <p className="text-sm text-blue-accent">
                Auto-translating to {translatingLanguages.map(l => LANGUAGE_LABELS[l]).join(', ')}...
              </p>
            </div>
          )}

          {/* English Script Editor (default view or when English tab active) */}
          {(!showLanguageTabs || activeLanguage === 'ENGLISH') && (
            <>
              <textarea
                value={script}
                onChange={(e) => onScriptChange(e.target.value, scriptSource)}
                rows={8}
                className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-accent/50 font-mono text-sm leading-relaxed resize-y"
              />

              <div className="text-xs text-text-muted text-right">
                {script.length} characters
              </div>
            </>
          )}

          {/* Translation Editor (non-English tabs) */}
          {showLanguageTabs && activeLanguage !== 'ENGLISH' && (
            <div className="space-y-4">
              {/* Translated Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-primary">
                  {LANGUAGE_LABELS[activeLanguage]} Title
                </label>
                {translations[activeLanguage]?.title ? (
                  <input
                    type="text"
                    value={translations[activeLanguage]?.title || ''}
                    onChange={(e) => handleTitleTranslationEdit(activeLanguage, e.target.value)}
                    className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-accent/50 text-sm"
                    placeholder={`${LANGUAGE_LABELS[activeLanguage]} title will appear here...`}
                  />
                ) : (
                  <div className="p-3 bg-white-5 border border-white-10 rounded-lg text-text-muted text-sm">
                    Click &quot;Translate&quot; to generate {LANGUAGE_LABELS[activeLanguage]} title
                  </div>
                )}
              </div>

              {/* Translated Script */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    {LANGUAGE_LABELS[activeLanguage]} Script
                  </label>
                  <button
                    type="button"
                    onClick={() => handleTranslate(activeLanguage)}
                    disabled={isTranslating || !title}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-accent hover:bg-blue-accent/80 disabled:bg-blue-accent/30 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Translating...
                      </>
                    ) : translations[activeLanguage]?.script ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Re-translate
                      </>
                    ) : (
                      <>
                        <Languages className="w-4 h-4" />
                        Translate
                      </>
                    )}
                  </button>
                </div>

                {translations[activeLanguage]?.script ? (
                  <>
                    <textarea
                      value={translations[activeLanguage]?.script || ''}
                      onChange={(e) => handleTranslationEdit(activeLanguage, e.target.value)}
                      rows={8}
                      className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-accent/50 font-mono text-sm leading-relaxed resize-y"
                    />
                    <div className="text-xs text-text-muted text-right">
                      {translations[activeLanguage]?.script?.length || 0} characters
                    </div>
                  </>
                ) : (
                  <div className="p-6 bg-white-5 border border-white-10 rounded-lg text-center">
                    <Languages className="w-8 h-8 text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-muted">
                      {!title
                        ? 'Add a title above to enable translation'
                        : `Click "Translate" to generate ${LANGUAGE_LABELS[activeLanguage]} version`
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Info note */}
              <p className="text-xs text-text-muted">
                You can edit the translation before generating the video. Changes are saved automatically.
              </p>
            </div>
          )}

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && aiGuidance.trim()) {
                    handleImproveScript();
                  }
                }}
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

'use client';

import { useState, useRef, useCallback } from 'react';
import { X, AlertCircle, CheckCircle2, AlertTriangle, Upload, FileSpreadsheet } from 'lucide-react';
import { useBulkCreateTags } from '@/lib/api/hooks';
import { useToast } from '@/components/ui/ToastContainer';
import type { CreateTagRequest, Tag } from '@repo/api-client/types';

// The actual response type from the bulk create API (different from the typed return)
interface BulkCreateResponse {
  created: Tag[];
  skipped: { name: string; reason: string }[];
  errors: { name: string; error: string }[];
}

interface BulkTagUploadProps {
  isOpen: boolean;
  onClose: () => void;
  orgSlug: string;
}

interface ParsedTag {
  name: string;
  category?: string;
  description?: string;
}

interface UploadResult {
  created: string[];
  skipped: string[];
  errors: string[];
}

/**
 * Parse CSV content handling quoted fields properly
 */
function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

export function BulkTagUpload({ isOpen, onClose, orgSlug }: BulkTagUploadProps) {
  const [input, setInput] = useState('');
  const [parsedTags, setParsedTags] = useState<ParsedTag[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkCreate = useBulkCreateTags(orgSlug);
  const toast = useToast();

  const parseTextInput = (text: string): ParsedTag[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    const tags: ParsedTag[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if it's CSV format (contains comma)
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map((p) => p.trim());
        tags.push({
          name: parts[0],
          category: parts[1] || undefined,
          description: parts[2] || undefined,
        });
      } else {
        // Simple format - just the tag name
        tags.push({ name: trimmed });
      }
    }

    return tags.filter((tag) => tag.name);
  };

  const parseCSVContent = useCallback((content: string): ParsedTag[] => {
    const rows = parseCSV(content);
    const tags: ParsedTag[] = [];

    // Check if first row is a header
    const firstRow = rows[0];
    const hasHeader = firstRow && (
      firstRow[0]?.toLowerCase() === 'name' ||
      firstRow[0]?.toLowerCase() === 'tag' ||
      firstRow[0]?.toLowerCase() === 'tag name'
    );

    const dataRows = hasHeader ? rows.slice(1) : rows;

    for (const row of dataRows) {
      if (row.length === 0 || !row[0]) continue;

      tags.push({
        name: row[0],
        category: row[1] || undefined,
        description: row[2] || undefined,
      });
    }

    return tags.filter((tag) => tag.name);
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Invalid File', 'Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const tags = parseCSVContent(content);

      if (tags.length === 0) {
        toast.error('Empty File', 'No valid tags found in the CSV file');
        return;
      }

      setParsedTags(tags);
      setUploadedFileName(file.name);
      setShowPreview(true);
      setInput(''); // Clear text input when file is uploaded
      toast.success('File Loaded', `Found ${tags.length} tag${tags.length !== 1 ? 's' : ''} in ${file.name}`);
    };
    reader.onerror = () => {
      toast.error('Read Error', 'Failed to read the file');
    };
    reader.readAsText(file);
  }, [parseCSVContent, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  }, [handleFileUpload]);

  const handlePreview = () => {
    const tags = parseTextInput(input);
    setParsedTags(tags);
    setShowPreview(true);
    setUploadedFileName(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (parsedTags.length === 0) {
      toast.error('No Tags', 'Please enter at least one tag');
      return;
    }

    try {
      const createRequests: CreateTagRequest[] = parsedTags.map((tag) => ({
        name: tag.name,
        category: tag.category,
        description: tag.description,
      }));

      // Cast response to the actual type returned by the API
      const response = await bulkCreate.mutateAsync(createRequests) as unknown as BulkCreateResponse;

      // Process result
      const uploadResult: UploadResult = {
        created: response.created?.map((t) => t.name) || [],
        skipped: response.skipped?.map((t) => t.name) || [],
        errors: response.errors?.map((e) => `${e.name}: ${e.error}`) || [],
      };

      setResult(uploadResult);

      if (uploadResult.created.length > 0) {
        toast.success(
          'Tags Created',
          `Successfully created ${uploadResult.created.length} tag${uploadResult.created.length !== 1 ? 's' : ''}`
        );
      }

      if (uploadResult.skipped.length > 0 || uploadResult.errors.length > 0) {
        toast.warning(
          'Some Tags Skipped',
          `${uploadResult.skipped.length} duplicates, ${uploadResult.errors.length} errors`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error('Upload Failed', message);
    }
  };

  const handleClose = () => {
    setInput('');
    setParsedTags([]);
    setShowPreview(false);
    setResult(null);
    setUploadedFileName(null);
    onClose();
  };

  const handleClearFile = () => {
    setParsedTags([]);
    setShowPreview(false);
    setUploadedFileName(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-background-secondary rounded-xl shadow-2xl border border-white-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-accent/20 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-purple-accent" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Bulk Upload Tags</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-white-10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!result ? (
            <>
              {/* CSV File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative mb-6 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDragging
                    ? 'border-purple-accent bg-purple-accent/10'
                    : uploadedFileName
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-white-15 hover:border-white-30 hover:bg-white-5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center text-center">
                  {uploadedFileName ? (
                    <>
                      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
                        <FileSpreadsheet className="w-6 h-6 text-green-400" />
                      </div>
                      <p className="text-text-primary font-medium mb-1">{uploadedFileName}</p>
                      <p className="text-text-muted text-sm">{parsedTags.length} tags loaded</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearFile();
                        }}
                        className="mt-3 text-sm text-text-secondary hover:text-text-primary underline"
                      >
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white-10 rounded-xl flex items-center justify-center mb-3">
                        <FileSpreadsheet className="w-6 h-6 text-text-muted" />
                      </div>
                      <p className="text-text-primary font-medium mb-1">
                        Drop a CSV file here, or click to browse
                      </p>
                      <p className="text-text-muted text-sm">
                        CSV should have columns: <code className="bg-white-10 px-1.5 py-0.5 rounded text-xs">name, category, description</code>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Divider */}
              {!uploadedFileName && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-white-10" />
                    <span className="text-text-muted text-sm">or enter manually</span>
                    <div className="flex-1 h-px bg-white-10" />
                  </div>

                  {/* Manual Input */}
                  <div className="mb-4">
                    <label htmlFor="bulk-input" className="block text-sm font-medium text-text-secondary mb-2">
                      Enter tags (one per line)
                    </label>
                    <textarea
                      id="bulk-input"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setShowPreview(false);
                      }}
                      placeholder={`marketing\nsales, Sales Team, Tags for sales content\nproduct, Product, Product-related content`}
                      className="input w-full min-h-[120px] font-mono text-sm resize-y"
                      rows={5}
                    />
                    <p className="text-text-muted text-xs mt-2">
                      Use format: <code className="bg-white-10 px-1 py-0.5 rounded">name, category, description</code> or just the tag name
                    </p>
                  </div>
                </>
              )}

              {/* Preview */}
              {showPreview && parsedTags.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-text-secondary mb-2">
                    Preview ({parsedTags.length} tag{parsedTags.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="bg-white-5 border border-white-10 rounded-lg max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-white-5 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-text-muted font-medium">Name</th>
                          <th className="px-4 py-2 text-left text-text-muted font-medium">Category</th>
                          <th className="px-4 py-2 text-left text-text-muted font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white-5">
                        {parsedTags.map((tag, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-text-primary">{tag.name}</td>
                            <td className="px-4 py-2 text-text-secondary">{tag.category || '-'}</td>
                            <td className="px-4 py-2 text-text-secondary truncate max-w-[200px]">
                              {tag.description || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Results */
            <div className="space-y-4">
              {result.created.length > 0 && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-green-400">Created ({result.created.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.created.map((name, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-500/20 rounded text-sm text-green-300">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.skipped.length > 0 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-yellow-400">Skipped - Duplicates ({result.skipped.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.skipped.map((name, idx) => (
                      <span key={idx} className="px-2 py-1 bg-yellow-500/20 rounded text-sm text-yellow-300">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="font-medium text-red-400">Errors ({result.errors.length})</span>
                  </div>
                  <ul className="text-sm text-red-300 space-y-1">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white-10 shrink-0">
          {!result ? (
            <>
              <button type="button" onClick={handleClose} className="btn btn-ghost">
                Cancel
              </button>
              {uploadedFileName ? (
                // File was uploaded - go straight to upload
                <button
                  type="button"
                  onClick={handleUpload}
                  className="btn btn-primary"
                  disabled={bulkCreate.isPending || parsedTags.length === 0}
                >
                  {bulkCreate.isPending ? 'Uploading...' : `Upload ${parsedTags.length} Tag${parsedTags.length !== 1 ? 's' : ''}`}
                </button>
              ) : !showPreview ? (
                <button
                  type="button"
                  onClick={handlePreview}
                  className="btn btn-secondary"
                  disabled={!input.trim()}
                >
                  Preview
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUpload}
                  className="btn btn-primary"
                  disabled={bulkCreate.isPending || parsedTags.length === 0}
                >
                  {bulkCreate.isPending ? 'Uploading...' : `Upload ${parsedTags.length} Tag${parsedTags.length !== 1 ? 's' : ''}`}
                </button>
              )}
            </>
          ) : (
            <button type="button" onClick={handleClose} className="btn btn-primary">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

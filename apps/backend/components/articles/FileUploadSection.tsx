'use client';

import { RefObject } from 'react';
import { Upload, FileText, ChevronDown } from 'lucide-react';

interface Article {
  id: string;
  title: string;
}

interface FileUploadSectionProps {
  file: File | null;
  selectedArticleId: string;
  articles: Article[] | undefined;
  articlesLoading: boolean;
  isUploading: boolean;
  onFileChange: (file: File | null) => void;
  onArticleSelect: (articleId: string) => void;
  fileInputRef: RefObject<HTMLInputElement>;
}

export function FileUploadSection({
  file,
  selectedArticleId,
  articles,
  articlesLoading,
  isUploading,
  onFileChange,
  onArticleSelect,
  fileInputRef,
}: FileUploadSectionProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onFileChange(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleArticleSelect = (articleId: string) => {
    onArticleSelect(articleId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-text-secondary text-sm font-medium mb-3">
        Article Source
      </label>

      {/* File Upload / Drag-Drop */}
      <div className="relative mb-4">
        <input
          type="file"
          id="file-upload"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".doc,.docx,.txt"
          className="hidden"
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
            file
              ? 'border-gold bg-gold-light'
              : 'border-white-20 bg-white-10 hover:border-blue-accent hover:bg-blue-light'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {file ? (
            <div className="text-center">
              <FileText className="w-12 h-12 text-gold mx-auto mb-3" />
              <p className="text-text-primary font-medium">{file.name}</p>
              <p className="text-text-muted text-sm mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-text-primary font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-text-muted text-sm">
                DOC, DOCX, or TXT (max 10MB)
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white-20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-navy-secondary text-text-muted">or</span>
        </div>
      </div>

      {/* Existing Article Dropdown */}
      <div className="relative">
        <select
          value={selectedArticleId}
          onChange={(e) => handleArticleSelect(e.target.value)}
          disabled={isUploading || articlesLoading}
          className="w-full px-4 py-3 rounded-xl bg-white-10 border-2 border-white-20 text-text-primary focus:border-blue-accent focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
        >
          <option value="">Select an existing article</option>
          {articles?.map((article) => (
            <option key={article.id} value={article.id}>
              {article.title}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
      </div>
    </div>
  );
}

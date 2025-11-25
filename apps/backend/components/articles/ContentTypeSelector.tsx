'use client';

import { FileText } from 'lucide-react';

interface ContentOptions {
  generateVideo: boolean;
  generateAudio: boolean;
  generatePodcast: boolean;
  generateQuiz: boolean;
  generateInteractivePodcast: boolean;
}

interface ContentTypeSelectorProps {
  contentOptions: ContentOptions;
  onContentToggle: (key: keyof ContentOptions) => void;
  isDisabled: boolean;
}

export function ContentTypeSelector({
  contentOptions,
  onContentToggle,
  isDisabled,
}: ContentTypeSelectorProps) {
  return (
    <div>
      <label className="block text-text-secondary text-sm font-medium mb-3">
        Content to Generate
      </label>
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={contentOptions.generateAudio}
            onChange={() => onContentToggle('generateAudio')}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={isDisabled}
          />
          <div className="w-8 h-8 bg-gradient-pink rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text-primary">Audio</div>
            <div className="text-sm text-text-muted">
              Audio narration of the article
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={contentOptions.generatePodcast}
            onChange={() => onContentToggle('generatePodcast')}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={isDisabled}
          />
          <div className="w-8 h-8 bg-gradient-purple rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text-primary">Podcast</div>
            <div className="text-sm text-text-muted">
              Conversational podcast format
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={contentOptions.generateVideo}
            onChange={() => onContentToggle('generateVideo')}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={isDisabled}
          />
          <div className="w-8 h-8 bg-gradient-gold rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-navy-primary" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text-primary">Video</div>
            <div className="text-sm text-text-muted">
              Interactive video with quiz bubbles
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={contentOptions.generateQuiz}
            onChange={() => onContentToggle('generateQuiz')}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={isDisabled}
          />
          <div className="w-8 h-8 bg-gradient-blue rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text-primary">Quiz</div>
            <div className="text-sm text-text-muted">
              Multiple choice and fill-in-the-blank questions
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-4 rounded-xl bg-white-10 hover:bg-white-20 cursor-pointer transition-all duration-200">
          <input
            type="checkbox"
            checked={contentOptions.generateInteractivePodcast}
            onChange={() => onContentToggle('generateInteractivePodcast')}
            className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
            disabled={isDisabled}
          />
          <div className="w-8 h-8 bg-gradient-teal rounded-lg flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-text-primary">Interactive Podcast</div>
            <div className="text-sm text-text-muted">
              Casual educational podcast with 10-15 interactive questions
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}

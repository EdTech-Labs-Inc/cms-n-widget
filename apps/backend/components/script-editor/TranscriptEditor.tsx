'use client';

import { useState, useEffect } from 'react';
import { Save, X, ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptSegment {
  speaker: 'interviewer' | 'guest';
  text: string;
}

interface TranscriptEditorProps {
  initialTranscript: string; // JSON string of segments
  onSave: (transcript: string) => void;
  onCancel?: () => void;
  isSaving?: boolean;
  disabled?: boolean;
}

export function TranscriptEditor({
  initialTranscript,
  onSave,
  onCancel,
  isSaving = false,
  disabled = false,
}: TranscriptEditorProps) {
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const parsed = JSON.parse(initialTranscript) as TranscriptSegment[];
      setSegments(parsed);
      setHasChanges(false);
      // Expand first 3 segments by default
      setExpandedSegments(new Set([0, 1, 2]));
    } catch (error) {
      console.error('Failed to parse transcript:', error);
      setSegments([]);
    }
  }, [initialTranscript]);

  const handleSegmentChange = (index: number, text: string) => {
    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], text };
    setSegments(newSegments);
    setHasChanges(true);
  };

  const toggleSegment = (index: number) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSegments(newExpanded);
  };

  const handleSave = () => {
    if (hasChanges && !isSaving) {
      onSave(JSON.stringify(segments));
    }
  };

  const handleCancel = () => {
    try {
      const parsed = JSON.parse(initialTranscript) as TranscriptSegment[];
      setSegments(parsed);
      setHasChanges(false);
      onCancel?.();
    } catch (error) {
      console.error('Failed to reset transcript:', error);
    }
  };

  const getSpeakerLabel = (speaker: 'interviewer' | 'guest') => {
    return speaker === 'interviewer' ? 'Interviewer (Herin)' : 'Guest (Isha)';
  };

  const getSpeakerColor = (speaker: 'interviewer' | 'guest') => {
    return speaker === 'interviewer' ? 'text-blue-accent' : 'text-gold';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">
          Podcast Transcript ({segments.length} segments)
        </label>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {segments.map((segment, index) => {
          const isExpanded = expandedSegments.has(index);
          return (
            <div
              key={index}
              className="bg-white-10 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSegment(index)}
                className="w-full flex items-center justify-between p-3 hover:bg-white-20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getSpeakerColor(segment.speaker)}`}>
                    Segment {index + 1}: {getSpeakerLabel(segment.speaker)}
                  </span>
                  {!isExpanded && (
                    <span className="text-xs text-text-muted truncate max-w-[300px]">
                      {segment.text.substring(0, 60)}...
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-text-muted shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
                )}
              </button>

              {isExpanded && (
                <div className="p-3 pt-0">
                  <textarea
                    value={segment.text}
                    onChange={(e) => handleSegmentChange(index, e.target.value)}
                    rows={3}
                    className="w-full p-2 bg-navy-dark border border-white-20 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent/50 resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSaving || disabled}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasChanges && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
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

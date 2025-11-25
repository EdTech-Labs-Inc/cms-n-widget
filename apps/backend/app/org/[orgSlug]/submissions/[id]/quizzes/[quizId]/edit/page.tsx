'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus, X, Edit2, Save, XCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import {
  useSubmission,
  useTags,
  useAddQuizTag,
  useRemoveQuizTag,
  useUpdateQuiz,
  useApproveQuiz,
  useUnapproveQuiz,
} from '@/lib/api/hooks';
import type { Tag, QuizQuestion } from '@/lib/api/types';
import { useToast } from '@/components/ui/ToastContainer';
import { MediaEditLayout } from '@/components/layout/MediaEditLayout';
import { MediaPreviewModal } from '@/components/preview/MediaPreviewModal';
import { QuizPlayer, type Question } from '@repo/quiz-player';

interface TagManagerProps {
  tags: Tag[];
  availableTags: Tag[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  isLoading?: boolean;
}

function TagManager({ tags, availableTags, onAddTag, onRemoveTag, isLoading }: TagManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTags = availableTags.filter(
    (tag) => !tags.find((t) => t.id === tag.id) && tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gold/20 text-gold rounded-full text-xs sm:text-sm font-medium"
          >
            <span className="truncate max-w-[120px] sm:max-w-none">{tag.name}</span>
            <button
              onClick={() => onRemoveTag(tag.id)}
              className="hover:bg-gold/30 rounded-full p-0.5 transition-colors shrink-0"
              aria-label={`Remove ${tag.name}`}
              disabled={isLoading}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {!isAdding ? (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 border border-dashed border-gold/50 text-gold rounded-full text-xs sm:text-sm font-medium hover:bg-gold/10 transition-colors"
            disabled={isLoading}
          >
            <Plus className="w-3 h-3" />
            <span className="hidden xs:inline">Add Tag</span>
            <span className="inline xs:hidden">Add</span>
          </button>
        ) : (
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tags..."
              className="w-full sm:w-auto px-3 py-1 bg-white-10 border border-gold/50 text-text-primary rounded-full text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              autoFocus
              onBlur={() => {
                setTimeout(() => {
                  setIsAdding(false);
                  setSearchQuery('');
                }, 200);
              }}
            />
            {searchQuery && filteredTags.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 sm:left-0 sm:right-auto bg-navy-dark border border-white-20 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10 sm:min-w-[200px]">
                {filteredTags.slice(0, 10).map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      onAddTag(tag.id);
                      setSearchQuery('');
                      setIsAdding(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-white-10 text-text-primary text-xs sm:text-sm transition-colors"
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrgQuizEditPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const submissionId = params.id as string;
  const quizId = params.quizId as string;
  const toast = useToast();
  const [showPreview, setShowPreview] = useState(false);

  // State
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [editableQuestions, setEditableQuestions] = useState<QuizQuestion[]>([]);

  // Data fetching
  const { data: submission, isLoading: submissionLoading } = useSubmission(submissionId);
  const { data: allTags = [], isLoading: tagsLoading } = useTags();

  // Mutations
  const addQuizTag = useAddQuizTag();
  const removeQuizTag = useRemoveQuizTag();
  const updateQuiz = useUpdateQuiz();
  const approveQuiz = useApproveQuiz();
  const unapproveQuiz = useUnapproveQuiz();

  // Loading state
  if (submissionLoading || tagsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col justify-center items-center py-12 gap-3">
          <Loader2 className="w-8 h-8 text-blue-accent animate-spin" />
          <div className="text-text-secondary">Loading quiz...</div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Quiz not found</p>
        </div>
      </div>
    );
  }

  const quiz = submission.quizOutputs?.find((q) => q.id === quizId);

  if (!quiz) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="card p-6">
          <p className="text-red-400">Quiz not found</p>
        </div>
      </div>
    );
  }

  const quizTags = quiz.tags?.map((t) => t.tag) || [];
  const questions = quiz.questions || [];

  // Tag handlers
  const handleAddTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    addQuizTag.mutate(
      { submissionId, quizId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag added', `"${tag?.name || 'Tag'}" added to quiz`);
        },
        onError: (error: any) => {
          toast.error('Failed to add tag', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleRemoveTag = (tagId: string) => {
    const tag = allTags.find((t) => t.id === tagId);
    removeQuizTag.mutate(
      { submissionId, quizId, tagId },
      {
        onSuccess: () => {
          toast.success('Tag removed', `"${tag?.name || 'Tag'}" removed from quiz`);
        },
        onError: (error: any) => {
          toast.error('Failed to remove tag', error?.message || 'Please try again');
        },
      }
    );
  };

  // Question handlers
  const handleEditQuestion = (index: number) => {
    setEditableQuestions([...questions]);
    setEditingQuestionIndex(index);
  };

  const handleSaveQuestion = () => {
    updateQuiz.mutate(
      {
        submissionId,
        quizId,
        questions: editableQuestions,
      },
      {
        onSuccess: () => {
          setEditingQuestionIndex(null);
          setEditableQuestions([]);
          toast.success('Question saved', 'Quiz question updated successfully');
        },
        onError: (error: any) => {
          toast.error('Failed to save question', error?.message || 'Please try again');
        },
      }
    );
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionIndex(null);
    setEditableQuestions([]);
  };

  const handleQuestionFieldChange = (index: number, field: string, value: any) => {
    const updated = [...editableQuestions];
    updated[index] = { ...updated[index], [field]: value };
    setEditableQuestions(updated);
  };

  const handleQuestionOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...editableQuestions];
    const question = updated[questionIndex];
    if (question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updated[questionIndex] = { ...question, options: newOptions };
      setEditableQuestions(updated);
    }
  };

  // Approval handlers
  const handleApprove = () => {
    approveQuiz.mutate(
      { submissionId, quizId },
      {
        onSuccess: () => toast.success('Quiz approved', 'Quiz output has been approved'),
        onError: (error: any) => toast.error('Failed to approve quiz', error?.message || 'Please try again'),
      }
    );
  };

  const handleUnapprove = () => {
    unapproveQuiz.mutate(
      { submissionId, quizId },
      {
        onSuccess: () => toast.success('Approval withdrawn', 'Quiz approval has been withdrawn'),
        onError: (error: any) => toast.error('Failed to withdraw approval', error?.message || 'Please try again'),
      }
    );
  };

  // Transform data for preview
  const quizQuestions: Question[] = (quiz.questions as any[]).map((q: any) => ({
    type: q.type,
    question: q.question,
    explanation: q.explanation || undefined,
    options: q.options || undefined,
    correctAnswer: q.correctAnswer,
    acceptableAnswers: q.acceptableAnswers || undefined,
  }));

  return (
    <>
      <MediaEditLayout
        title={submission.article?.title ? `${submission.article.title} - Quiz` : 'Quiz'}
        backUrl={`/org/${orgSlug}/submissions/${submissionId}`}
        isApproved={quiz.isApproved}
        approvedAt={quiz.approvedAt}
        onApprove={handleApprove}
        onUnapprove={handleUnapprove}
        isApproving={approveQuiz.isPending || unapproveQuiz.isPending}
      >
      <div className="space-y-6">
        {/* Tags Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Tags</h2>
          <TagManager
            tags={quizTags}
            availableTags={allTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            isLoading={addQuizTag.isPending || removeQuizTag.isPending}
          />
        </div>

        {/* Questions */}
        {questions.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Questions ({questions.length})
            </h2>
            <div className="space-y-4 sm:space-y-6">
              {questions.map((question, index) => {
                const isEditing = editingQuestionIndex === index;
                const editableQuestion = isEditing ? editableQuestions[index] : question;

                return (
                  <div key={index} className="bg-white-10 rounded-xl p-4 sm:p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-blue-accent font-bold text-lg">{index + 1}.</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="badge badge-blue text-xs">{question.type}</span>
                          {!isEditing ? (
                            <button
                              onClick={() => handleEditQuestion(index)}
                              className="p-1 hover:bg-white-20 rounded transition-colors"
                              aria-label="Edit question"
                            >
                              <Edit2 className="w-4 h-4 text-blue-accent" />
                            </button>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={handleSaveQuestion}
                                className="p-1 hover:bg-success/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Save changes"
                                disabled={updateQuiz.isPending}
                              >
                                {updateQuiz.isPending ? (
                                  <Loader2 className="w-4 h-4 text-success animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4 text-success" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelQuestionEdit}
                                className="p-1 hover:bg-error/20 rounded transition-colors"
                                aria-label="Cancel editing"
                                disabled={updateQuiz.isPending}
                              >
                                <XCircle className="w-4 h-4 text-error" />
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <>
                            <textarea
                              value={editableQuestion.question}
                              onChange={(e) => handleQuestionFieldChange(index, 'question', e.target.value)}
                              className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary font-medium mb-4 focus:outline-none focus:ring-2 focus:ring-blue-accent/50"
                              rows={2}
                            />

                            {/* Editable answers */}
                            {editableQuestion.type === 'MCQ' && editableQuestion.options && (
                              <div className="space-y-2 mb-4">
                                {editableQuestion.options.map((option, optIdx) => (
                                  <div key={optIdx} className="space-y-1">
                                    <label className="text-xs text-text-muted">
                                      {optIdx === editableQuestion.correctAnswer
                                        ? '✓ Correct Answer'
                                        : `Option ${optIdx + 1}`}
                                    </label>
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => handleQuestionOptionChange(index, optIdx, e.target.value)}
                                      className="w-full p-3 bg-navy-dark border border-white-20 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-accent/50"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Editable explanation */}
                            <div className="space-y-2 mb-4">
                              <label className="text-xs text-text-muted">Explanation</label>
                              <textarea
                                value={editableQuestion.explanation || ''}
                                onChange={(e) => handleQuestionFieldChange(index, 'explanation', e.target.value)}
                                className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent/50"
                                rows={3}
                              />
                            </div>

                            {/* Editable hint */}
                            <div className="space-y-2 mb-4">
                              <label className="text-xs text-text-muted">Hint (optional)</label>
                              <textarea
                                value={editableQuestion.hint || ''}
                                onChange={(e) => handleQuestionFieldChange(index, 'hint', e.target.value)}
                                className="w-full p-3 bg-navy-dark border border-white-20 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-accent/50"
                                rows={2}
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-text-primary font-medium mb-4">{question.question}</p>

                            {/* Display answers based on type */}
                            {question.type === 'MCQ' && question.options && (
                              <div className="space-y-2 mb-4">
                                {question.options.map((option, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className={`p-3 rounded-xl ${
                                      optIdx === question.correctAnswer
                                        ? 'bg-success/20 border border-success/50'
                                        : 'bg-white-10'
                                    }`}
                                  >
                                    <span className="text-text-primary">{option}</span>
                                    {optIdx === question.correctAnswer && (
                                      <CheckCircle2 className="w-4 h-4 text-success inline ml-2" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {question.explanation && (
                              <div className="bg-blue-light rounded-xl p-4 flex items-start gap-2">
                                <Lightbulb className="w-5 h-5 text-blue-accent shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm text-text-secondary">
                                    <span className="text-blue-accent font-medium">Explanation:</span>{' '}
                                    {question.explanation}
                                  </p>
                                  {question.hint && (
                                    <p className="text-sm text-text-muted mt-2">
                                      <span className="text-blue-accent/70 font-medium">Hint:</span> {question.hint}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MediaEditLayout>

    {/* TEMPORARILY COMMENTED OUT */}
    {/* <MediaPreviewModal
      isOpen={showPreview}
      onClose={() => setShowPreview(false)}
      title="Quiz Preview"
    >
      <QuizPlayer
        questions={quizQuestions}
        showCloseButton={false}
        onClose={() => setShowPreview(false)}
        disableOverlay={true}
      />
    </MediaPreviewModal> */}
  </>
  );
}

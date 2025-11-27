'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSubmissions } from '@/lib/api/hooks';
import { Clock, CheckCircle2, Loader2, Plus, FolderOpen } from 'lucide-react';

export default function OrgDashboardPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;
  const { data, isLoading } = useSubmissions(orgSlug, 1, 8, true);

  const recentProjects = data?.submissions?.slice(0, 6) || [];
  const processingProjects = data?.submissions?.filter(
    s => s.status === 'PROCESSING' || s.status === "PARTIAL_COMPLETE"
  ) || [];

  const totalProjects = data?.pagination?.total || 0;
  const completedCount = data?.stats?.totalCompleted || 0;
  const processingCount = data?.stats?.totalProcessing || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section - Simplified */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Dashboard
        </h1>
        <p className="text-text-secondary">
          Manage your content projects
        </p>
      </div>

      {/* Quick Stats - Clean and minimal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="card p-6">
          <p className="text-text-muted text-sm mb-2">Total Articles</p>
          <p className="text-3xl font-bold text-text-primary">{totalProjects}</p>
        </div>

        <div className="card p-6">
          <p className="text-text-muted text-sm mb-2">Completed</p>
          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-bold text-text-primary">{completedCount}</p>
            {totalProjects > 0 && (
              <span className="text-sm text-text-muted">
                {Math.round((completedCount / totalProjects) * 100)}%
              </span>
            )}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-text-muted text-sm mb-2">Processing</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-text-primary">{processingCount}</p>
            {processingCount > 0 && (
              <Loader2 className="w-4 h-4 text-blue-accent animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Recent Articles - Clean */}
      {recentProjects.length > 0 && (
        <div className="mb-10">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-text-primary">Recent Articles</h2>
            <Link
              href={`/org/${orgSlug}/articles`}
              className="text-blue-accent hover:text-blue-vibrant text-sm font-medium transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/org/${orgSlug}/submissions/${project.id}`}
                className="card p-5 group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-text-primary group-hover:text-blue-accent transition-colors line-clamp-2 mb-1">
                      {project.article?.title || 'Untitled Article'}
                    </h3>
                    <p className="text-text-muted text-xs">
                      {new Date(project.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 ml-3">
                    {project.status === 'COMPLETED' && (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    )}
                    {(project.status === 'PROCESSING' || project.status === 'PARTIAL_COMPLETE') && (
                      <Loader2 className="w-5 h-5 text-blue-accent animate-spin" />
                    )}
                  </div>
                </div>

                {/* Output indicators */}
                <div className="flex gap-2 flex-wrap">
                  {project.generateAudio && (
                    <span className="px-2.5 py-1 rounded-full bg-white-10 text-text-secondary text-xs font-medium">
                      Audio
                    </span>
                  )}
                  {project.generateVideo && (
                    <span className="px-2.5 py-1 rounded-full bg-white-10 text-text-secondary text-xs font-medium">
                      Video
                    </span>
                  )}
                  {project.generatePodcast && (
                    <span className="px-2.5 py-1 rounded-full bg-white-10 text-text-secondary text-xs font-medium">
                      Podcast
                    </span>
                  )}
                  {project.generateQuiz && (
                    <span className="px-2.5 py-1 rounded-full bg-white-10 text-text-secondary text-xs font-medium">
                      Quiz
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Currently Processing - Clean */}
      {processingProjects.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-text-primary mb-5">Currently Processing</h2>

          <div className="space-y-3">
            {processingProjects.map((project) => {
              const outputs = [
                project.generateAudio && { name: 'Audio', done: project.audioOutputs?.some(a => a.status === 'COMPLETED') },
                project.generatePodcast && { name: 'Podcast', done: project.podcastOutputs?.some(p => p.status === 'COMPLETED') },
                project.generateVideo && { name: 'Video', done: project.videoOutputs?.some(v => v.status === 'COMPLETED') },
                project.generateQuiz && { name: 'Quiz', done: project.quizOutputs?.some(q => q.status === 'COMPLETED') },
              ].filter(Boolean);

              const progress = outputs.length > 0
                ? Math.round((outputs.filter((o: any) => o.done).length / outputs.length) * 100)
                : 0;

              return (
                <Link
                  key={project.id}
                  href={`/org/${orgSlug}/submissions/${project.id}`}
                  className="card p-5 group block"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-text-primary group-hover:text-blue-accent transition-colors flex-1">
                      {project.article?.title || 'Processing...'}
                    </h3>
                    <span className="text-xs text-text-muted ml-3">
                      {progress}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-white-10 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-blue-accent transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {outputs.map((output: any) => (
                      <span
                        key={output.name}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          output.done
                            ? 'bg-green-500/15 text-success'
                            : 'bg-blue-light text-blue-accent'
                        }`}
                      >
                        {output.name}
                        {output.done && ' ✓'}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State - Clean */}
      {totalProjects === 0 && !isLoading && (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">No articles yet</h2>
          <p className="text-text-muted mb-6 max-w-md mx-auto">
            Upload your first article to start creating multimedia content
          </p>
          <Link href={`/org/${orgSlug}/create`} className="btn btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Article
          </Link>
        </div>
      )}
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { SubmissionList } from '@/components/submissions/SubmissionList';

export default function OrgArticlesPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Clean Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Articles</h1>
          <p className="text-text-secondary">Manage your content projects</p>
        </div>
        <Link href={`/org/${orgSlug}/create`} className="btn btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Article
        </Link>
      </div>

      <SubmissionList orgSlug={orgSlug} />
    </div>
  );
}

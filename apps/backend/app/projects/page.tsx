import Link from 'next/link';
import { Plus } from 'lucide-react';
import { SubmissionList } from '@/components/submissions/SubmissionList';

export default function ProjectsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Projects</h1>
          <p className="text-text-secondary">View and manage your article projects</p>
        </div>
        <Link href="/create" className="btn btn-gold inline-flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Project
        </Link>
      </div>

      <SubmissionList />
    </div>
  );
}

'use client';

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ArticleForm } from "@/components/articles/ArticleForm";

export default function OrgNewArticlePage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Upload Article
        </h1>
        <p className="text-text-secondary">
          Upload your article to generate interactive multimedia learning
          content
        </p>
      </div>

      <div className="card p-6">
        <Suspense
          fallback={<div className="text-text-secondary">Loading form...</div>}
        >
          <ArticleForm orgSlug={orgSlug} />
        </Suspense>
      </div>
    </div>
  );
}

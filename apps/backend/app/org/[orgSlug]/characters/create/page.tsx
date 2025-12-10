'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { CharacterForm } from '@/components/characters/CharacterForm';

export default function CreateCharacterPage() {
  const params = useParams();
  const orgSlug = params.orgSlug as string;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Create Character
        </h1>
        <p className="text-text-secondary">
          Upload a photo and configure a new character for video generation
        </p>
      </div>

      <div className="card p-6">
        <Suspense
          fallback={<div className="text-text-secondary">Loading form...</div>}
        >
          <CharacterForm orgSlug={orgSlug} />
        </Suspense>
      </div>
    </div>
  );
}

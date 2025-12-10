'use client';

import { User, Sparkles } from 'lucide-react';

export default function AvatarsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card p-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/20 flex items-center justify-center">
          <User className="w-10 h-10 text-gold" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Coming Soon
        </div>

        <h1 className="text-3xl font-bold text-text-primary mb-3">
          Avatar Management
        </h1>

        <p className="text-text-muted text-lg mb-6 max-w-2xl mx-auto">
          Create and manage custom avatars for your videos. This feature will allow you to upload
          your own talking photos and configure AI avatars for personalized content creation.
        </p>

        <div className="bg-white-5 border border-white-10 rounded-lg p-6 text-left max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            What's coming:
          </h3>
          <ul className="space-y-2 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="text-gold">•</span>
              <span>Upload custom talking photos</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold">•</span>
              <span>Browse and select from AI avatar library</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold">•</span>
              <span>Link avatars to custom voices</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gold">•</span>
              <span>Organize avatars into character groups</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

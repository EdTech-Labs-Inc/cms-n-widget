'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { CollapsibleStep } from '@/components/video-create/CollapsibleStep';
import { ScriptStep } from '@/components/video-create/ScriptStep';
import { CharacterStep } from '@/components/video-create/CharacterStep';
import { LookStep } from '@/components/video-create/LookStep';
import { CaptionsStep } from '@/components/video-create/CaptionsStep';
import { SpecialEffectsStep } from '@/components/video-create/SpecialEffectsStep';
import { MusicStep } from '@/components/video-create/MusicStep';
import { BumpersStep } from '@/components/video-create/BumpersStep';
import { PreviewPanel } from '@/components/video-create/PreviewPanel';
import { SuccessModal } from '@/components/video-create/SuccessModal';
import { useCreateStandaloneVideo } from '@repo/api-client/hooks';
import { useToast } from '@/components/ui/ToastContainer';

type ScriptSource = 'prompt' | 'script_file' | 'content_file' | null;

interface VideoCreateDraft {
  script: string;
  scriptSource: ScriptSource;
  characterGroupId: string | null;
  characterGroupName: string | null;
  characterGroupThumbnailUrl: string | null;
  characterId: string | null;
  characterThumbnailUrl: string | null;
  heygenAvatarId: string | null;
  heygenCharacterType: 'avatar' | 'talking_photo' | null;
  voiceId: string | null;
  captionStyleId: string | null;
  captionStyleName: string | null;
  captionPreviewUrl: string | null;
  enableMagicZooms: boolean;
  enableMagicBrolls: boolean;
  magicBrollsPercentage: number;
  backgroundMusicId: string | null;
  backgroundMusicVolume: number;
  startBumperId: string | null;
  startBumperDuration: number | null;
  startBumperThumbnailUrl: string | null;
  startBumperMediaUrl: string | null;
  startBumperType: 'image' | 'video' | null;
  endBumperId: string | null;
  endBumperDuration: number | null;
  endBumperThumbnailUrl: string | null;
  endBumperMediaUrl: string | null;
  endBumperType: 'image' | 'video' | null;
  lastUpdated: string;
}

const DEFAULT_DRAFT: VideoCreateDraft = {
  script: '',
  scriptSource: null,
  characterGroupId: null,
  characterGroupName: null,
  characterGroupThumbnailUrl: null,
  characterId: null,
  characterThumbnailUrl: null,
  heygenAvatarId: null,
  heygenCharacterType: null,
  voiceId: null,
  captionStyleId: null,
  captionStyleName: null,
  captionPreviewUrl: null,
  enableMagicZooms: true,
  enableMagicBrolls: true,
  magicBrollsPercentage: 40,
  backgroundMusicId: null,
  backgroundMusicVolume: 0.15,
  startBumperId: null,
  startBumperDuration: null,
  startBumperThumbnailUrl: null,
  startBumperMediaUrl: null,
  startBumperType: null,
  endBumperId: null,
  endBumperDuration: null,
  endBumperThumbnailUrl: null,
  endBumperMediaUrl: null,
  endBumperType: null,
  lastUpdated: new Date().toISOString(),
};

export default function VideoCreatePage() {
  const params = useParams();
  const router = useRouter();
  const orgSlug = params.orgSlug as string;
  const toast = useToast();

  const STORAGE_KEY = `video-create-draft-${orgSlug}`;

  // Draft state
  const [draft, setDraft] = useState<VideoCreateDraft>(DEFAULT_DRAFT);
  const [isHydrated, setIsHydrated] = useState(false);

  // UI state
  const [expandedStep, setExpandedStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // API mutation
  const createVideoMutation = useCreateStandaloneVideo(orgSlug);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as VideoCreateDraft;
        setDraft(parsed);
      } catch {
        // Invalid JSON, use default
      }
    }
    setIsHydrated(true);
  }, [STORAGE_KEY]);

  // Save draft to localStorage on change
  useEffect(() => {
    if (isHydrated) {
      const toSave = { ...draft, lastUpdated: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    }
  }, [draft, isHydrated, STORAGE_KEY]);

  // Step completion status
  const isScriptComplete = !!draft.script.trim();
  const isCharacterComplete = !!draft.characterGroupId;
  const isLookComplete = !!draft.characterId && !!draft.voiceId;
  const isCaptionComplete = !!draft.captionStyleId;
  const isSpecialEffectsComplete = true; // Always has defaults
  const isMusicComplete = true; // Optional, so always "complete"
  const isBumpersComplete = true; // Optional, so always "complete"

  // Handle script change
  const handleScriptChange = useCallback(
    (script: string, source: ScriptSource) => {
      setDraft((prev) => ({
        ...prev,
        script,
        scriptSource: source,
      }));
    },
    []
  );

  // Handle character group selection
  const handleCharacterGroupSelect = useCallback(
    (groupId: string | null, groupName: string | null, thumbnailUrl: string | null) => {
      setDraft((prev) => ({
        ...prev,
        characterGroupId: groupId,
        characterGroupName: groupName,
        characterGroupThumbnailUrl: thumbnailUrl,
        // Clear character selection when group changes
        characterId: null,
        characterThumbnailUrl: null,
        heygenAvatarId: null,
        heygenCharacterType: null,
        voiceId: null,
      }));
    },
    []
  );

  // Handle character (look) selection
  const handleCharacterSelect = useCallback(
    (
      characterId: string,
      heygenAvatarId: string,
      heygenCharacterType: 'avatar' | 'talking_photo',
      voiceId: string,
      thumbnailUrl: string | null
    ) => {
      setDraft((prev) => ({
        ...prev,
        characterId,
        characterThumbnailUrl: thumbnailUrl,
        heygenAvatarId,
        heygenCharacterType,
        voiceId,
      }));
    },
    []
  );

  // Handle caption style selection
  const handleCaptionStyleSelect = useCallback(
    (captionStyleId: string, captionStyleName: string | null, previewImageUrl: string | null) => {
      setDraft((prev) => ({
        ...prev,
        captionStyleId,
        captionStyleName,
        captionPreviewUrl: previewImageUrl,
      }));
    },
    []
  );

  // Handle special effects changes
  const handleMagicZoomsChange = useCallback((enabled: boolean) => {
    setDraft((prev) => ({ ...prev, enableMagicZooms: enabled }));
  }, []);

  const handleMagicBrollsChange = useCallback((enabled: boolean) => {
    setDraft((prev) => ({ ...prev, enableMagicBrolls: enabled }));
  }, []);

  const handleBrollsPercentageChange = useCallback((percentage: number) => {
    setDraft((prev) => ({ ...prev, magicBrollsPercentage: percentage }));
  }, []);

  // Handle music selection
  const handleMusicSelect = useCallback((musicId: string | null) => {
    setDraft((prev) => ({ ...prev, backgroundMusicId: musicId }));
  }, []);

  const handleMusicVolumeChange = useCallback((volume: number) => {
    setDraft((prev) => ({ ...prev, backgroundMusicVolume: volume }));
  }, []);

  // Handle bumper selection
  const handleStartBumperSelect = useCallback(
    (
      bumperId: string | null,
      duration: number | null,
      thumbnailUrl: string | null,
      mediaUrl: string | null,
      bumperType: 'image' | 'video' | null
    ) => {
      setDraft((prev) => ({
        ...prev,
        startBumperId: bumperId,
        startBumperDuration: duration,
        startBumperThumbnailUrl: thumbnailUrl,
        startBumperMediaUrl: mediaUrl,
        startBumperType: bumperType,
      }));
    },
    []
  );

  const handleEndBumperSelect = useCallback(
    (
      bumperId: string | null,
      duration: number | null,
      thumbnailUrl: string | null,
      mediaUrl: string | null,
      bumperType: 'image' | 'video' | null
    ) => {
      setDraft((prev) => ({
        ...prev,
        endBumperId: bumperId,
        endBumperDuration: duration,
        endBumperThumbnailUrl: thumbnailUrl,
        endBumperMediaUrl: mediaUrl,
        endBumperType: bumperType,
      }));
    },
    []
  );

  // Handle generate
  const handleGenerate = useCallback(async () => {
    // Validate required fields
    if (!draft.script.trim()) {
      toast.error('Missing Script', 'Please add a script before generating');
      return;
    }
    if (!draft.characterId || !draft.heygenAvatarId || !draft.heygenCharacterType || !draft.voiceId) {
      toast.error('Missing Character', 'Please select a character and look before generating');
      return;
    }
    if (!draft.captionStyleId) {
      toast.error('Missing Caption Style', 'Please select a caption style before generating');
      return;
    }

    setIsGenerating(true);

    try {
      await createVideoMutation.mutateAsync({
        script: draft.script,
        sourceType: draft.scriptSource || 'prompt',
        characterId: draft.characterId,
        heygenAvatarId: draft.heygenAvatarId,
        heygenCharacterType: draft.heygenCharacterType,
        voiceId: draft.voiceId,
        captionStyleId: draft.captionStyleId,
        enableMagicZooms: draft.enableMagicZooms,
        enableMagicBrolls: draft.enableMagicBrolls,
        magicBrollsPercentage: draft.magicBrollsPercentage,
        backgroundMusicId: draft.backgroundMusicId,
        backgroundMusicVolume: draft.backgroundMusicVolume,
        startBumperId: draft.startBumperId,
        startBumperDuration: draft.startBumperDuration,
        endBumperId: draft.endBumperId,
        endBumperDuration: draft.endBumperDuration,
      });

      // Clear localStorage on success
      localStorage.removeItem(STORAGE_KEY);

      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create video';
      toast.error('Generation Failed', message);
    } finally {
      setIsGenerating(false);
    }
  }, [draft, createVideoMutation, STORAGE_KEY, toast]);

  // Don't render until hydrated (prevents hydration mismatch)
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-navy-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
          <p className="text-text-muted text-sm">Loading video creator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-navy-primary/95 backdrop-blur border-b border-white-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href={`/org/${orgSlug}/dashboard`}
            className="p-2 rounded-lg bg-white-10 hover:bg-white-20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Create Video</h1>
            <p className="text-sm text-text-muted">
              Build a standalone video with AI assistance
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - 70/30 split */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Column - Steps (70%) */}
          <div className="w-[70%] space-y-3">
            {/* Step 1: Script */}
            <CollapsibleStep
              stepNumber={1}
              title="Script"
              isExpanded={expandedStep === 1}
              onToggle={() => setExpandedStep(expandedStep === 1 ? 0 : 1)}
              isComplete={isScriptComplete}
              isRequired
            >
              <ScriptStep
                script={draft.script}
                scriptSource={draft.scriptSource}
                onScriptChange={handleScriptChange}
                orgSlug={orgSlug}
              />
            </CollapsibleStep>

            {/* Step 2: Character */}
            <CollapsibleStep
              stepNumber={2}
              title="Character"
              isExpanded={expandedStep === 2}
              onToggle={() => setExpandedStep(expandedStep === 2 ? 0 : 2)}
              isComplete={isCharacterComplete}
              isRequired
            >
              <CharacterStep
                orgSlug={orgSlug}
                selectedGroupId={draft.characterGroupId}
                onGroupSelect={handleCharacterGroupSelect}
              />
            </CollapsibleStep>

            {/* Step 3: Background & Outfit (Look) */}
            <CollapsibleStep
              stepNumber={3}
              title="Background & Outfit"
              isExpanded={expandedStep === 3}
              onToggle={() => setExpandedStep(expandedStep === 3 ? 0 : 3)}
              isComplete={isLookComplete}
              isDisabled={!isCharacterComplete}
              isRequired
            >
              <LookStep
                orgSlug={orgSlug}
                selectedGroupId={draft.characterGroupId}
                selectedCharacterId={draft.characterId}
                onCharacterSelect={handleCharacterSelect}
              />
            </CollapsibleStep>

            {/* Step 4: Captions */}
            <CollapsibleStep
              stepNumber={4}
              title="Captions"
              isExpanded={expandedStep === 4}
              onToggle={() => setExpandedStep(expandedStep === 4 ? 0 : 4)}
              isComplete={isCaptionComplete}
              isRequired
            >
              <CaptionsStep
                orgSlug={orgSlug}
                selectedCaptionStyleId={draft.captionStyleId}
                onCaptionStyleSelect={handleCaptionStyleSelect}
              />
            </CollapsibleStep>

            {/* Step 5: Special Effects */}
            <CollapsibleStep
              stepNumber={5}
              title="Special Effects"
              isExpanded={expandedStep === 5}
              onToggle={() => setExpandedStep(expandedStep === 5 ? 0 : 5)}
              isComplete={isSpecialEffectsComplete}
            >
              <SpecialEffectsStep
                enableMagicZooms={draft.enableMagicZooms}
                enableMagicBrolls={draft.enableMagicBrolls}
                magicBrollsPercentage={draft.magicBrollsPercentage}
                onMagicZoomsChange={handleMagicZoomsChange}
                onMagicBrollsChange={handleMagicBrollsChange}
                onBrollsPercentageChange={handleBrollsPercentageChange}
              />
            </CollapsibleStep>

            {/* Step 6: Music */}
            <CollapsibleStep
              stepNumber={6}
              title="Music"
              isExpanded={expandedStep === 6}
              onToggle={() => setExpandedStep(expandedStep === 6 ? 0 : 6)}
              isComplete={isMusicComplete}
            >
              <MusicStep
                orgSlug={orgSlug}
                selectedMusicId={draft.backgroundMusicId}
                musicVolume={draft.backgroundMusicVolume}
                onMusicSelect={handleMusicSelect}
                onVolumeChange={handleMusicVolumeChange}
              />
            </CollapsibleStep>

            {/* Step 7: Bumpers */}
            <CollapsibleStep
              stepNumber={7}
              title="Bumpers"
              isExpanded={expandedStep === 7}
              onToggle={() => setExpandedStep(expandedStep === 7 ? 0 : 7)}
              isComplete={isBumpersComplete}
            >
              <BumpersStep
                orgSlug={orgSlug}
                startBumperId={draft.startBumperId}
                startBumperDuration={draft.startBumperDuration}
                endBumperId={draft.endBumperId}
                endBumperDuration={draft.endBumperDuration}
                onStartBumperSelect={handleStartBumperSelect}
                onEndBumperSelect={handleEndBumperSelect}
              />
            </CollapsibleStep>
          </div>

          {/* Right Column - Preview (30%) */}
          <div className="w-[30%]">
            <PreviewPanel
              characterThumbnailUrl={draft.characterThumbnailUrl || draft.characterGroupThumbnailUrl}
              characterName={draft.characterGroupName}
              startBumperThumbnailUrl={draft.startBumperThumbnailUrl}
              startBumperName={draft.startBumperId ? 'Start Bumper' : null}
              startBumperMediaUrl={draft.startBumperMediaUrl}
              startBumperType={draft.startBumperType}
              endBumperThumbnailUrl={draft.endBumperThumbnailUrl}
              endBumperName={draft.endBumperId ? 'End Bumper' : null}
              endBumperMediaUrl={draft.endBumperMediaUrl}
              endBumperType={draft.endBumperType}
              captionPreviewUrl={draft.captionPreviewUrl}
              captionStyleName={draft.captionStyleName}
              isScriptReady={isScriptComplete}
              isCharacterSelected={isCharacterComplete}
              isLookSelected={isLookComplete}
              isCaptionSelected={isCaptionComplete}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </main>

      {/* Generating Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-navy-dark/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white-5 border border-white-20 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              Generating Your Video
            </h3>
            <p className="text-text-muted text-sm mb-4">
              This may take a few seconds. Please don&apos;t close this page.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
              <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              <span>Processing request...</span>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // Reset the draft to defaults
          setDraft(DEFAULT_DRAFT);
        }}
        orgSlug={orgSlug}
      />
    </div>
  );
}

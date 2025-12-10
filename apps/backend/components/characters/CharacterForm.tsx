'use client';

import { useState, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Upload, X, User, Mic } from 'lucide-react';
import axios from 'axios';
import { useVoices } from '@/lib/api/hooks';
import { useToast } from '@/components/ui/ToastContainer';

interface CharacterFormProps {
  orgSlug: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export function CharacterForm({ orgSlug }: CharacterFormProps) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [voiceId, setVoiceId] = useState('');
  const [characterType, setCharacterType] = useState<'avatar' | 'talking_photo'>('avatar');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [description, setDescription] = useState('');
  const [heygenAvatarGroupId, setHeygenAvatarGroupId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch voices
  const { data: voices, isLoading: voicesLoading } = useVoices(orgSlug);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type', 'Please upload a JPG or PNG image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', 'Maximum file size is 5MB');
      return;
    }

    setPhotoFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type', 'Please upload a JPG or PNG image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large', 'Maximum file size is 5MB');
      return;
    }

    setPhotoFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!photoFile) {
      toast.error('Photo required', 'Please upload a photo for the character');
      return;
    }

    if (!name.trim()) {
      toast.error('Name required', 'Please enter a name for the character');
      return;
    }

    if (!voiceId) {
      toast.error('Voice required', 'Please select a voice for the character');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('name', name.trim());
      formData.append('voiceId', voiceId);
      formData.append('characterType', characterType);
      if (gender) formData.append('gender', gender);
      if (description.trim()) formData.append('description', description.trim());
      if (heygenAvatarGroupId.trim()) formData.append('heygenAvatarGroupId', heygenAvatarGroupId.trim());

      const response = await axios.post(
        `/api/org/${orgSlug}/characters`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000, // 60 second timeout for upload
        }
      );

      if (response.data.success) {
        toast.success('Character created', `${name} has been created successfully`);
        // Reset form
        clearPhoto();
        setName('');
        setVoiceId('');
        setCharacterType('avatar');
        setGender('');
        setDescription('');
        setHeygenAvatarGroupId('');
      } else {
        throw new Error(response.data.error || 'Failed to create character');
      }
    } catch (error) {
      console.error('Character creation error:', error);
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : error instanceof Error
          ? error.message
          : 'Failed to create character';
      toast.error('Creation failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <div>
        <label className="block text-text-secondary text-sm font-medium mb-2">
          Character Photo *
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoChange}
          accept="image/jpeg,image/png"
          className="hidden"
          disabled={isSubmitting}
        />
        {photoPreview ? (
          <div className="relative inline-block">
            <img
              src={photoPreview}
              alt="Character preview"
              className="w-40 h-40 object-cover rounded-xl border-2 border-white-20"
            />
            <button
              type="button"
              onClick={clearPhoto}
              disabled={isSubmitting}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label
            htmlFor="photo-upload"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white-20 rounded-xl cursor-pointer hover:border-gold transition-colors bg-white-10"
          >
            <Upload className="w-8 h-8 text-text-muted mb-2" />
            <span className="text-text-secondary text-sm">
              Drop photo here or click to upload
            </span>
            <span className="text-text-muted text-xs mt-1">
              JPG or PNG, max 5MB
            </span>
          </label>
        )}
      </div>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-text-secondary text-sm font-medium mb-2">
          Name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter character name"
            disabled={isSubmitting}
            className="w-full pl-10 pr-4 py-3 bg-white-10 border border-white-20 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50"
          />
        </div>
      </div>

      {/* Voice Selection */}
      <div>
        <label htmlFor="voice" className="block text-text-secondary text-sm font-medium mb-2">
          Voice *
        </label>
        <div className="relative">
          <Mic className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <select
            id="voice"
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            disabled={isSubmitting || voicesLoading}
            className="w-full pl-10 pr-4 py-3 bg-white-10 border border-white-20 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 appearance-none"
          >
            <option value="">Select a voice</option>
            {voices?.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} {voice.gender ? `(${voice.gender})` : ''}
              </option>
            ))}
          </select>
        </div>
        {voicesLoading && (
          <p className="text-text-muted text-xs mt-1">Loading voices...</p>
        )}
        {!voicesLoading && (!voices || voices.length === 0) && (
          <p className="text-amber-500 text-xs mt-1">
            No voices available. Please add voices to your organization first.
          </p>
        )}
      </div>

      {/* Character Type */}
      <div>
        <label className="block text-text-secondary text-sm font-medium mb-2">
          Character Type
        </label>
        <div className="flex gap-4">
          <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
            characterType === 'avatar' ? 'bg-gold/20 border-2 border-gold' : 'bg-white-10 border border-white-20'
          }`}>
            <input
              type="radio"
              name="characterType"
              value="avatar"
              checked={characterType === 'avatar'}
              onChange={() => setCharacterType('avatar')}
              disabled={isSubmitting}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 ${
              characterType === 'avatar' ? 'border-gold bg-gold' : 'border-white-40'
            }`} />
            <span className="text-text-primary font-medium">Avatar</span>
          </label>
          <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
            characterType === 'talking_photo' ? 'bg-gold/20 border-2 border-gold' : 'bg-white-10 border border-white-20'
          }`}>
            <input
              type="radio"
              name="characterType"
              value="talking_photo"
              checked={characterType === 'talking_photo'}
              onChange={() => setCharacterType('talking_photo')}
              disabled={isSubmitting}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 ${
              characterType === 'talking_photo' ? 'border-gold bg-gold' : 'border-white-40'
            }`} />
            <span className="text-text-primary font-medium">Talking Photo</span>
          </label>
        </div>
      </div>

      {/* Gender (Optional) */}
      <div>
        <label className="block text-text-secondary text-sm font-medium mb-2">
          Gender (Optional)
        </label>
        <div className="flex gap-4">
          <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
            gender === 'male' ? 'bg-gold/20 border-2 border-gold' : 'bg-white-10 border border-white-20'
          }`}>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={gender === 'male'}
              onChange={() => setGender('male')}
              disabled={isSubmitting}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 ${
              gender === 'male' ? 'border-gold bg-gold' : 'border-white-40'
            }`} />
            <span className="text-text-primary font-medium">Male</span>
          </label>
          <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
            gender === 'female' ? 'bg-gold/20 border-2 border-gold' : 'bg-white-10 border border-white-20'
          }`}>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={gender === 'female'}
              onChange={() => setGender('female')}
              disabled={isSubmitting}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 ${
              gender === 'female' ? 'border-gold bg-gold' : 'border-white-40'
            }`} />
            <span className="text-text-primary font-medium">Female</span>
          </label>
          {gender && (
            <button
              type="button"
              onClick={() => setGender('')}
              disabled={isSubmitting}
              className="px-4 py-2 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Description (Optional) */}
      <div>
        <label htmlFor="description" className="block text-text-secondary text-sm font-medium mb-2">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a description for this character"
          disabled={isSubmitting}
          rows={3}
          className="w-full px-4 py-3 bg-white-10 border border-white-20 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50 resize-none"
        />
      </div>

      {/* Avatar Group ID (Optional) */}
      <div>
        <label htmlFor="groupId" className="block text-text-secondary text-sm font-medium mb-2">
          Avatar Group ID (Optional)
        </label>
        <input
          type="text"
          id="groupId"
          value={heygenAvatarGroupId}
          onChange={(e) => setHeygenAvatarGroupId(e.target.value)}
          placeholder="Enter group ID to link multiple looks"
          disabled={isSubmitting}
          className="w-full px-4 py-3 bg-white-10 border border-white-20 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50"
        />
        <p className="text-text-muted text-xs mt-1">
          Use the same group ID to link multiple character looks together
        </p>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !photoFile || !name.trim() || !voiceId}
          className="w-full py-3 px-4 bg-gradient-purple text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Character...
            </>
          ) : (
            'Create Character'
          )}
        </button>
      </div>
    </form>
  );
}

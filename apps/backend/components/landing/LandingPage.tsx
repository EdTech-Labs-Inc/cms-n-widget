'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Headphones,
  Video,
  Mic2,
  Brain,
  Sparkles,
  ArrowRight,
  Play,
  Zap,
  Globe,
  CheckCircle2,
} from 'lucide-react';

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const elements = document.querySelectorAll('[data-timeline-item]');

    elements.forEach((element, index) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleItems((prev) => new Set(prev).add(index));
            }
          });
        },
        { threshold: 0.2 }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [mounted]);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Cosmic grid background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Main radial glow - hero focal point */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-radial from-purple-500/40 via-purple-600/10 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-gradient-radial from-purple-600/30 via-purple-500/5 to-transparent blur-2xl" />
      </div>

      {/* Floating particles - only render on client */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">
              EdTech Labs
            </span>
          </div>
          <Link
            href="/login"
            className="px-8 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Main Headline */}
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold text-white mb-8 tracking-tight leading-[0.95]">
            One Article.
            <br />
            <span className="bg-gradient-to-r from-purple-300 via-purple-100 to-white bg-clip-text text-transparent">
              Five AI Formats.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-2xl md:text-3xl text-white/50 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            AI transforms your text into audio, video, podcasts,
            <br className="hidden md:block" />
            and interactive quizzes—instantly.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/login"
              className="group px-10 py-4 rounded-full bg-white text-black font-semibold text-lg hover:bg-white/90 transition-all duration-200 flex items-center gap-2 shadow-2xl shadow-white/10"
            >
              Start Creating
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="group px-10 py-4 rounded-full bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-all duration-200 flex items-center gap-2 backdrop-blur-sm">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>5 Content Formats</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>10x Faster</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>4 Languages</span>
            </div>
          </div>
        </div>

        {/* Subtle preview cards - more ethereal */}
        <div className="absolute bottom-20 left-0 right-0 pointer-events-none hidden lg:block">
          <div className="max-w-7xl mx-auto px-6 relative h-32">
            {/* Video preview */}
            <div className="absolute left-0 bottom-0 w-80 p-5 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/5 transform -rotate-3 opacity-60 hover:opacity-100 transition-opacity duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <Video className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">AI Video</div>
                  <div className="text-white/30 text-xs">with avatars</div>
                </div>
              </div>
            </div>

            {/* Podcast preview */}
            <div className="absolute right-0 bottom-0 w-80 p-5 rounded-2xl bg-white/[0.02] backdrop-blur-md border border-white/5 transform rotate-3 opacity-60 hover:opacity-100 transition-opacity duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Mic2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-medium">AI Podcast</div>
                  <div className="text-white/30 text-xs">multi-speaker</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Scroll timeline */}
      <section className="relative py-40 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-32">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
              Five ways to learn.
              <br />
              <span className="text-white/30">One upload.</span>
            </h2>
            <p className="text-xl text-white/40 max-w-2xl mx-auto">
              Different learners need different formats. We generate them all.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 md:left-16 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/50 via-purple-500/20 to-transparent" />

            {/* Format items */}
            <div className="space-y-24">
              {[
                {
                  number: '01',
                  icon: Video,
                  title: 'AI Video',
                  description: 'Professional videos with AI avatars, auto-captions, and dynamic editing. No camera needed.',
                  color: 'text-pink-400',
                  glow: 'from-pink-500/20 to-purple-500/20'
                },
                {
                  number: '02',
                  icon: Mic2,
                  title: 'AI Podcast',
                  description: 'Natural conversations between two AI voices with professional audio quality.',
                  color: 'text-blue-400',
                  glow: 'from-blue-500/20 to-cyan-500/20'
                },
                {
                  number: '03',
                  icon: Headphones,
                  title: 'Audio Narration',
                  description: 'Text-to-speech in multiple languages with natural-sounding AI voices.',
                  color: 'text-teal-400',
                  glow: 'from-teal-500/20 to-green-500/20'
                },
                {
                  number: '04',
                  icon: Brain,
                  title: 'Interactive Quiz',
                  description: 'Auto-generated assessments with MCQ, true/false, and fill-in-the-blank questions.',
                  color: 'text-purple-400',
                  glow: 'from-purple-500/20 to-indigo-500/20'
                },
                {
                  number: '05',
                  icon: Sparkles,
                  title: 'Interactive Podcast',
                  description: 'Podcasts with embedded quiz questions for active learning and engagement.',
                  color: 'text-indigo-400',
                  glow: 'from-indigo-500/20 to-blue-500/20'
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  data-timeline-item
                  className={`relative flex items-start gap-8 md:gap-12 group transition-all duration-700 ${
                    visibleItems.has(index)
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-12'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Number badge */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${feature.glow} backdrop-blur-sm border border-white/10 flex items-center justify-center font-bold text-2xl md:text-3xl ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                      {feature.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-white">{feature.title}</h3>
                    </div>
                    <p className="text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Ultra minimal */}
      <section className="relative py-40 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-bold text-white mb-4">
              Three steps.
              <br />
              <span className="text-white/30">That's it.</span>
            </h2>
          </div>

          <div className="space-y-20">
            {[
              {
                number: '01',
                title: 'Upload',
                description: 'Paste or upload your article content.',
              },
              {
                number: '02',
                title: 'Select',
                description: 'Choose which formats to generate.',
              },
              {
                number: '03',
                title: 'Download',
                description: 'Review, edit, and publish your content.',
              },
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-8 group">
                <div className="text-7xl font-bold text-white/5 group-hover:text-white/10 transition-colors duration-300 min-w-[120px]">
                  {step.number}
                </div>
                <div className="pt-4">
                  <h3 className="text-3xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-xl text-white/40">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-40 px-6">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Glow effect behind CTA */}
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-purple-600/10 to-transparent blur-3xl -z-10" />

          <h2 className="text-6xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
            Ready to transform
            <br />
            your content?
          </h2>

          <p className="text-2xl text-white/40 mb-12 font-light">
            Join teams creating multimedia at scale.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-3 px-12 py-5 rounded-full bg-white text-black font-semibold text-lg hover:bg-white/90 transition-all duration-200 shadow-2xl shadow-white/20"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">EdTech Labs</span>
          </div>
          <p className="text-white/30 text-sm">
            &copy; {new Date().getFullYear()} EdTech Labs. Transform content with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}

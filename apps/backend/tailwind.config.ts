import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Main backgrounds - pure black
        navy: {
          primary: '#000000',
          secondary: '#0A0A0A',
          dark: '#000000',
        },
        // Text colors
        text: {
          primary: 'rgba(255, 255, 255, 0.98)',
          secondary: 'rgba(255, 255, 255, 0.7)',
          muted: 'rgba(255, 255, 255, 0.45)',
          dim: 'rgba(255, 255, 255, 0.3)',
        },
        // Primary colors - white as main accent
        gold: {
          DEFAULT: '#FFFFFF',
          light: 'rgba(255, 255, 255, 0.12)',
          glow: 'rgba(255, 255, 255, 0.25)',
        },
        blue: {
          accent: '#8B5CF6',
          light: 'rgba(139, 92, 246, 0.12)',
          glow: 'rgba(139, 92, 246, 0.25)',
          vibrant: '#A78BFA',
        },
        purple: {
          accent: '#8B5CF6',
          light: 'rgba(139, 92, 246, 0.12)',
          glow: 'rgba(139, 92, 246, 0.25)',
          vibrant: '#A78BFA',
        },
        teal: {
          accent: '#14B8A6',
          light: 'rgba(20, 184, 166, 0.12)',
          glow: 'rgba(20, 184, 166, 0.25)',
        },
        pink: {
          accent: '#EC4899',
          light: 'rgba(236, 72, 153, 0.12)',
          glow: 'rgba(236, 72, 153, 0.25)',
        },
        // Success/Status - more refined
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        // Difficulty levels
        difficulty: {
          beginner: '#10B981',
          intermediate: '#FFFFFF',
          advanced: '#8B5CF6',
        },
        // White variations
        white: {
          DEFAULT: '#FFFFFF',
          5: 'rgba(255, 255, 255, 0.05)',
          10: 'rgba(255, 255, 255, 0.1)',
          15: 'rgba(255, 255, 255, 0.15)',
          20: 'rgba(255, 255, 255, 0.2)',
          30: 'rgba(255, 255, 255, 0.3)',
          40: 'rgba(255, 255, 255, 0.4)',
          60: 'rgba(255, 255, 255, 0.6)',
          87: 'rgba(255, 255, 255, 0.87)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FFFFFF 0%, #000000 100%)',
        'gradient-gold': 'linear-gradient(135deg, #FFFFFF 0%, #E5E5E5 100%)',
        'gradient-blue': 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
        'gradient-purple': 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
        'gradient-teal': 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)',
        'gradient-pink': 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)',
        'gradient-mesh': 'radial-gradient(at 0% 0%, rgba(255, 255, 255, 0.03) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(255, 255, 255, 0.03) 0px, transparent 50%)',
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3), 0 0 40px rgba(59, 130, 246, 0.1)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1)',
        'glow-gold': '0 0 20px rgba(255, 184, 77, 0.3), 0 0 40px rgba(255, 184, 77, 0.1)',
        'glow-teal': '0 0 20px rgba(20, 184, 166, 0.3), 0 0 40px rgba(20, 184, 166, 0.1)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.25), 0 0 1px rgba(255, 255, 255, 0.1)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.35), 0 0 1px rgba(255, 255, 255, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { filter: 'brightness(1) saturate(1)' },
          '100%': { filter: 'brightness(1.1) saturate(1.2)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

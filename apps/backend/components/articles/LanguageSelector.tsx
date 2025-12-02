'use client';

const LANGUAGES = [
  { code: 'ENGLISH', label: 'English' },
  { code: 'HINDI', label: 'Hindi' },
  { code: 'MARATHI', label: 'Marathi' },
  { code: 'BENGALI', label: 'Bengali' },
  { code: 'GUJARATI', label: 'Gujarati' },
];

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onLanguageToggle: (code: string) => void;
  isDisabled: boolean;
}

export function LanguageSelector({
  selectedLanguages,
  onLanguageToggle,
  isDisabled,
}: LanguageSelectorProps) {
  const handleLanguageToggle = (code: string) => {
    // Don't allow deselecting if it's the last one
    if (selectedLanguages.includes(code) && selectedLanguages.length === 1) {
      return;
    }
    onLanguageToggle(code);
  };

  return (
    <div>
      <label className="block text-text-secondary text-sm font-medium mb-3">
        Select Languages
      </label>
      <div className="grid grid-cols-2 gap-3">
        {LANGUAGES.map((lang) => (
          <label
            key={lang.code}
            className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
              selectedLanguages.includes(lang.code)
                ? 'bg-blue-light border-2 border-blue-accent'
                : 'bg-white-10 border-2 border-transparent hover:bg-white-20'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedLanguages.includes(lang.code)}
              onChange={() => handleLanguageToggle(lang.code)}
              className="w-5 h-5 rounded border-white-40 bg-transparent checked:bg-blue-accent"
              disabled={isDisabled}
            />
            <span className="text-text-primary font-medium">{lang.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

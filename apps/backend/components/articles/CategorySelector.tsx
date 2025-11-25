'use client';

const CATEGORIES = [
  { value: 'EVERGREEN', label: 'Evergreen', description: 'Financial basics, foundational knowledge' },
  { value: 'PERIODIC_UPDATES', label: 'Periodic Updates', description: 'Regular scheduled updates' },
  { value: 'MARKET_UPDATES', label: 'Market Updates', description: 'Real-time market changes' },
];

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isDisabled: boolean;
}

export function CategorySelector({
  selectedCategory,
  onCategoryChange,
  isDisabled,
}: CategorySelectorProps) {
  return (
    <div>
      <label className="block text-text-secondary text-sm font-medium mb-3">
        Content Category
      </label>
      <div className="space-y-2">
        {CATEGORIES.map((cat) => (
          <label
            key={cat.value}
            className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
              selectedCategory === cat.value
                ? 'bg-gold-light border-2 border-gold'
                : 'bg-white-10 border-2 border-transparent hover:bg-white-20'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input
              type="radio"
              name="category"
              value={cat.value}
              checked={selectedCategory === cat.value}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-5 h-5 mt-0.5 rounded-full border-white-40 bg-transparent checked:bg-gold"
              disabled={isDisabled}
            />
            <div className="flex-1">
              <div className="text-text-primary font-medium">{cat.label}</div>
              <div className="text-sm text-text-muted">{cat.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

// Multi-select props
interface MultiSelectProps {
  singleSelect?: false;
  value: string[];
  onChange: (value: string[]) => void;
}

// Single-select props
interface SingleSelectProps {
  singleSelect: true;
  value: string;
  onChange: (value: string) => void;
}

type FilterDropdownProps = {
  label: string;
  options: FilterOption[];
  placeholder?: string;
  maxVisibleOptions?: number; // Max options before scroll, defaults to 8
} & (MultiSelectProps | SingleSelectProps);

export function FilterDropdown(props: FilterDropdownProps) {
  const { label, options, placeholder, singleSelect, maxVisibleOptions = 8 } = props;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize value to array for internal logic
  const valueArray = singleSelect ? (props.value ? [props.value] : []) : props.value;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleOptionClick = (optionValue: string) => {
    if (singleSelect) {
      (props as SingleSelectProps).onChange(optionValue);
      setIsOpen(false);
    } else {
      const multiProps = props as MultiSelectProps;
      if (multiProps.value.includes(optionValue)) {
        multiProps.onChange(multiProps.value.filter((v) => v !== optionValue));
      } else {
        multiProps.onChange([...multiProps.value, optionValue]);
      }
    }
  };

  const handleClearSelection = () => {
    if (!singleSelect) {
      (props as MultiSelectProps).onChange([]);
    }
  };

  const getButtonLabel = () => {
    if (valueArray.length === 0) {
      return placeholder || label;
    }
    if (valueArray.length === 1) {
      const selected = options.find((o) => o.value === valueArray[0]);
      return selected?.label || valueArray[0];
    }
    return `${label} (${valueArray.length})`;
  };

  const hasSelection = valueArray.length > 0;

  // Calculate max height based on option count (approx 36px per option + clear button if needed)
  const optionHeight = 36;
  const clearButtonHeight = !singleSelect && hasSelection ? optionHeight + 1 : 0; // +1 for border
  const maxHeight = maxVisibleOptions * optionHeight + clearButtonHeight;
  const needsScroll = options.length > maxVisibleOptions;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[120px] justify-between ${
          hasSelection
            ? 'bg-blue-accent/20 text-blue-accent border border-blue-accent/30'
            : 'bg-white-10 text-text-secondary hover:bg-white-20 border border-transparent'
        }`}
      >
        <span>{getButtonLabel()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute z-20 w-full min-w-[180px] mt-1 bg-black/90 backdrop-blur-xl border border-white-15 rounded-lg shadow-lg overflow-hidden"
          style={{ maxHeight: needsScroll ? `${maxHeight}px` : undefined }}
        >
          {/* Clear selection button for multi-select when items are selected */}
          {!singleSelect && hasSelection && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-2 text-text-muted hover:bg-white-10 border-b border-white-10"
            >
              <X className="w-3 h-3" />
              <span>Clear selection</span>
            </button>
          )}

          {/* Scrollable options container */}
          <div className={needsScroll ? 'overflow-y-auto' : ''} style={{ maxHeight: needsScroll ? `${maxVisibleOptions * optionHeight}px` : undefined }}>
            {options.map((option) => {
              const isSelected = valueArray.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors flex items-center gap-3 ${
                    isSelected ? 'bg-blue-accent/20 text-blue-accent' : 'text-text-primary hover:bg-white-10'
                  }`}
                >
                  {!singleSelect && (
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-blue-accent border-blue-accent' : 'border-white-30'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  )}
                  {option.icon && <span>{option.icon}</span>}
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

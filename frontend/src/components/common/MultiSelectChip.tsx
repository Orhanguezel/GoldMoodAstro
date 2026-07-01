'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useUiSection } from '@/i18n';

interface MultiSelectChipProps {
  label?: string;
  selected: string[];
  options?: Array<string | { value: string; label: string }>;
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  error?: string;
  maxItems?: number;
}

export default function MultiSelectChip({
  label,
  selected,
  options = [],
  onSelectionChange,
  placeholder,
  error,
  maxItems,
}: MultiSelectChipProps) {
  const { ui } = useUiSection('ui_misc' as any);
  const resolvedPlaceholder = placeholder ?? ui('ui_misc_multiselect_placeholder', 'Type to add and press Enter...');
  const [inputValue, setInputValue] = useState('');
  const normalizedOptions = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  );
  const optionLabelByValue = new Map(normalizedOptions.map((option) => [option.value, option.label]));

  const handleAdd = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (selected.includes(trimmed)) {
      setInputValue('');
      return;
    }
    if (maxItems && selected.length >= maxItems) return;

    onSelectionChange([...selected, trimmed]);
    setInputValue('');
  };

  const handleRemove = (value: string) => {
    onSelectionChange(selected.filter((s) => s !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd(inputValue);
    } else if (e.key === ',' || e.key === ';') {
      e.preventDefault();
      handleAdd(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
      handleRemove(selected[selected.length - 1]);
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--gm-gold-dim)] ml-1">
          {label}
        </label>
      )}
      
      <div 
        className={`min-h-11 w-full bg-[var(--gm-bg-deep)] border rounded-xl p-2 flex flex-wrap gap-2 transition-all ${
          error ? 'border-[var(--gm-error)]/60' : 'border-[var(--gm-border-soft)] focus-within:border-[var(--gm-gold)]/40'
        }`}
      >
        {selected.map((item) => (
          <div 
            key={item}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gm-gold)]/10 border border-[var(--gm-gold)]/30 text-[12px] text-[var(--gm-text)]"
          >
            {optionLabelByValue.get(item) ?? item}
            <button
              type="button"
              onClick={() => handleRemove(item)}
              className="text-[var(--gm-muted)] hover:text-[var(--gm-error)] transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => handleAdd(inputValue)}
          placeholder={selected.length === 0 ? resolvedPlaceholder : ''}
          className="flex-1 bg-transparent border-0 outline-none text-sm text-[var(--gm-text)] min-w-[120px]"
        />
      </div>

      {error && <p className="text-[9px] text-[var(--gm-error)] font-bold uppercase tracking-widest ml-1">{error}</p>}
      
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {normalizedOptions.filter((opt) => !selected.includes(opt.value)).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleAdd(opt.value)}
              className="px-2 py-0.5 rounded-full border border-[var(--gm-border-soft)] text-[10px] text-[var(--gm-muted)] hover:border-[var(--gm-gold)]/40 hover:text-[var(--gm-gold)] transition-all"
            >
              + {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

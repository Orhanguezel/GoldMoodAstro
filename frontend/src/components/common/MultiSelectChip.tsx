'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface MultiSelectChipProps {
  label?: string;
  selected: string[];
  options?: string[]; // Optional predefined options
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
  placeholder = 'Eklemek için yazın ve Enter\'a basın...',
  error,
  maxItems,
}: MultiSelectChipProps) {
  const [inputValue, setInputValue] = useState('');

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
          error ? 'border-rose-500/60' : 'border-[var(--gm-border-soft)] focus-within:border-[var(--gm-gold)]/40'
        }`}
      >
        {selected.map((item) => (
          <div 
            key={item}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gm-gold)]/10 border border-[var(--gm-gold)]/30 text-[12px] text-[var(--gm-text)]"
          >
            {item}
            <button
              type="button"
              onClick={() => handleRemove(item)}
              className="text-[var(--gm-muted)] hover:text-rose-400 transition-colors"
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
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 bg-transparent border-0 outline-none text-sm text-[var(--gm-text)] min-w-[120px]"
        />
      </div>

      {error && <p className="text-[9px] text-rose-400 font-bold uppercase tracking-widest ml-1">{error}</p>}
      
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {options.filter(opt => !selected.includes(opt)).map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => handleAdd(opt)}
              className="px-2 py-0.5 rounded-full border border-[var(--gm-border-soft)] text-[10px] text-[var(--gm-muted)] hover:border-[var(--gm-gold)]/40 hover:text-[var(--gm-gold)] transition-all"
            >
              + {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

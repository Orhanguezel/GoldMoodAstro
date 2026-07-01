// =============================================================
// FILE: src/components/ui/RichTextEditorBasic.tsx
// goldmoodastro - Basic Rich Text Editor (HTML based + toolbar)
// =============================================================

import React, { useEffect, useRef } from 'react';
import { useUiSection } from '@/i18n';

export type RichTextEditorBasicProps = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
};

export const RichTextEditorBasic: React.FC<RichTextEditorBasicProps> = ({
  value,
  onChange,
  disabled,
  minHeight = 220,
  maxHeight = 600,
}) => {
  const { ui } = useUiSection('ui_editor');
  const ref = useRef<HTMLDivElement | null>(null);

  // Keep editor content in sync with external value changes.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const next = value || '';
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (disabled) return;
    onChange(e.currentTarget.innerHTML);
  };

  const focusEditor = () => {
    if (ref.current) {
      ref.current.focus();
    }
  };

  const exec = (command: string, value?: string) => {
    if (disabled) return;
    // Prevent focus loss from mouse down toolbar actions.
    focusEditor();
    try {
      document.execCommand(command, false, value);
    } catch {
      // Ignore unsupported commands in older browsers.
    }
  };

  const handleToolbarMouseDown = (
    e: React.MouseEvent<HTMLButtonElement>,
    command: string,
    value?: string,
  ) => {
    e.preventDefault();
    exec(command, value);
  };

  return (
    <div className="border rounded">
      {/* Toolbar */}
      <div className="border-bottom bg-light px-2 py-1 d-flex flex-wrap gap-1">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'bold')}
          title={ui('ui_editor_basic_btn_bold', 'Bold (Ctrl+B)')}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'italic')}
          title={ui('ui_editor_basic_btn_italic', 'Italic (Ctrl+I)')}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'underline')}
          title={ui('ui_editor_basic_btn_underline', 'Underline (Ctrl+U)')}
        >
          <span style={{ textDecoration: 'underline' }}>U</span>
        </button>

        <span className="vr mx-1" />

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'insertUnorderedList')}
          title={ui('ui_editor_btn_bullet_list', 'Bulleted list')}
        >
          ••
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'insertOrderedList')}
          title={ui('ui_editor_btn_ordered_list', 'Numbered list')}
        >
          1.
        </button>

        <span className="vr mx-1" />

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', 'p')}
          title={ui('ui_editor_btn_paragraph', 'Paragraf')}
        >
          P
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', 'h2')}
          title={ui('ui_editor_basic_btn_heading1', 'Heading 1')}
        >
          H1
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', 'h3')}
          title={ui('ui_editor_basic_btn_heading2', 'Heading 2')}
        >
          H2
        </button>

        <span className="vr mx-1" />

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onMouseDown={(e) => handleToolbarMouseDown(e, 'removeFormat')}
          title={ui('ui_editor_btn_clear_format', 'Clear formatting')}
        >
          {ui('ui_editor_basic_btn_clear_label', 'Clear')}
        </button>
      </div>

      {/* Editor area */}
      <div
        ref={ref}
        className="px-2 py-2"
        style={{
          minHeight,
          maxHeight,
          overflowY: 'auto',
          backgroundColor: disabled ? 'var(--gm-surface-high)' : undefined,
        }}
        contentEditable={!disabled}
        onInput={handleInput}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
      />
    </div>
  );
};

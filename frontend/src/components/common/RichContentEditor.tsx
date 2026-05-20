// =============================================================
// FILE: src/components/common/RichContentEditor.tsx
// goldmoodastro – Zengin HTML Editörü + Canlı Önizleme (depsiz)
//  - contentEditable tabanlı WYSIWYG
//  - Tablo ve Resim ekleme butonları
//  - Kaynak (HTML) sekmesi
//  - Önizleme anlık güncellenir
//  - Eski {"html":"..."} kayıtlarını otomatik düz HTML'e çevirir
//
// FIXES (FINAL):
//  - ✅ H2/H3 buton label/arg düzeltildi
//  - ✅ formatBlock arg: <p>, <h2>, <h3>
//  - ✅ insertHtmlAtCursor caret davranışı iyileştirildi
// =============================================================

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Code2,
  Eraser,
  Eye,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Table2,
  Underline,
} from 'lucide-react';

export type RichContentEditorProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  height?: string;
  /**
   * Opsiyonel image upload hook'u.
   * Storage modülüne upload edip public URL döndürmek için kullanabilirsin.
   */
  onUploadImage?: (file: File) => Promise<string>;
  showHelp?: boolean;
  showPreview?: boolean;
};

type ActiveTab = 'visual' | 'source';

const DEFAULT_HEIGHT = '260px';

function normalizeLegacyHtmlValue(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed) as any;
      if (parsed && typeof parsed.html === 'string') return parsed.html;
    } catch {
      // parse edilemezse olduğu gibi bırak
    }
  }
  return raw;
}

function insertHtmlAtCursor(html: string) {
  if (typeof window === 'undefined') return;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  range.deleteContents();

  const temp = document.createElement('div');
  temp.innerHTML = html;

  const frag = document.createDocumentFragment();
  let lastNode: ChildNode | null = null;

  while (temp.firstChild) {
    lastNode = temp.firstChild;
    frag.appendChild(temp.firstChild);
  }

  range.insertNode(frag);

  // caret: inserted content sonrası
  if (lastNode) {
    const after = document.createRange();
    after.setStartAfter(lastNode);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }
}

const RichContentEditor: React.FC<RichContentEditorProps> = ({
  label = 'İçerik',
  value,
  onChange,
  disabled = false,
  height = DEFAULT_HEIGHT,
  onUploadImage,
  showHelp = true,
  showPreview = true,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolbarButtonClass =
    'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg)]/60 px-2.5 text-[11px] font-bold text-[var(--gm-text-dim)] transition-all hover:border-[var(--gm-gold)]/45 hover:bg-[var(--gm-gold)]/10 hover:text-[var(--gm-gold)] disabled:pointer-events-none disabled:opacity-35';
  const toolbarSeparatorClass = 'mx-1 h-9 w-px bg-[var(--gm-border-soft)]';

  const [activeTab, setActiveTab] = useState<ActiveTab>('visual');
  const [html, setHtml] = useState<string>(normalizeLegacyHtmlValue(value));

  // dış value sync + legacy normalize
  useEffect(() => {
    const normalized = normalizeLegacyHtmlValue(value);
    setHtml(normalized);

    if (editorRef.current && activeTab === 'visual') {
      if (editorRef.current.innerHTML !== normalized) {
        editorRef.current.innerHTML = normalized || '';
      }
    }

    // legacy json -> plain html normalize
    if (
      typeof value === 'string' &&
      value.trim().startsWith('{') &&
      value.trim().endsWith('}') &&
      normalized !== value
    ) {
      onChange(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // tab switch sync
  useEffect(() => {
    if (activeTab === 'visual' && editorRef.current) {
      if (editorRef.current.innerHTML !== html) editorRef.current.innerHTML = html || '';
    }
  }, [activeTab, html]);

  const propagateChange = (next: string) => {
    setHtml(next);
    onChange(next);
  };

  const handleVisualInput = (e: React.FormEvent<HTMLDivElement>) => {
    if (disabled) return;
    const next = e.currentTarget.innerHTML;
    propagateChange(next);
  };

  const focusEditor = () => editorRef.current?.focus();

  const exec = (command: string, valueArg?: string) => {
    if (disabled) return;
    if (typeof document === 'undefined') return;

    focusEditor();
    try {
      document.execCommand(command, false, valueArg);
      if (editorRef.current) propagateChange(editorRef.current.innerHTML);
    } catch {
      // sessiz geç
    }
  };

  const handleToolbarMouseDown = (
    e: React.MouseEvent<HTMLButtonElement>,
    command: string,
    valueArg?: string,
  ) => {
    e.preventDefault();

    if (disabled) return;
    if (activeTab !== 'visual') return;

    if (command === 'insertTable') {
      focusEditor();
      const tableHtml =
        '<table class="table table-bordered"><thead><tr><th>Başlık 1</th><th>Başlık 2</th></tr></thead><tbody><tr><td>Hücre 1</td><td>Hücre 2</td></tr></tbody></table><p></p>';
      insertHtmlAtCursor(tableHtml);
      if (editorRef.current) propagateChange(editorRef.current.innerHTML);
      return;
    }

    if (command === 'insertImage') {
      // upload varsa file picker
      if (onUploadImage && fileInputRef.current) {
        fileInputRef.current.click();
        return;
      }

      // yoksa URL prompt
      if (typeof window !== 'undefined') {
        const url = window.prompt("Resim URL'si girin:");
        if (url && url.trim()) {
          const safeUrl = url.trim();
          const imgHtml = `<img src="${safeUrl}" alt="" class="img-fluid" style="max-width: 100%; height: auto;" />`;
          focusEditor();
          insertHtmlAtCursor(imgHtml);
          if (editorRef.current) propagateChange(editorRef.current.innerHTML);
        }
      }
      return;
    }

    if (command === 'formatBlock') {
      exec(command, valueArg);
      return;
    }

    exec(command, valueArg);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUploadImage) return;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const url = await onUploadImage(file);
      if (!url) return;

      const safeAlt = file.name.replace(/"/g, '&quot;');
      const imgHtml = `<img src="${url}" alt="${safeAlt}" class="img-fluid" style="max-width: 100%; height: auto;" />`;

      focusEditor();
      insertHtmlAtCursor(imgHtml);
      if (editorRef.current) propagateChange(editorRef.current.innerHTML);
    } catch {
      // parent isterse toast basar
    }
  };

  return (
    <div className="mt-3">
      {label && <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[var(--gm-text-dim)]">{label}</label>}

      {/* Tabs */}
      <div className="mb-3 inline-flex rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/45 p-1 text-sm shadow-[var(--gm-shadow-soft)]">
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'visual'
              ? 'bg-[var(--gm-bg)] text-[var(--gm-gold)] shadow-sm'
              : 'text-[var(--gm-text-dim)] hover:text-[var(--gm-text)]'
          }`}
          onClick={() => setActiveTab('visual')}
          disabled={disabled}
        >
          <Eye className="size-3.5" />
          Görsel editör
        </button>
        <button
          type="button"
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'source'
              ? 'bg-[var(--gm-bg)] text-[var(--gm-gold)] shadow-sm'
              : 'text-[var(--gm-text-dim)] hover:text-[var(--gm-text)]'
          }`}
          onClick={() => setActiveTab('source')}
          disabled={disabled}
        >
          <Code2 className="size-3.5" />
          Kaynak (HTML)
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/55 shadow-[var(--gm-shadow-soft)]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]/35 px-4 py-3 text-sm">
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'bold')}
            disabled={disabled || activeTab !== 'visual'}
            title="Kalın"
          >
            <Bold className="size-4" />
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'italic')}
            disabled={disabled || activeTab !== 'visual'}
            title="İtalik"
          >
            <Italic className="size-4" />
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'underline')}
            disabled={disabled || activeTab !== 'visual'}
            title="Altı çizili"
          >
            <Underline className="size-4" />
          </button>

          <span className={toolbarSeparatorClass} />

          {/* formatBlock */}
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', '<p>')}
            disabled={disabled || activeTab !== 'visual'}
            title="Paragraf"
          >
            <Pilcrow className="size-4" />
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', '<h2>')}
            disabled={disabled || activeTab !== 'visual'}
            title="Başlık (H2)"
          >
            <Heading2 className="size-4" />
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'formatBlock', '<h3>')}
            disabled={disabled || activeTab !== 'visual'}
            title="Alt başlık (H3)"
          >
            <Heading3 className="size-4" />
          </button>

          <span className={toolbarSeparatorClass} />

          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertUnorderedList')}
            disabled={disabled || activeTab !== 'visual'}
            title="Madde işaretli liste"
          >
            <List className="size-4" />
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertOrderedList')}
            disabled={disabled || activeTab !== 'visual'}
            title="Numaralı liste"
          >
            <ListOrdered className="size-4" />
          </button>

          <span className={toolbarSeparatorClass} />

          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertTable')}
            disabled={disabled || activeTab !== 'visual'}
            title="Tablo ekle"
          >
            <Table2 className="size-4" />
          </button>

          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'insertImage')}
            disabled={disabled || activeTab !== 'visual'}
            title={onUploadImage ? 'Resim yükle ve ekle' : "Resim URL'si ile ekle"}
          >
            <ImageIcon className="size-4" />
          </button>

          <span className={toolbarSeparatorClass} />

          <button
            type="button"
            className={toolbarButtonClass}
            onMouseDown={(e) => handleToolbarMouseDown(e, 'removeFormat')}
            disabled={disabled || activeTab !== 'visual'}
            title="Biçimlendirmeyi temizle"
          >
            <Eraser className="size-4" />
          </button>

          {onUploadImage && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
            />
          )}
        </div>

        {/* Editor */}
        {activeTab === 'visual' ? (
          <div
            ref={editorRef}
            className="prose prose-sm max-w-none px-5 py-5 text-[var(--gm-text)] outline-none prose-headings:font-serif prose-headings:text-[var(--gm-text)] prose-p:my-3 prose-p:leading-7 prose-p:text-[var(--gm-text)] prose-li:text-[var(--gm-text)] prose-strong:text-[var(--gm-gold)] prose-a:text-[var(--gm-gold)]"
            style={{
              minHeight: height,
              maxHeight: '600px',
              overflowY: 'auto',
              backgroundColor: disabled ? 'var(--gm-surface-high)' : 'color-mix(in srgb, var(--gm-bg) 82%, transparent)',
              cursor: disabled ? 'not-allowed' : 'text',
            }}
            contentEditable={!disabled}
            onInput={handleVisualInput}
            suppressContentEditableWarning
          />
        ) : (
          <textarea
            className="w-full border-0 bg-[var(--gm-bg)]/80 px-5 py-5 font-mono text-sm leading-7 text-[var(--gm-text)] outline-none placeholder:text-[var(--gm-muted)] focus:outline-none"
            style={{ height, maxHeight: '600px', resize: 'vertical' }}
            value={html}
            onChange={(e) => propagateChange(e.target.value)}
            disabled={disabled}
            placeholder="<p>HTML içeriği buraya yaz...</p>"
          />
        )}
      </div>

      {showHelp && (
        <div className="mt-3 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/35 px-4 py-3 text-xs leading-6 text-[var(--gm-text-dim)]">
          Görsel editörde başlık, liste, tablo ve görsel ekleyebilir; Kaynak sekmesinde HTML'i ince ayarla düzenleyebilirsin.
        </div>
      )}

      {/* Live Preview */}
      {showPreview && (
      <div className="mt-4">
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gm-gold-dim)]">Önizleme</div>
        <div
          className="rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-bg)]/75 p-4 text-[var(--gm-text)]"
          style={{
            minHeight: '120px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {html && html.trim() ? (
            <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-[var(--gm-text)] prose-p:text-[var(--gm-text-dim)] prose-li:text-[var(--gm-text-dim)] prose-strong:text-[var(--gm-gold)]" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <p className="mb-0 text-xs italic text-[var(--gm-muted)]">
              Henüz içerik yok. Yazdıkça burada anlık olarak gözükecek.
            </p>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default RichContentEditor;

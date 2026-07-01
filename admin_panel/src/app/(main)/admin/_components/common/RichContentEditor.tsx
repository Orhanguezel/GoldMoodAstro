'use client';

// =============================================================
// FILE: src/components/common/RichContentEditor.tsx
// FINAL — Rich Content Editor (shadcn)
// - No Bootstrap classes
// - Tabs: Visual / HTML Source
// - Toolbar buttons (shadcn Button)
// - Live preview
// - Legacy {"html":"..."} -> plain html normalize
// =============================================================

import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Eraser,
  Heading2,
  Heading3,
  Type,
  Table2,
  Image as ImageIcon,
  Code2,
  Eye,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAdminT } from './useAdminT';

export type RichContentEditorProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  height?: string;
  onUploadImage?: (file: File) => Promise<string>;
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
      // ignore
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

  if (lastNode) {
    const after = document.createRange();
    after.setStartAfter(lastNode);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }
}

const RichContentEditor: React.FC<RichContentEditorProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  height = DEFAULT_HEIGHT,
  onUploadImage,
}) => {
  const t = useAdminT('admin.common');
  const resolvedLabel = label ?? t('editor.content');
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('visual');
  const [html, setHtml] = useState<string>(normalizeLegacyHtmlValue(value));

  useEffect(() => {
    const normalized = normalizeLegacyHtmlValue(value);
    setHtml(normalized);

    if (editorRef.current && activeTab === 'visual') {
      if (editorRef.current.innerHTML !== normalized) {
        editorRef.current.innerHTML = normalized || '';
      }
    }

    // legacy normalize
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
    propagateChange(e.currentTarget.innerHTML);
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
      // ignore
    }
  };

  const insertTable = () => {
    focusEditor();
    // minimal theme-friendly table (no bootstrap)
    const tableHtml = `
      <table style="width:100%; border-collapse:collapse;" border="1">
        <thead>
          <tr>
            <th style="padding:8px; text-align:left;">${t('editor.tableHeader1')}</th>
            <th style="padding:8px; text-align:left;">${t('editor.tableHeader2')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:8px;">${t('editor.tableCell1')}</td>
            <td style="padding:8px;">${t('editor.tableCell2')}</td>
          </tr>
        </tbody>
      </table>
      <p></p>
    `.trim();
    insertHtmlAtCursor(tableHtml);
    if (editorRef.current) propagateChange(editorRef.current.innerHTML);
  };

  const insertImage = async () => {
    if (disabled) return;

    if (onUploadImage && fileInputRef.current) {
      fileInputRef.current.click();
      return;
    }

    if (typeof window !== 'undefined') {
      const url = window.prompt(t('editor.imageUrlPrompt'));
      if (url && url.trim()) {
        const safeUrl = url.trim();
        const imgHtml = `<img src="${safeUrl}" alt="" style="max-width:100%; height:auto;" />`;
        focusEditor();
        insertHtmlAtCursor(imgHtml);
        if (editorRef.current) propagateChange(editorRef.current.innerHTML);
      }
    }
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
      const imgHtml = `<img src="${url}" alt="${safeAlt}" style="max-width:100%; height:auto;" />`;

      focusEditor();
      insertHtmlAtCursor(imgHtml);
      if (editorRef.current) propagateChange(editorRef.current.innerHTML);
    } catch {
      // parent isterse toast basar
    }
  };

  const ToolbarButton = (props: React.ComponentProps<typeof Button>) => (
    <Button type="button" variant="outline" size="sm" {...props} />
  );

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm">{resolvedLabel}</Label>
          <Badge variant="secondary" className="gap-1">
            <Eye className="size-3.5" />
            {t('editor.livePreview')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          <TabsList className="w-fit">
            <TabsTrigger value="visual" disabled={disabled}>
              {t('editor.visualEditor')}
            </TabsTrigger>
            <TabsTrigger value="source" disabled={disabled}>
              {t('editor.sourceHtml')}
            </TabsTrigger>
          </TabsList>

          <div className="mt-3 rounded-md border">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), exec('bold'))}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.bold')}
              >
                <Bold className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), exec('italic'))}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.italic')}
              >
                <Italic className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), exec('underline'))}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.underline')}
              >
                <Underline className="size-4" />
              </ToolbarButton>

              <span className="mx-1 h-5 w-px bg-border" />

              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), exec('formatBlock', '<p>'))}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.paragraph')}
              >
                <Type className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), exec('formatBlock', '<h2>'))}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.headingH2')}
              >
                <Heading2 className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), exec('formatBlock', '<h3>'))}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.headingH3')}
              >
                <Heading3 className="size-4" />
              </ToolbarButton>

              <span className="mx-1 h-5 w-px bg-border" />

              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), exec('insertUnorderedList'))}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.bulletList')}
              >
                <List className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), exec('insertOrderedList'))}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.numberedList')}
              >
                <ListOrdered className="size-4" />
              </ToolbarButton>

              <span className="mx-1 h-5 w-px bg-border" />

              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), insertTable())}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.insertTable')}
              >
                <Table2 className="size-4" />
              </ToolbarButton>

              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), void insertImage())}
                disabled={disabled || activeTab !== 'visual'}
                title={onUploadImage ? t('editor.uploadImage') : t('editor.insertImageUrl')}
              >
                <ImageIcon className="size-4" />
              </ToolbarButton>

              <span className="mx-1 h-5 w-px bg-border" />

              <ToolbarButton
                onMouseDown={(e) => (e.preventDefault(), exec('removeFormat'))}
                disabled={disabled || activeTab !== 'visual'}
                title={t('editor.clearFormatting')}
              >
                <Eraser className="size-4" />
              </ToolbarButton>

              {onUploadImage ? (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              ) : null}
            </div>

            <TabsContent value="visual" className="m-0">
              <div
                ref={editorRef}
                className={cn(
                  'px-3 py-2 text-sm outline-none',
                  disabled ? 'cursor-not-allowed bg-muted/20' : 'bg-background',
                )}
                style={{
                  minHeight: height,
                  maxHeight: '600px',
                  overflowY: 'auto',
                }}
                contentEditable={!disabled}
                onInput={handleVisualInput}
                suppressContentEditableWarning
              />
            </TabsContent>

            <TabsContent value="source" className="m-0">
              <div className="p-2">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Code2 className="size-4" />
                  {t('editor.htmlSource')}
                </div>
                <Textarea
                  value={html}
                  onChange={(e) => propagateChange(e.target.value)}
                  disabled={disabled}
                  className="font-mono text-xs leading-5"
                  style={{ height, maxHeight: '600px', resize: 'vertical' }}
                  placeholder={t('editor.sourcePlaceholder')}
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">{t('editor.preview')}</div>
          <div className="rounded-md border bg-background p-3">
            {html && html.trim() ? (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('editor.empty')}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {t('editor.execNotePrefix')} <code>execCommand</code> {t('editor.execNoteSuffix')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RichContentEditor;

// =============================================================
// FILE: src/components/common/RichTextEditor.tsx
// goldmoodastro – Tiptap based WYSIWYG editor with image upload.
//  - StarterKit + Image + Link + Placeholder
//  - Toolbar: Bold, Italic, H2, H3, Bullet/Ordered List, Blockquote,
//    Link, Image upload, Undo, Redo
//  - Image upload uses useUploadToBucketMutation (storage_public)
//  - Output: HTML (editor.getHTML())
// =============================================================

'use client';

import React, { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold as BoldIcon,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic as ItalicIcon,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';

export type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  bucket?: string;
  folder?: string;
  className?: string;
  minHeight?: string;
};

function readUploadError(err: unknown): string {
  const data = (err as { data?: unknown })?.data;
  const status = (err as { status?: unknown })?.status;
  const payload = typeof data === 'object' && data !== null ? (data as Record<string, any>) : {};
  const error =
    typeof payload.error === 'object' && payload.error !== null
      ? (payload.error as Record<string, any>)
      : payload;
  const code = String(error.code || error.message || payload.message || '');

  if (status === 401 || status === 403) {
    return 'Oturum dogrulanamadi. Lutfen tekrar giris yapip yeniden deneyin.';
  }
  if (code === 'storage_not_configured') {
    return 'Dosya yukleme servisi su anda yapilandirilmamis. Destek ekibiyle iletisime gecin.';
  }
  if (code === 'multipart_parse_error' || code === 'invalid_multipart_body') {
    return 'Resim dosyasi okunamadi. Farkli bir dosya ile tekrar deneyin.';
  }
  return 'Resim yuklenemedi. Dosya boyutunu ve formatini kontrol edip tekrar deneyin.';
}

const TOOLBAR_BTN =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-(--gm-border-soft) bg-(--gm-bg)/60 px-2 text-(--gm-text-dim) transition-colors hover:border-(--gm-gold)/45 hover:bg-(--gm-gold)/10 hover:text-(--gm-gold) disabled:pointer-events-none disabled:opacity-40';
const TOOLBAR_BTN_ACTIVE =
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-(--gm-gold)/55 bg-(--gm-gold)/15 px-2 text-(--gm-gold)';
const TOOLBAR_SEP = 'mx-1 h-6 w-px bg-(--gm-border-soft)';

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  bucket = 'uploads',
  folder = 'editor',
  className,
  minHeight = '260px',
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [upload, { isLoading: isUploading }] = useUploadToBucketMutation();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl my-3 max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || '',
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none px-5 py-5 text-(--gm-text) outline-none prose-headings:font-serif prose-headings:text-(--gm-text) prose-p:my-3 prose-p:leading-7 prose-p:text-(--gm-text) prose-li:text-(--gm-text) prose-strong:text-(--gm-gold) prose-a:text-(--gm-gold) prose-blockquote:border-l-4 prose-blockquote:border-(--gm-gold)/45 prose-blockquote:text-(--gm-text-dim)',
      },
    },
    onUpdate({ editor: e }) {
      onChange(e.getHTML());
    },
  });

  // Sync external value when it changes (e.g. switching between drafts).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || '') === current) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
  }, [value, editor]);

  if (!editor) {
    return (
      <div
        className={[
          'rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep)/40 p-5 text-sm text-(--gm-text-dim)',
          className || '',
        ].join(' ')}
        style={{ minHeight }}
      >
        ...
      </div>
    );
  }

  const triggerImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Lutfen bir resim dosyasi secin.');
      return;
    }
    try {
      const res = await upload({ bucket, files: file, path: folder, upsert: true }).unwrap();
      const item = res.items?.[0];
      const url = item?.url || (item?.path ? `/uploads/${item.path}` : '');
      if (!url) throw new Error('upload_url_missing');
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      console.error('[RichTextEditor] image upload failed', err);
      toast.error(readUploadError(err));
    }
  };

  const promptLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined;
    const input = typeof window !== 'undefined' ? window.prompt('Bag URL', previous || 'https://') : null;
    if (input === null) return;
    const trimmed = input.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  };

  const Btn = ({
    onClick,
    active,
    disabled,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={active ? TOOLBAR_BTN_ACTIVE : TOOLBAR_BTN}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={!!active}
    >
      {children}
    </button>
  );

  return (
    <div
      className={[
        'overflow-hidden rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep)/40 shadow-(--gm-shadow-soft)',
        className || '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-1.5 border-b border-(--gm-border-soft) bg-(--gm-bg-deep)/55 px-3 py-2">
        <Btn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Kalin"
        >
          <BoldIcon className="h-4 w-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italik"
        >
          <ItalicIcon className="h-4 w-4" />
        </Btn>

        <span className={TOOLBAR_SEP} />

        <Btn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Baslik (H2)"
        >
          <Heading2 className="h-4 w-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Alt baslik (H3)"
        >
          <Heading3 className="h-4 w-4" />
        </Btn>

        <span className={TOOLBAR_SEP} />

        <Btn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Madde isaretli liste"
        >
          <ListIcon className="h-4 w-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Numarali liste"
        >
          <ListOrdered className="h-4 w-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Alinti"
        >
          <Quote className="h-4 w-4" />
        </Btn>

        <span className={TOOLBAR_SEP} />

        <Btn onClick={promptLink} active={editor.isActive('link')} title="Bag ekle/duzenle">
          <LinkIcon className="h-4 w-4" />
        </Btn>
        <Btn onClick={triggerImagePicker} disabled={isUploading} title="Resim yukle">
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Btn>

        <span className={TOOLBAR_SEP} />

        <Btn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Geri al"
        >
          <Undo2 className="h-4 w-4" />
        </Btn>
        <Btn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Yeniden yap"
        >
          <Redo2 className="h-4 w-4" />
        </Btn>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      <EditorContent editor={editor} style={{ minHeight }} />
    </div>
  );
}

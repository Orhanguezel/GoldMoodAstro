'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Edit3, ImagePlus, Loader2, Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  type CustomPageDto,
  extractApiError,
  safeStr,
} from '@/integrations/shared';
import {
  useCreateMyConsultantBlogPostMutation,
  useDeleteMyConsultantBlogPostMutation,
  useListMyConsultantBlogPostsQuery,
  useUpdateMyConsultantBlogPostMutation,
} from '@/integrations/rtk/private/consultant_self.endpoints';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';
import { useUiSection } from '@/i18n';
import RichTextEditor from '@/components/common/RichTextEditor';

type BlogForm = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  tags: string;
  featured_image: string;
  featured_image_alt: string;
};

const EMPTY_FORM: BlogForm = {
  title: '',
  slug: '',
  summary: '',
  content: '',
  tags: '',
  featured_image: '',
  featured_image_alt: '',
};

const SLUG_CHAR_MAP: Record<string, string> = {
  '\u0131': 'i',
  '\u011f': 'g',
  '\u00fc': 'u',
  '\u015f': 's',
  '\u00f6': 'o',
  '\u00e7': 'c',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\u0131\u011f\u00fc\u015f\u00f6\u00e7]/g, (c) => SLUG_CHAR_MAP[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toForm(post: CustomPageDto): BlogForm {
  return {
    id: post.id,
    title: safeStr(post.title),
    slug: safeStr(post.slug),
    summary: safeStr(post.summary),
    content: safeStr(post.content_html),
    tags: post.tags?.filter((tag) => !tag.startsWith('author_consultant:')).join(', ') || '',
    featured_image: safeStr(post.featured_image),
    featured_image_alt: safeStr(post.featured_image_alt),
  };
}

type BlogPanelProps = {
  locale: string;
  consultantId?: string;
};

export default function BlogPanel({ locale, consultantId }: BlogPanelProps) {
  const { ui } = useUiSection('ui_dashboard', locale as any);
  const [form, setForm] = useState<BlogForm | null>(null);
  const { data: posts = [], isLoading } = useListMyConsultantBlogPostsQuery({ locale });
  const [createPost, createState] = useCreateMyConsultantBlogPostMutation();
  const [updatePost, updateState] = useUpdateMyConsultantBlogPostMutation();
  const [deletePost, deleteState] = useDeleteMyConsultantBlogPostMutation();
  const [uploadCover, coverUploadState] = useUploadToBucketMutation();
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const editorFolder = useMemo(() => {
    const slug = form?.slug?.trim();
    if (consultantId) return slug ? `${consultantId}/${slug}` : consultantId;
    return slug || 'editor';
  }, [consultantId, form?.slug]);

  const busy = isLoading || createState.isLoading || updateState.isLoading || deleteState.isLoading;
  const sortedPosts = useMemo(() => [...posts].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))), [posts]);

  const patchForm = (patch: Partial<BlogForm>) => {
    setForm((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      if (patch.title !== undefined && !current.id && (!current.slug || current.slug === slugify(current.title))) {
        next.slug = slugify(patch.title);
      }
      return next;
    });
  };

  const save = async () => {
    if (!form) return;
    const title = form.title.trim();
    const slug = slugify(form.slug || form.title);
    if (!title || !slug) {
      toast.error(ui('ui_dashboard_blog_error_required', 'Title and slug are required'));
      return;
    }
    const payload = {
      locale,
      title,
      slug,
      summary: form.summary.trim() || null,
      content: form.content,
      tags: form.tags.trim() || null,
      featured_image: form.featured_image.trim() || null,
      featured_image_alt: form.featured_image_alt.trim() || null,
    };
    try {
      if (form.id) {
        await updatePost({ id: form.id, patch: payload }).unwrap();
        toast.success(ui('ui_dashboard_blog_draft_saved', 'Draft saved'));
      } else {
        await createPost(payload).unwrap();
        toast.success(ui('ui_dashboard_blog_draft_submitted', 'Draft sent for admin review'));
      }
      setForm(null);
    } catch (error) {
      toast.error(extractApiError(error, ui('ui_dashboard_blog_save_failed', 'Blog post could not be saved')));
    }
  };

  const handleCoverFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error(ui('ui_dashboard_blog_cover_invalid', 'Please choose an image file.'));
      return;
    }
    try {
      const res = await uploadCover({
        bucket: 'consultant_blog',
        files: file,
        path: `${editorFolder}/cover`,
        upsert: true,
      }).unwrap();
      const item = res.items?.[0];
      const url = item?.url || (item?.path ? `/uploads/${item.path}` : '');
      if (!url) throw new Error('upload_url_missing');
      patchForm({ featured_image: url });
      toast.success(ui('ui_dashboard_blog_cover_uploaded', 'Cover image uploaded'));
    } catch (error) {
      toast.error(extractApiError(error, ui('ui_dashboard_blog_cover_failed', 'Cover image upload failed')));
    }
  };

  const remove = async (post: CustomPageDto) => {
    if (!confirm(ui('ui_dashboard_blog_delete_confirm', 'Delete "{title}"?').replace('{title}', safeStr(post.title || post.slug)))) return;
    try {
      await deletePost(post.id).unwrap();
      toast.success(ui('ui_dashboard_blog_draft_deleted', 'Draft deleted'));
    } catch (error) {
      toast.error(extractApiError(error, ui('ui_dashboard_blog_delete_failed', 'Draft could not be deleted')));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--gm-text-dim)] font-serif italic">
          {ui('ui_dashboard_blog_intro', 'Prepare your blog drafts here. Publishing and final editorial review are handled in the admin panel.')}
        </p>
        <button
          onClick={() => setForm({ ...EMPTY_FORM })}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gm-gold)] px-5 py-2.5 text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest"
        >
          <Plus className="h-4 w-4" />
          {ui('ui_dashboard_blog_new', 'New Post')}
        </button>
      </div>

      {form && (
        <div className="rounded-3xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/35 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-serif text-xl text-[var(--gm-text)]">{form.id ? ui('ui_dashboard_blog_edit_draft', 'Edit Draft') : ui('ui_dashboard_blog_new_draft', 'New Blog Draft')}</h3>
            <button onClick={() => setForm(null)} className="rounded-full p-2 text-[var(--gm-text-dim)] hover:bg-[var(--gm-surface)]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={ui('ui_dashboard_blog_title_label', 'Title')}>
              <input value={form.title} onChange={(event) => patchForm({ title: event.target.value })} className="input" />
            </Field>
            <Field label="Slug">
              <input value={form.slug} onChange={(event) => patchForm({ slug: slugify(event.target.value) })} className="input" />
            </Field>
            <Field label={ui('ui_dashboard_blog_summary_label', 'Summary')}>
              <textarea value={form.summary} onChange={(event) => patchForm({ summary: event.target.value })} className="input min-h-24" />
            </Field>
            <div className="grid gap-4">
              <Field label={ui('ui_dashboard_blog_cover_label', 'Cover Image')}>
                <div className="space-y-3">
                  {form.featured_image ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-(--gm-border-soft) bg-(--gm-bg-deep)/40 p-2">
                      <img
                        src={form.featured_image}
                        alt=""
                        className="h-16 w-24 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-(--gm-text-dim)">{form.featured_image}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => patchForm({ featured_image: '' })}
                        className="rounded-full border border-(--gm-border-soft) px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-(--gm-text-dim) hover:text-(--gm-gold)"
                      >
                        {ui('ui_dashboard_blog_cover_clear', 'Remove')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={coverUploadState.isLoading}
                      className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-(--gm-border-soft) bg-(--gm-bg-deep)/30 px-4 py-3 text-xs text-(--gm-text-dim) hover:border-(--gm-gold)/50 hover:text-(--gm-gold) disabled:opacity-50"
                    >
                      {coverUploadState.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                      {ui('ui_dashboard_blog_cover_upload', 'Upload cover image')}
                    </button>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverFile}
                  />
                </div>
              </Field>
              <Field label={ui('ui_dashboard_blog_tags_label', 'Tags')}>
                <input value={form.tags} onChange={(event) => patchForm({ tags: event.target.value })} className="input" placeholder={ui('ui_dashboard_blog_tags_placeholder', 'astrology, tarot')} />
              </Field>
            </div>
          </div>
          <Field label={ui('ui_dashboard_blog_content_label', 'Content')}>
            <RichTextEditor
              value={form.content}
              onChange={(html) => patchForm({ content: html })}
              placeholder={ui('ui_dashboard_blog_content_placeholder', 'Start writing your post...')}
              bucket="consultant_blog"
              folder={editorFolder}
              minHeight="320px"
            />
          </Field>
          <div className="flex justify-end">
            <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[var(--gm-gold)] px-6 py-3 text-[var(--gm-bg-deep)] text-[10px] font-bold uppercase tracking-widest">
              <Save className="h-4 w-4" />
              {ui('ui_dashboard_save', 'Save')}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {isLoading ? (
          <div className="rounded-2xl border border-[var(--gm-border-soft)] p-6 text-sm text-[var(--gm-text-dim)]">{ui('ui_dashboard_blog_loading_drafts', 'Loading drafts...')}</div>
        ) : sortedPosts.length === 0 ? (
          <div className="rounded-2xl border border-[var(--gm-border-soft)] p-6 text-sm text-[var(--gm-text-dim)]">
            {ui('ui_dashboard_blog_empty', 'You do not have any blog drafts yet.')}
          </div>
        ) : sortedPosts.map((post) => (
          <article key={post.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/25 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-lg text-[var(--gm-text)]">{post.title || ui('ui_dashboard_blog_untitled', 'Untitled post')}</h3>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${post.is_published ? 'bg-[var(--gm-success)]/15 text-[var(--gm-success)]' : 'bg-[var(--gm-warning)]/15 text-[var(--gm-warning)]'}`}>
                  {post.is_published ? ui('ui_dashboard_blog_published', 'Published') : ui('ui_dashboard_blog_pending_admin', 'Pending admin review')}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--gm-text-dim)]">{post.slug}</p>
              {post.summary && <p className="mt-2 max-w-2xl text-sm text-[var(--gm-text-dim)]">{post.summary}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setForm(toForm(post))} className="rounded-full border border-[var(--gm-border-soft)] p-2 text-[var(--gm-text-dim)] hover:text-[var(--gm-gold)]">
                <Edit3 className="h-4 w-4" />
              </button>
              <button onClick={() => remove(post)} className="rounded-full border border-[var(--gm-border-soft)] p-2 text-[var(--gm-error)] hover:bg-[var(--gm-error)]/10">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gm-text-dim)]">{label}</span>
      {children}
    </label>
  );
}

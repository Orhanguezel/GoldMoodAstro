'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Eye,
  EyeOff,
  FileText,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  type CustomPageDto,
  safeStr,
} from '@/integrations/shared';
import {
  useCreateCustomPageAdminMutation,
  useDeleteCustomPageAdminMutation,
  useListSeoQualityQuery,
  useListCustomPagesAdminQuery,
  useUpdateCustomPageAdminMutation,
} from '@/integrations/hooks';
import { useLocaleContext } from '@/i18n';
import { cn } from '@/lib/utils';

type BlogForm = {
  id?: string;
  locale: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  featured_image: string;
  featured_image_alt: string;
  meta_title: string;
  meta_description: string;
  tags: string;
  is_published: boolean;
  featured: boolean;
};

const EMPTY_FORM: BlogForm = {
  locale: 'tr',
  title: '',
  slug: '',
  summary: '',
  content: '',
  featured_image: '',
  featured_image_alt: '',
  meta_title: '',
  meta_description: '',
  tags: '',
  is_published: false,
  featured: false,
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ığüşöç]/g, (c) => ({ ı: 'i', ğ: 'g', ü: 'u', ş: 's', ö: 'o', ç: 'c' })[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function errorMessage(error: unknown, fallback: string): string {
  const data = (error as any)?.data;
  return safeStr(data?.error?.message || data?.message || (error as any)?.message) || fallback;
}

function toForm(post: CustomPageDto): BlogForm {
  return {
    id: post.id,
    locale: post.locale_resolved || 'tr',
    title: safeStr(post.title),
    slug: safeStr(post.slug),
    summary: safeStr(post.summary),
    content: safeStr(post.content_html),
    featured_image: safeStr(post.featured_image),
    featured_image_alt: safeStr(post.featured_image_alt),
    meta_title: safeStr(post.meta_title),
    meta_description: safeStr(post.meta_description),
    tags: post.tags?.join(', ') || safeStr(post.tags_raw),
    is_published: post.is_published,
    featured: post.featured,
  };
}

function formatDate(value: string, locale: string): string {
  if (!value) return '-';
  try {
    const tag = locale === 'de' ? 'de-DE' : locale === 'en' ? 'en-US' : 'tr-TR';
    return new Intl.DateTimeFormat(tag, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

function qualityVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 75) return 'default';
  if (score >= 40) return 'secondary';
  return 'destructive';
}

export default function AdminBlogClient() {
  const { t, locale: uiLocale } = useLocaleContext();
  const b = React.useCallback(
    (key: string, fallback: string, vars?: Record<string, string | number>) => t(`admin.blog.${key}`, vars, fallback),
    [t],
  );
  const [q, setQ] = React.useState('');
  const [locale, setLocale] = React.useState('tr');
  const [form, setForm] = React.useState<BlogForm | null>(null);

  const query = useListCustomPagesAdminQuery({
    module_key: 'blog',
    locale,
    q: q.trim() || undefined,
    sort: 'created_at',
    orderDir: 'desc',
    limit: 200,
  });
  const seoQuery = useListSeoQualityQuery({
    entity_type: 'custom_page',
    locale,
    page_size: 200,
  });
  const [createPost, createState] = useCreateCustomPageAdminMutation();
  const [updatePost, updateState] = useUpdateCustomPageAdminMutation();
  const [deletePost, deleteState] = useDeleteCustomPageAdminMutation();

  const posts = query.data?.items ?? [];
  const seoByEntity = React.useMemo(() => {
    const map = new Map<string, { overall_score: number; adsense_ready: unknown; word_count: number }>();
    for (const item of seoQuery.data?.items ?? []) {
      map.set(`${item.entity_id}:${item.locale}`, item);
    }
    return map;
  }, [seoQuery.data?.items]);
  const busy = query.isFetching || createState.isLoading || updateState.isLoading || deleteState.isLoading;
  const editing = Boolean(form?.id);

  const startNew = () => setForm({ ...EMPTY_FORM, locale });
  const startEdit = (post: CustomPageDto) => setForm(toForm(post));
  const closeForm = () => setForm(null);

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
    if (!title) {
      toast.error(b('validation.titleRequired', 'Başlık zorunlu.'));
      return;
    }
    if (!slug) {
      toast.error(b('validation.slugRequired', 'URL slug zorunlu.'));
      return;
    }

    const payload = {
      module_key: 'blog',
      locale: form.locale,
      title,
      slug,
      summary: form.summary.trim() || null,
      content: form.content,
      featured_image: form.featured_image.trim() || null,
      image_url: form.featured_image.trim() || null,
      featured_image_alt: form.featured_image_alt.trim() || null,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      tags: form.tags.trim() || null,
      is_published: form.is_published,
      featured: form.featured,
    };

    try {
      if (form.id) {
        await updatePost({ id: form.id, patch: payload }).unwrap();
        toast.success(b('toast.saved', 'Blog yazısı kaydedildi.'));
      } else {
        await createPost(payload).unwrap();
        toast.success(b('toast.created', 'Blog yazısı oluşturuldu.'));
      }
      setForm(null);
    } catch (error) {
      toast.error(errorMessage(error, b('toast.saveError', 'Blog yazısı kaydedilemedi.')));
    }
  };

  const togglePublished = async (post: CustomPageDto) => {
    try {
      await updatePost({ id: post.id, patch: { is_published: !post.is_published } }).unwrap();
      toast.success(post.is_published ? b('toast.unpublished', 'Yazı taslağa alındı.') : b('toast.published', 'Yazı yayına alındı.'));
    } catch (error) {
      toast.error(errorMessage(error, b('toast.statusError', 'Durum güncellenemedi.')));
    }
  };

  const remove = async (post: CustomPageDto) => {
    if (!confirm(b('confirmDelete', '"{title}" silinsin mi?', { title: post.title || post.slug || post.id }))) return;
    try {
      await deletePost(post.id).unwrap();
      toast.success(b('toast.deleted', 'Blog yazısı silindi.'));
    } catch (error) {
      toast.error(errorMessage(error, b('toast.deleteError', 'Blog yazısı silinemedi.')));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">{b('eyebrow', 'İçerik Yönetimi')}</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{b('title', 'Blog Yönetimi')}</h1>
          <p className="max-w-2xl text-sm italic text-gm-muted">
            {b('description', 'Web ve mobil blog sayfası buradaki yayınlanmış yazıları okur. Danışman taslakları da burada onaylanıp yayına alınır.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => query.refetch()} disabled={busy} className="h-11 rounded-full border-gm-border-soft">
            <RefreshCcw className={cn('mr-2 size-4', query.isFetching && 'animate-spin')} />
            {b('refresh', 'Yenile')}
          </Button>
          <Button onClick={startNew} disabled={busy} className="h-11 rounded-full bg-gm-gold px-7 text-gm-bg hover:bg-gm-gold/80">
            <Plus className="mr-2 size-4" />
            {b('newPost', 'Yeni Yazı')}
          </Button>
        </div>
      </div>

      <Card className="rounded-[28px] border-gm-border-soft bg-gm-surface/20 shadow-xl">
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gm-muted" />
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder={b('searchPlaceholder', 'Başlık veya slug ara')}
                className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep pl-10"
              />
            </div>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value)}
              className="h-11 rounded-full border border-gm-border-soft bg-gm-bg-deep px-4 text-sm text-gm-text"
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {form && (
        <Card className="rounded-[28px] border-gm-border-soft bg-gm-surface/30 shadow-xl">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-gm-text">{editing ? b('form.editTitle', 'Yazıyı Düzenle') : b('form.newTitle', 'Yeni Blog Yazısı')}</h2>
                <p className="text-xs text-gm-muted">{b('form.help', 'İçerik HTML kabul eder; düz metin de kullanılabilir.')}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm} className="rounded-full">
                <X className="size-4" />
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Field label={b('form.fields.title', 'Başlık')}>
                <Input value={form.title} onChange={(event) => patchForm({ title: event.target.value })} />
              </Field>
              <Field label="Slug">
                <Input value={form.slug} onChange={(event) => patchForm({ slug: slugify(event.target.value) })} />
              </Field>
              <Field label={b('form.fields.summary', 'Özet')}>
                <Textarea value={form.summary} onChange={(event) => patchForm({ summary: event.target.value })} className="min-h-24" />
              </Field>
              <div className="grid gap-4">
                <Field label={b('form.fields.imageUrl', 'Kapak Görsel URL')}>
                  <Input value={form.featured_image} onChange={(event) => patchForm({ featured_image: event.target.value })} />
                </Field>
                <Field label={b('form.fields.imageAlt', 'Görsel Alt Metni')}>
                  <Input value={form.featured_image_alt} onChange={(event) => patchForm({ featured_image_alt: event.target.value })} />
                </Field>
              </div>
              <Field label={b('form.fields.metaTitle', 'Meta Başlık')}>
                <Input value={form.meta_title} onChange={(event) => patchForm({ meta_title: event.target.value })} />
              </Field>
              <Field label={b('form.fields.metaDescription', 'Meta Açıklama')}>
                <Input value={form.meta_description} onChange={(event) => patchForm({ meta_description: event.target.value })} />
              </Field>
              <Field label={b('form.fields.tags', 'Etiketler')}>
                <Input value={form.tags} onChange={(event) => patchForm({ tags: event.target.value })} placeholder={b('form.tagsPlaceholder', 'astroloji, tarot')} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <ToggleField label={b('form.fields.published', 'Yayında')} checked={form.is_published} onChange={(v) => patchForm({ is_published: v })} />
                <ToggleField label={b('form.fields.featured', 'Öne çıkar')} checked={form.featured} onChange={(v) => patchForm({ featured: v })} />
              </div>
            </div>

            <Field label={b('form.fields.content', 'İçerik')}>
              <Textarea value={form.content} onChange={(event) => patchForm({ content: event.target.value })} className="min-h-[320px] font-mono text-sm" />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={closeForm} className="rounded-full border-gm-border-soft">
                {b('form.cancel', 'Vazgeç')}
              </Button>
              <Button onClick={save} disabled={busy} className="rounded-full bg-gm-gold px-8 text-gm-bg hover:bg-gm-gold/80">
                <Save className="mr-2 size-4" />
                {b('form.save', 'Kaydet')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-[28px] border-gm-border-soft bg-gm-surface/20 shadow-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="px-7 py-5 text-[10px] uppercase tracking-widest text-gm-muted">{b('table.status', 'Durum')}</TableHead>
                <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted">{b('table.post', 'Yazı')}</TableHead>
                <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted">SEO</TableHead>
                <TableHead className="py-5 text-[10px] uppercase tracking-widest text-gm-muted">{b('table.date', 'Tarih')}</TableHead>
                <TableHead className="px-7 py-5 text-right text-[10px] uppercase tracking-widest text-gm-muted">{b('table.actions', 'İşlem')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow><TableCell colSpan={5} className="py-20 text-center text-sm italic text-gm-muted">{b('loading', 'Yükleniyor...')}</TableCell></TableRow>
              ) : posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3 text-gm-muted">
                      <BookOpen className="size-12 opacity-40" />
                      <span className="font-serif italic">{b('empty', 'Henüz blog yazısı yok.')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : posts.map((post) => {
                const title = post.title || post.slug || b('untitled', 'Başlıksız yazı');
                const score = seoByEntity.get(`${post.id}:${post.locale_resolved || locale}`);
                return (
                  <TableRow key={post.id} className="border-gm-border-soft hover:bg-gm-surface/40">
                    <TableCell className="px-7 py-5">
                      <div className="flex items-center gap-3">
                        <Switch checked={post.is_published} onCheckedChange={() => togglePublished(post)} disabled={busy} />
                        <Badge className={post.is_published ? 'bg-gm-success/15 text-gm-success' : 'bg-gm-muted/10 text-gm-muted'}>
                          {post.is_published ? b('status.published', 'Yayında') : b('status.draft', 'Taslak')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 rounded-xl border border-gm-border-soft bg-gm-bg-deep p-2 text-gm-gold">
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-serif text-lg text-gm-text">{title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gm-muted">
                            <code className="rounded-full border border-gm-border-soft bg-gm-bg-deep px-2 py-0.5">{post.slug}</code>
                            {post.featured && <Badge variant="outline" className="border-gm-gold/30 text-gm-gold">{b('status.featured', 'Öne çıkan')}</Badge>}
                          </div>
                          {post.summary && <p className="mt-2 max-w-2xl truncate text-xs text-gm-muted">{post.summary}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      {score ? (
                        <Button asChild variant="ghost" size="sm" className="h-auto rounded-full px-0 hover:bg-transparent">
                          <Link href={`/admin/seo-quality/custom_page/${post.id}?locale=${post.locale_resolved || locale}`}>
                            <Badge variant={qualityVariant(Number(score.overall_score))}>{score.overall_score}/100</Badge>
                          </Link>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-gm-muted">Bekliyor</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-5 text-xs text-gm-muted">{formatDate(post.updated_at || post.created_at, uiLocale)}</TableCell>
                    <TableCell className="px-7 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {post.slug && (
                          <Button asChild variant="ghost" size="icon" className="rounded-full">
                            <Link href={`/tr/blog/${post.slug}`} target="_blank">
                              {post.is_published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => startEdit(post)} className="rounded-full">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(post)} className="rounded-full text-gm-error hover:bg-gm-error/10">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gm-muted">{label}</span>
      {children}
    </label>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gm-border-soft bg-gm-bg-deep p-4">
      <span className="text-xs font-bold uppercase tracking-widest text-gm-text">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

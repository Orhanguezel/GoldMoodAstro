'use client';

import * as React from 'react';
import { 
  Bot, Plus, RefreshCcw, 
  Trash2, Pencil, Search,
  Cpu, Zap, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useListLlmPromptsQuery,
  useUpdateLlmPromptMutation,
  useDeleteLlmPromptMutation,
} from '@/integrations/hooks';
import { cn } from '@/lib/utils';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export default function LlmPromptsClient() {
  const t = useAdminT('admin.llmPrompts');
  const [searchTerm, setSearchTerm] = React.useState('');
  const query = useListLlmPromptsQuery({ search: searchTerm });
  const [update] = useUpdateLlmPromptMutation();
  const [remove] = useDeleteLlmPromptMutation();

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await update({ id, body: { is_active: !current } }).unwrap();
      toast.success(t('toastStatusUpdated', undefined, 'Prompt status updated.'));
    } catch {
      toast.error(t('toastUpdateFailed', undefined, 'Update failed.'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete', undefined, 'Are you sure you want to delete this prompt configuration?'))) return;
    try {
      await remove(id).unwrap();
      toast.success(t('toastDeleted', undefined, 'Prompt deleted.'));
    } catch {
      toast.error(t('toastDeleteFailed', undefined, 'Delete failed.'));
    }
  };

  const busy = query.isFetching;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Outside Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">{t('eyebrow', undefined, 'YAPAY ZEKA YÖNETİMİ')}</span>
          </div>
          <h1 className="font-serif text-4xl text-gm-text">{t('listTitle', undefined, 'LLM Prompts')}</h1>
          <p className="text-sm italic text-gm-muted">{t('listSubtitle', undefined, 'Yapay zeka model yapılandırmalarını, prompt şablonlarını ve parametreleri yönetin.')}</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={busy}
            className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest text-gm-text hover:bg-gm-surface/80"
          >
            <RefreshCcw className={cn("mr-2 size-4 text-gm-gold", query.isFetching && "animate-spin")} />
            {t('refresh', undefined, 'Yenile')}
          </Button>
          <Button 
            size="sm" 
            asChild 
            className="h-12 rounded-full bg-gm-gold hover:bg-gm-gold/80 text-gm-bg px-8 text-[10px] font-bold uppercase tracking-widest border border-transparent shadow-lg shadow-gm-gold/10"
          >
            <Link href="/admin/llm-prompts/new">
              <Plus className="mr-2 size-4" />
              {t('newPrompt', undefined, 'Yeni Prompt')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gm-muted" />
          <Input
            placeholder={t('searchPlaceholder', undefined, 'Prompt anahtarı veya içeriğe göre ara...')}
            className="pl-11 h-11 rounded-full border-gm-border-soft bg-gm-surface/20 text-sm text-gm-text placeholder:text-gm-muted/60 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Glassmorphic Card & Table */}
      <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gm-surface/40">
              <TableRow className="border-gm-border-soft hover:bg-transparent">
                <TableHead className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('colActive', undefined, 'Aktif')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('colKeyLocale', undefined, 'Anahtar / Dil')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('colModelProvider', undefined, 'Model / Sağlayıcı')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('colParams', undefined, 'Parametreler')}</TableHead>
                <TableHead className="py-6 text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('colUpdated', undefined, 'Son Güncelleme')}</TableHead>
                <TableHead className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('colActions', undefined, 'İşlem')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading ? (
                <TableRow className="border-gm-border-soft">
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-gm-muted italic font-serif">
                    {t('loading', undefined, 'Yükleniyor...')}
                  </TableCell>
                </TableRow>
              ) : query.data?.items.length === 0 ? (
                <TableRow className="border-gm-border-soft">
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-gm-muted italic font-serif">
                    {t('empty', undefined, 'Prompt yapılandırması bulunamadı.')}
                  </TableCell>
                </TableRow>
              ) : (
                query.data?.items.map((item) => (
                  <TableRow key={item.id} className="border-gm-border-soft hover:bg-gm-surface/40 transition-colors">
                    <TableCell className="px-8 py-5">
                      <Switch 
                        checked={item.is_active} 
                        onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                        className="data-[state=checked]:bg-gm-gold"
                      />
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="font-bold text-gm-text flex items-center gap-2">
                          {item.key}
                          <Badge variant="outline" className="rounded-full border-gm-primary/30 text-gm-primary bg-gm-primary/5 text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                            {item.locale}
                          </Badge>
                        </div>
                        <div className="text-xs text-gm-muted truncate max-w-[240px]">
                          {item.notes || t('noDescription', undefined, 'Açıklama belirtilmedi')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="text-sm font-medium text-gm-text flex items-center gap-1.5">
                          <Cpu className="size-3.5 text-gm-info" />
                          {item.model}
                        </div>
                        <Badge variant="secondary" className="w-fit rounded-full text-[9px] bg-gm-bg-deep text-gm-text-dim border border-gm-border-soft uppercase tracking-widest px-2 py-0.5">
                          {item.provider}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="rounded-full border-gm-gold/20 bg-gm-gold/5 text-gm-gold text-[9px] tracking-widest uppercase px-2.5 py-0.5 flex items-center gap-1">
                          <Zap className="size-2.5" />
                          <span>T: {item.temperature}</span>
                        </Badge>
                        <Badge variant="outline" className="rounded-full border-gm-success/20 bg-gm-success/5 text-gm-success text-[9px] tracking-widest uppercase px-2.5 py-0.5 flex items-center gap-1">
                          <Activity className="size-2.5" />
                          <span>M: {item.max_tokens}</span>
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-5 text-xs text-gm-text-dim">
                      {format(new Date(item.updated_at), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button asChild size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-gm-primary/10 hover:text-gm-primary text-gm-muted">
                          <Link href={`/admin/llm-prompts/${item.id}`}>
                            <Pencil className="size-4" />
                          </Link>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-9 w-9 rounded-full text-gm-error hover:bg-gm-error/10 hover:text-gm-error"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

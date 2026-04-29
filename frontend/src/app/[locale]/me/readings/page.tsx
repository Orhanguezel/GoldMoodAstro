'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import {
  Star,
  Coffee,
  Moon,
  Binary,
  ChevronRight,
  Clock,
  Calendar,
  Trash2,
  Heart,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetUserHistoryQuery,
  useDeleteReadingMutation,
  useDeleteAllReadingsMutation,
  type ReadingType,
} from '@/integrations/rtk/hooks';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { localizePath, normalizeError } from '@/integrations/shared';

const cinzel = Cinzel({ subsets: ['latin'] });

const TYPE_CONFIG: Record<
  ReadingType,
  { label: string; icon: any; color: string; route: string }
> = {
  tarot:      { label: 'Tarot Falı',   icon: Star,     color: 'text-brand-gold',     route: 'tarot/reading' },
  coffee:     { label: 'Kahve Falı',   icon: Coffee,   color: 'text-brand-gold-dim', route: 'kahve-fali/result' },
  dream:      { label: 'Rüya Tabiri',  icon: Moon,     color: 'text-brand-primary',  route: 'ruya-tabiri/result' },
  numerology: { label: 'Numeroloji',   icon: Binary,   color: 'text-brand-gold',     route: 'numeroloji' },
  yildizname: { label: 'Yıldızname',   icon: Sparkles, color: 'text-brand-gold',     route: 'yildizname/result' },
  synastry:   { label: 'Sinastri',     icon: Heart,    color: 'text-brand-primary',  route: 'sinastri/result' },
};

const FILTERS: Array<{ key: 'all' | ReadingType; label: string }> = [
  { key: 'all',        label: 'Tümü' },
  { key: 'tarot',      label: 'Tarot' },
  { key: 'coffee',     label: 'Kahve' },
  { key: 'dream',      label: 'Rüya' },
  { key: 'yildizname', label: 'Yıldızname' },
  { key: 'synastry',   label: 'Sinastri' },
  { key: 'numerology', label: 'Numeroloji' },
];

export default function MyReadingsPage() {
  const { locale } = useParams();
  const localeStr = (locale as string) || 'tr';
  const { data: history, isLoading } = useGetUserHistoryQuery();
  const [deleteOne, { isLoading: deletingOne }] = useDeleteReadingMutation();
  const [deleteAll, { isLoading: deletingAll }] = useDeleteAllReadingsMutation();
  const [filter, setFilter] = useState<'all' | ReadingType>('all');

  const filtered = useMemo(() => {
    const arr = history ?? [];
    if (filter === 'all') return arr;
    return arr.filter((it) => it.type === filter);
  }, [history, filter]);

  const handleDelete = async (type: ReadingType, id: string, title: string) => {
    if (!confirm(`"${title}" silinsin mi? Bu işlem geri alınamaz.`)) return;
    try {
      await deleteOne({ type, id }).unwrap();
      toast.success('Kayıt silindi');
    } catch (err) {
      toast.error(normalizeError(err).message || 'Silinemedi');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('TÜM yorumların silinsin mi? Bu işlem geri alınamaz (KVKK).')) return;
    try {
      const res = await deleteAll().unwrap();
      toast.success(`${res.total} kayıt silindi`);
    } catch (err) {
      toast.error(normalizeError(err).message || 'Silinemedi');
    }
  };

  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Link
              href={localizePath(localeStr, '/dashboard')}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-brand-gold tracking-[0.18em] uppercase mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Panele Dön
            </Link>
            <h1 className={`${cinzel.className} text-4xl md:text-5xl text-foreground`}>
              Geçmiş Yorumlarım
            </h1>
            <p className="text-muted-foreground italic font-serif mt-2">
              Kader çarkındaki izleri takip et, istediğin zaman sil.
            </p>
          </div>
          {(history?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-bold uppercase tracking-[0.18em] disabled:opacity-50 self-start md:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deletingAll ? 'Siliniyor…' : 'Tümünü Sil'}
            </button>
          )}
        </div>

        {/* Filters */}
        {(history?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-[0.18em] border transition-colors ${
                    active
                      ? 'bg-brand-gold text-bg-base border-brand-gold'
                      : 'border-border/40 text-muted-foreground hover:border-brand-gold/50 hover:text-brand-gold'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-2 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((item, i) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.tarot;
              const Icon = config.icon;
              return (
                <motion.div
                  key={`${item.type}:${item.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group bg-surface/30 border border-border/20 rounded-3xl p-5 hover:bg-surface/50 hover:border-brand-gold/30 transition-all shadow-lg flex items-center gap-5"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-surface-high flex items-center justify-center ${config.color} border border-border/10 shrink-0`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  <Link
                    href={`/${localeStr}/${config.route}/${item.id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={`text-[10px] font-bold tracking-widest uppercase ${config.color}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">•</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />{' '}
                        {new Date(item.created_at).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground truncate">
                      {item.title || `${config.label} Analizi`}
                    </h3>
                    {item.snippet && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {item.snippet}
                      </p>
                    )}
                  </Link>

                  <Link
                    href={`/${localeStr}/${config.route}/${item.id}`}
                    className="hidden sm:flex w-10 h-10 rounded-full bg-surface-high/50 items-center justify-center text-muted-foreground hover:text-brand-gold hover:bg-brand-gold/10 transition-all"
                    aria-label="Aç"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.type, item.id, item.title)}
                    disabled={deletingOne}
                    className="w-10 h-10 rounded-full bg-rose-500/5 flex items-center justify-center text-rose-400 hover:bg-rose-500/15 transition-colors disabled:opacity-40"
                    aria-label="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-surface/10 border border-dashed border-border/20 rounded-[3rem]">
            <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-serif italic">
              {filter === 'all'
                ? 'Henüz bir yorumun bulunmuyor.'
                : 'Bu kategoride yorumun yok.'}
            </p>
            <Link
              href={localizePath(localeStr, '/')}
              className="mt-6 inline-block text-brand-gold font-bold uppercase tracking-widest text-sm hover:underline"
            >
              Keşfetmeye Başla
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

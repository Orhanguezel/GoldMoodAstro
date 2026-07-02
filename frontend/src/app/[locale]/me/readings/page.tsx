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
import PageContainer from '@/components/common/PageContainer';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth.store';
import { useBrand } from '@/hooks/useBrand';
import { useUiSection } from '@/i18n';
import { localizePath, normalizeError } from '@/integrations/shared';

const cinzel = Cinzel({ subsets: ['latin'] });

// Etiketler dashboard ile ortak i18n anahtarlarını (ui_extra_b0_call_reading_*) kullanır.
const TYPE_CONFIG: Record<
  ReadingType,
  { labelKey: string; fallback: string; icon: any; color: string; route: string }
> = {
  tarot:      { labelKey: 'ui_extra_b0_call_reading_tarot',      fallback: 'Tarot',       icon: Star,     color: 'text-brand-gold',     route: 'tarot/reading' },
  coffee:     { labelKey: 'ui_extra_b0_call_reading_coffee',     fallback: 'Coffee reading', icon: Coffee,   color: 'text-brand-gold-dim', route: 'kahve-fali/result' },
  dream:      { labelKey: 'ui_extra_b0_call_reading_dream',      fallback: 'Dream',       icon: Moon,     color: 'text-brand-primary',  route: 'ruya-tabiri/result' },
  numerology: { labelKey: 'ui_extra_b0_call_reading_numerology', fallback: 'Numerology',  icon: Binary,   color: 'text-brand-gold',     route: 'numeroloji' },
  yildizname: { labelKey: 'ui_extra_b0_call_reading_yildizname', fallback: 'Yildizname',  icon: Sparkles, color: 'text-brand-gold',     route: 'yildizname/result' },
  synastry:   { labelKey: 'ui_extra_b0_call_reading_synastry',   fallback: 'Synastry',    icon: Heart,    color: 'text-brand-primary',  route: 'sinastri/result' },
  birth_chart:{ labelKey: 'ui_extra_b0_call_reading_birth_chart',fallback: 'Birth Chart', icon: Sparkles, color: 'text-brand-primary',  route: 'birth-chart' },
};

const FILTERS: Array<{ key: 'all' | ReadingType; labelKey: string; fallback: string }> = [
  { key: 'all',         labelKey: 'ui_extra_b0_dash_history_all',        fallback: 'All' },
  { key: 'birth_chart', labelKey: 'ui_extra_b0_call_reading_birth_chart', fallback: 'Birth Chart' },
  { key: 'tarot',       labelKey: 'ui_extra_b0_call_reading_tarot',      fallback: 'Tarot' },
  { key: 'coffee',      labelKey: 'ui_extra_b0_call_reading_coffee',     fallback: 'Coffee reading' },
  { key: 'dream',       labelKey: 'ui_extra_b0_call_reading_dream',      fallback: 'Dream' },
  { key: 'yildizname',  labelKey: 'ui_extra_b0_call_reading_yildizname', fallback: 'Yildizname' },
  { key: 'synastry',    labelKey: 'ui_extra_b0_call_reading_synastry',   fallback: 'Synastry' },
  { key: 'numerology',  labelKey: 'ui_extra_b0_call_reading_numerology', fallback: 'Numerology' },
];

export default function MyReadingsPage() {
  const { locale } = useParams();
  const localeStr = (locale as string) || 'tr';
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuthStore();
  React.useEffect(() => {
    if (isReady && !isAuthenticated) router.replace(`/${localeStr}/login?next=/${localeStr}/me/readings`);
  }, [isReady, isAuthenticated, localeStr, router]);
  const { ui } = useUiSection('ui_extra' as any, localeStr as any);
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
    if (!confirm(`"${title}" ${ui('ui_extra_b1_confirm_delete_one', 'should be deleted? This cannot be undone.')}`)) return;
    try {
      await deleteOne({ type, id }).unwrap();
      toast.success(ui('ui_extra_b1_record_deleted', 'Record deleted'));
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_extra_b1_delete_failed', 'Silinemedi'));
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(ui('ui_extra_b1_confirm_delete_all', 'Delete ALL readings? This cannot be undone.'))) return;
    try {
      const res = await deleteAll().unwrap();
      toast.success(`${res.total} ${ui('ui_extra_b1_records_deleted', 'records deleted')}`);
    } catch (err) {
      toast.error(normalizeError(err).message || ui('ui_extra_b1_delete_failed', 'Silinemedi'));
    }
  };

  return (
    <PageContainer width="wide" verticalPadding="large">
      <div className="space-y-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Link
              href={localizePath(localeStr, '/dashboard')}
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-brand-gold tracking-[0.18em] uppercase mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {ui('ui_extra_b1_back_to_dashboard_2', 'Back to Dashboard')}
            </Link>
            <h1 className={`${cinzel.className} text-4xl md:text-5xl text-foreground`}>
              {ui('ui_extra_b1_my_past_readings', 'My Past Readings')}
            </h1>
            <p className="text-muted-foreground italic font-serif mt-2">
              {ui('ui_extra_b1_readings_subtitle', 'Follow the traces in the wheel of fate and delete them whenever you want.')}
            </p>
          </div>
          {(history?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--gm-error)]/40 text-[var(--gm-error)] hover:bg-[var(--gm-error)]/10 transition-colors text-xs font-bold uppercase tracking-[0.18em] disabled:opacity-50 self-start md:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deletingAll ? ui('ui_extra_b1_deleting', 'Deleting…') : ui('ui_extra_b1_delete_all', 'Delete All')}
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
                  {ui(f.labelKey, f.fallback)}
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
              // numerology + birth_chart detay sayfası yok → index'e yönlendir (404 fix).
              const itemHref = item.type === 'birth_chart'
                ? localizePath(localeStr, '/birth-chart')
                : item.type === 'numerology'
                ? localizePath(localeStr, '/numeroloji')
                : `/${localeStr}/${config.route}/${item.id}`;
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
                    href={itemHref}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={`text-[10px] font-bold tracking-widest uppercase ${config.color}`}
                      >
                        {ui(config.labelKey, config.fallback)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">•</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />{' '}
                        {new Date(item.created_at).toLocaleDateString(localeStr === 'tr' ? 'tr-TR' : localeStr === 'de' ? 'de-DE' : 'en-US')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground truncate">
                      {item.title || `${ui(config.labelKey, config.fallback)} ${ui('ui_extra_b1_analysis', 'Analysis')}`}
                    </h3>
                    {item.snippet && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {item.snippet}
                      </p>
                    )}
                  </Link>

                  <Link
                    href={itemHref}
                    className="hidden sm:flex w-10 h-10 rounded-full bg-surface-high/50 items-center justify-center text-muted-foreground hover:text-brand-gold hover:bg-brand-gold/10 transition-all"
                    aria-label={ui('ui_extra_b1_open', 'Open')}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.type, item.id, item.title)}
                    disabled={deletingOne}
                    className="w-10 h-10 rounded-full bg-[var(--gm-error)]/5 flex items-center justify-center text-[var(--gm-error)] hover:bg-[var(--gm-error)]/15 transition-colors disabled:opacity-40"
                    aria-label={ui('ui_extra_b1_delete', 'Delete')}
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
                ? ui('ui_extra_b1_empty_all', 'You do not have any readings yet.')
                : ui('ui_extra_b1_empty_category', 'You do not have a reading in this category.')}
            </p>
            <Link
              href={localizePath(localeStr, '/')}
              className="mt-6 inline-block text-brand-gold font-bold uppercase tracking-widest text-sm hover:underline"
            >
              {ui('ui_extra_b1_start_exploring', 'Start Exploring')}
            </Link>
          </div>
        )}
      </div>
    </PageContainer>
  );
}

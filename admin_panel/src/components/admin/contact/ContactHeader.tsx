import { Inbox, RefreshCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ContactHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
};

export function ContactHeader({
  search,
  onSearchChange,
  onRefresh,
  isRefreshing = false,
}: ContactHeaderProps) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-gm-gold" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">
            İletişim
          </span>
        </div>
        <h1 className="font-serif text-4xl text-gm-text">İletişim Mesajları</h1>
        <p className="max-w-2xl font-serif text-sm italic text-gm-muted opacity-70">
          Web sitesindeki iletişim formundan gelen mesajları buradan takip edin.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="group relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gm-muted/50 transition-colors group-focus-within:text-gm-gold" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Ad, e-posta, konu veya mesaj ara"
            className="h-12 rounded-2xl border-gm-border-soft bg-gm-surface/40 pl-12 text-sm transition-all focus:ring-gm-gold/50"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-12 rounded-full border-gm-border-soft bg-gm-surface/50 px-8 text-[10px] font-bold uppercase tracking-widest shadow-lg backdrop-blur-sm transition-all hover:bg-gm-primary/5"
        >
          <RefreshCcw className={cn('mr-2 size-4', isRefreshing && 'animate-spin')} />
          Yenile
        </Button>
      </div>
    </div>
  );
}

export default ContactHeader;

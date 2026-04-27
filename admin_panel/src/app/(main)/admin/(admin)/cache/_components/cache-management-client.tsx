'use client';

import * as React from 'react';
import { toast } from 'sonner';
import {
  Trash2,
  RefreshCcw,
  Globe,
  Star,
  Calendar,
  LogIn,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

async function revalidate(opts: { all?: boolean; path?: string }) {
  const res = await fetch('/api/revalidate-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Revalidation failed');
  return data;
}

const CACHE_ACTIONS = [
  {
    id: 'all',
    label: 'Tüm Site Cache',
    description:
      "Tüm sayfaların cache'ini temizler. Tema/tasarım değişiklikleri ve site ayarları için bunu kullanın.",
    icon: Globe,
    action: () => revalidate({ all: true }),
    variant: 'destructive' as const,
  },
  {
    id: 'home',
    label: 'Ana Sayfa',
    description: "Ana sayfanın cache'ini temizler.",
    icon: Globe,
    action: () => revalidate({ path: '/tr' }),
  },
  {
    id: 'birth-chart',
    label: 'Doğum Haritası',
    description: "Doğum haritası sayfası cache'ini temizler.",
    icon: Sparkles,
    action: () => revalidate({ path: '/tr/birth-chart' }),
  },
  {
    id: 'consultants',
    label: 'Danışmanlar',
    description: "Danışman listesi ve detay sayfaları cache'ini temizler.",
    icon: Star,
    action: () => revalidate({ path: '/tr/consultants' }),
  },
  {
    id: 'booking',
    label: 'Randevu',
    description: "Randevu akışının cache'ini temizler.",
    icon: Calendar,
    action: () => revalidate({ path: '/tr/booking' }),
  },
  {
    id: 'auth',
    label: 'Giriş / Kayıt',
    description: "Giriş ve kayıt sayfalarının cache'ini temizler.",
    icon: LogIn,
    action: () => revalidate({ path: '/tr/auth/login' }),
  },
];

export default function CacheManagementClient() {
  const [loading, setLoading] = React.useState<string | null>(null);
  const [lastCleared, setLastCleared] = React.useState<Record<string, string>>({});

  async function handleClear(id: string, action: () => Promise<any>) {
    setLoading(id);
    try {
      await action();
      const now = new Date().toLocaleTimeString('tr-TR');
      setLastCleared((prev) => ({ ...prev, [id]: now }));
      toast.success(id === 'all' ? 'Tüm site cache temizlendi' : 'Cache temizlendi');
    } catch (err: any) {
      toast.error(err?.message || 'Cache temizlenemedi');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Cache Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Frontend sayfalarının cache'ini temizleyin. İçerik güncellemelerinin anında görünmesini
          sağlar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hızlı Temizle</CardTitle>
          <CardDescription>
            Belirli bir sayfanın veya tüm sitenin cache'ini temizleyin. Cache temizlendikten sonra
            sayfa ilk ziyarette yeniden oluşturulur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {CACHE_ACTIONS.map((item, idx) => (
            <React.Fragment key={item.id}>
              {idx === 1 && <Separator />}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <item.icon className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.label}</span>
                      {lastCleared[item.id] && (
                        <Badge variant="secondary" className="text-[10px]">
                          {lastCleared[item.id]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <Button
                  variant={item.variant || 'outline'}
                  size="sm"
                  onClick={() => handleClear(item.id, item.action)}
                  disabled={loading !== null}
                >
                  {loading === item.id ? (
                    <RefreshCcw className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}
                  Temizle
                </Button>
              </div>
            </React.Fragment>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bilgi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Frontend sayfaları 5 dakika (300 saniye) boyunca cache'lenir. Cache temizlendiğinde
            sayfalar bir sonraki ziyarette API'den taze veri çeker.
          </p>
          <p>
            Tema şablonu uygulandığında otomatik olarak tüm cache temizlenir — el ile temizlemeye
            gerek yoktur. Sadece içerik (yorumlar, ürünler vb.) güncellendiğinde bu sayfayı
            kullanın.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

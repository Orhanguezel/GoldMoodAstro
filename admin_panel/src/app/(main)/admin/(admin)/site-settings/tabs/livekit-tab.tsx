'use client';

import * as React from 'react';
import { RefreshCcw, RadioTower } from 'lucide-react';
import { useGetLiveKitAdminStatusQuery } from '@/integrations/hooks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? <Badge>Aktif</Badge> : <Badge variant="destructive">Eksik</Badge>;
}

export function LiveKitTab() {
  const { data, isLoading, isFetching, refetch } = useGetLiveKitAdminStatusQuery();
  const busy = isLoading || isFetching;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <RadioTower className="size-4" />
              LiveKit Durumu
            </CardTitle>
            <CardDescription>
              LiveKit değerleri backend .env dosyasından okunur. Secret alanlar admin panelde
              sadece maskeleme ve yapılandırma durumu olarak gösterilir.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={busy}>
            <RefreshCcw className="mr-2 size-4" />
            Yenile
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge ok={Boolean(data?.configured)} />
            <Badge variant="outline">
              Aktif oda: {data?.active_rooms === null || data?.active_rooms === undefined ? '-' : data.active_rooms}
            </Badge>
            {data?.rooms_error ? <Badge variant="destructive">Room API hata</Badge> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>LIVEKIT_URL</Label>
              <Input value={data?.livekit_url ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>LIVEKIT_API_KEY</Label>
              <Input value={data?.api_key_masked ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Webhook Signing Key</Label>
              <Input
                value={data?.webhook_signing_key_configured ? 'Tanımlı' : 'Eksik'}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label>Aktif Oda Sayısı</Label>
              <Input
                value={data?.active_rooms === null || data?.active_rooms === undefined ? '-' : String(data.active_rooms)}
                readOnly
              />
            </div>
          </div>

          {data?.rooms_error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {data.rooms_error}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

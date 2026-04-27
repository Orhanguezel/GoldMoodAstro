'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Save, Code } from 'lucide-react';
import { useGetSiteSettingAdminByKeyQuery, useUpdateSiteSettingAdminMutation } from '@/integrations/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

export function CustomCssTab() {
  const { data: settingRow, isLoading, isFetching, refetch } = useGetSiteSettingAdminByKeyQuery('custom_css');
  const [updateSetting, { isLoading: isSaving }] = useUpdateSiteSettingAdminMutation();

  const [cssValue, setCssValue] = React.useState('');

  React.useEffect(() => {
    if (settingRow?.value !== undefined) {
      setCssValue(typeof settingRow.value === 'string' ? settingRow.value : '');
    }
  }, [settingRow?.value]);

  const busy = isLoading || isFetching || isSaving;

  const handleSave = async () => {
    try {
      await updateSetting({
        key: 'custom_css',
        value: cssValue,
        locale: '*',
      }).unwrap();
      toast.success('Özel CSS kaydedildi. 5 dakika içinde yansır.');
    } catch (err) {
      toast.error('Kaydetme hatası.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold flex items-center gap-2">
            <Code className="size-4" />
            Özel CSS (Global)
          </h3>
          <p className="text-sm text-muted-foreground">
            Frontend tarafına enjekte edilecek global CSS kuralları.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <Badge variant="outline">Yükleniyor...</Badge>}
          <Button type="button" variant="ghost" size="icon" onClick={() => refetch()} disabled={busy}>
            <RefreshCcw className="size-4" />
          </Button>
          <Button type="button" onClick={handleSave} disabled={busy} className="gap-2">
            <Save className="size-4" />
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSS Editörü</CardTitle>
          <CardDescription>
            Buradaki CSS, globals.css sonrasına enjekte edilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={cssValue}
            onChange={(e) => setCssValue(e.target.value)}
            placeholder="body { background: ... }"
            className="min-h-[400px] font-mono text-sm leading-relaxed"
            disabled={busy}
          />
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">Bilgi</Badge>
            <span>CSS değişiklikleri sunucu tarafında 5 dakika önbelleğe alınır.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpenText, Clipboard, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBulkImportAstrologyKbMutation } from '@/integrations/hooks';
import { useCreateAstrologyKbTranslationDraftsMutation } from '@/integrations/hooks';
import type { AstrologyKbBulkImportPayload } from '@/integrations/shared';

const SAMPLE_ITEMS: AstrologyKbBulkImportPayload['items'] = [
  {
    kind: 'sign',
    key1: 'aries',
    key2: null,
    key3: null,
    locale: 'tr',
    title: 'Koç Burcu Temel Arketipi',
    content: 'Koç enerjisi başlangıç, cesaret, dürtü ve doğrudan eylem temalarını taşır.',
    short_summary: 'Başlangıç ve cesaret arketipi.',
    tone: 'warm',
    source: 'editorial_seed',
    author: 'GoldMoodAstro',
    is_active: true,
  },
];

const PUBLIC_DOMAIN_SAMPLE: AstrologyKbBulkImportPayload['items'] = [
  {
    kind: 'planet_sign',
    key1: 'sun',
    key2: 'aries',
    key3: null,
    locale: 'tr',
    title: 'Public Domain Modernizasyon Örneği — Güneş Koç',
    content:
      'Klasik metinlerde Koç vurgusu çoğu zaman başlangıç gücü, doğrudanlık ve cesaretle anlatılır. Modern KB dilinde bu enerji, kişinin eyleme geçme refleksi, öncü tavrı ve deneyerek öğrenme ihtiyacı olarak okunabilir. Bu yerleşim acelecilik veya sabırsızlık gibi gölge temalar taşıyabilir; ancak sorumlu yorum dili bunu kesin karakter hükmü gibi değil, fark edilip dengelenebilecek bir ritim olarak ele almalıdır.',
    short_summary: 'Eski Koç/Güneş anlatısını modern ve kaderci olmayan KB diline çeviren örnek.',
    tone: 'professional',
    source: 'Public domain astrology classic — section/page placeholder',
    author: 'Public domain author; modernized by GoldMoodAstro',
    is_active: false,
  },
];

export default function AstrologyKbImportPage() {
  const [jsonText, setJsonText] = React.useState('');
  const [upsert, setUpsert] = React.useState(true);
  const [result, setResult] = React.useState<string>('');
  const [bulkImport, { isLoading }] = useBulkImportAstrologyKbMutation();
  const [createTranslationDrafts, { isLoading: isCreatingDrafts }] = useCreateAstrologyKbTranslationDraftsMutation();

  const loadSample = () => {
    setJsonText(JSON.stringify({ items: SAMPLE_ITEMS }, null, 2));
    setResult('');
  };

  const loadPublicDomainSample = () => {
    setJsonText(JSON.stringify({ items: PUBLIC_DOMAIN_SAMPLE }, null, 2));
    setResult('');
  };

  const handleImport = async () => {
    setResult('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonText);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'JSON parse failed';
      setResult(`JSON hatası: ${message}`);
      toast.error('JSON okunamadı.');
      return;
    }

    const items = Array.isArray(parsed)
      ? parsed
      : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { items?: unknown }).items)
        ? (parsed as { items: unknown[] }).items
        : null;

    if (!items) {
      setResult('JSON kökü array veya { "items": [...] } olmalı.');
      toast.error('Import formatı geçersiz.');
      return;
    }

    try {
      const response = await bulkImport({ items: items as AstrologyKbBulkImportPayload['items'], upsert }).unwrap();
      const message = `Eklenen: ${response.inserted}, güncellenen: ${response.updated}, başarısız: ${response.failed}`;
      setResult(message);
      toast.success(message);
    } catch (error: any) {
      const message = error?.data?.error?.message || error?.message || 'Import başarısız.';
      setResult(`Hata: ${message}`);
      toast.error(message);
    }
  };

  const handleCreateTranslationDrafts = async () => {
    setResult('');
    try {
      const response = await createTranslationDrafts({
        source_locale: 'en',
        target_locale: 'tr',
        limit: 100,
      }).unwrap();
      const message = `EN→TR taslak kuyruğu: ${response.created} oluşturuldu, ${response.skipped} atlandı, kaynak: ${response.source_total}`;
      setResult(message);
      toast.success(message);
    } catch (error: any) {
      const message = error?.data?.error?.message || error?.message || 'Çeviri taslak kuyruğu oluşturulamadı.';
      setResult(`Hata: ${message}`);
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-gm-primary">
          <Link href="/admin/astrology-kb">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold italic text-gm-primary">Astrology KB Import Wizard</h1>
          <p className="text-sm text-muted-foreground">
            JSON içerikleri toplu olarak bilgi tabanına aktarın. Kök formatı array veya <code>{'{ "items": [...] }'}</code> olabilir.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="border-gm-border-soft bg-gm-surface/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="size-4 text-gm-primary" />
              Import JSON
            </CardTitle>
            <CardDescription>
              Her kayıt `kind`, `key1`, `locale`, `title`, `content`, `tone`, `is_active` alanlarını içermeli.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              spellCheck={false}
              className="min-h-[520px] resize-y border-gm-border-soft bg-gm-bg-deep/30 font-mono text-xs"
              placeholder='{"items":[{"kind":"sign","key1":"aries","locale":"tr","title":"...","content":"...","tone":"warm","is_active":true}]}'
            />
            {result && (
              <div className="rounded-md border border-gm-border-soft bg-gm-bg-deep/40 p-3 text-sm text-gm-text-dim">
                {result}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="upsert"
                  checked={upsert}
                  onCheckedChange={(checked) => setUpsert(checked === true)}
                />
                <Label htmlFor="upsert">Var olan kayıtları güncelle</Label>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={loadSample}>
                <Clipboard className="mr-2 size-4" />
                Örnek JSON Yükle
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={loadPublicDomainSample}>
                <BookOpenText className="mr-2 size-4" />
                Public Domain Örneği
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCreateTranslationDrafts}
                disabled={isCreatingDrafts}
              >
                <Clipboard className="mr-2 size-4" />
                {isCreatingDrafts ? 'Taslaklar hazırlanıyor...' : 'EN→TR Taslak Kuyruğu'}
              </Button>
              <Button
                type="button"
                className="w-full bg-gm-primary hover:bg-gm-primary-dark"
                onClick={handleImport}
                disabled={isLoading || !jsonText.trim()}
              >
                <Upload className="mr-2 size-4" />
                {isLoading ? 'Import ediliyor...' : 'Import Et'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base">Suggested Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>1. İçerikleri dış kaynaklardan JSON formatına dönüştürün.</p>
              <p>2. EN→TR çeviri hattı için prompt key: <code>kb_translate_en_tr</code>.</p>
              <p>3. Kamu malı klasikler için prompt key: <code>kb_public_domain_modernizer</code>.</p>
              <p>4. Kaynak, yazar, bölüm/sayfa ve lisans notunu doldurun.</p>
              <p>5. Import sonrası KB listesinden kayıtları kontrol edip pasif kayıtları onaylayın.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Save, Bot,
  Settings2, Code2, AlertTriangle,
  Database, Zap, BrainCircuit,
  PlayCircle, CheckCircle2, XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  useCreateLlmPromptMutation,
  useGetLlmPromptQuery,
  useUpdateLlmPromptMutation,
  useTestLlmPromptMutation,
} from '@/integrations/hooks';
import type { LlmProviderId, LlmPromptTestResult } from '@/integrations/shared';
import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

export default function LlmPromptFormPage() {
  const t = useAdminT('admin.llmPrompts');
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isEdit = Boolean(id);

  const { data: existing, isLoading: isFetching } = useGetLlmPromptQuery(id, { skip: !isEdit });
  const [create, { isLoading: isCreating }] = useCreateLlmPromptMutation();
  const [update, { isLoading: isUpdating }] = useUpdateLlmPromptMutation();
  const [testPrompt, { isLoading: isTesting }] = useTestLlmPromptMutation();

  // T19-3 Test Et state
  const [testVarsRaw, setTestVarsRaw] = React.useState<string>('{}');
  const [testResult, setTestResult] = React.useState<LlmPromptTestResult | null>(null);
  const [testError, setTestError] = React.useState<string>('');

  const [formData, setFormData] = React.useState({
    key: '',
    locale: 'tr',
    provider: 'anthropic' as LlmProviderId,
    model: 'claude-haiku-4-5',
    temperature: 0.7,
    max_tokens: 2000,
    system_prompt: '',
    user_template: '',
    safety_check: true,
    similarity_threshold: 0.85,
    max_attempts: 3,
    notes: '',
    is_active: true,
  });

  React.useEffect(() => {
    if (existing) {
      setFormData({
        key: existing.key,
        locale: existing.locale,
        provider: existing.provider as LlmProviderId,
        model: existing.model,
        temperature: existing.temperature,
        max_tokens: existing.max_tokens,
        system_prompt: existing.system_prompt,
        user_template: existing.user_template,
        safety_check: !!existing.safety_check,
        similarity_threshold: existing.similarity_threshold,
        max_attempts: existing.max_attempts,
        notes: existing.notes || '',
        is_active: !!existing.is_active,
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key || !formData.system_prompt) {
      toast.error(t('toastValidationRequired', undefined, 'Key and System Prompt are required.'));
      return;
    }

    try {
      if (isEdit) {
        await update({ id, body: formData }).unwrap();
        toast.success(t('toastUpdated', undefined, 'Prompt updated.'));
      } else {
        await create(formData).unwrap();
        toast.success(t('toastCreated', undefined, 'Prompt created.'));
      }
      router.push('/admin/llm-prompts');
    } catch {
      toast.error(t('toastOperationFailed', undefined, 'Operation failed.'));
    }
  };

  if (isEdit && isFetching) return <div className="p-8 text-center text-gm-muted">{t('loadingPromptData', undefined, 'Loading prompt data...')}</div>;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      {/* Outside Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">{t('eyebrow', undefined, 'YAPAY ZEKA YÖNETİMİ')}</span>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()} 
              className="h-10 w-10 rounded-full border-gm-border-soft bg-gm-surface/50 text-gm-gold hover:bg-gm-gold/10"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <h1 className="font-serif text-4xl text-gm-text">{isEdit ? t('formTitleEdit', undefined, 'Prompt Düzenle') : t('formTitleNew', undefined, 'Yeni Prompt Tanımı')}</h1>
          </div>
          <p className="text-sm italic text-gm-muted">{t('formSubtitle', undefined, 'Yapay zeka model davranışını ve şablonunu yapılandırın.')}</p>
        </div>
      </div>

      {/* T19-3 — Test Et paneli (sadece edit modunda) */}
      {isEdit && existing && (
        <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
          <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
            <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
              <PlayCircle className="size-5 text-gm-gold" />
              {t('sandboxTitle', undefined, 'Sandbox Test Modülü')}
            </CardTitle>
            <CardDescription className="text-xs text-gm-muted mt-1">
              {t('sandboxDescription', undefined, "Prompt'u sandbox'ta çalıştır. Hiçbir veri kaydedilmez. Variables nesnesini JSON formatında girin (örn:")} <code className="bg-gm-bg-deep/40 px-1.5 rounded text-[11px]">{'{ "full_name": "Ahmet", "dob": "1990-05-12" }'}</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2 p-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('sandboxVarsLabel', undefined, 'Değişkenler (JSON)')}</Label>
              <Textarea
                rows={8}
                value={testVarsRaw}
                onChange={(e) => setTestVarsRaw(e.target.value)}
                placeholder='{ "name": "Ahmet" }'
                className="font-mono text-xs border-gm-border-soft bg-gm-bg-deep/30 rounded-2xl p-4 text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="button"
                onClick={async () => {
                  setTestError('');
                  setTestResult(null);
                  let vars: Record<string, unknown> = {};
                  try {
                    const parsed = JSON.parse(testVarsRaw || '{}');
                    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                      throw new Error(t('errorExpectJsonObject', undefined, 'JSON object beklenir'));
                    }
                    vars = parsed as Record<string, unknown>;
                  } catch (e: any) {
                    setTestError(t('errorJsonParse', { message: String(e?.message ?? e) }, 'JSON parse hatası: {message}'));
                    return;
                  }
                  try {
                    const res = await testPrompt({ id, body: { vars } }).unwrap();
                    setTestResult(res);
                    if (!res.ok) toast.error(res.error || t('testFailed', undefined, 'Test başarısız'));
                  } catch (err: any) {
                    setTestError(err?.data?.error?.message || err?.message || t('testFailed', undefined, 'Test başarısız'));
                  }
                }}
                disabled={isTesting}
                className="w-full h-11 rounded-full bg-gm-gold hover:bg-gm-gold/80 text-gm-bg text-xs font-bold uppercase tracking-widest"
              >
                <PlayCircle className="mr-2 size-4" />
                {isTesting ? t('testRunning', undefined, 'Çalışıyor...') : t('testRun', undefined, 'Test Et')}
              </Button>
            </div>
            <div className="space-y-4 flex flex-col justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('sandboxOutputLabel', undefined, 'Test Çıktısı')}</Label>
              <div className="flex-1 min-h-[200px] flex flex-col justify-center">
                {testError && (
                  <div className="border border-gm-error/30 bg-gm-error/10 rounded-2xl p-4 text-sm text-gm-error flex gap-2">
                    <XCircle className="size-4 mt-0.5 shrink-0" />
                    <span>{testError}</span>
                  </div>
                )}
                {testResult && testResult.ok && (
                  <div className="space-y-3 h-full flex flex-col justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full border-gm-success/30 text-gm-success bg-gm-success/5 text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                        {t('badgeAttempts', { count: String(testResult.attempts) }, '{count} deneme')}
                      </Badge>
                      <Badge variant="outline" className="rounded-full border-gm-primary/30 text-gm-primary bg-gm-primary/5 text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                        {testResult.provider}
                      </Badge>
                      <Badge variant="outline" className="rounded-full border-gm-gold/30 text-gm-gold bg-gm-gold/5 text-[9px] uppercase tracking-widest px-2.5 py-0.5">
                        {testResult.model}
                      </Badge>
                    </div>
                    {testResult.safety_flags && testResult.safety_flags.length > 0 && (
                      <div className="text-[9px] text-gm-warning border border-gm-warning/20 bg-gm-warning/5 rounded-full px-3 py-1 inline-flex items-center gap-1 w-fit uppercase tracking-widest">
                        <AlertTriangle size={10} /> {t('safetyLabel', undefined, 'Safety')}: {testResult.safety_flags.join(', ')}
                      </div>
                    )}
                    {typeof testResult.max_similarity === 'number' && (
                      <div className="text-[10px] text-gm-text-dim px-1 font-light italic">
                        {t('maxSimilarity', undefined, 'Max similarity')}: {testResult.max_similarity.toFixed(3)}
                      </div>
                    )}
                    <pre className="border border-gm-border-soft bg-gm-bg-deep/30 rounded-2xl p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto flex-1">
                      {testResult.output ?? ''}
                    </pre>
                  </div>
                )}
                {testResult && !testResult.ok && (
                  <div className="border border-gm-error/30 bg-gm-error/10 rounded-2xl p-4 text-sm text-gm-error flex gap-2">
                    <XCircle className="size-4 mt-0.5 shrink-0" />
                    <span>{testResult.error ?? t('unknownError', undefined, 'Bilinmeyen hata')}</span>
                  </div>
                )}
                {!testResult && !testError && (
                  <div className="text-xs text-gm-muted italic border border-dashed border-gm-border-soft rounded-2xl p-6 text-center">
                    {t('sandboxOutputPlaceholder', undefined, 'Test çıktısı burada görünecek.')}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Core Configuration */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Database className="size-5 text-gm-gold" />
                {t('cardDefinition', undefined, 'Prompt Tanımlama')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="key" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('fieldKey', undefined, 'Prompt Benzersiz Anahtarı')}</Label>
                  <Input 
                    id="key" 
                    value={formData.key} 
                    onChange={(e) => setFormData(p => ({ ...p, key: e.target.value.toUpperCase() }))}
                    placeholder="DAILY_HOROSCOPE_V1"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
                  />
                  <p className="text-[10px] text-gm-muted/80 italic pl-1">{t('fieldKeyHint', undefined, 'Kod içerisinde çağrılacak eşsiz anahtar.')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('fieldLocale', undefined, 'Dil (Locale)')}</Label>
                  <Select 
                    value={formData.locale} 
                    onValueChange={(v) => setFormData(p => ({ ...p, locale: v }))}
                  >
                    <SelectTrigger id="locale" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gm-border-soft bg-gm-surface text-gm-text rounded-2xl">
                      <SelectItem value="tr">{t('localeTr', undefined, 'Türkçe (TR)')}</SelectItem>
                      <SelectItem value="en">{t('localeEn', undefined, 'İngilizce (EN)')}</SelectItem>
                      <SelectItem value="de">{t('localeDe', undefined, 'Almanca (DE)')}</SelectItem>
                      <SelectItem value="*">{t('localeAll', undefined, 'Tümü (*)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('fieldNotes', undefined, 'Açıklama / Amacı')}</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder={t('fieldNotesPlaceholder', undefined, 'örn: Günlük astroloji ve mood yorumlamaları için kullanılan şablon.')}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Prompt Templates */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Code2 className="size-5 text-gm-gold" />
                {t('cardTemplates', undefined, 'Prompt Şablonları')}
              </CardTitle>
              <CardDescription className="text-xs text-gm-muted mt-1">{t('cardTemplatesDescPrefix', undefined, 'Dinamik değerler için')} {'{{degisken}}'} {t('cardTemplatesDescSuffix', undefined, 'sözdizimini kullanın.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <Label htmlFor="system_prompt" className="text-[10px] font-bold uppercase tracking-widest text-gm-gold">{t('fieldSystemPrompt', undefined, 'Sistem Promptu (System Message)')}</Label>
                <Textarea 
                  id="system_prompt" 
                  rows={10}
                  value={formData.system_prompt} 
                  onChange={(e) => setFormData(p => ({ ...p, system_prompt: e.target.value }))}
                  placeholder="You are an expert astrologer with 20 years of experience..."
                  className="border-gm-border-soft bg-gm-bg-deep/20 rounded-2xl p-4 font-sans text-sm leading-relaxed text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_template" className="text-[10px] font-bold uppercase tracking-widest text-gm-gold">{t('fieldUserTemplate', undefined, 'Kullanıcı Şablonu (User Message Template)')}</Label>
                <Textarea 
                  id="user_template" 
                  rows={6}
                  value={formData.user_template} 
                  onChange={(e) => setFormData(p => ({ ...p, user_template: e.target.value }))}
                  placeholder="Calculate the daily reading for {{full_name}} born on {{dob}}..."
                  className="border-gm-border-soft bg-gm-bg-deep/10 rounded-2xl p-4 font-sans text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Model Settings */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <BrainCircuit className="size-5 text-gm-gold" />
                {t('cardModel', undefined, 'Model & Parametreler')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('fieldProvider', undefined, 'Sağlayıcı (Provider)')}</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(v) => setFormData(p => ({ ...p, provider: v as LlmProviderId }))}
                >
                  <SelectTrigger id="provider" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gm-border-soft bg-gm-surface text-gm-text rounded-2xl">
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                    <SelectItem value="groq">Groq (Llama)</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                    <SelectItem value="local">Local / Self-hosted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('fieldModelId', undefined, 'Model ID')}</Label>
                <Input 
                  id="model" 
                  value={formData.model} 
                  onChange={(e) => setFormData(p => ({ ...p, model: e.target.value }))}
                  placeholder="gpt-4o / claude-3-5-sonnet"
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('fieldTemperature', undefined, 'Sıcaklık (Temperature)')}: <span className="text-gm-gold font-bold">{formData.temperature}</span></Label>
                </div>
                <Slider 
                  value={[formData.temperature]} 
                  min={0} 
                  max={1.5} 
                  step={0.05} 
                  onValueChange={([v]) => setFormData(p => ({ ...p, temperature: v }))}
                />
                <p className="text-[10px] text-gm-muted/70 italic text-center">{t('temperatureHint', undefined, 'Düşük = Tutarlı, Yüksek = Yaratıcı/Rastgele')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tokens" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('fieldMaxTokens', undefined, 'Maksimum Token')}</Label>
                <Input 
                  id="max_tokens" 
                  type="number"
                  value={formData.max_tokens} 
                  onChange={(e) => setFormData(p => ({ ...p, max_tokens: parseInt(e.target.value) }))}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Validation & Safety */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Zap className="size-5 text-gm-gold" />
                {t('cardProcessing', undefined, 'İşlem Ayarları')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between">
                <Label htmlFor="safety_check" className="text-sm font-medium text-gm-text">{t('fieldSafetyCheck', undefined, 'Güvenlik Kontrolü (Safety Check)')}</Label>
                <Switch 
                  id="safety_check" 
                  checked={formData.safety_check} 
                  onCheckedChange={(v) => setFormData(p => ({ ...p, safety_check: v }))}
                  className="data-[state=checked]:bg-gm-gold"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('fieldCacheThreshold', undefined, 'Önbellek Eşiği (Cache Threshold)')}: <span className="text-gm-gold font-bold">{formData.similarity_threshold}</span></Label>
                </div>
                <Slider 
                  value={[formData.similarity_threshold]} 
                  min={0.5} 
                  max={1.0} 
                  step={0.01} 
                  onValueChange={([v]) => setFormData(p => ({ ...p, similarity_threshold: v }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attempts" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">{t('fieldMaxAttempts', undefined, 'Maksimum Deneme Sayısı')}</Label>
                <Input 
                  id="max_attempts" 
                  type="number"
                  value={formData.max_attempts} 
                  onChange={(e) => setFormData(p => ({ ...p, max_attempts: parseInt(e.target.value) }))}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gm-border-soft/50">
                <Label htmlFor="is_active" className="text-sm font-medium text-gm-text">{t('fieldIsActive', undefined, 'Durum (Aktif mi?)')}</Label>
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                  className="data-[state=checked]:bg-gm-gold"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isCreating || isUpdating} className="w-full bg-gm-gold hover:bg-gm-gold/80 text-gm-bg h-12 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-gm-gold/10 border-transparent">
            <Save className="mr-2 size-5" />
            {isEdit ? t('submitSave', undefined, 'Değişiklikleri Kaydet') : t('submitCreate', undefined, 'Prompt Yapılandırmasını Kaydet')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full h-11 rounded-full text-gm-muted hover:bg-gm-surface/20">{t('cancel', undefined, 'İptal Et')}</Button>
        </div>
      </form>
    </div>
  );
}

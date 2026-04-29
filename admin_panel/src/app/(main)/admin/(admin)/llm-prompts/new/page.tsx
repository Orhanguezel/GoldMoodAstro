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
import {
  useCreateLlmPromptMutation,
  useGetLlmPromptQuery,
  useUpdateLlmPromptMutation,
  useTestLlmPromptMutation,
} from '@/integrations/hooks';
import type { LlmProviderId, LlmPromptTestResult } from '@/integrations/shared';

export default function LlmPromptFormPage() {
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
      toast.error('Key and System Prompt are required.');
      return;
    }

    try {
      if (isEdit) {
        await update({ id, body: formData }).unwrap();
        toast.success('Prompt updated.');
      } else {
        await create(formData).unwrap();
        toast.success('Prompt created.');
      }
      router.push('/admin/llm-prompts');
    } catch {
      toast.error('Operation failed.');
    }
  };

  if (isEdit && isFetching) return <div className="p-8 text-center text-gm-muted">Loading prompt data...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gm-primary">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display text-gm-primary italic">{isEdit ? 'Edit Prompt' : 'New LLM Prompt'}</h1>
          <p className="text-sm text-muted-foreground">Configure AI model behavior and templates for {formData.key || 'this task'}.</p>
        </div>
      </div>

      {/* T19-3 — Test Et paneli (sadece edit modunda) */}
      {isEdit && existing && (
        <Card className="border-gm-border-soft bg-gm-surface/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PlayCircle className="size-4 text-gm-primary" />
              Test Et
            </CardTitle>
            <CardDescription>
              Prompt'u sandbox'ta çalıştır. Hiçbir şey kaydedilmez.
              Variables JSON formatında girin (örn: <code className="bg-gm-bg-deep/40 px-1.5 rounded text-[11px]">{'{ "full_name": "Ahmet", "dob": "1990-05-12" }'}</code>).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label>Variables (JSON)</Label>
              <Textarea
                rows={8}
                value={testVarsRaw}
                onChange={(e) => setTestVarsRaw(e.target.value)}
                placeholder='{ "name": "Ahmet" }'
                className="font-mono text-xs border-gm-border-soft bg-gm-bg-deep/20"
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
                      throw new Error('JSON object beklenir');
                    }
                    vars = parsed as Record<string, unknown>;
                  } catch (e: any) {
                    setTestError(`JSON parse hatası: ${e?.message ?? e}`);
                    return;
                  }
                  try {
                    const res = await testPrompt({ id, body: { vars } }).unwrap();
                    setTestResult(res);
                    if (!res.ok) toast.error(res.error || 'Test başarısız');
                  } catch (err: any) {
                    setTestError(err?.data?.error?.message || err?.message || 'Test başarısız');
                  }
                }}
                disabled={isTesting}
                className="w-full bg-gm-primary hover:bg-gm-primary-dark"
              >
                <PlayCircle className="mr-2 size-4" />
                {isTesting ? 'Çalışıyor...' : 'Test Et'}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Sonuç</Label>
              {testError && (
                <div className="border border-gm-error/30 bg-gm-error/10 rounded-lg p-3 text-sm text-gm-error flex gap-2">
                  <XCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{testError}</span>
                </div>
              )}
              {testResult && testResult.ok && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gm-success">
                    <CheckCircle2 className="size-4" />
                    <span>{testResult.attempts} deneme · {testResult.provider} · {testResult.model}</span>
                  </div>
                  {testResult.safety_flags && testResult.safety_flags.length > 0 && (
                    <div className="text-[10px] text-gm-warning border border-gm-warning/20 rounded px-2 py-1 inline-flex items-center gap-1">
                      <AlertTriangle size={10} /> Safety flags: {testResult.safety_flags.join(', ')}
                    </div>
                  )}
                  {typeof testResult.max_similarity === 'number' && (
                    <div className="text-[10px] text-gm-text-dim">
                      Max similarity: {testResult.max_similarity.toFixed(3)}
                    </div>
                  )}
                  <pre className="border border-gm-border-soft bg-gm-bg-deep/30 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                    {testResult.output ?? ''}
                  </pre>
                </div>
              )}
              {testResult && !testResult.ok && (
                <div className="border border-gm-error/30 bg-gm-error/10 rounded-lg p-3 text-sm text-gm-error flex gap-2">
                  <XCircle className="size-4 mt-0.5 shrink-0" />
                  <span>{testResult.error ?? 'Bilinmeyen hata'}</span>
                </div>
              )}
              {!testResult && !testError && (
                <div className="text-xs text-gm-muted italic border border-dashed border-gm-border-soft rounded-lg p-4 text-center">
                  Test çıktısı burada görünecek.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Core Configuration */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="size-4 text-gm-primary" />
                Prompt Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="key">Prompt Unique Key</Label>
                  <Input 
                    id="key" 
                    value={formData.key} 
                    onChange={(e) => setFormData(p => ({ ...p, key: e.target.value.toUpperCase() }))}
                    placeholder="DAILY_HOROSCOPE_V1"
                    className="border-gm-border-soft bg-gm-bg-deep/30 font-mono"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Used in code to call this specific prompt.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale">Language (Locale)</Label>
                  <Select 
                    value={formData.locale} 
                    onValueChange={(v) => setFormData(p => ({ ...p, locale: v }))}
                  >
                    <SelectTrigger id="locale" className="border-gm-border-soft bg-gm-bg-deep/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tr">Turkish (TR)</SelectItem>
                      <SelectItem value="en">English (EN)</SelectItem>
                      <SelectItem value="de">German (DE)</SelectItem>
                      <SelectItem value="*">All (*)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Purpose</Label>
                <Input 
                  id="notes" 
                  value={formData.notes} 
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="e.g. Used for generating daily personalized astrology readings."
                  className="border-gm-border-soft"
                />
              </div>
            </CardContent>
          </Card>

          {/* Prompt Templates */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Code2 className="size-4 text-gm-primary" />
                Prompt Templates
              </CardTitle>
              <CardDescription>Use {'{{variable}}'} syntax for dynamic values.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="system_prompt" className="text-gm-primary font-bold">System Prompt</Label>
                <Textarea 
                  id="system_prompt" 
                  rows={10}
                  value={formData.system_prompt} 
                  onChange={(e) => setFormData(p => ({ ...p, system_prompt: e.target.value }))}
                  placeholder="You are an expert astrologer with 20 years of experience..."
                  className="border-gm-border-soft bg-gm-bg-deep/20 font-sans text-sm leading-relaxed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_template" className="text-gm-gold font-bold">User Template (User Message)</Label>
                <Textarea 
                  id="user_template" 
                  rows={6}
                  value={formData.user_template} 
                  onChange={(e) => setFormData(p => ({ ...p, user_template: e.target.value }))}
                  placeholder="Calculate the daily reading for {{full_name}} born on {{dob}}..."
                  className="border-gm-border-soft bg-gm-bg-deep/10 font-sans text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Model Settings */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BrainCircuit className="size-4 text-gm-primary" />
                Model & Params
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(v) => setFormData(p => ({ ...p, provider: v as LlmProviderId }))}
                >
                  <SelectTrigger id="provider" className="border-gm-border-soft bg-gm-bg-deep/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                    <SelectItem value="groq">Groq (Llama 4 / 3.3) — hızlı + ucuz</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                    <SelectItem value="local">Local / Self-hosted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model ID</Label>
                <Input 
                  id="model" 
                  value={formData.model} 
                  onChange={(e) => setFormData(p => ({ ...p, model: e.target.value }))}
                  placeholder="gpt-4o / claude-3-5-sonnet"
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <Label>Temperature: <span className="text-gm-gold font-bold">{formData.temperature}</span></Label>
                </div>
                <Slider 
                  value={[formData.temperature]} 
                  min={0} 
                  max={1.5} 
                  step={0.05} 
                  onValueChange={([v]) => setFormData(p => ({ ...p, temperature: v }))}
                />
                <p className="text-[10px] text-muted-foreground italic text-center">Lower = consistent, Higher = creative/random</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tokens">Max Tokens</Label>
                <Input 
                  id="max_tokens" 
                  type="number"
                  value={formData.max_tokens} 
                  onChange={(e) => setFormData(p => ({ ...p, max_tokens: parseInt(e.target.value) }))}
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Validation & Safety */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="size-4 text-gm-primary" />
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="safety_check">Safety Check</Label>
                <Switch 
                  id="safety_check" 
                  checked={formData.safety_check} 
                  onCheckedChange={(v) => setFormData(p => ({ ...p, safety_check: v }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="similarity_threshold">Cache Threshold ({formData.similarity_threshold})</Label>
                <Slider 
                  value={[formData.similarity_threshold]} 
                  min={0.5} 
                  max={1.0} 
                  step={0.01} 
                  onValueChange={([v]) => setFormData(p => ({ ...p, similarity_threshold: v }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_attempts">Max Retries</Label>
                <Input 
                  id="max_attempts" 
                  type="number"
                  value={formData.max_attempts} 
                  onChange={(e) => setFormData(p => ({ ...p, max_attempts: parseInt(e.target.value) }))}
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gm-border-soft">
                <Label htmlFor="is_active">Status (Is Active)</Label>
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isCreating || isUpdating} className="w-full bg-gm-primary hover:bg-gm-primary-dark h-12 text-base">
            <Save className="mr-2 size-5" />
            {isEdit ? 'Update Prompt' : 'Save Configuration'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full text-gm-muted">Cancel</Button>
        </div>
      </form>
    </div>
  );
}

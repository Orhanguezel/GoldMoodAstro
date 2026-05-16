'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Ticket, Users, Calendar, Percent, Coins, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  useCreateCampaignAdminMutation, 
  useGetCampaignAdminQuery, 
  useUpdateCampaignAdminMutation 
} from '@/integrations/hooks';

export default function CampaignFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isEdit = Boolean(id);

  const { data: existing, isLoading: isFetching } = useGetCampaignAdminQuery(id, { skip: !isEdit });
  const [create, { isLoading: isCreating }] = useCreateCampaignAdminMutation();
  const [update, { isLoading: isUpdating }] = useUpdateCampaignAdminMutation();

  const [formData, setFormData] = React.useState({
    code: '',
    name_tr: '',
    name_en: '',
    description_tr: '',
    description_en: '',
    type: 'discount_percentage' as any,
    value: 0,
    max_uses: null as number | null,
    max_uses_per_user: 1,
    starts_at: '',
    ends_at: '',
    applies_to: 'all' as any,
    is_active: true,
  });

  React.useEffect(() => {
    if (existing) {
      setFormData({
        code: existing.code,
        name_tr: existing.name_tr,
        name_en: existing.name_en,
        description_tr: existing.description_tr || '',
        description_en: existing.description_en || '',
        type: existing.type,
        value: existing.value,
        max_uses: existing.max_uses ?? null,
        max_uses_per_user: existing.max_uses_per_user,
        starts_at: existing.starts_at ? existing.starts_at.slice(0, 16) : '',
        ends_at: existing.ends_at ? existing.ends_at.slice(0, 16) : '',
        applies_to: existing.applies_to,
        is_active: !!existing.is_active,
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name_tr || !formData.type) {
      toast.error('Code, Name and Type are required.');
      return;
    }

    const payload = {
      ...formData,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      max_uses: formData.max_uses === 0 ? null : formData.max_uses,
    };

    try {
      if (isEdit) {
        await update({ id, body: payload }).unwrap();
        toast.success('Campaign updated.');
      } else {
        await create(payload).unwrap();
        toast.success('Campaign created.');
      }
      router.push('/admin/campaigns');
    } catch {
      toast.error('Operation failed.');
    }
  };

  if (isEdit && isFetching) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-10 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      {/* Outside Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gm-gold" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">KAMPANYA YÖNETİMİ</span>
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
            <h1 className="font-serif text-4xl text-gm-text">{isEdit ? 'Kampanya Düzenle' : 'Yeni Kampanya Tanımı'}</h1>
          </div>
          <p className="text-sm italic text-gm-muted">Promosyon kurallarını, kampanya tiplerini ve geçerlilik sürelerini yapılandırın.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Info */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Ticket className="size-5 text-gm-gold" />
                Kampanya Kimliği
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Promosyon Kodu (Eşsiz)</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                  placeholder="örn: GOLDEN20"
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono font-bold text-gm-gold"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name_tr" className="text-[10px] font-bold uppercase tracking-widest text-gm-gold">Görünen Ad (TR)</Label>
                  <Input 
                    id="name_tr" 
                    value={formData.name_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, name_tr: e.target.value }))}
                    placeholder="TR Kampanya Adı"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Görünen Ad (EN)</Label>
                  <Input 
                    id="name_en" 
                    value={formData.name_en} 
                    onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))}
                    placeholder="EN Campaign Name"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description_tr" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Açıklama (TR)</Label>
                  <Textarea 
                    id="description_tr" 
                    value={formData.description_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, description_tr: e.target.value }))}
                    placeholder="TR Açıklama"
                    className="border-gm-border-soft bg-gm-bg-deep/10 rounded-2xl p-4 font-sans text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_en" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Açıklama (EN)</Label>
                  <Textarea 
                    id="description_en" 
                    value={formData.description_en} 
                    onChange={(e) => setFormData(p => ({ ...p, description_en: e.target.value }))}
                    placeholder="EN Description"
                    className="border-gm-border-soft bg-gm-bg-deep/10 rounded-2xl p-4 font-sans text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Type & Value */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Percent className="size-5 text-gm-gold" />
                Avantaj Kuralları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kampanya Türü</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData(p => ({ ...p, type: v as any }))}
                  >
                    <SelectTrigger id="type" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gm-border-soft bg-gm-surface text-gm-text rounded-2xl">
                      <SelectItem value="discount_percentage">Yüzdesel İndirim (%)</SelectItem>
                      <SelectItem value="discount_fixed">Sabit Tutar İndirimi (₺)</SelectItem>
                      <SelectItem value="bonus_credits">Hediye Kredi (Bonus)</SelectItem>
                      <SelectItem value="free_trial_days">Ücretsiz Deneme Günleri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Avantaj Değeri</Label>
                  <Input 
                    id="value" 
                    type="number"
                    step="0.01"
                    value={formData.value} 
                    onChange={(e) => setFormData(p => ({ ...p, value: parseFloat(e.target.value) }))}
                    className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-bold"
                  />
                  <p className="text-[10px] text-gm-muted/80 italic pl-1">Değer türe göre yorumlanır (örn. %20 indirim için 20).</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applies_to" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kampanya Kapsamı</Label>
                <Select 
                  value={formData.applies_to} 
                  onValueChange={(v) => setFormData(p => ({ ...p, applies_to: v as any }))}
                >
                  <SelectTrigger id="applies_to" className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gm-border-soft bg-gm-surface text-gm-text rounded-2xl">
                    <SelectItem value="all">Tüm İşlemler</SelectItem>
                    <SelectItem value="subscription">Yalnızca Abonelikler</SelectItem>
                    <SelectItem value="credit_package">Yalnızca Kredi Paketleri</SelectItem>
                    <SelectItem value="consultant_booking">Yalnızca Danışman Randevuları</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Settings */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Clock className="size-5 text-gm-gold" />
                Kullanım Sınırları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active" className="text-sm font-medium text-gm-text">Kampanya Aktif mi?</Label>
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                  className="data-[state=checked]:bg-gm-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Global Kullanım Sınırı (0 = Sınırsız)</Label>
                <Input 
                  id="max_uses" 
                  type="number"
                  value={formData.max_uses ?? 0} 
                  onChange={(e) => setFormData(p => ({ ...p, max_uses: parseInt(e.target.value) || null }))}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses_per_user" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Kullanıcı Başına Sınır</Label>
                <Input 
                  id="max_uses_per_user" 
                  type="number"
                  value={formData.max_uses_per_user} 
                  onChange={(e) => setFormData(p => ({ ...p, max_uses_per_user: parseInt(e.target.value) }))}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Calendar className="size-5 text-gm-gold" />
                Geçerlilik Süresi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <Label htmlFor="starts_at" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Başlangıç Tarihi</Label>
                <Input 
                  id="starts_at" 
                  type="datetime-local" 
                  value={formData.starts_at} 
                  onChange={(e) => setFormData(p => ({ ...p, starts_at: e.target.value }))}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Bitiş Tarihi</Label>
                <Input 
                  id="ends_at" 
                  type="datetime-local" 
                  value={formData.ends_at} 
                  onChange={(e) => setFormData(p => ({ ...p, ends_at: e.target.value }))}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isCreating || isUpdating} className="w-full bg-gm-gold hover:bg-gm-gold/80 text-gm-bg h-12 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-gm-gold/10 border-transparent">
            <Save className="mr-2 size-5" />
            {isEdit ? 'Kampanyayı Güncelle' : 'Kampanyayı Oluştur'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full h-11 rounded-full text-gm-muted hover:bg-gm-surface/20">İptal Et</Button>
        </div>
      </form>
    </div>
  );
}

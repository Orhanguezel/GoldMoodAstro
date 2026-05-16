'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Layout, Globe, Users, Calendar, Image as ImageIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  useCreateBannerAdminMutation, 
  useGetBannerAdminQuery, 
  useListCampaignsAdminQuery,
  useUpdateBannerAdminMutation 
} from '@/integrations/hooks';

export default function BannerFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isEdit = Boolean(id);

  const { data: existing, isLoading: isFetching } = useGetBannerAdminQuery(id, { skip: !isEdit });
  const campaignsQuery = useListCampaignsAdminQuery({ is_active: true, limit: 100 });
  const [create, { isLoading: isCreating }] = useCreateBannerAdminMutation();
  const [update, { isLoading: isUpdating }] = useUpdateBannerAdminMutation();

  const [formData, setFormData] = React.useState({
    code: '',
    title_tr: '',
    title_en: '',
    subtitle_tr: '',
    subtitle_en: '',
    image_url: '',
    image_url_mobile: '',
    link_url: '',
    cta_label_tr: '',
    cta_label_en: '',
    placement: 'home_hero' as any,
    locale: '*',
    target_segment: 'all' as any,
    campaign_id: '',
    priority: 0,
    is_active: true,
    starts_at: '',
    ends_at: '',
  });

  React.useEffect(() => {
    if (existing) {
      setFormData({
        code: existing.code,
        title_tr: existing.title_tr || '',
        title_en: existing.title_en || '',
        subtitle_tr: existing.subtitle_tr || '',
        subtitle_en: existing.subtitle_en || '',
        image_url: existing.image_url || '',
        image_url_mobile: existing.image_url_mobile || '',
        link_url: existing.link_url || '',
        cta_label_tr: existing.cta_label_tr || '',
        cta_label_en: existing.cta_label_en || '',
        placement: existing.placement,
        locale: existing.locale,
        target_segment: existing.target_segment,
        campaign_id: existing.campaign_id || '',
        priority: existing.priority,
        is_active: !!existing.is_active,
        starts_at: existing.starts_at ? existing.starts_at.slice(0, 16) : '',
        ends_at: existing.ends_at ? existing.ends_at.slice(0, 16) : '',
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.image_url || !formData.placement) {
      toast.error('Code, Image URL and Placement are required.');
      return;
    }

    const payload = {
      ...formData,
      campaign_id: formData.campaign_id || null,
      starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
      ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
    };

    try {
      if (isEdit) {
        await update({ id, body: payload }).unwrap();
        toast.success('Banner updated.');
      } else {
        await create(payload).unwrap();
        toast.success('Banner created.');
      }
      router.push('/admin/banners');
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
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gm-gold">REKLAM & BANNER YÖNETİMİ</span>
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
            <h1 className="font-serif text-4xl text-gm-text">{isEdit ? 'Banner Düzenle' : 'Yeni Banner Tanımı'}</h1>
          </div>
          <p className="text-sm italic text-gm-muted">Görsel reklamları, promosyon içeriklerini ve gösterim alanlarını yapılandırın.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Info */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Layout className="size-5 text-gm-gold" />
                İçerik Detayları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Eşsiz Referans Kodu</Label>
                  <Input 
                    id="code" 
                    value={formData.code} 
                    onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))}
                    placeholder="örn: SUMMER_SALE_2026"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placement" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Gösterim Yeri (Slot)</Label>
                  <Select 
                    value={formData.placement} 
                    onValueChange={(v) => setFormData(p => ({ ...p, placement: v as any }))}
                  >
                    <SelectTrigger id="placement" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/30 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-gm-border-soft bg-gm-surface text-gm-text rounded-2xl">
                      <SelectItem value="home_hero">Ana Sayfa Hero</SelectItem>
                      <SelectItem value="home_sidebar">Ana Sayfa Kenar Çubuğu</SelectItem>
                      <SelectItem value="home_footer">Ana Sayfa Alt Alanı</SelectItem>
                      <SelectItem value="consultant_list">Danışman Listesi</SelectItem>
                      <SelectItem value="mobile_welcome">Mobil Karşılama Ekranı</SelectItem>
                      <SelectItem value="mobile_home">Mobil Ana Sayfa</SelectItem>
                      <SelectItem value="mobile_call_end">Mobil Arama Sonu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="title_tr" className="text-[10px] font-bold uppercase tracking-widest text-gm-gold">Başlık (TR)</Label>
                  <Input 
                    id="title_tr" 
                    value={formData.title_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, title_tr: e.target.value }))}
                    placeholder="TR Başlık"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_en" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Başlık (EN)</Label>
                  <Input 
                    id="title_en" 
                    value={formData.title_en} 
                    onChange={(e) => setFormData(p => ({ ...p, title_en: e.target.value }))}
                    placeholder="EN Title"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subtitle_tr" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Alt Başlık (TR)</Label>
                  <Input 
                    id="subtitle_tr" 
                    value={formData.subtitle_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, subtitle_tr: e.target.value }))}
                    placeholder="TR Alt Başlık"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle_en" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Alt Başlık (EN)</Label>
                  <Input 
                    id="subtitle_en" 
                    value={formData.subtitle_en} 
                    onChange={(e) => setFormData(p => ({ ...p, subtitle_en: e.target.value }))}
                    placeholder="EN Subtitle"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-6 border-gm-border-soft/50 mt-2">
                <Label htmlFor="link_url" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Hedef Link Adresi (URL)</Label>
                <Input 
                  id="link_url" 
                  value={formData.link_url} 
                  onChange={(e) => setFormData(p => ({ ...p, link_url: e.target.value }))}
                  placeholder="https://goldmoodastro.com/campaign"
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cta_label_tr" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Buton Metni (TR)</Label>
                  <Input 
                    id="cta_label_tr" 
                    value={formData.cta_label_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, cta_label_tr: e.target.value }))}
                    placeholder="Hemen İncele"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta_label_en" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Buton Metni (EN)</Label>
                  <Input 
                    id="cta_label_en" 
                    value={formData.cta_label_en} 
                    onChange={(e) => setFormData(p => ({ ...p, cta_label_en: e.target.value }))}
                    placeholder="Check Out"
                    className="h-11 rounded-full border-gm-border-soft bg-gm-surface/10 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visuals */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <ImageIcon className="size-5 text-gm-gold" />
                Görsel Medya Alanları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <Label htmlFor="image_url" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Masaüstü / Genel Görsel Linki (URL)</Label>
                <Input 
                  id="image_url" 
                  value={formData.image_url} 
                  onChange={(e) => setFormData(p => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://cloudinary.com/..."
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {formData.image_url && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-gm-border-soft bg-gm-bg-deep p-2 flex items-center justify-center">
                    <img src={formData.image_url} alt="Preview" className="max-h-48 rounded-xl object-contain" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url_mobile" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Mobil Görsel Linki (URL - Opsiyonel)</Label>
                <Input 
                  id="image_url_mobile" 
                  value={formData.image_url_mobile} 
                  onChange={(e) => setFormData(p => ({ ...p, image_url_mobile: e.target.value }))}
                  placeholder="https://cloudinary.com/..."
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text placeholder:text-gm-muted/50 focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                {formData.image_url_mobile && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-gm-border-soft bg-gm-bg-deep p-2 flex items-center justify-center">
                    <img src={formData.image_url_mobile} alt="Mobile Preview" className="max-h-48 rounded-xl object-contain" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Settings */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Globe className="size-5 text-gm-gold" />
                Hedef Kitle & Görünürlük
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active" className="text-sm font-medium text-gm-text">Banner Aktif mi?</Label>
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                  className="data-[state=checked]:bg-gm-gold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locale" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Dil Filtresi</Label>
                <Select 
                  value={formData.locale} 
                  onValueChange={(v) => setFormData(p => ({ ...p, locale: v }))}
                >
                  <SelectTrigger id="locale" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gm-border-soft bg-gm-surface text-gm-text rounded-2xl">
                    <SelectItem value="*">Tüm Diller (*)</SelectItem>
                    <SelectItem value="tr">Türkçe (TR)</SelectItem>
                    <SelectItem value="en">İngilizce (EN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_segment" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Hedef Segment</Label>
                <Select 
                  value={formData.target_segment} 
                  onValueChange={(v) => setFormData(p => ({ ...p, target_segment: v as any }))}
                >
                  <SelectTrigger id="target_segment" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gm-border-soft bg-gm-surface text-gm-text rounded-2xl">
                    <SelectItem value="all">Herkes</SelectItem>
                    <SelectItem value="free">Ücretsiz Kullanıcılar</SelectItem>
                    <SelectItem value="paid">Ücretli Aboneler</SelectItem>
                    <SelectItem value="new_user">Yeni Kayıtlı Kullanıcılar (v2)</SelectItem>
                    <SelectItem value="existing_user">Mevcut Kullanıcılar (v2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign_id" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Bağlantılı Kampanya</Label>
                <Select
                  value={formData.campaign_id || 'none'}
                  onValueChange={(v) => setFormData(p => ({ ...p, campaign_id: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger id="campaign_id" className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <SelectValue placeholder="Kampanya seçilmedi" />
                  </SelectTrigger>
                  <SelectContent className="border-gm-border-soft bg-gm-surface text-gm-text rounded-2xl max-h-60 overflow-y-auto">
                    <SelectItem value="none">Kampanya bağlantısı yok</SelectItem>
                    {campaignsQuery.data?.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.code} — {campaign.name_tr || campaign.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gm-muted/80 italic pl-1">
                  Banner tıklandığında kupon/kampanya tetiklemek için kullanın.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Gösterim Önceliği</Label>
                <Input 
                  id="priority" 
                  type="number"
                  value={formData.priority} 
                  onChange={(e) => setFormData(p => ({ ...p, priority: parseInt(e.target.value) }))}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <p className="text-[10px] text-gm-muted/80 italic pl-1">Yüksek sayı = önce listelenir</p>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="overflow-hidden rounded-[32px] border-gm-border-soft bg-gm-surface/20 shadow-xl backdrop-blur-sm">
            <CardHeader className="border-b border-gm-border-soft/50 pb-6 px-8 pt-8">
              <CardTitle className="font-serif text-xl text-gm-text flex items-center gap-2">
                <Calendar className="size-5 text-gm-gold" />
                Planlama Takvimi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-2">
                <Label htmlFor="starts_at" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Yayın Başlangıcı</Label>
                <Input 
                  id="starts_at" 
                  type="datetime-local" 
                  value={formData.starts_at} 
                  onChange={(e) => setFormData(p => ({ ...p, starts_at: e.target.value }))}
                  className="h-11 rounded-full border-gm-border-soft bg-gm-bg-deep/20 px-5 text-sm text-gm-text focus:border-gm-gold/50 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at" className="text-[10px] font-bold uppercase tracking-widest text-gm-muted">Yayın Bitişi</Label>
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
            {isEdit ? 'Bannerı Güncelle' : 'Bannerı Oluştur'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full h-11 rounded-full text-gm-muted hover:bg-gm-surface/20">İptal Et</Button>
        </div>
      </form>
    </div>
  );
}

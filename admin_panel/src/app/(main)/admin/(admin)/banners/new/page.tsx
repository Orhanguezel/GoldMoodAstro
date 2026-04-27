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
  useUpdateBannerAdminMutation 
} from '@/integrations/hooks';

export default function BannerFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isEdit = Boolean(id);

  const { data: existing, isLoading: isFetching } = useGetBannerAdminQuery(id, { skip: !isEdit });
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gm-primary">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display text-gm-primary italic">{isEdit ? 'Edit Banner' : 'New Banner'}</h1>
          <p className="text-sm text-muted-foreground">Configure your banner details and placement.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Info */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layout className="size-4 text-gm-primary" />
                Content Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Unique Code (Reference)</Label>
                  <Input 
                    id="code" 
                    value={formData.code} 
                    onChange={(e) => setFormData(p => ({ ...p, code: e.target.value }))}
                    placeholder="e.g. SUMMER_SALE_2026"
                    className="border-gm-border-soft focus:border-gm-primary bg-gm-bg-deep/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="placement">Placement Slot</Label>
                  <Select 
                    value={formData.placement} 
                    onValueChange={(v) => setFormData(p => ({ ...p, placement: v as any }))}
                  >
                    <SelectTrigger id="placement" className="border-gm-border-soft bg-gm-bg-deep/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_hero">Home Hero</SelectItem>
                      <SelectItem value="home_sidebar">Home Sidebar</SelectItem>
                      <SelectItem value="home_footer">Home Footer</SelectItem>
                      <SelectItem value="consultant_list">Consultant List</SelectItem>
                      <SelectItem value="mobile_welcome">Mobile Welcome</SelectItem>
                      <SelectItem value="mobile_home">Mobile Home</SelectItem>
                      <SelectItem value="mobile_call_end">Mobile Call End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="title_tr" className="text-gm-primary font-medium">Title (TR)</Label>
                  <Input 
                    id="title_tr" 
                    value={formData.title_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, title_tr: e.target.value }))}
                    placeholder="TR Başlık"
                    className="border-gm-border-soft"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_en">Title (EN)</Label>
                  <Input 
                    id="title_en" 
                    value={formData.title_en} 
                    onChange={(e) => setFormData(p => ({ ...p, title_en: e.target.value }))}
                    placeholder="EN Title"
                    className="border-gm-border-soft"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subtitle_tr">Subtitle (TR)</Label>
                  <Input 
                    id="subtitle_tr" 
                    value={formData.subtitle_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, subtitle_tr: e.target.value }))}
                    placeholder="TR Alt Başlık"
                    className="border-gm-border-soft"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle_en">Subtitle (EN)</Label>
                  <Input 
                    id="subtitle_en" 
                    value={formData.subtitle_en} 
                    onChange={(e) => setFormData(p => ({ ...p, subtitle_en: e.target.value }))}
                    placeholder="EN Subtitle"
                    className="border-gm-border-soft"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4 border-gm-border-soft mt-2">
                <Label htmlFor="link_url">Destination Link (URL)</Label>
                <Input 
                  id="link_url" 
                  value={formData.link_url} 
                  onChange={(e) => setFormData(p => ({ ...p, link_url: e.target.value }))}
                  placeholder="https://goldmoodastro.com/campaign"
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cta_label_tr">CTA Label (TR)</Label>
                  <Input 
                    id="cta_label_tr" 
                    value={formData.cta_label_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, cta_label_tr: e.target.value }))}
                    placeholder="Hemen İncele"
                    className="border-gm-border-soft"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta_label_en">CTA Label (EN)</Label>
                  <Input 
                    id="cta_label_en" 
                    value={formData.cta_label_en} 
                    onChange={(e) => setFormData(p => ({ ...p, cta_label_en: e.target.value }))}
                    placeholder="Check Out"
                    className="border-gm-border-soft"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visuals */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="size-4 text-gm-primary" />
                Banner Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">Desktop/General Image URL</Label>
                <Input 
                  id="image_url" 
                  value={formData.image_url} 
                  onChange={(e) => setFormData(p => ({ ...p, image_url: e.target.value }))}
                  placeholder="https://cloudinary.com/..."
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
                {formData.image_url && (
                  <div className="mt-2 h-32 w-full overflow-hidden rounded-md border border-gm-border-soft bg-gm-bg-deep">
                    <img src={formData.image_url} alt="Preview" className="h-full w-full object-contain" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url_mobile">Mobile Image URL (Optional)</Label>
                <Input 
                  id="image_url_mobile" 
                  value={formData.image_url_mobile} 
                  onChange={(e) => setFormData(p => ({ ...p, image_url_mobile: e.target.value }))}
                  placeholder="https://cloudinary.com/..."
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
                {formData.image_url_mobile && (
                  <div className="mt-2 h-32 w-full overflow-hidden rounded-md border border-gm-border-soft bg-gm-bg-deep">
                    <img src={formData.image_url_mobile} alt="Mobile Preview" className="h-full w-full object-contain" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Settings */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="size-4 text-gm-primary" />
                Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Is Active</Label>
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locale">Locale / Language</Label>
                <Select 
                  value={formData.locale} 
                  onValueChange={(v) => setFormData(p => ({ ...p, locale: v }))}
                >
                  <SelectTrigger id="locale" className="border-gm-border-soft bg-gm-bg-deep/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">All Languages (*)</SelectItem>
                    <SelectItem value="tr">Turkish (TR)</SelectItem>
                    <SelectItem value="en">English (EN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_segment">Target Segment</Label>
                <Select 
                  value={formData.target_segment} 
                  onValueChange={(v) => setFormData(p => ({ ...p, target_segment: v as any }))}
                >
                  <SelectTrigger id="target_segment" className="border-gm-border-soft bg-gm-bg-deep/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="free">Free Users</SelectItem>
                    <SelectItem value="paid">Subscribers</SelectItem>
                    <SelectItem value="new_user">New Users</SelectItem>
                    <SelectItem value="existing_user">Existing Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Display Priority</Label>
                <Input 
                  id="priority" 
                  type="number"
                  value={formData.priority} 
                  onChange={(e) => setFormData(p => ({ ...p, priority: parseInt(e.target.value) }))}
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
                <p className="text-[10px] text-muted-foreground italic">Higher number = shows first</p>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-gm-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Starts At</Label>
                <Input 
                  id="starts_at" 
                  type="datetime-local" 
                  value={formData.starts_at} 
                  onChange={(e) => setFormData(p => ({ ...p, starts_at: e.target.value }))}
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">Ends At</Label>
                <Input 
                  id="ends_at" 
                  type="datetime-local" 
                  value={formData.ends_at} 
                  onChange={(e) => setFormData(p => ({ ...p, ends_at: e.target.value }))}
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isCreating || isUpdating} className="w-full bg-gm-primary hover:bg-gm-primary-dark">
            <Save className="mr-2 size-4" />
            {isEdit ? 'Update Banner' : 'Create Banner'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full text-gm-muted">Cancel</Button>
        </div>
      </form>
    </div>
  );
}

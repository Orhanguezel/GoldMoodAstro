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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gm-primary">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display text-gm-primary italic">{isEdit ? 'Edit Campaign' : 'New Campaign'}</h1>
          <p className="text-sm text-muted-foreground">Define promotion rules, types and validity.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Main Info */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="size-4 text-gm-primary" />
                Campaign Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Promo Code (Unique)</Label>
                <Input 
                  id="code" 
                  value={formData.code} 
                  onChange={(e) => setFormData(p => ({ ...p, code: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                  placeholder="e.g. GOLDEN20"
                  className="border-gm-border-soft focus:border-gm-primary bg-gm-bg-deep/30 font-mono font-bold text-gm-gold"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name_tr" className="text-gm-primary font-medium">Display Name (TR)</Label>
                  <Input 
                    id="name_tr" 
                    value={formData.name_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, name_tr: e.target.value }))}
                    placeholder="TR Kampanya Adı"
                    className="border-gm-border-soft"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name_en">Display Name (EN)</Label>
                  <Input 
                    id="name_en" 
                    value={formData.name_en} 
                    onChange={(e) => setFormData(p => ({ ...p, name_en: e.target.value }))}
                    placeholder="EN Campaign Name"
                    className="border-gm-border-soft"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="description_tr">Description (TR)</Label>
                  <Textarea 
                    id="description_tr" 
                    value={formData.description_tr} 
                    onChange={(e) => setFormData(p => ({ ...p, description_tr: e.target.value }))}
                    placeholder="TR Açıklama"
                    className="border-gm-border-soft"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description_en">Description (EN)</Label>
                  <Textarea 
                    id="description_en" 
                    value={formData.description_en} 
                    onChange={(e) => setFormData(p => ({ ...p, description_en: e.target.value }))}
                    placeholder="EN Description"
                    className="border-gm-border-soft"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Type & Value */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="size-4 text-gm-primary" />
                Benefit Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Promotion Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v) => setFormData(p => ({ ...p, type: v as any }))}
                  >
                    <SelectTrigger id="type" className="border-gm-border-soft bg-gm-bg-deep/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount_percentage">Percentage Discount (%)</SelectItem>
                      <SelectItem value="discount_fixed">Fixed Amount Discount (₺)</SelectItem>
                      <SelectItem value="bonus_credits">Bonus Credits</SelectItem>
                      <SelectItem value="free_trial_days">Free Trial Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Benefit Value</Label>
                  <Input 
                    id="value" 
                    type="number"
                    step="0.01"
                    value={formData.value} 
                    onChange={(e) => setFormData(p => ({ ...p, value: parseFloat(e.target.value) }))}
                    className="border-gm-border-soft bg-gm-bg-deep/30 font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground italic">Value depends on type (e.g. 20 for 20%)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="applies_to">Applies To</Label>
                <Select 
                  value={formData.applies_to} 
                  onValueChange={(v) => setFormData(p => ({ ...p, applies_to: v as any }))}
                >
                  <SelectTrigger id="applies_to" className="border-gm-border-soft">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="subscription">Subscriptions Only</SelectItem>
                    <SelectItem value="credit_package">Credit Packages Only</SelectItem>
                    <SelectItem value="consultant_booking">Consultant Bookings Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Settings */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="size-4 text-gm-primary" />
                Usage Limits
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
                <Label htmlFor="max_uses">Total Global Limit (0 = ∞)</Label>
                <Input 
                  id="max_uses" 
                  type="number"
                  value={formData.max_uses ?? 0} 
                  onChange={(e) => setFormData(p => ({ ...p, max_uses: parseInt(e.target.value) || null }))}
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses_per_user">Limit Per User</Label>
                <Input 
                  id="max_uses_per_user" 
                  type="number"
                  value={formData.max_uses_per_user} 
                  onChange={(e) => setFormData(p => ({ ...p, max_uses_per_user: parseInt(e.target.value) }))}
                  className="border-gm-border-soft bg-gm-bg-deep/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="border-gm-border-soft bg-gm-surface/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="size-4 text-gm-primary" />
                Validity Period
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

          <Button type="submit" disabled={isCreating || isUpdating} className="w-full bg-gm-primary hover:bg-gm-primary-dark shadow-gm-shadow-glow">
            <Save className="mr-2 size-4" />
            {isEdit ? 'Update Campaign' : 'Create Campaign'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="w-full text-gm-muted">Cancel</Button>
        </div>
      </form>
    </div>
  );
}

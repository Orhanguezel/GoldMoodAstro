'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Save, Megaphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  useCreateAnnouncementAdminMutation, 
  useGetAnnouncementAdminQuery, 
  useUpdateAnnouncementAdminMutation 
} from '@/integrations/hooks';

export default function AnnouncementFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isEdit = Boolean(id);

  const { data: existing, isLoading: isFetching } = useGetAnnouncementAdminQuery(id, { skip: !isEdit });
  const [create, { isLoading: isCreating }] = useCreateAnnouncementAdminMutation();
  const [update, { isLoading: isUpdating }] = useUpdateAnnouncementAdminMutation();

  const [formData, setFormData] = React.useState({
    title: '',
    body: '',
    audience: 'all' as 'all' | 'users' | 'consultants',
    is_active: true,
    starts_at: '',
    ends_at: '',
  });

  React.useEffect(() => {
    if (existing) {
      setFormData({
        title: existing.title,
        body: existing.body,
        audience: existing.audience,
        is_active: existing.is_active,
        starts_at: existing.starts_at ? existing.starts_at.slice(0, 10) : '',
        ends_at: existing.ends_at ? existing.ends_at.slice(0, 10) : '',
      });
    }
  }, [existing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      toast.error('Title and body are required.');
      return;
    }

    try {
      if (isEdit) {
        await update({ id, patch: formData }).unwrap();
        toast.success('Announcement updated.');
      } else {
        await create(formData).unwrap();
        toast.success('Announcement created.');
      }
      router.push('/admin/announcements');
    } catch {
      toast.error('Operation failed.');
    }
  };

  if (isEdit && isFetching) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Announcement' : 'New Announcement'}</h1>
          <p className="text-sm text-muted-foreground">Fill in the details to publish an announcement.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Announcement Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. New Feature Release"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message Body</Label>
              <Textarea 
                id="body" 
                className="min-h-[150px]"
                value={formData.body} 
                onChange={(e) => setFormData(p => ({ ...p, body: e.target.value }))}
                placeholder="Write your announcement here..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select 
                  value={formData.audience} 
                  onValueChange={(v) => setFormData(p => ({ ...p, audience: v as any }))}
                >
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Everyone</SelectItem>
                    <SelectItem value="users">Users Only</SelectItem>
                    <SelectItem value="consultants">Consultants Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-8">
                <Switch 
                  id="is_active" 
                  checked={formData.is_active} 
                  onCheckedChange={(v) => setFormData(p => ({ ...p, is_active: v }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="starts_at">Starts At (Optional)</Label>
                <Input 
                  id="starts_at" 
                  type="date" 
                  value={formData.starts_at} 
                  onChange={(e) => setFormData(p => ({ ...p, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends_at">Ends At (Optional)</Label>
                <Input 
                  id="ends_at" 
                  type="date" 
                  value={formData.ends_at} 
                  onChange={(e) => setFormData(p => ({ ...p, ends_at: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end border-t pt-6">
            <Button type="button" variant="outline" onClick={() => router.back()} className="mr-2">Cancel</Button>
            <Button type="submit" disabled={isCreating || isUpdating} className="bg-amethyst hover:bg-amethyst/90">
              <Save className="mr-2 size-4" />
              {isEdit ? 'Update Announcement' : 'Create Announcement'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

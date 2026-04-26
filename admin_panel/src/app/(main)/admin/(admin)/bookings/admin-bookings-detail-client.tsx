'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/bookings/admin-bookings-detail-client.tsx
// Admin Booking Create/Edit Client
// =============================================================

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useAdminT } from '@/app/(main)/admin/_components/common/useAdminT';

import type { BookingMergedDto, BookingAdminCreatePayload, BookingAdminUpdatePayload } from '@/integrations/shared';
import {
  useCreateBookingAdminMutation,
  useGetBookingAdminQuery,
  useUpdateBookingAdminMutation,
} from '@/integrations/hooks';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { BookingForm, type BookingFormValues } from './booking-form';

function getErrMessage(err: unknown, fallback: string): string {
  const anyErr = err as any;
  const m1 = anyErr?.data?.error?.message;
  if (typeof m1 === 'string' && m1.trim()) return m1;
  const m2 = anyErr?.data?.message;
  if (typeof m2 === 'string' && m2.trim()) return m2;
  const m3 = anyErr?.message;
  if (typeof m3 === 'string' && m3.trim()) return m3;
  return fallback;
}

export default function AdminBookingsDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useAdminT('admin.bookings');

  const isCreateMode = String(id) === 'new';

  const q = useGetBookingAdminQuery(
    { id: String(id) },
    { skip: isCreateMode } as any,
  );

  const initialData = (q.data as any as BookingMergedDto | undefined) ?? undefined;

  const [createBooking, createState] = useCreateBookingAdminMutation();
  const [updateBooking, updateState] = useUpdateBookingAdminMutation();

  const loading = q.isLoading || q.isFetching;
  const saving = createState.isLoading || updateState.isLoading;

  const onCancel = () => router.push('/admin/bookings');

  if (isCreateMode) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-semibold">{t('messages.createUnavailableTitle')}</div>
          <div className="text-sm text-muted-foreground">{t('messages.createUnavailableDescription')}</div>
          <div>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('actions.backToList')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (values: BookingFormValues) => {
    try {
      if (isCreateMode) {
        const payload: BookingAdminCreatePayload = {
          locale: values.locale || undefined,
          name: values.name,
          email: values.email,
          phone: values.phone,
          appointment_date: values.appointment_date,
          appointment_time: values.appointment_time,
          resource_id: values.resource_id,
          service_id: values.service_id || undefined,
          customer_message: values.customer_message || undefined,
          status: values.status || undefined,
          is_read: values.is_read,
          admin_note: values.admin_note || undefined,
        };

        await createBooking(payload as any).unwrap();
        toast.success(t('messages.created'));
        router.push('/admin/bookings');
        router.refresh();
        return;
      }

      const patch: BookingAdminUpdatePayload = {
        locale: values.locale || undefined,
        name: values.name || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        customer_message: values.customer_message ? values.customer_message : null,
        service_id: values.service_id ? values.service_id : null,
        resource_id: values.resource_id ? values.resource_id : null,
        appointment_date: values.appointment_date || undefined,
        appointment_time: values.appointment_time ? values.appointment_time : null,
        status: values.status || undefined,
        is_read: values.is_read,
        admin_note: values.admin_note ? values.admin_note : null,
        decision_note: values.decision_note ? values.decision_note : null,
      };

      await updateBooking({ id: String(id), patch } as any).unwrap();
      toast.success(t('messages.updated'));
      router.refresh();
    } catch (err) {
      toast.error(getErrMessage(err, t('messages.genericError')));
    }
  };

  if (!isCreateMode && q.error) {
    return (
      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="text-sm font-semibold">{t('messages.loadError')}</div>
          <div className="text-sm text-muted-foreground">
            {getErrMessage(q.error, t('messages.genericError'))}
          </div>
          <div>
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('actions.backToList')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <BookingForm
      mode={isCreateMode ? 'create' : 'edit'}
      initialData={isCreateMode ? undefined : initialData}
      loading={loading}
      saving={saving}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}

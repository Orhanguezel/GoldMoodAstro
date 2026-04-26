"use client";

// =============================================================
// FILE: src/app/(main)/admin/(admin)/availability/admin-availability-detail-client.tsx
// guezelwebdesign — Admin Availability Detail (Resource + Weekly + Daily)
// FINAL — App Router client
// =============================================================

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { AvailabilityResourceValues } from "@/integrations/shared";
import { isUuidLike } from "@/integrations/shared";
import {
  useCreateResourceAdminMutation,
  useGetResourceAdminQuery,
  useUpdateResourceAdminMutation,
} from "@/integrations/hooks";

import { AvailabilityForm } from "./availability-form";
import { getApiErrorMessage } from "./availability-utils";
import { useAdminT } from "@/app/(main)/admin/_components/common/useAdminT";

export default function AdminAvailabilityDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const t = useAdminT();
  const safeId = String(id ?? "").trim();
  const isNew = safeId === "new";
  const isValidId = isUuidLike(safeId);

  const getQ = useGetResourceAdminQuery(safeId, {
    skip: isNew || !isValidId,
    refetchOnMountOrArgChange: true,
  });

  const [createResource, createState] = useCreateResourceAdminMutation();
  const [updateResource, updateState] = useUpdateResourceAdminMutation();

  const loading = getQ.isLoading || getQ.isFetching;
  const saving = createState.isLoading || updateState.isLoading;

  React.useEffect(() => {
    if (!isNew && !isValidId) {
      toast.error(t("availability.form.messages.invalidId"));
    }
  }, [isNew, isValidId]);

  const handleSubmit = async (values: AvailabilityResourceValues) => {
    try {
      if (isNew) {
        const created = await createResource(values).unwrap();
        const newId = String(created?.id ?? "").trim();
        toast.success(t("availability.form.messages.createSuccess"));
        if (isUuidLike(newId)) {
          router.replace(`/admin/availability/${encodeURIComponent(newId)}`);
        } else {
          router.replace("/admin/availability");
        }
        return;
      }

      await updateResource({ id: safeId, patch: values }).unwrap();
      toast.success(t("availability.form.messages.updateSuccess"));
      await getQ.refetch();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (!isNew && !isValidId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("availability.form.messages.invalidId")}</CardTitle>
          <CardDescription>{t("availability.form.messages.notFoundDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => router.push("/admin/availability")}>
            {t("availability.form.messages.returnToList")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isNew && getQ.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("availability.form.messages.notFound")}</CardTitle>
          <CardDescription>{t("availability.form.messages.notFoundDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => router.push("/admin/availability")}>
            {t("availability.form.messages.returnToList")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AvailabilityForm
        mode={isNew ? "create" : "edit"}
        initialData={isNew ? undefined : getQ.data}
        loading={loading}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/admin/availability")}
      />
    </div>
  );
}

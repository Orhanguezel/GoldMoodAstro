"use client";

import * as React from "react";

import { RadioTower, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetLiveKitAdminStatusQuery,
  useGetSiteSettingAdminByKeyQuery,
  useUpdateSiteSettingAdminMutation,
} from "@/integrations/hooks";
import { toBool } from "@/integrations/shared";

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? <Badge>Aktif</Badge> : <Badge variant="destructive">Eksik</Badge>;
}

export function LiveKitTab() {
  const { data, isLoading, isFetching, refetch } = useGetLiveKitAdminStatusQuery();
  const {
    data: featureSetting,
    isLoading: isFeatureLoading,
    isFetching: isFeatureFetching,
    refetch: refetchFeature,
  } = useGetSiteSettingAdminByKeyQuery("feature_video_enabled");
  const [updateFeatureSetting, { isLoading: isSavingFeature }] = useUpdateSiteSettingAdminMutation();

  const [featureVideoEnabled, setFeatureVideoEnabled] = React.useState<boolean>(false);
  const [featureVideoDraft, setFeatureVideoDraft] = React.useState<boolean>(false);
  const [featureChanged, setFeatureChanged] = React.useState<boolean>(false);

  const featureBusy = isFeatureLoading || isFeatureFetching || isSavingFeature;
  const busy = isLoading || isFetching;

  React.useEffect(() => {
    const parsed = toBool(featureSetting?.value, false);
    setFeatureVideoEnabled(parsed);
    setFeatureVideoDraft(parsed);
    setFeatureChanged(false);
  }, [featureSetting?.value]);

  const saveFeatureEnabled = async () => {
    try {
      await updateFeatureSetting({
        key: "feature_video_enabled",
        value: featureVideoDraft,
        locale: "*",
      }).unwrap();

      setFeatureVideoEnabled(featureVideoDraft);
      setFeatureChanged(false);
      toast.success("Video görüşme flagi güncellendi.");
      await refetchFeature();
    } catch {
      toast.error("Video görüşme flagi kaydedilemedi.");
      setFeatureVideoDraft(featureVideoEnabled);
      setFeatureChanged(false);
    }
  };

  const handleFeatureToggle = (checked: boolean | "indeterminate") => {
    const next = checked === "indeterminate" ? !featureVideoDraft : checked;
    setFeatureVideoDraft(next);
    setFeatureChanged(next !== featureVideoEnabled);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <RadioTower className="size-4" />
              LiveKit Durumu
            </CardTitle>
            <CardDescription>
              LiveKit değerleri backend .env dosyasından okunur. Secret alanlar admin panelde sadece maskeleme ve
              yapılandırma durumu olarak gösterilir.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={busy}>
            <RefreshCcw className="mr-2 size-4" />
            Yenile
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge ok={Boolean(data?.configured)} />
            <Badge variant="outline">
              Aktif oda: {data?.active_rooms === null || data?.active_rooms === undefined ? "-" : data.active_rooms}
            </Badge>
            {data?.rooms_error ? <Badge variant="destructive">Room API hata</Badge> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>LIVEKIT_URL</Label>
              <Input value={data?.livekit_url ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label>LIVEKIT_API_KEY</Label>
              <Input value={data?.api_key_masked ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Webhook Signing Key</Label>
              <Input value={data?.webhook_signing_key_configured ? "Tanımlı" : "Eksik"} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Aktif Oda Sayısı</Label>
              <Input
                value={
                  data?.active_rooms === null || data?.active_rooms === undefined ? "-" : String(data.active_rooms)
                }
                readOnly
              />
            </div>
          </div>

          {data?.rooms_error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
              {data.rooms_error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">Video Görüşme Özelliği</CardTitle>
            <CardDescription>
              `feature_video_enabled` ile video akışı global olarak açılır/kapatılır. Sistem sadece bu bayrağın true
              olduğu durumlarda video akışını aktive etmeye hazırdır.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => refetchFeature()} disabled={featureBusy}>
            <RefreshCcw className="mr-2 size-4" />
            {featureBusy ? "Yükleniyor..." : "Yenile"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {featureBusy ? <div className="text-muted-foreground text-sm">Ayar yükleniyor...</div> : null}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="feature-video-enabled"
                checked={featureVideoDraft}
                onCheckedChange={handleFeatureToggle}
                disabled={featureBusy}
              />
              <Label htmlFor="feature-video-enabled" className="text-sm">
                Video görüşmeleri aktif
              </Label>
            </div>
            <Button type="button" onClick={saveFeatureEnabled} disabled={featureBusy || !featureChanged}>
              {isSavingFeature ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={featureVideoEnabled ? "default" : "outline"}>
              {featureVideoEnabled ? "Aktif" : "Pasif"}
            </Badge>
            <Badge variant="secondary">Kayıtlı değer: {featureVideoEnabled ? "1" : "0"}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

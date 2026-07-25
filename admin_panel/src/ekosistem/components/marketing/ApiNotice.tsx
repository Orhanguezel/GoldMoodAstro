import { AlertCircle, Settings } from "lucide-react";

// "Kimlik yapılandırılmadı" türü mesajları kırmızı HATA yerine sade/nötr
// "opsiyonel — yapılandırılmadı" bilgisi olarak göster. Gerçek hatalar kırmızı kalır.
const UNCONFIGURED_RX =
  /GOOGLE_SERVICE_ACCOUNT_JSON|GOOGLE_ADS_(DEVELOPER_TOKEN|CLIENT_ID|CLIENT_SECRET|REFRESH_TOKEN)|baglantisi eksik|bağlantısı eksik|tanimli degil|tanımlı değil/i;

export function isUnconfigured(msg?: string | null): boolean {
  return !!msg && UNCONFIGURED_RX.test(msg);
}

export function ApiNotice({ text }: { text: string }) {
  if (isUnconfigured(text)) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs font-medium flex items-start gap-3">
        <Settings size={16} className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          <b className="text-slate-600">Opsiyonel — yapılandırılmadı.</b>{" "}
          Bu entegrasyon için Google API kimlik bilgileri henüz girilmedi.
          Panelin geri kalanı normal çalışır; kimlik eklenince bu bölüm
          otomatik aktifleşir.
        </span>
      </div>
    );
  }
  return (
    <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-medium flex items-center gap-3">
      <AlertCircle size={16} />
      {text}
    </div>
  );
}

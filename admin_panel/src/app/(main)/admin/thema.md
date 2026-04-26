

pages-router kodundaki davranışı App Router’a taşır.



Aşağıdaki talimat seti, **admin modülündeki tüm dosyaları Bootstrap’tan arındırıp**, projedeki **`src/components/ui/*` shadcn bileşenleri** ve mevcut **theme preset (tangerine)** ile **Users list sayfasıyla aynı görsel dilde** standartlaştırmak için “tek bir doğru yol” tanımlar. Bunu uygularsan dosyalar arasında stil kayması olmaz.

---

## 1) Hedef ve Kapsam

**Hedef:** Admin  ekranlarının tamamı, **UsersListClient** sayfası ile aynı UI standartlarında olacak:

* `Card` / `CardHeader` / `CardContent`
* `Button`, `Input`, `Label`, `Badge`, `Select`, `Switch`
* `Table` (desktop), mobilde `divide-y` ile kart listesi
* Tailwind sınıfları (utility) serbest, **inline style yok**
* Bootstrap sınıfları **tamamen yok** (`row`, `col-*`, `btn`, `card`, `badge bg-*`, `table-responsive`, `form-control` vb.)

---

## 2) “Yasaklar” ve “Zorunluluklar” (Lint gibi düşün)

### Yasaklar

* Bootstrap classNames:

  * `container-fluid`, `row`, `col-*`, `btn*`, `card*`, `badge bg-*`, `table*`, `form-control`, `input-group`, `alert*`, `text-muted`, `fw-*`, `small` vb.
* Inline style:

  * `style={{ ... }}` kesinlikle yok.
* Next Router Pages API:

  * App Router içinde `useRouter` **`next/router`** değil; **`next/navigation`**.
* Eski word-break sınıfları:

  * `break-words` uyarısı geliyorsa **`wrap-break-word`** kullan.

### Zorunluluklar

* Her admin component dosyasında `use client` gerekiyorsa en üste.
* UI elemanları **`@/components/ui/*`** üzerinden.
* Responsive düzen: `grid` / `flex` + `md:` / `lg:`.
* Metin hiyerarşisi:

  * Sayfa başlığı: `h1.text-lg.font-semibold`
  * Açıklama: `p.text-sm.text-muted-foreground`
* Loading/Error empty state’ler: `Badge`, `Card`, `Empty` (varsa `@/components/ui/empty`).

---

## 3) Standart Sayfa İskeleti (Kopyala-Yapıştır Şablonu)

Her admin sayfa/tab paneli aşağıdaki iskeleti izlesin:

```tsx
<div className="space-y-6">
  <div className="space-y-1">
    <h1 className="text-lg font-semibold">Başlık</h1>
    <p className="text-sm text-muted-foreground">Açıklama</p>
  </div>

  <Card>
    <CardHeader>
      <CardTitle className="text-base">Kart Başlık</CardTitle>
      <CardDescription>Opsiyonel</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* içerik */}
    </CardContent>
  </Card>
</div>
```

---

## 4) Layout/Spacing Kuralları

### Grid kullanımı (Bootstrap row/col yerine)

* 2 kolon: `grid gap-4 md:grid-cols-2`
* 3 kolon: `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
* Alan genişletme: `md:col-span-2`, `lg:col-span-2`

### Form alanı standardı

Her alan:

```tsx
<div className="space-y-2">
  <Label htmlFor="field">Label</Label>
  <Input id="field" ... />
  <p className="text-xs text-muted-foreground">Helper</p>
</div>
```

---

## 5) Table Standardı (Desktop) + Mobile Card List

### Desktop (md+)

* `CardContent` içinde:

  * `div.rounded-md.border` + `Table`

### Mobile (md-)

* `div.rounded-md.border` + `div.divide-y` + `p-4` kartlar
* Başlık satırı: `flex flex-wrap items-center gap-2`
* Uzun metinler: `wrap-break-word` (sizin projede canonical)

---

## 6) Word Break / JSON Preview / Uzun Key Değerleri

* Key/value gibi kırılması gereken yerlerde:

  * `wrap-break-word` kullan
* JSON preview:

  * `text-xs text-muted-foreground wrap-break-word`
  * Çok uzunsa `slice` ile kısalt (mevcut helper mantığı iyi)

---

## 7) Site Settings Modülü için Özel Kurallar

### 7.1 Header (SiteSettingsHeader)

* Bootstrap “tab button group” yerine:

  * `Tabs` bileşeni varsa `@/components/ui/tabs` ile gerçek tab UI
  * Yoksa “secondary/outline” butonlarıyla segment:

    * aktif: `Button variant="default"`
    * pasif: `Button variant="outline"`

* Search:

  * `Label + Input` (icon gerekiyorsa users-list gibi absolute icon)

* Locale select:

  * `Select` (shadcn) kullan
  * `global` tab’larda disable mantığı korunur

### 7.2 List (SiteSettingsList)

* Senin son shadcn sürümün doğru yönde.
* `wrap-break-word` sınıfı her key/value’da.

### 7.3 Form (SiteSettingsForm)

* Mode switch:

  * `Select` veya `Tabs` (Structured/Raw) olarak uygula.
* Butonlar:

  * Kaydet: `Button`
  * Sil: `Button variant="destructive"`
* Raw textarea:

  * `Textarea` bileşeni (var: `@/components/ui/textarea`)
  * `className="font-mono"` gibi utility serbest
* Debug `<pre>`:

  * `div.rounded-md.border.bg-muted/??` yerine:

    * `pre` + `rounded-md border p-3 text-xs bg-muted` gibi utility
  * Inline yok.

### 7.4 Tabs (General/SEO/SMTP/Cloudinary/BrandMedia/API)

* Her tab içeride mutlaka `Card` ile başlasın.
* Üst aksiyon barı:

  * sağda `Button`lar ve `Badge`ler.
* Search alanı:

  * `Label + Input` veya UsersList gibi `Search icon + Input`.

---

## 8) Router ve Dosya Konum Standardı

App Router kullandığınız için:

* `useRouter`, `useSearchParams`, `usePathname` => `next/navigation`
* `next/router` tamamen kaldır.

Özellikle bu dosyada var:

* `SiteSettingsForm.tsx` içinde `useRouter` şu an `next/router`. Bunu **değiştirmeniz şart**.

---

## 9) Dönüşüm Sırası (En az riskli yol)

1. **SiteSettingsHeader** (en görünür parça; şu an Bootstrap ağır)
2. **AdminSiteSettingsClient wrapper** (container-fluid vs temizlenecek)
3. **SiteSettingsList** (table/mobile uyumu)
4. **SiteSettingsForm** (structured/raw + textarea + upload alanı)
5. Tab’ler:

   * General
   * Seo
   * Smtp
   * Cloudinary
   * BrandMedia
   * Api

Her adımda:

* Bootstrap class araması yap:

  * `className="row`
  * `btn`
  * `card`
  * `col-`
  * `form-control`
  * `table`
  * `text-muted`
* Bulduklarını shadcn + tailwind’e çevir.

---

## 10) “Kontrol Listesi” (PR checklist gibi)

Bir dosyayı bitirdiğinizde:

* [ ] Bootstrap class yok
* [ ] Inline style yok
* [ ] `next/router` import yok (App Router dosyalarında)
* [ ] `@/components/ui/*` kullanımı doğru
* [ ] Desktop + mobile responsive çalışır
* [ ] `wrap-break-word` kullanılan yerler doğru
* [ ] Loading/Error state kullanıcı dostu (Badge/Empty)

---

## 11) Hızlı Komut: Toplu Bul-Değiştir Önerileri

* `break-words` → `wrap-break-word`
* `text-muted` → `text-muted-foreground`
* `small` → `text-xs` / `text-sm` (bağlama göre)
* `fw-semibold` → `font-semibold`
* `table-responsive` → kaldır, yerine `div.rounded-md.border` + `Table`
* `btn btn-outline-secondary btn-sm` → `<Button variant="outline" size="sm">`
* `btn btn-danger btn-sm` → `<Button variant="destructive" size="sm">`

---

İstersen bir sonraki adımda, **SiteSettingsHeader.tsx** için aynı UsersList düzenine birebir uyumlu **FINAL shadcn sürümünü** yazayım; çünkü sayfanın “stil bozuk” görünmesinin ana nedeni genelde header/toolbar kısmındaki Bootstrap kalıntıları oluyor.

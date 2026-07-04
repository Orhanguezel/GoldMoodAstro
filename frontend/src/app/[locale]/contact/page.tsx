import ContactPage from '@/components/containers/contact/ContactPage';
import PageContainer from '@/components/common/PageContainer';
import { fetchSetting } from '@/i18n/server';
import { safeJson, safeStr } from '@/integrations/shared';

type CompanyBrand = Partial<{
  name: string;
  legal_name: string;
  mersis: string;
  tax_office: string;
  tax_no: string;
  trade_registry: string;
  address: string;
  phone: string;
  email: string;
}>;

export const revalidate = 300;

function settingValue<T>(row: Awaited<ReturnType<typeof fetchSetting>>, fallback: T): T {
  return safeJson<T>((row as any)?.value, fallback);
}

export default async function ContactRoutePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale = 'tr' } = await params;
  const companyRow = await fetchSetting('company_brand', '*', { revalidate: 300 });
  const company = settingValue<CompanyBrand>(companyRow, {});
  const legalName = safeStr(company.legal_name || company.name || 'GoldMoodAstro');
  const address = safeStr(company.address);
  const phone = safeStr(company.phone);
  const email = safeStr(company.email);

  return (
    <PageContainer pad="large">
      <section className="mb-12 rounded-[2rem] border border-(--gm-border-soft) bg-(--gm-surface) p-6 md:p-8 shadow-(--gm-shadow-soft)">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-(--gm-gold-dim)">
          {locale === 'tr' ? 'Şirket Künyesi' : 'Company Details'}
        </p>
        <h1 className="mt-3 font-serif text-3xl text-(--gm-text)">
          {locale === 'tr' ? 'İletişim ve Destek' : 'Contact and Support'}
        </h1>
        <dl className="mt-6 grid gap-4 text-sm text-(--gm-text-dim) md:grid-cols-2">
          <div>
            <dt className="font-bold text-(--gm-text)">Ticari Unvan</dt>
            <dd className="mt-1">{legalName}</dd>
          </div>
          {address && (
            <div>
              <dt className="font-bold text-(--gm-text)">Adres</dt>
              <dd className="mt-1">{address}</dd>
            </div>
          )}
          {phone && (
            <div>
              <dt className="font-bold text-(--gm-text)">Telefon</dt>
              <dd className="mt-1"><a href={`tel:${phone}`}>{phone}</a></dd>
            </div>
          )}
          {email && (
            <div>
              <dt className="font-bold text-(--gm-text)">E-posta</dt>
              <dd className="mt-1"><a href={`mailto:${email}`}>{email}</a></dd>
            </div>
          )}
          {safeStr(company.mersis) && (
            <div>
              <dt className="font-bold text-(--gm-text)">MERSİS</dt>
              <dd className="mt-1">{safeStr(company.mersis)}</dd>
            </div>
          )}
          {safeStr(company.tax_no) && (
            <div>
              <dt className="font-bold text-(--gm-text)">Vergi No</dt>
              <dd className="mt-1">{safeStr(company.tax_no)}</dd>
            </div>
          )}
        </dl>
      </section>
      <ContactPage />
    </PageContainer>
  );
}

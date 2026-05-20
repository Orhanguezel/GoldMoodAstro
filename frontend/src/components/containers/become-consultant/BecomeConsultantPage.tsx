'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import { 
  Users, 
  CheckCircle2, 
  Send, 
  Upload,
  Award,
  Calendar,
  FileText,
  Loader2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type ConsultantApplicationPayload,
  useApplyConsultantMutation,
} from '@/integrations/rtk/public/consultant_applications.endpoints';
import { useListServiceCategoriesPublicQuery } from '@/integrations/rtk/public/service_categories.public.endpoints';
import { useListLanguagesPublicQuery } from '@/integrations/rtk/public/languages.public.endpoints';
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';
import { useListSiteSettingsQuery } from '@/integrations/rtk/public/site_settings.endpoints';
import { cn } from '@/lib/utils';
import Link from 'next/link';



function getApiErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) return 'Başvuru sırasında bir hata oluştu.';
  const data = 'data' in error ? (error as { data?: unknown }).data : undefined;
  if (typeof data !== 'object' || data === null) return 'Başvuru sırasında bir hata oluştu.';
  const directMessage = 'message' in data ? (data as { message?: unknown }).message : undefined;
  if (typeof directMessage === 'string' && directMessage.trim()) return directMessage;
  return 'Başvuru sırasında bir hata oluştu.';
}

import PageContainer from '@/components/common/PageContainer';

const cinzel = Cinzel({ subsets: ['latin'] });

export default function BecomeConsultantPage() {
  const [step, setStep] = useState(1);
  const [apply, { isLoading }] = useApplyConsultantMutation();
  const { data: serviceCategories = [], isLoading: isLoadingCategories } = useListServiceCategoriesPublicQuery();
  const expertiseOptions = serviceCategories.map((category) => ({ id: category.slug, label: category.name }));

  const { data: dbLanguages = [], isLoading: isLoadingLanguages } = useListLanguagesPublicQuery();
  // We don't have locale here, so we default to name_tr or name_en
  const getLanguageLabel = (lang: any) => lang.name_tr || lang.name_en || lang.slug;
  const languageOptions = dbLanguages.map((lang) => ({ id: lang.slug, label: getLanguageLabel(lang) }));

  const { data: settings = [] } = useListSiteSettingsQuery({ keys: ['platform_commission_rate'] });
  const commissionRateSetting = settings.find(s => s.key === 'platform_commission_rate');
  const commissionRate = (commissionRateSetting?.value as { percent?: number } | undefined)?.percent ?? 15;

  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    expertise: [] as string[],
    languages: [] as string[],
    experience_years: 1,
    certifications: '',
    cv_url: '',
    sample_chart_url: '',
  });

  const handleToggleExpertise = (id: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(id) 
        ? prev.expertise.filter(e => e !== id) 
        : [...prev.expertise, id]
    }));
  };

  const handleToggleLanguage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(id) 
        ? prev.languages.filter(l => l !== id) 
        : [...prev.languages, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.expertise.length === 0) {
      toast.error('Lütfen en az bir uzmanlık alanı seçin');
      return;
    }
    if (formData.languages.length === 0) {
      toast.error('Lütfen en az bir dil seçin');
      return;
    }
    if (!agreementAccepted) {
      toast.error('Lütfen danışmanlık sözleşmesini kabul edin');
      return;
    }
    try {
      const payload: ConsultantApplicationPayload = {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        bio: formData.bio.trim(),
        expertise: formData.expertise,
        languages: formData.languages,
        experience_years: formData.experience_years,
        ...(formData.phone.trim() ? { phone: formData.phone.trim() } : {}),
        ...(formData.certifications.trim() ? { certifications: formData.certifications.trim() } : {}),
        ...(formData.cv_url.trim() ? { cv_url: formData.cv_url.trim() } : {}),
        ...(formData.sample_chart_url.trim() ? { sample_chart_url: formData.sample_chart_url.trim() } : {}),
      };
      await apply(payload).unwrap();
      toast.success('Başvurunuz başarıyla alındı!');
      setStep(3); // Success step
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <PageContainer className="bg-(--gm-bg) relative overflow-hidden" verticalPadding="large">
      {/* Mystical Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-(--gm-gold)/5 blur-[120px] rounded-full -mr-64 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-(--gm-primary)/5 blur-[100px] rounded-full -ml-48 -mb-24 pointer-events-none" />

      {/* Hero'daki "Hemen Başvur" (#basvuru-formu) buraya kayar.
          scroll-mt: sabit header altında kalmasın. */}
      <div id="basvuru-formu" className="relative z-10 scroll-mt-28">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="max-w-5xl mx-auto"
            >
              <div className="text-center mb-20">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-(--gm-gold)/20 bg-(--gm-gold)/5 text-(--gm-gold) text-[11px] font-bold uppercase tracking-[0.3em] mb-10"
                >
                  <Sparkles size={12} />
                  BİLGELİĞİNİZİ PAYLAŞIN
                </motion.span>
                <h1 className="font-serif text-5xl md:text-8xl text-(--gm-text) mb-10 leading-[1.1] tracking-tight">
                  GoldMoodAstro Ailesine <br /> <span className="text-(--gm-gold) italic">Görkemli Bir Giriş Yapın</span>
                </h1>
                <p className="max-w-3xl mx-auto text-(--gm-text-dim) font-serif italic text-2xl leading-relaxed opacity-90">
                  Binlerce ruhsal yolculuğa rehberlik edin, uzmanlığınızı markalaştırın ve kendi kutsal çalışma alanınızı yönetin.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                <BenefitCard 
                  icon={Users} 
                  title="Seçkin Kitle" 
                  desc="Bilinçli ve derinlik arayan binlerce aktif kullanıcıya anında erişim sağlayın." 
                />
                <BenefitCard 
                  icon={Calendar} 
                  title="Özgür Takvim" 
                  desc="Kendi zamanınızı siz belirleyin; dilediğiniz yerden, dilediğiniz vakitte danışmanlık verin." 
                />
                <BenefitCard 
                  icon={Award} 
                  title="Lider Konum" 
                  desc="Modern astrolojinin öncü platformunda uzmanlığınızı elit bir marka altında tescilleyin." 
                />
              </div>

              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={() => setStep(2)}
                  className="group relative px-20 py-6 rounded-full bg-(--gm-gold) text-(--gm-bg-deep) font-bold uppercase tracking-[0.25em] text-xs transition-all duration-500 hover:scale-105 hover:shadow-(--gm-shadow-gold) overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Hemen Başvuruyu Başlat
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-[var(--gm-text)]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
                <div className="flex items-center gap-2 text-[10px] text-(--gm-muted) uppercase tracking-widest font-bold">
                  <ShieldCheck size={14} className="text-(--gm-success)" />
                  Başvurular 48 saat içinde değerlendirilir
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="mb-12 flex items-center justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-(--gm-muted) hover:text-(--gm-text) transition-colors"
                >
                  <ArrowLeft size={16} />
                  Geri Dön
                </button>
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-(--gm-gold)">
                  Başvuru Formu — Adım 2/2
                </div>
              </div>

              <div className="relative p-8 md:p-20 rounded-[3.5rem] border border-(--gm-border-soft) bg-(--gm-surface) shadow-(--gm-shadow-card) overflow-hidden">
                {/* Internal Decorative Orb */}
                <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-(--gm-gold)/5 blur-[80px] pointer-events-none" />

                <form onSubmit={handleSubmit} className="relative z-10 space-y-16">
                  <div className="space-y-10">
                    <h2 className={`${cinzel.className} text-3xl text-(--gm-text) tracking-tight`}>Kişisel Bilgiler & Deneyim</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <InputGroup label="Ad Soyad" required>
                        <input 
                          type="text" 
                          required
                          value={formData.full_name}
                          onChange={e => setFormData({...formData, full_name: e.target.value})}
                          className="gm-input-premium" 
                          placeholder="John Doe"
                        />
                      </InputGroup>
                      <InputGroup label="E-posta Adresi" required>
                        <input 
                          type="email" 
                          required
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="gm-input-premium" 
                          placeholder="john@example.com"
                        />
                      </InputGroup>
                      <InputGroup label="Telefon Numarası">
                        <input 
                          type="tel" 
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="gm-input-premium" 
                          placeholder="+90 5XX XXX XX XX"
                        />
                      </InputGroup>
                      <InputGroup label="Deneyim (Yıl)">
                        <input 
                          type="number" 
                          min={0}
                          value={formData.experience_years}
                          onChange={e => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                          className="gm-input-premium text-center w-32" 
                        />
                      </InputGroup>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <h2 className={`${cinzel.className} text-3xl text-(--gm-text) tracking-tight`}>Uzmanlık & Diller</h2>
                    <InputGroup label="Uzmanlık Alanları" required>
                      {isLoadingCategories ? (
                        <div className="text-[12px] text-(--gm-text-dim) py-2">Yükleniyor...</div>
                      ) : (
                        <div className="flex flex-wrap gap-4">
                          {expertiseOptions.map(opt => (
                            <PillButton
                              key={opt.id}
                              label={opt.label}
                              active={formData.expertise.includes(opt.id)}
                              onClick={() => handleToggleExpertise(opt.id)}
                            />
                          ))}
                        </div>
                      )}
                    </InputGroup>

                    <InputGroup label="Danışmanlık Dilleri" required>
                      {isLoadingLanguages ? (
                        <div className="text-[12px] text-(--gm-text-dim) py-2">Yükleniyor...</div>
                      ) : (
                        <div className="flex flex-wrap gap-4">
                          {languageOptions.map(opt => (
                            <PillButton
                              key={opt.id}
                              label={opt.label}
                              active={formData.languages.includes(opt.id)}
                              onClick={() => handleToggleLanguage(opt.id)}
                            />
                          ))}
                        </div>
                      )}
                    </InputGroup>
                  </div>

                  <div className="space-y-10">
                    <h2 className={`${cinzel.className} text-3xl text-(--gm-text) tracking-tight`}>Anlatım & Belgeler</h2>
                    <InputGroup 
                      label="Kısa Biyografi" 
                      required
                      hint="Kendinizi, yaklaşımınızı ve danışana ne sunduğunuzu anlatın. İletişim bilgisi/dış link yazmayın. En az 150 karakter önerilir."
                    >
                      <textarea 
                        required
                        rows={5}
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                        className="gm-input-premium py-6 min-h-[200px] resize-none font-serif italic" 
                        placeholder="Uzmanlığınız, yaklaşımınız ve ruhsal rehberlik tarzınızdan bahsedin..."
                      />
                      <p className="text-[10px] text-(--gm-muted) font-bold uppercase tracking-[0.2em] mt-4 opacity-70">
                        * Profil fotoğrafınızı başvurunuz onaylandıktan sonra panel üzerinden ekleyeceksiniz.
                      </p>
                    </InputGroup>

                    <InputGroup label="Sertifikalar & Eğitimler">
                      <textarea 
                        rows={3}
                        value={formData.certifications}
                        onChange={e => setFormData({...formData, certifications: e.target.value})}
                        className="gm-input-premium py-6 min-h-[120px] resize-none font-serif italic" 
                        placeholder="Aldığınız eğitimler, sertifikalar ve referans kurumlar..."
                      />
                    </InputGroup>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <FileUploadBox 
                        label="CV / Özgeçmiş" 
                        desc="PDF, JPG veya PNG (Max 5MB)"
                        onUpload={(url) => setFormData({...formData, cv_url: url})} 
                      />
                      <FileUploadBox 
                        label="Örnek Yorum" 
                        desc="Danışmanlık tarzınızı yansıtan örnek bir yorum"
                        onUpload={(url) => setFormData({...formData, sample_chart_url: url})} 
                      />
                    </div>
                  </div>

                  <div className="pt-12 border-t border-(--gm-border-soft) flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex flex-col gap-4 max-w-md w-full">
                      <div className="p-4 bg-(--gm-gold)/5 border border-(--gm-gold)/20 rounded-xl text-[11px] text-(--gm-text-dim) leading-relaxed">
                        <strong className="text-(--gm-gold)">Platform Komisyonu: %{commissionRate}</strong>
                        <br />
                        Hizmet ücretinizin %{commissionRate}&apos;i platform tarafından kesilir, kalan tutar cüzdanınıza eklenir.
                      </div>
                      
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5 relative flex items-center justify-center">
                          <input 
                            type="checkbox" 
                            className="peer appearance-none w-5 h-5 border border-(--gm-border-soft) rounded bg-(--gm-bg-deep) checked:bg-(--gm-gold) checked:border-(--gm-gold) transition-all cursor-pointer"
                            checked={agreementAccepted}
                            onChange={(e) => setAgreementAccepted(e.target.checked)}
                          />
                          <CheckCircle2 size={14} className="absolute text-(--gm-bg-deep) opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                        </div>
                        <p className="text-[11px] text-(--gm-text-dim) leading-relaxed font-serif italic flex-1 group-hover:text-(--gm-text) transition-colors">
                          Platform komisyon oranını ve <Link href="/tr/legal/consultant-agreement" target="_blank" className="text-(--gm-gold) font-bold hover:underline transition-all">Danışman Kullanım Sözleşmesi</Link>&apos;ni okudum, kabul ediyorum.
                        </p>
                      </label>
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoading || !agreementAccepted}
                      className="group w-full md:w-auto px-20 py-6 rounded-full bg-(--gm-gold) text-(--gm-bg-deep) font-bold uppercase tracking-[0.25em] text-xs flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-(--gm-shadow-gold) disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Başvuruyu Gönder
                          <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto text-center py-32"
            >
              <div className="relative inline-block mb-16">
                <div className="absolute inset-0 bg-(--gm-success)/20 blur-[60px] rounded-full animate-pulse" />
                <div className="relative w-32 h-32 rounded-full bg-(--gm-success)/10 text-(--gm-success) flex items-center justify-center border border-(--gm-success)/30 shadow-(--gm-shadow-glow)">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
              </div>
              
              <h2 className={`${cinzel.className} text-4xl md:text-6xl text-(--gm-text) mb-8 tracking-tight`}>Başvurunuz Gökyüzüne Ulaştı!</h2>
              <p className="text-(--gm-text-dim) font-serif italic text-2xl mb-16 leading-relaxed opacity-90">
                Değerli vaktinizi ayırdığınız için teşekkür ederiz. Başvurunuz uzman küratör ekibimiz tarafından özenle incelenecek ve en kısa sürede sizinle iletişime geçeceğiz.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-16 py-5 rounded-full bg-(--gm-gold) text-(--gm-bg-deep) font-bold uppercase tracking-[0.25em] text-[11px] hover:scale-105 transition-all shadow-(--gm-shadow-gold)"
                >
                  Anasayfaya Dön
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .gm-input-premium {
          width: 100%;
          height: 64px;
          background: var(--gm-bg-deep);
          border: 1px solid var(--gm-border-soft);
          border-radius: 24px;
          padding: 0 28px;
          font-family: var(--font-serif);
          font-size: 16px;
          color: var(--gm-text);
          outline: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .gm-input-premium:focus {
          border-color: var(--gm-gold);
          box-shadow: var(--gm-shadow-soft);
          padding-left: 32px;
        }
        .gm-input-premium::placeholder {
          opacity: 0.3;
          font-style: italic;
        }
        textarea.gm-input-premium {
          height: auto;
        }
      `}</style>
    </PageContainer>
  );
}

function BenefitCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-10 rounded-[2.5rem] border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/20 hover:border-[var(--gm-gold)]/30 transition-all duration-500 group relative overflow-hidden">
      <div className="absolute inset-0 bg-[var(--gm-gold)]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-[var(--gm-gold)]/10 text-[var(--gm-gold)] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 shadow-inner">
          <Icon size={32} />
        </div>
        <h3 className="font-serif text-2xl text-[var(--gm-text)] mb-4 tracking-tight">{title}</h3>
        <p className="text-[15px] text-[var(--gm-text-dim)] leading-relaxed font-serif italic">{desc}</p>
      </div>
    </div>
  );
}

function InputGroup({ label, children, required, hint }: { label: string, children: React.ReactNode, required?: boolean, hint?: string }) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gm-gold-dim)] mb-1">
        {label} 
        {required && <span className="text-[var(--gm-error)] text-lg leading-none mt-1">*</span>}
      </label>
      {hint && <p className="text-[11px] text-[var(--gm-text-dim)] font-serif italic leading-relaxed mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function PillButton({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-6 py-3 rounded-2xl border text-[11px] font-bold uppercase tracking-widest transition-all duration-300",
        active
          ? "border-[var(--gm-gold)] bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] shadow-lg shadow-[var(--gm-gold)]/20 scale-105"
          : "border-[var(--gm-border-soft)] text-[var(--gm-text-dim)] hover:border-[var(--gm-gold)]/40 hover:bg-[var(--gm-gold)]/5"
      )}
    >
      {label}
    </button>
  );
}

function FileUploadBox({ label, desc, onUpload }: { label: string, desc: string, onUpload: (url: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [upload, { isLoading }] = useUploadToBucketMutation();
  const [fileName, setFileName] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB altında olmalıdır.');
      return;
    }

    try {
      const res = await upload({ bucket: 'uploads', files: file, path: 'applications' }).unwrap();
      const url = res.items?.[0]?.url || '';
      onUpload(url);
      setFileName(file.name);
      toast.success(`${label} yüklendi.`);
    } catch {
      toast.error('Yükleme başarısız oldu.');
    }
  };

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className={cn(
        "p-8 rounded-[2rem] border border-dashed border-[var(--gm-border-soft)] bg-[var(--gm-bg-deep)]/30 flex flex-col items-center justify-center gap-4 text-center cursor-pointer transition-all duration-500 group relative overflow-hidden",
        fileName ? "border-[var(--gm-success)]/40 bg-[var(--gm-success)]/[0.03]" : "hover:border-[var(--gm-gold)]/40 hover:bg-[var(--gm-gold)]/[0.03]"
      )}
    >
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
        fileName ? "bg-[var(--gm-success)]/10 text-[var(--gm-success)]" : "bg-[var(--gm-gold)]/10 text-[var(--gm-gold)] group-hover:scale-110"
      )}>
        {isLoading ? <Loader2 size={24} className="animate-spin" /> : fileName ? <CheckCircle2 size={24} /> : <FileText size={24} />}
      </div>
      <div>
        <p className="text-xs font-bold text-[var(--gm-text)] uppercase tracking-widest">{fileName || label}</p>
        <p className="text-[10px] text-[var(--gm-muted)] mt-1">{fileName ? 'Başarıyla yüklendi' : desc}</p>
      </div>
      <input 
        ref={inputRef}
        type="file" 
        className="hidden" 
        onChange={handleUpload}
        accept=".pdf,.doc,.docx,image/*"
      />
    </div>
  );
}

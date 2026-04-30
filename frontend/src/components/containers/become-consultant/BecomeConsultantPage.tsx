'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useUploadToBucketMutation } from '@/integrations/rtk/public/storage_public.endpoints';
import { cn } from '@/lib/utils';

const EXPERTISE_OPTIONS = [
  { id: 'astrology', label: 'Astroloji' },
  { id: 'tarot', label: 'Tarot' },
  { id: 'coffee', label: 'Kahve Falı' },
  { id: 'numerology', label: 'Numeroloji' },
  { id: 'birth_chart', label: 'Doğum Haritası' },
  { id: 'dream_interpretation', label: 'Rüya Tabiri' },
  { id: 'relationship_advice', label: 'İlişki Danışmanlığı' },
  { id: 'energy_healing', label: 'Enerji Şifası' },
];

const LANGUAGES = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'İngilizce' },
  { id: 'de', label: 'Almanca' },
  { id: 'fr', label: 'Fransızca' },
];

function getApiErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) return 'Başvuru sırasında bir hata oluştu.';
  const data = 'data' in error ? (error as { data?: unknown }).data : undefined;
  if (typeof data !== 'object' || data === null) return 'Başvuru sırasında bir hata oluştu.';
  const directMessage = 'message' in data ? (data as { message?: unknown }).message : undefined;
  if (typeof directMessage === 'string' && directMessage.trim()) return directMessage;
  return 'Başvuru sırasında bir hata oluştu.';
}

export default function BecomeConsultantPage() {
  const [step, setStep] = useState(1);
  const [apply, { isLoading }] = useApplyConsultantMutation();

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
    <div className="min-h-screen bg-[var(--gm-bg)] pt-32 pb-24 relative overflow-hidden">
      {/* Mystical Background Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--gm-gold)]/5 blur-[120px] rounded-full -mr-64 -mt-32 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--gm-primary)]/5 blur-[100px] rounded-full -ml-48 -mb-24 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
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
              <div className="text-center mb-16">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--gm-gold)]/20 bg-[var(--gm-gold)]/[0.03] text-[var(--gm-gold)] text-[10px] font-bold uppercase tracking-[0.3em] mb-8"
                >
                  <Sparkles size={12} />
                  BİLGELİĞİNİZİ PAYLAŞIN
                </motion.span>
                <h1 className="font-serif text-5xl md:text-7xl text-[var(--gm-text)] mb-8 leading-[1.1] tracking-tight">
                  GoldMoodAstro Ailesine <br /> <span className="text-[var(--gm-gold)] italic">Görkemli Bir Giriş Yapın</span>
                </h1>
                <p className="max-w-2xl mx-auto text-[var(--gm-text-dim)] font-serif italic text-xl leading-relaxed">
                  Binlerce ruhsal yolculuğa rehberlik edin, uzmanlığınızı markalaştırın ve kendi kutsal çalışma alanınızı yönetin.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
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
                  className="group relative px-16 py-5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] font-bold uppercase tracking-[0.2em] text-xs transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(201,169,97,0.3)] overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    Hemen Başvuruyu Başlat
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </button>
                <div className="flex items-center gap-2 text-[10px] text-[var(--gm-muted)] uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-[var(--gm-success)]" />
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
              <div className="mb-10 flex items-center justify-between">
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--gm-muted)] hover:text-[var(--gm-text)] transition-colors"
                >
                  <ArrowLeft size={14} />
                  Geri Dön
                </button>
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--gm-gold)]">
                  Başvuru Formu — Adım 2/2
                </div>
              </div>

              <div className="relative p-8 md:p-16 rounded-[3rem] border border-[var(--gm-border-soft)] bg-[var(--gm-surface)]/30 backdrop-blur-md shadow-2xl overflow-hidden">
                {/* Internal Decorative Orb */}
                <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[var(--gm-gold)]/5 blur-[60px] pointer-events-none" />

                <form onSubmit={handleSubmit} className="relative z-10 space-y-12">
                  <div className="space-y-8">
                    <h2 className="font-serif text-3xl text-[var(--gm-text)] tracking-tight">Kişisel Bilgiler & Deneyim</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                  <div className="space-y-8">
                    <h2 className="font-serif text-3xl text-[var(--gm-text)] tracking-tight">Uzmanlık & Diller</h2>
                    <InputGroup label="Uzmanlık Alanları" required>
                      <div className="flex flex-wrap gap-3">
                        {EXPERTISE_OPTIONS.map(opt => (
                          <PillButton
                            key={opt.id}
                            label={opt.label}
                            active={formData.expertise.includes(opt.id)}
                            onClick={() => handleToggleExpertise(opt.id)}
                          />
                        ))}
                      </div>
                    </InputGroup>

                    <InputGroup label="Danışmanlık Dilleri" required>
                      <div className="flex flex-wrap gap-3">
                        {LANGUAGES.map(opt => (
                          <PillButton
                            key={opt.id}
                            label={opt.label}
                            active={formData.languages.includes(opt.id)}
                            onClick={() => handleToggleLanguage(opt.id)}
                          />
                        ))}
                      </div>
                    </InputGroup>
                  </div>

                  <div className="space-y-8">
                    <h2 className="font-serif text-3xl text-[var(--gm-text)] tracking-tight">Anlatım & Belgeler</h2>
                    <InputGroup label="Kısa Biyografi" required>
                      <textarea 
                        required
                        rows={5}
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                        className="gm-input-premium py-5 min-h-[160px] resize-none" 
                        placeholder="Uzmanlığınız, yaklaşımınız ve ruhsal rehberlik tarzınızdan bahsedin..."
                      />
                    </InputGroup>

                    <InputGroup label="Sertifikalar & Eğitimler">
                      <textarea 
                        rows={3}
                        value={formData.certifications}
                        onChange={e => setFormData({...formData, certifications: e.target.value})}
                        className="gm-input-premium py-5 min-h-[100px] resize-none" 
                        placeholder="Aldığınız eğitimler, sertifikalar ve referans kurumlar..."
                      />
                    </InputGroup>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div className="pt-10 border-t border-[var(--gm-border-soft)] flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-start gap-3 max-w-md">
                      <div className="mt-1">
                        <CheckCircle2 size={16} className="text-[var(--gm-gold)]" />
                      </div>
                      <p className="text-[11px] text-[var(--gm-muted)] leading-relaxed">
                        Başvurunuzu göndererek <span className="text-[var(--gm-gold)] hover:underline cursor-pointer transition-all">Danışman Kullanım Şartları</span>&apos;nı ve KVKK aydınlatma metnini kabul etmiş sayılırsınız.
                      </p>
                    </div>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="group w-full md:w-auto px-16 py-5 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--gm-gold)]/30 disabled:opacity-50"
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
              className="max-w-2xl mx-auto text-center py-20"
            >
              <div className="relative inline-block mb-12">
                <div className="absolute inset-0 bg-[var(--gm-success)]/20 blur-[40px] rounded-full animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-[var(--gm-success)]/10 text-[var(--gm-success)] flex items-center justify-center border border-[var(--gm-success)]/30 shadow-2xl">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>
              
              <h2 className="font-serif text-4xl md:text-5xl text-[var(--gm-text)] mb-6 tracking-tight">Başvurunuz Gökyüzüne Ulaştı!</h2>
              <p className="text-[var(--gm-text-dim)] font-serif italic text-xl mb-12 leading-relaxed">
                Değerli vaktinizi ayırdığınız için teşekkür ederiz. Başvurunuz uzman küratör ekibimiz tarafından özenle incelenecek ve en kısa sürede sizinle iletişime geçeceğiz.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => window.location.href = '/'}
                  className="px-12 py-4 rounded-full bg-[var(--gm-gold)] text-[var(--gm-bg-deep)] font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl shadow-[var(--gm-gold)]/20"
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
          height: 60px;
          background: rgba(var(--gm-bg-deep-rgb), 0.4);
          border: 1px solid var(--gm-border-soft);
          border-radius: 20px;
          padding: 0 24px;
          font-family: var(--font-serif);
          font-size: 16px;
          color: var(--gm-text);
          outline: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(4px);
        }
        .gm-input-premium:focus {
          border-color: var(--gm-gold);
          background: rgba(var(--gm-bg-deep-rgb), 0.6);
          box-shadow: 0 0 25px rgba(201, 169, 97, 0.1);
          padding-left: 28px;
        }
        .gm-input-premium::placeholder {
          opacity: 0.3;
          font-style: italic;
        }
        textarea.gm-input-premium {
          height: auto;
        }
      `}</style>
    </div>
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

function InputGroup({ label, children, required }: { label: string, children: React.ReactNode, required?: boolean }) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--gm-gold-dim)] mb-1">
        {label} 
        {required && <span className="text-rose-500 text-lg leading-none mt-1">*</span>}
      </label>
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

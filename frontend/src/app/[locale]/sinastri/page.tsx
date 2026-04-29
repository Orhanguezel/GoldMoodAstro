'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import { 
  Heart, 
  Sparkles, 
  Zap, 
  ChevronRight, 
  User, 
  Users, 
  Star,
  RefreshCcw,
  ShieldCheck,
  ChevronLeft,
  Search,
  Check,
  X,
  Mail,
  Send
} from 'lucide-react';
import { 
  useGetSynastryManualMutation, 
  useGetSynastryQuickMutation,
  useSearchUsersQuery,
  useCreateSynastryInviteMutation,
  useGetSynastryInvitesQuery,
  useAcceptSynastryInviteMutation,
  useDeclineSynastryInviteMutation
} from '@/integrations/rtk/hooks';
import { toast } from 'sonner';
import ShareCard from '@/components/common/ShareCard';

const cinzel = Cinzel({ subsets: ['latin'] });

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export default function SynastryPage() {
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') as any;
  const [step, setStep] = useState<'mode' | 'quick' | 'manual' | 'invite' | 'loading' | 'result'>(
    ['quick', 'manual', 'invite'].includes(initialMode) ? initialMode : 'mode'
  );
  const [quickData, setQuickData] = useState({ sign_a: 'Aries', sign_b: 'Aries' });
  const [manualData, setManualData] = useState({ name: '', dob: '', tob: '', pob_label: '' });
  const [userSearch, setUserSearch] = useState('');
  const [result, setResult] = useState<any>(null);

  const [getManual] = useGetSynastryManualMutation();
  const [getQuick] = useGetSynastryQuickMutation();
  const { data: searchResults, isFetching: isSearching } = useSearchUsersQuery(userSearch, { skip: userSearch.length < 3 });
  const [createInvite] = useCreateSynastryInviteMutation();
  const { data: pendingInvites } = useGetSynastryInvitesQuery();
  const [acceptInvite] = useAcceptSynastryInviteMutation();
  const [declineInvite] = useDeclineSynastryInviteMutation();

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');
    try {
      const res = await getQuick(quickData).unwrap();
      setResult({ type: 'quick', ...res });
      setTimeout(() => setStep('result'), 2500);
    } catch (err) {
      toast.error('Uyum analizi başarısız oldu');
      setStep('mode');
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('loading');
    try {
      const res = await getManual({ partner_data: manualData }).unwrap();
      setResult({ type: 'manual', ...res });
      setTimeout(() => setStep('result'), 3000);
    } catch (err: any) {
      if (err.status === 402) {
        toast.error('Yetersiz kredi! Lütfen kredi paketi alınız.');
        setStep('manual');
      } else {
        toast.error('Detaylı analiz için önce kendi doğum haritanızı oluşturmalısınız.');
        setStep('mode');
      }
    }
  };

  const handleSendInvite = async (partnerId: string) => {
    try {
      await createInvite({ partner_user_id: partnerId }).unwrap();
      toast.success('Davet başarıyla gönderildi!');
      setUserSearch('');
    } catch (err) {
      toast.error('Davet gönderilemedi.');
    }
  };

  const handleAccept = async (id: string) => {
    setStep('loading');
    try {
      const res = await acceptInvite(id).unwrap();
      setResult({ type: 'manual', ...res });
      setStep('result');
      toast.success('Davet kabul edildi ve analiz üretildi!');
    } catch (err) {
      toast.error('Hata oluştu.');
      setStep('mode');
    }
  };

  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto relative">
        <AnimatePresence mode="wait">
          {step === 'mode' && (
            <motion.div
              key="mode"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12 text-center"
            >
              <div className="space-y-4">
                <h1 className={`${cinzel.className} text-5xl md:text-7xl text-foreground tracking-tighter`}>
                  Aşk <span className="text-brand-gold">Uyumu</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-serif italic">
                  Yıldızların aşkınıza ne dediğini keşfedin. Hangi yöntemi tercih edersiniz?
                </p>
              </div>

              {pendingInvites && pendingInvites.length > 0 && (
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="max-w-2xl mx-auto bg-brand-gold/10 border border-brand-gold/20 p-6 rounded-3xl space-y-4"
                >
                  <div className="flex items-center justify-center gap-2 text-brand-gold">
                    <Heart className="w-5 h-5 fill-brand-gold" />
                    <span className="text-xs font-bold tracking-widest uppercase">BEKLEYEN DAVETLERİN VAR</span>
                  </div>
                  <div className="space-y-3">
                    {pendingInvites.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between bg-surface/50 p-4 rounded-2xl border border-border/10">
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground">Bir kullanıcı seninle uyumuna bakmak istiyor</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{new Date(inv.created_at).toLocaleDateString('tr-TR')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAccept(inv.id)} className="w-10 h-10 bg-success/20 text-success rounded-full flex items-center justify-center hover:bg-success hover:text-white transition-all"><Check className="w-5 h-5" /></button>
                          <button onClick={() => declineInvite(inv.id)} className="w-10 h-10 bg-error/20 text-error rounded-full flex items-center justify-center hover:bg-error hover:text-white transition-all"><X className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                <button 
                  onClick={() => setStep('quick')}
                  className="group bg-surface/30 border border-border/20 p-8 rounded-[2.5rem] text-left space-y-6 hover:bg-brand-gold/5 transition-all hover:border-brand-gold/30"
                >
                  <div className="w-14 h-14 bg-brand-gold/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-brand-gold" />
                  </div>
                  <div className="space-y-2">
                    <h3 className={`${cinzel.className} text-xl text-foreground`}>Hızlı Uyum</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">2 Burç seçimi. Anında yorum. Ücretsiz!</p>
                  </div>
                  <div className="flex items-center text-brand-gold text-[10px] font-bold tracking-widest gap-2">
                    DENEMEK ÜCRETSİZ <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button 
                  onClick={() => setStep('manual')}
                  className="group bg-surface/30 border border-border/20 p-8 rounded-[2.5rem] text-left space-y-6 hover:bg-brand-primary/5 transition-all hover:border-brand-primary/30"
                >
                  <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-7 h-7 text-brand-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className={`${cinzel.className} text-xl text-foreground`}>Manuel Rapor</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">Partner bilgilerini sen gir, tam raporu hemen al.</p>
                  </div>
                  <div className="flex items-center text-brand-primary text-[10px] font-bold tracking-widest gap-2">
                    250 KREDİ <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button 
                  onClick={() => setStep('invite')}
                  className="group bg-surface/30 border border-border/20 p-8 rounded-[2.5rem] text-left space-y-6 hover:bg-brand-accent/5 transition-all hover:border-brand-accent/30"
                >
                  <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-brand-accent" />
                  </div>
                  <div className="space-y-2">
                    <h3 className={`${cinzel.className} text-xl text-foreground`}>Davet Et</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">Partnerine davet gönder, o da onaylayınca uyuma bakın.</p>
                  </div>
                  <div className="flex items-center text-brand-accent text-[10px] font-bold tracking-widest gap-2">
                    PREMİUM / ÜCRETSİZ <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {step === 'invite' && (
            <motion.div
              key="invite"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl mx-auto space-y-12"
            >
               <button onClick={() => setStep('mode')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold tracking-widest">
                  <ChevronLeft className="w-4 h-4" /> GERİ DÖN
               </button>
               <div className="text-center space-y-4">
                  <h2 className={`${cinzel.className} text-4xl text-foreground`}>Partnerini Davet Et</h2>
                  <p className="text-muted-foreground italic font-serif">Birlikte kozmik uyumunuza bakmak istediğiniz kullanıcıyı arayın.</p>
               </div>

               <div className="space-y-8">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="İsim veya e-posta ile ara..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full bg-surface/30 border border-border/20 rounded-full py-6 pl-14 pr-8 outline-none focus:ring-2 focus:ring-brand-accent/30 text-lg"
                    />
                  </div>

                  <div className="space-y-4">
                    {isSearching ? (
                      <div className="text-center py-10 opacity-50 italic">Aranıyor...</div>
                    ) : searchResults && searchResults.length > 0 ? (
                      searchResults.map((u: any) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={u.id} 
                          className="bg-surface/30 border border-border/10 p-6 rounded-3xl flex items-center justify-between hover:bg-surface/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-brand-accent" />
                             </div>
                             <div>
                                <h4 className="font-bold text-foreground">{u.full_name}</h4>
                                <p className="text-xs text-muted-foreground">{u.email}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleSendInvite(u.id)}
                            className="bg-brand-accent/20 text-brand-accent px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-brand-accent hover:text-white transition-all flex items-center gap-2"
                          >
                            DAVET ET <Send className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))
                    ) : userSearch.length >= 3 && (
                      <div className="text-center py-10 opacity-50 italic">Kullanıcı bulunamadı.</div>
                    )}
                  </div>
               </div>
            </motion.div>
          )}

          {step === 'quick' && (
            <motion.div
              key="quick"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-12"
            >
               <button onClick={() => setStep('mode')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold tracking-widest">
                  <ChevronLeft className="w-4 h-4" /> GERİ DÖN
               </button>
               <div className="text-center space-y-4">
                  <h2 className={`${cinzel.className} text-4xl text-foreground`}>Hızlı Aşk Analizi</h2>
                  <p className="text-muted-foreground italic font-serif">Siz ve o... Burçlarınızın enerjisi nasıl bir harmoni yaratıyor?</p>
               </div>

               <form onSubmit={handleQuickSubmit} className="bg-surface/30 border border-border/20 p-10 rounded-[2.5rem] space-y-10 backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-8 relative">
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="w-12 h-12 bg-bg-base border border-border/20 rounded-full flex items-center justify-center shadow-2xl">
                           <Heart className="w-6 h-6 text-brand-gold fill-brand-gold animate-pulse" />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-brand-gold tracking-[0.2em] uppercase ml-2 text-center block">SENİN BURCUN</label>
                        <select 
                           value={quickData.sign_a}
                           onChange={(e) => setQuickData({ ...quickData, sign_a: e.target.value })}
                           className="w-full bg-surface-high/50 border border-border/20 rounded-2xl p-5 text-lg outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all appearance-none text-center cursor-pointer"
                        >
                           {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>

                     <div className="space-y-4 text-right">
                        <label className="text-[10px] font-bold text-brand-gold tracking-[0.2em] uppercase mr-2 text-center block">ONUN BURCU</label>
                        <select 
                           value={quickData.sign_b}
                           onChange={(e) => setQuickData({ ...quickData, sign_b: e.target.value })}
                           className="w-full bg-surface-high/50 border border-border/20 rounded-2xl p-5 text-lg outline-none focus:ring-2 focus:ring-brand-gold/20 transition-all appearance-none text-center cursor-pointer"
                        >
                           {ZODIAC_SIGNS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-gold text-bg-base font-bold py-5 rounded-2xl tracking-[0.1em] shadow-xl shadow-brand-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    UYUMU GÖR
                  </button>
               </form>
            </motion.div>
          )}

          {step === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-xl mx-auto space-y-10"
            >
               <button onClick={() => setStep('mode')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold tracking-widest">
                  <ChevronLeft className="w-4 h-4" /> GERİ DÖN
               </button>
               <div className="text-center space-y-4">
                  <h2 className={`${cinzel.className} text-4xl text-foreground`}>Sinastri Analizi</h2>
                  <p className="text-muted-foreground italic font-serif leading-relaxed">Partnerinizin doğum bilgilerini girerek 100 farklı astrolojik açıdan derin uyumunuzu keşfedin.</p>
               </div>

               <form onSubmit={handleManualSubmit} className="bg-surface/30 border border-border/20 p-10 rounded-[2.5rem] space-y-8 shadow-2xl backdrop-blur-xl">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-brand-gold tracking-[0.2em] uppercase ml-4">PARTNERİN ADI</label>
                       <input 
                         type="text" required placeholder="Örn: Mehmet"
                         value={manualData.name} onChange={e => setManualData({ ...manualData, name: e.target.value })}
                         className="w-full bg-surface-high/50 border border-border/20 rounded-2xl p-4 pl-6 text-foreground outline-none focus:ring-2 focus:ring-brand-primary/20"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-brand-gold tracking-[0.2em] uppercase ml-4">DOĞUM TARİHİ</label>
                       <input 
                         type="date" required
                         value={manualData.dob} onChange={e => setManualData({ ...manualData, dob: e.target.value })}
                         className="w-full bg-surface-high/50 border border-border/20 rounded-2xl p-4 pl-6 text-foreground outline-none focus:ring-2 focus:ring-brand-primary/20"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-brand-gold tracking-[0.2em] uppercase ml-4">DOĞUM SAATİ (OPSİYONEL)</label>
                       <input 
                         type="time"
                         value={manualData.tob} onChange={e => setManualData({ ...manualData, tob: e.target.value })}
                         className="w-full bg-surface-high/50 border border-border/20 rounded-2xl p-4 pl-6 text-foreground outline-none focus:ring-2 focus:ring-brand-primary/20"
                       />
                    </div>
                  </div>

                  <div className="p-4 bg-brand-gold/5 border border-brand-gold/10 rounded-2xl space-y-2">
                     <p className="text-[10px] text-brand-gold leading-relaxed italic uppercase tracking-wider text-center font-bold">
                        MALİYET: 250 KREDİ
                     </p>
                     <p className="text-[10px] text-muted-foreground leading-relaxed italic text-center">
                        * Bu veriler sadece rapor üretimi için kullanılır ve sistemimizde saklanmaz.
                     </p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-primary text-white font-bold py-5 rounded-2xl tracking-[0.1em] shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    ANALİZİ BAŞLAT
                  </button>
               </form>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 space-y-12"
            >
               <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 border-4 border-brand-gold/20 border-t-brand-gold rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Heart className="w-8 h-8 text-brand-gold fill-brand-gold animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-4">
                  <h3 className={`${cinzel.className} text-3xl text-foreground tracking-widest`}>Kader Ağları Örülüyor</h3>
                  <p className="text-muted-foreground font-serif italic">Yıldızların birbirine dokunduğu o an analiz ediliyor...</p>
               </div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-12"
            >
               {result.type === 'quick' ? (
                 <div className="max-w-3xl mx-auto bg-surface/30 border border-border/20 rounded-[3rem] p-10 md:p-16 space-y-10 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                       <Users className="w-64 h-64" />
                    </div>
                    
                    <div className="text-center space-y-6 relative">
                       <div className="flex items-center justify-center gap-12">
                          <div className="text-center space-y-2">
                             <div className="text-4xl">{quickData.sign_a}</div>
                             <div className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">SEN</div>
                          </div>
                          <Heart className="w-8 h-8 text-brand-gold fill-brand-gold" />
                          <div className="text-center space-y-2">
                             <div className="text-4xl">{quickData.sign_b}</div>
                             <div className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">O</div>
                          </div>
                       </div>
                       <h2 className={`${cinzel.className} text-4xl text-foreground tracking-tight`}>{result.title}</h2>
                       <div className="h-1 w-20 bg-brand-gold/30 mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       {[
                         { label: 'AŞK', val: result.love_score },
                         { label: 'DOSTLUK', val: result.friendship_score },
                         { label: 'KARİYER', val: result.career_score },
                         { label: 'ÇEKİM', val: result.sexual_score }
                       ].map(s => (
                         <div key={s.label} className="bg-surface-high/30 p-4 rounded-2xl text-center border border-border/10">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1 tracking-widest">{s.label}</div>
                            <div className="text-2xl font-bold text-brand-gold">%{s.val}</div>
                         </div>
                       ))}
                    </div>

                    <div className="prose prose-invert prose-brand max-w-none">
                       <p className="text-lg text-foreground/90 leading-relaxed font-serif italic whitespace-pre-wrap">{result.content}</p>
                    </div>

                     <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <button 
                          onClick={() => setStep('mode')}
                          className="flex-1 py-4 rounded-2xl border border-border/20 text-muted-foreground text-xs font-bold tracking-widest hover:bg-surface-high transition-all"
                        >
                          BAŞTAN BAŞLA
                        </button>
                        <ShareCard 
                          title="Aşk Uyumunu Paylaş"
                          shareText={`GoldMoodAstro'da aşk uyumumuzu ölçtüm ✨\n❤️ Aşk: %${result.love_score}  •  🔥 Çekim: %${result.sexual_score}\nSen de uyumunu keşfet:`}
                          variant="synastry"
                          data={{
                            partnerA: quickData.sign_a,
                            partnerB: quickData.sign_b,
                            scoreLove: result.love_score,
                            scoreAttraction: result.sexual_score
                          }}
                        />
                     </div>
                 </div>
               ) : (
                 <div className="flex flex-col lg:flex-row gap-10">
                    <div className="w-full lg:w-1/3 space-y-6">
                       <div className="bg-surface/30 border border-border/20 rounded-[2.5rem] p-8 text-center space-y-6">
                          <h3 className={`${cinzel.className} text-xl text-foreground tracking-widest`}>Uyum Skoru</h3>
                          <div className="relative inline-block">
                             <svg className="w-40 h-40 transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border/10" />
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (result.result?.score ?? result.score ?? 0)) / 100} className="text-brand-primary" />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-brand-primary">%{result.result?.score ?? result.score ?? 0}</div>
                          </div>
                       </div>
                       
                       <div className="bg-surface/30 border border-border/20 rounded-[2.5rem] p-8 space-y-6">
                          <h4 className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-4">ÖNEMLİ AÇILAR</h4>
                          <div className="space-y-4">
                             {(result.result?.aspects ?? result.aspects)?.slice(0, 5).map((a: any, i: number) => (
                               <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface-high/30 border border-border/10">
                                  <div className="text-xs font-bold text-foreground uppercase">{a.planet_a} & {a.planet_b}</div>
                                  <div className="text-[10px] text-brand-primary font-bold uppercase">{a.type}</div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="w-full lg:w-2/3 bg-surface/30 border border-border/20 rounded-[3rem] p-10 md:p-14 space-y-10 relative overflow-hidden backdrop-blur-xl">
                       <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                          <Sparkles className="w-64 h-64 text-brand-primary" />
                       </div>
                       
                       <div className="space-y-6 relative">
                          <div className="flex items-center gap-2 text-brand-primary">
                             <Star className="w-5 h-5 fill-brand-primary" />
                             <span className="text-[10px] font-bold tracking-[0.4em] uppercase">Derin Analiz</span>
                          </div>
                          <h2 className={`${cinzel.className} text-4xl text-foreground leading-tight`}>
                             Kozmik <span className="text-brand-primary">Bağlantı</span> Raporu
                          </h2>
                          <p className="text-muted-foreground font-serif italic text-lg leading-relaxed">
                             {result.mode === 'invite' ? 'Partneriniz' : manualData.name} ile olan enerjiniz, gökyüzündeki planetlerin etkileşimiyle bu şekilde yorumlanıyor:
                          </p>
                       </div>

                       <div className="prose prose-invert prose-brand max-w-none">
                          <div className="text-foreground/90 leading-relaxed font-serif whitespace-pre-wrap italic text-lg opacity-90">
                             {result.result?.interpretation ?? result.interpretation ?? result.reading}
                          </div>
                       </div>

                       <div className="pt-10 border-t border-border/10 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-muted-foreground/60">
                             <ShieldCheck className="w-4 h-4" />
                             <span className="text-[10px] font-bold tracking-widest uppercase">Güvenli ve Gizli Analiz</span>
                          </div>
                          <button onClick={() => setStep('mode')} className="text-brand-primary text-xs font-bold tracking-widest border-b border-brand-primary/30 pb-1">
                             YENİ BİRİNE BAK
                          </button>
                       </div>
                    </div>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

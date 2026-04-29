'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import { 
  Zap, 
  ShieldCheck, 
  CreditCard, 
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { 
  useListCreditPackagesQuery, 
  useGetUserBalanceQuery, 
  useBuyCreditsMutation 
} from '@/integrations/rtk/hooks';
import { toast } from 'sonner';

const cinzel = Cinzel({ subsets: ['latin'] });

export default function CreditsPage() {
  const { data: balanceData } = useGetUserBalanceQuery();
  const { data: packages, isLoading: pkgLoading } = useListCreditPackagesQuery();
  const [buyCredits, { isLoading: buyLoading }] = useBuyCreditsMutation();

  const handleBuy = async (packageId: string) => {
    try {
      const res = await buyCredits({ package_id: packageId, locale: 'tr' }).unwrap();
      if (res.checkout_url) {
        window.location.href = res.checkout_url;
      }
    } catch (err) {
      toast.error('Ödeme başlatılamadı');
    }
  };

  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Bakiye Özeti */}
        <div className="bg-surface/30 border border-border/20 rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
           
           <div className="space-y-6 text-center md:text-left relative">
              <h1 className={`${cinzel.className} text-4xl md:text-6xl text-foreground`}>Kredi Bakiyeniz</h1>
              <p className="text-muted-foreground text-lg max-w-md italic font-serif leading-relaxed">
                Astroloji danışmanlıkları ve özel yorumlar için kredi bakiyenizi kullanın.
              </p>
           </div>

           <div className="flex flex-col items-center gap-4 relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-brand-gold/20 flex flex-col items-center justify-center bg-surface-high/50 shadow-xl">
                 <Zap className="w-6 h-6 text-brand-gold mb-1" />
                 <span className="text-4xl md:text-5xl font-bold text-foreground tracking-tighter">
                    {balanceData?.balance?.toLocaleString() || '0'}
                 </span>
                 <span className="text-[10px] font-bold text-brand-gold tracking-widest uppercase">KREDİ</span>
              </div>
           </div>
        </div>

        {/* Paketler */}
        <div className="space-y-10">
           <div className="text-center space-y-2">
              <h2 className={`${cinzel.className} text-3xl text-foreground`}>Kredi Paketleri</h2>
              <p className="text-muted-foreground font-serif italic">Size en uygun paketi seçerek devam edin.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pkgLoading ? (
                 [1, 2, 3].map(i => <div key={i} className="h-80 bg-surface/20 animate-pulse rounded-[2.5rem]"></div>)
              ) : packages?.map((pkg, i) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative group bg-surface/30 border border-border/20 rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-6 hover:border-brand-gold/40 transition-all shadow-xl ${pkg.isFeatured ? 'ring-2 ring-brand-gold/50 scale-105 md:scale-110 z-10' : ''}`}
                >
                  {pkg.isFeatured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-gold text-bg-base text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest flex items-center gap-1 shadow-lg">
                      <Award className="w-3 h-3" /> EN POPÜLER
                    </div>
                  )}

                  <div className="space-y-2">
                    <h3 className={`${cinzel.className} text-2xl text-foreground`}>{pkg.nameTr}</h3>
                    <div className="text-4xl font-bold text-brand-gold tracking-tighter">
                       {(pkg.credits + pkg.bonusCredits).toLocaleString()} <span className="text-sm">kr</span>
                    </div>
                  </div>

                  <div className="space-y-2 w-full">
                     <div className="text-3xl font-light text-foreground/80">
                        {(pkg.priceMinor / 100).toLocaleString('tr-TR', { minimumFractionDigits: 0 })} <span className="text-lg">₺</span>
                     </div>
                     {pkg.bonusCredits > 0 && (
                       <div className="text-xs font-bold text-emerald-400 tracking-wider flex items-center justify-center gap-1">
                          <TrendingUp className="w-3 h-3" /> +{pkg.bonusCredits.toLocaleString()} BONUS
                       </div>
                     )}
                  </div>

                  <button
                    onClick={() => handleBuy(pkg.id)}
                    disabled={buyLoading}
                    className="w-full py-4 rounded-2xl bg-brand-gold text-bg-base font-bold tracking-widest text-xs hover:bg-brand-gold-dim transition-all flex items-center justify-center gap-2 group"
                  >
                    SATIN AL <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Güvenlik */}
        <div className="max-w-2xl mx-auto pt-10 flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
           <div className="flex items-center gap-3 text-muted-foreground/60">
              <ShieldCheck className="w-10 h-10 text-brand-gold/40" />
              <div className="text-xs font-serif italic">
                 Ödemeleriniz <span className="text-brand-gold/60 font-bold">iyzico</span> altyapısı ile 256-bit SSL sertifikası korunmaktadır.
              </div>
           </div>
           <div className="flex items-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all">
              <CreditCard className="w-6 h-6" />
              <span className="text-[10px] font-bold tracking-widest uppercase">Mastercard</span>
              <span className="text-[10px] font-bold tracking-widest uppercase">Visa</span>
              <span className="text-[10px] font-bold tracking-widest uppercase">TROY</span>
           </div>
        </div>

      </div>
    </main>
  );
}

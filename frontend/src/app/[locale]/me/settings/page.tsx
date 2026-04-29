'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cinzel } from 'next/font/google';
import { 
  User, 
  Bell, 
  ShieldAlert, 
  Trash2, 
  Save,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react';
import { 
  useGetMyProfileQuery, 
  useUpsertMyProfileMutation,
  useListMyBirthChartsQuery,
  useUpdateBirthChartMutation
} from '@/integrations/rtk/hooks';
import { toast } from 'sonner';

const cinzel = Cinzel({ subsets: ['latin'] });

export default function SettingsPage() {
  const { data: profile } = useGetMyProfileQuery();
  const { data: charts } = useListMyBirthChartsQuery();
  const [upsertProfile] = useUpsertMyProfileMutation();
  const [updateChart] = useUpdateBirthChartMutation();

  const [formData, setFormData] = useState({
    full_name: '',
    push_notifications: true,
    email_notifications: true
  });

  const primaryChart = charts?.[0]; // MVP: ilk haritayı ana harita sayıyoruz

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        push_notifications: !!profile.push_notifications,
        email_notifications: !!profile.email_notifications
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await upsertProfile({
        profile: {
          full_name: formData.full_name,
          push_notifications: formData.push_notifications ? 1 : 0,
          email_notifications: formData.email_notifications ? 1 : 0
        }
      }).unwrap();
      toast.success('Profil güncellendi');
    } catch (err) {
      toast.error('Güncelleme başarısız');
    }
  };

  return (
    <main className="min-h-screen bg-background pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className={`${cinzel.className} text-4xl md:text-5xl text-foreground`}>Ayarlar</h1>
          <p className="text-muted-foreground italic font-serif">Kişisel bilgilerinizi ve tercihlerinizi yönetin.</p>
        </div>

        <div className="space-y-8">
          {/* Kişisel Bilgiler */}
          <section className="bg-surface/30 border border-border/20 rounded-[2.5rem] p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-4 text-brand-gold">
              <User className="w-6 h-6" />
              <h2 className={`${cinzel.className} text-xl tracking-wider`}>Kişisel Bilgiler</h2>
            </div>

            <div className="grid gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground tracking-widest uppercase ml-4">Ad Soyad</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full bg-surface-high/50 border border-border/20 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold/50 transition-all text-foreground outline-none"
                  />
               </div>

               {primaryChart && (
                 <div className="bg-brand-gold/5 border border-brand-gold/10 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-bold text-brand-gold tracking-widest uppercase">Doğum Haritası Bilgileri</h3>
                       <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                       <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" /> {new Date(primaryChart.dob).toLocaleDateString('tr-TR')}
                       </div>
                       <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" /> {primaryChart.tob}
                       </div>
                       <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" /> {primaryChart.pob_label}
                       </div>
                    </div>
                    <p className="text-xs text-muted-foreground/60 italic pt-2 border-t border-brand-gold/10">
                      * Doğum saati ve konumu gibi hassas veriler astroloji motorumuz tarafından hesaplamalarda kullanılır.
                    </p>
                 </div>
               )}
            </div>
          </section>

          {/* Bildirim Tercihleri */}
          <section className="bg-surface/30 border border-border/20 rounded-[2.5rem] p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-4 text-brand-gold">
              <Bell className="w-6 h-6" />
              <h2 className={`${cinzel.className} text-xl tracking-wider`}>Bildirimler</h2>
            </div>

            <div className="space-y-6">
               {[
                 { key: 'push_notifications', label: 'Anlık Bildirimler (Push)', desc: 'Günlük burç yorumları ve sistem duyuruları.' },
                 { key: 'email_notifications', label: 'E-posta Bildirimleri', desc: 'Randevu hatırlatmaları ve önemli güncellemeler.' },
               ].map((item) => (
                 <div key={item.key} className="flex items-center justify-between gap-8">
                    <div className="space-y-1">
                       <div className="text-foreground font-bold">{item.label}</div>
                       <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => setFormData({...formData, [item.key]: !formData[item.key as keyof typeof formData]})}
                      className={`relative w-14 h-8 rounded-full transition-colors ${formData[item.key as keyof typeof formData] ? 'bg-brand-gold' : 'bg-surface-high'}`}
                    >
                      <motion.div
                        animate={{ x: formData[item.key as keyof typeof formData] ? 24 : 4 }}
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                      />
                    </button>
                 </div>
               ))}
            </div>
          </section>

          {/* Tehlikeli Bölge */}
          <section className="bg-rose-500/5 border border-rose-500/10 rounded-[2.5rem] p-8 md:p-10 space-y-8">
            <div className="flex items-center gap-4 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
              <h2 className={`${cinzel.className} text-xl tracking-wider`}>Tehlikeli Bölge</h2>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="space-y-1 text-center md:text-left">
                  <div className="text-foreground font-bold">Hesabı Kapat</div>
                  <div className="text-sm text-muted-foreground">Tüm verileriniz 7 gün sonra kalıcı olarak silinecektir.</div>
               </div>
               <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-bold text-sm tracking-widest">
                  <Trash2 className="w-4 h-4" /> HESABI SİL
               </button>
            </div>
          </section>

          <div className="flex justify-center pt-8">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-3 px-12 py-5 rounded-2xl bg-brand-gold text-bg-base font-bold tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-gold/20"
            >
              <Save className="w-5 h-5" /> DEĞİŞİKLİKLERİ KAYDET
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

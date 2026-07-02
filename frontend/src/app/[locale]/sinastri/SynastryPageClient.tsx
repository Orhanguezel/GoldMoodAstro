'use client';

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  ShieldCheck,
  ChevronLeft,
  Search,
  Check,
  X,
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
import { useAuthStore } from '@/features/auth/auth.store';
import { useUiSection } from '@/i18n';
import { toast } from 'sonner';
import ShareCard from '@/components/common/ShareCard';

const cinzel = Cinzel({ subsets: ['latin'] });

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export default function SynastryPage() {
  const { ui } = useUiSection('ui_synastry');
  const params = useParams<{ locale?: string }>();
  const locale = typeof params?.locale === 'string' ? params.locale : 'tr';
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') as any;
  const [step, setStep] = useState<'mode' | 'quick' | 'manual' | 'invite' | 'loading' | 'result'>(
    ['quick', 'manual', 'invite'].includes(initialMode) ? initialMode : 'mode'
  );
  const [quickData, setQuickData] = useState({ sign_a: 'aries', sign_b: 'aries' });
  const [manualData, setManualData] = useState({ name: '', dob: '', tob: '', pob_label: '' });
  const [userSearch, setUserSearch] = useState('');
  const [result, setResult] = useState<any>(null);

  const [getManual] = useGetSynastryManualMutation();
  const [getQuick] = useGetSynastryQuickMutation();
  const { isAuthenticated } = useAuthStore();
  const { data: searchResults, isFetching: isSearching } = useSearchUsersQuery(userSearch, { skip: userSearch.length < 3 || !isAuthenticated });
  const [createInvite] = useCreateSynastryInviteMutation();
  const { data: pendingInvites } = useGetSynastryInvitesQuery(undefined, { skip: !isAuthenticated });
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
      toast.error(ui('ui_synastry_quick_failed', 'Compatibility analysis failed'));
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
        toast.error(ui('ui_synastry_insufficient_credits', 'Insufficient credits. Please purchase a credit package.'));
        setStep('manual');
      } else {
        toast.error(ui('ui_synastry_need_own_chart', 'Create your own birth chart before requesting a detailed analysis.'));
        setStep('mode');
      }
    }
  };

  const handleSendInvite = async (partnerId: string) => {
    try {
      await createInvite({ partner_user_id: partnerId }).unwrap();
      toast.success(ui('ui_synastry_invite_sent', 'Invite sent successfully.'));
      setUserSearch('');
    } catch (err) {
      toast.error(ui('ui_synastry_invite_failed', 'Invite could not be sent.'));
    }
  };

  const handleAccept = async (id: string) => {
    setStep('loading');
    try {
      const res = await acceptInvite(id).unwrap();
      setResult({ type: 'manual', ...res });
      setStep('result');
      toast.success(ui('ui_synastry_invite_accepted', 'Invite accepted and analysis generated.'));
    } catch (err) {
      toast.error(ui('ui_synastry_generic_error', 'Something went wrong.'));
      setStep('mode');
    }
  };

  return (
    <div className="max-w-[var(--gm-w-content)] mx-auto relative">
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
                <h2 className={`${cinzel.className} text-5xl md:text-7xl text-(--gm-text) tracking-tighter`}>
                  {ui('ui_synastry_love_word', 'Love')} <span className="text-(--gm-gold)">{ui('ui_synastry_compat_word', 'Compatibility')}</span>
                </h2>
                <p className="text-(--gm-text-dim) text-lg max-w-[var(--gm-w-narrow)] mx-auto font-serif italic">
                  {ui('ui_synastry_mode_lead', 'Discover what the stars say about your connection. Which method do you prefer?')}
                </p>
              </div>

              {pendingInvites && pendingInvites.length > 0 && (
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="max-w-[var(--gm-w-narrow)] mx-auto bg-(--gm-gold)/10 border border-(--gm-gold)/20 p-6 rounded-3xl space-y-4"
                >
                  <div className="flex items-center justify-center gap-2 text-(--gm-gold)">
                    <Heart className="w-5 h-5 fill-(--gm-gold)" />
                    <span className="text-xs font-bold tracking-widest uppercase">{ui('ui_synastry_pending_invites', 'YOU HAVE PENDING INVITES')}</span>
                  </div>
                  <div className="space-y-3">
                    {pendingInvites.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between bg-(--gm-surface)/50 p-4 rounded-2xl border border-(--gm-border-soft)">
                        <div className="text-left">
                          <p className="text-sm font-bold text-(--gm-text)">{ui('ui_synastry_invite_card_text', 'A user wants to check compatibility with you')}</p>
                          <p className="text-[10px] text-(--gm-text-dim) uppercase tracking-widest">{new Date(inv.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAccept(inv.id)} className="w-10 h-10 bg-success/20 text-success rounded-full flex items-center justify-center hover:bg-success hover:text-(--gm-text) transition-all"><Check className="w-5 h-5" /></button>
                          <button onClick={() => declineInvite(inv.id)} className="w-10 h-10 bg-error/20 text-error rounded-full flex items-center justify-center hover:bg-error hover:text-(--gm-text) transition-all"><X className="w-5 h-5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="grid md:grid-cols-3 gap-6 max-w-[var(--gm-w-content)] mx-auto">
                <button 
                  onClick={() => setStep('quick')}
                  className="group bg-(--gm-surface)/30 border border-(--gm-border-soft) p-8 rounded-[2.5rem] text-left space-y-6 hover:bg-(--gm-gold)/5 transition-all hover:border-(--gm-gold)/30"
                >
                  <div className="w-14 h-14 bg-(--gm-gold)/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-7 h-7 text-(--gm-gold)" />
                  </div>
                  <div className="space-y-2">
                    <h3 className={`${cinzel.className} text-xl text-(--gm-text)`}>{ui('ui_synastry_quick_title', 'Quick Compatibility')}</h3>
                    <p className="text-(--gm-text-dim) text-xs leading-relaxed">{ui('ui_synastry_quick_desc', 'Choose two signs. Instant reading. Free.')}</p>
                  </div>
                  <div className="flex items-center text-(--gm-gold) text-[10px] font-bold tracking-widest gap-2">
                    {ui('ui_synastry_quick_cta', 'TRY FOR FREE')} <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button 
                  onClick={() => setStep('manual')}
                  className="group bg-(--gm-surface)/30 border border-(--gm-border-soft) p-8 rounded-[2.5rem] text-left space-y-6 hover:bg-(--gm-primary)/5 transition-all hover:border-(--gm-primary)/30"
                >
                  <div className="w-14 h-14 bg-(--gm-primary)/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Star className="w-7 h-7 text-(--gm-primary)" />
                  </div>
                  <div className="space-y-2">
                    <h3 className={`${cinzel.className} text-xl text-(--gm-text)`}>{ui('ui_synastry_manual_title', 'Manual Report')}</h3>
                    <p className="text-(--gm-text-dim) text-xs leading-relaxed">{ui('ui_synastry_manual_desc', 'Enter partner details and get the full report immediately.')}</p>
                  </div>
                  <div className="flex items-center text-(--gm-primary) text-[10px] font-bold tracking-widest gap-2">
                    {ui('ui_synastry_manual_cost', '250 CREDITS')} <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                <button 
                  onClick={() => setStep('invite')}
                  className="group bg-(--gm-surface)/30 border border-(--gm-border-soft) p-8 rounded-[2.5rem] text-left space-y-6 hover:bg-(--gm-accent)/5 transition-all hover:border-(--gm-accent)/30"
                >
                  <div className="w-14 h-14 bg-(--gm-accent)/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-(--gm-accent)" />
                  </div>
                  <div className="space-y-2">
                    <h3 className={`${cinzel.className} text-xl text-(--gm-text)`}>{ui('ui_synastry_invite_title', 'Send Invite')}</h3>
                    <p className="text-(--gm-text-dim) text-xs leading-relaxed">{ui('ui_synastry_invite_desc', 'Send your partner an invite and view compatibility after approval.')}</p>
                  </div>
                  <div className="flex items-center text-(--gm-accent) text-[10px] font-bold tracking-widest gap-2">
                    {ui('ui_synastry_invite_cost', 'PREMIUM / FREE')} <ChevronRight className="w-4 h-4" />
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
              className="max-w-[var(--gm-w-narrow)] mx-auto space-y-12"
            >
               <button onClick={() => setStep('mode')} className="flex items-center gap-2 text-(--gm-text-dim) hover:text-(--gm-text) transition-colors text-xs font-bold tracking-widest">
                  <ChevronLeft className="w-4 h-4" /> {ui('ui_synastry_back', 'GO BACK')}
               </button>
               <div className="text-center space-y-4">
                  <h2 className={`${cinzel.className} text-4xl text-(--gm-text)`}>{ui('ui_synastry_invite_heading', 'Invite Your Partner')}</h2>
                  <p className="text-(--gm-text-dim) italic font-serif">{ui('ui_synastry_invite_subtitle', 'Search for the user you want to compare cosmic compatibility with.')}</p>
               </div>

               <div className="space-y-8">
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-(--gm-text-dim)" />
                    <input 
                      type="text"
                      placeholder={ui('ui_synastry_search_placeholder', 'Search by name or email...')}
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full bg-(--gm-surface)/30 border border-(--gm-border-soft) rounded-full py-6 pl-14 pr-8 outline-none focus:ring-2 focus:ring-(--gm-accent)/30 text-lg"
                    />
                  </div>

                  <div className="space-y-4">
                    {isSearching ? (
                      <div className="text-center py-10 opacity-50 italic">{ui('ui_synastry_searching', 'Searching...')}</div>
                    ) : searchResults && searchResults.length > 0 ? (
                      searchResults.map((u: any) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={u.id} 
                          className="bg-(--gm-surface)/30 border border-(--gm-border-soft) p-6 rounded-3xl flex items-center justify-between hover:bg-(--gm-surface)/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-(--gm-accent)/10 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-(--gm-accent)" />
                             </div>
                             <div>
                                <h4 className="font-bold text-(--gm-text)">{u.full_name}</h4>
                                <p className="text-xs text-(--gm-text-dim)">{u.email}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleSendInvite(u.id)}
                            className="bg-(--gm-accent)/20 text-(--gm-accent) px-6 py-2 rounded-full text-xs font-bold tracking-widest hover:bg-(--gm-accent) hover:text-(--gm-text) transition-all flex items-center gap-2"
                          >
                            {ui('ui_synastry_send_invite_btn', 'SEND INVITE')} <Send className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))
                    ) : userSearch.length >= 3 && (
                      <div className="text-center py-10 opacity-50 italic">{ui('ui_synastry_no_users', 'No users found.')}</div>
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
              className="max-w-[var(--gm-w-narrow)] mx-auto space-y-12"
            >
               <button onClick={() => setStep('mode')} className="flex items-center gap-2 text-(--gm-text-dim) hover:text-(--gm-text) transition-colors text-xs font-bold tracking-widest">
                  <ChevronLeft className="w-4 h-4" /> {ui('ui_synastry_back', 'GO BACK')}
               </button>
               <div className="text-center space-y-4">
                  <h2 className={`${cinzel.className} text-4xl text-(--gm-text)`}>{ui('ui_synastry_quick_heading', 'Quick Love Analysis')}</h2>
                  <p className="text-(--gm-text-dim) italic font-serif">{ui('ui_synastry_quick_subtitle', 'You and them... What harmony do your signs create?')}</p>
               </div>

               <form onSubmit={handleQuickSubmit} className="bg-(--gm-surface)/30 border border-(--gm-border-soft) p-10 rounded-[2.5rem] space-y-10 backdrop-blur-xl">
                  <div className="grid grid-cols-2 gap-8 relative">
                     <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                        <div className="w-12 h-12 bg-(--gm-bg) border border-(--gm-border-soft) rounded-full flex items-center justify-center shadow-2xl">
                           <Heart className="w-6 h-6 text-(--gm-gold) fill-(--gm-gold) animate-pulse" />
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-[10px] font-bold text-(--gm-gold) tracking-[0.2em] uppercase ml-2 text-center block">{ui('ui_synastry_your_sign', 'YOUR SIGN')}</label>
                        <select 
                           value={quickData.sign_a}
                           onChange={(e) => setQuickData({ ...quickData, sign_a: e.target.value })}
                           className="w-full bg-(--gm-surface-high)/50 border border-(--gm-border-soft) rounded-2xl p-5 text-lg outline-none focus:ring-2 focus:ring-(--gm-gold)/20 transition-all appearance-none text-center cursor-pointer"
                        >
                           {ZODIAC_SIGNS.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                        </select>
                     </div>

                     <div className="space-y-4 text-right">
                        <label className="text-[10px] font-bold text-(--gm-gold) tracking-[0.2em] uppercase mr-2 text-center block">{ui('ui_synastry_their_sign', 'THEIR SIGN')}</label>
                        <select 
                           value={quickData.sign_b}
                           onChange={(e) => setQuickData({ ...quickData, sign_b: e.target.value })}
                           className="w-full bg-(--gm-surface-high)/50 border border-(--gm-border-soft) rounded-2xl p-5 text-lg outline-none focus:ring-2 focus:ring-(--gm-gold)/20 transition-all appearance-none text-center cursor-pointer"
                        >
                           {ZODIAC_SIGNS.map(s => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                        </select>
                     </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-(--gm-gold) text-(--gm-bg) font-bold py-5 rounded-2xl tracking-[0.1em] shadow-xl shadow-(--gm-gold)/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {ui('ui_synastry_see_compat', 'SEE COMPATIBILITY')}
                  </button>
               </form>
            </motion.div>
          )}

          {step === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-[var(--gm-w-form)] mx-auto space-y-10"
            >
               <button onClick={() => setStep('mode')} className="flex items-center gap-2 text-(--gm-text-dim) hover:text-(--gm-text) transition-colors text-xs font-bold tracking-widest">
                  <ChevronLeft className="w-4 h-4" /> {ui('ui_synastry_back', 'GO BACK')}
               </button>
               <div className="text-center space-y-4">
                  <h2 className={`${cinzel.className} text-4xl text-(--gm-text)`}>{ui('ui_synastry_manual_heading', 'Synastry Analysis')}</h2>
                  <p className="text-(--gm-text-dim) italic font-serif leading-relaxed">{ui('ui_synastry_manual_subtitle', 'Enter your partner birth details and discover deep compatibility from 100 astrological aspects.')}</p>
               </div>

               <form onSubmit={handleManualSubmit} className="bg-(--gm-surface)/30 border border-(--gm-border-soft) p-10 rounded-[2.5rem] space-y-8 shadow-2xl backdrop-blur-xl">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-(--gm-gold) tracking-[0.2em] uppercase ml-4">{ui('ui_synastry_partner_name', 'PARTNER NAME')}</label>
                       <input
                         type="text" required placeholder={ui('ui_synastry_partner_name_placeholder', 'Example: Alex')}
                         value={manualData.name} onChange={e => setManualData({ ...manualData, name: e.target.value })}
                         className="w-full bg-(--gm-surface-high)/50 border border-(--gm-border-soft) rounded-2xl p-4 pl-6 text-(--gm-text) outline-none focus:ring-2 focus:ring-(--gm-primary)/20"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-(--gm-gold) tracking-[0.2em] uppercase ml-4">{ui('ui_synastry_dob', 'BIRTH DATE')}</label>
                       <input 
                         type="date" required
                         value={manualData.dob} onChange={e => setManualData({ ...manualData, dob: e.target.value })}
                         className="w-full bg-(--gm-surface-high)/50 border border-(--gm-border-soft) rounded-2xl p-4 pl-6 text-(--gm-text) outline-none focus:ring-2 focus:ring-(--gm-primary)/20"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-(--gm-gold) tracking-[0.2em] uppercase ml-4">{ui('ui_synastry_tob', 'BIRTH TIME (OPTIONAL)')}</label>
                       <input 
                         type="time"
                         value={manualData.tob} onChange={e => setManualData({ ...manualData, tob: e.target.value })}
                         className="w-full bg-(--gm-surface-high)/50 border border-(--gm-border-soft) rounded-2xl p-4 pl-6 text-(--gm-text) outline-none focus:ring-2 focus:ring-(--gm-primary)/20"
                       />
                    </div>
                  </div>

                  <div className="p-4 bg-(--gm-gold)/5 border border-(--gm-gold)/10 rounded-2xl space-y-2">
                     <p className="text-[10px] text-(--gm-gold) leading-relaxed italic uppercase tracking-wider text-center font-bold">
                        {ui('ui_synastry_cost_label', 'COST: 250 CREDITS')}
                     </p>
                     <p className="text-[10px] text-(--gm-text-dim) leading-relaxed italic text-center">
                        {ui('ui_synastry_privacy_note', '* This data is used only for report generation and is not stored in our system.')}
                     </p>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-(--gm-primary) text-(--gm-bg) font-bold py-5 rounded-2xl tracking-[0.1em] shadow-xl shadow-(--gm-primary)/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {ui('ui_synastry_start_analysis', 'START ANALYSIS')}
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
                    className="w-32 h-32 border-4 border-(--gm-gold)/20 border-t-(--gm-gold) rounded-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Heart className="w-8 h-8 text-(--gm-gold) fill-(--gm-gold) animate-pulse" />
                  </div>
               </div>
               <div className="text-center space-y-4">
                  <h3 className={`${cinzel.className} text-3xl text-(--gm-text) tracking-widest`}>{ui('ui_synastry_loading_title', 'Weaving the Threads')}</h3>
                  <p className="text-(--gm-text-dim) font-serif italic">{ui('ui_synastry_loading_subtitle', 'Analyzing the moment where your stars touch...')}</p>
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
                 <div className="max-w-[var(--gm-w-narrow)] mx-auto bg-(--gm-surface)/30 border border-(--gm-border-soft) rounded-[3rem] p-10 md:p-16 space-y-10 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                       <Users className="w-64 h-64" />
                    </div>
                    
                    <div className="text-center space-y-6 relative">
                       <div className="flex items-center justify-center gap-12">
                          <div className="text-center space-y-2">
                             <div className="text-4xl">{quickData.sign_a}</div>
                             <div className="text-[10px] font-bold text-(--gm-gold) uppercase tracking-widest">{ui('ui_synastry_you', 'YOU')}</div>
                          </div>
                          <Heart className="w-8 h-8 text-(--gm-gold) fill-(--gm-gold)" />
                          <div className="text-center space-y-2">
                             <div className="text-4xl">{quickData.sign_b}</div>
                             <div className="text-[10px] font-bold text-(--gm-gold) uppercase tracking-widest">{ui('ui_synastry_them', 'THEM')}</div>
                          </div>
                       </div>
                       <h2 className={`${cinzel.className} text-4xl text-(--gm-text) tracking-tight`}>{result.title}</h2>
                       <div className="h-1 w-20 bg-(--gm-gold)/30 mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       {[
                         { label: ui('ui_synastry_score_love', 'LOVE'), val: result.love_score },
                         { label: ui('ui_synastry_score_friendship', 'FRIENDSHIP'), val: result.friendship_score },
                         { label: ui('ui_synastry_score_career', 'CAREER'), val: result.career_score },
                         { label: ui('ui_synastry_score_attraction', 'ATTRACTION'), val: result.sexual_score }
                       ].map(s => (
                         <div key={s.label} className="bg-(--gm-surface-high)/30 p-4 rounded-2xl text-center border border-(--gm-border-soft)">
                            <div className="text-[10px] font-bold text-(--gm-text-dim) uppercase mb-1 tracking-widest">{s.label}</div>
                            <div className="text-2xl font-bold text-(--gm-gold)">%{s.val}</div>
                         </div>
                       ))}
                    </div>

                    <div className="prose prose-invert prose-brand max-w-none">
                       <p className="text-lg text-(--gm-text)/90 leading-relaxed font-serif italic whitespace-pre-wrap">{result.content}</p>
                    </div>

                     <div className="pt-8 border-t border-(--gm-border-soft) flex flex-col md:flex-row items-center justify-between gap-6">
                        <button 
                          onClick={() => setStep('mode')}
                          className="flex-1 py-4 rounded-2xl border border-(--gm-border-soft) text-(--gm-text-dim) text-xs font-bold tracking-widest hover:bg-(--gm-surface-high) transition-all"
                        >
                          {ui('ui_synastry_restart', 'START OVER')}
                        </button>
                        <ShareCard 
                          title={ui('ui_synastry_share_title', 'Share Love Compatibility')}
                          shareText={`${ui('ui_synastry_share_line1', "I measured our love compatibility on GoldMoodAstro.")}\n${ui('ui_synastry_share_line2_love', 'Love:')} %${result.love_score}  •  ${ui('ui_synastry_share_line2_attraction', 'Attraction:')} %${result.sexual_score}\n${ui('ui_synastry_share_line3', 'Discover your compatibility too:')}`}
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
                       <div className="bg-(--gm-surface)/30 border border-(--gm-border-soft) rounded-[2.5rem] p-8 text-center space-y-6">
                          <h3 className={`${cinzel.className} text-xl text-(--gm-text) tracking-widest`}>{ui('ui_synastry_compat_score', 'Compatibility Score')}</h3>
                          <div className="relative inline-block">
                             <svg className="w-40 h-40 transform -rotate-90">
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-(--gm-border-soft)/10" />
                                <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * (result.result?.score ?? result.score ?? 0)) / 100} className="text-(--gm-primary)" />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-(--gm-primary)">%{result.result?.score ?? result.score ?? 0}</div>
                          </div>
                       </div>
                       
                       <div className="bg-(--gm-surface)/30 border border-(--gm-border-soft) rounded-[2.5rem] p-8 space-y-6">
                          <h4 className="text-[10px] font-bold text-(--gm-gold) uppercase tracking-[0.3em] mb-4">{ui('ui_synastry_important_aspects', 'IMPORTANT ASPECTS')}</h4>
                          <div className="space-y-4">
                             {(result.result?.aspects ?? result.aspects)?.slice(0, 5).map((a: any, i: number) => (
                               <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-(--gm-surface-high)/30 border border-(--gm-border-soft)">
                                  <div className="text-xs font-bold text-(--gm-text) uppercase">{a.planet_a} & {a.planet_b}</div>
                                  <div className="text-[10px] text-(--gm-primary) font-bold uppercase">{a.type}</div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="w-full lg:w-2/3 bg-(--gm-surface)/30 border border-(--gm-border-soft) rounded-[3rem] p-10 md:p-14 space-y-10 relative overflow-hidden backdrop-blur-xl">
                       <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                          <Sparkles className="w-64 h-64 text-(--gm-primary)" />
                       </div>
                       
                       <div className="space-y-6 relative">
                          <div className="flex items-center gap-2 text-(--gm-primary)">
                             <Star className="w-5 h-5 fill-(--gm-primary)" />
                             <span className="text-[10px] font-bold tracking-[0.4em] uppercase">{ui('ui_synastry_deep_analysis', 'Deep Analysis')}</span>
                          </div>
                          <h2 className={`${cinzel.className} text-4xl text-(--gm-text) leading-tight`}>
                             {ui('ui_synastry_report_title_p1', 'Cosmic')} <span className="text-(--gm-primary)">{ui('ui_synastry_report_title_p2', 'Connection')}</span> {ui('ui_synastry_report_title_p3', 'Report')}
                          </h2>
                          <p className="text-(--gm-text-dim) font-serif italic text-lg leading-relaxed">
                             {result.mode === 'invite' ? ui('ui_synastry_your_partner', 'Your partner') : manualData.name} {ui('ui_synastry_report_lead', 'and your energy are interpreted through the interaction of the planets like this:')}
                          </p>
                       </div>

                       <div className="prose prose-invert prose-brand max-w-none">
                          <div className="text-(--gm-text)/90 leading-relaxed font-serif whitespace-pre-wrap italic text-lg opacity-90">
                             {result.result?.interpretation ?? result.interpretation ?? result.reading}
                          </div>
                       </div>

                       <div className="pt-10 border-t border-(--gm-border-soft) flex items-center justify-between">
                          <div className="flex items-center gap-3 text-(--gm-text-dim)/60">
                             <ShieldCheck className="w-4 h-4" />
                             <span className="text-[10px] font-bold tracking-widest uppercase">{ui('ui_synastry_secure_private', 'Secure and Private Analysis')}</span>
                          </div>
                          <button onClick={() => setStep('mode')} className="text-(--gm-primary) text-xs font-bold tracking-widest border-b border-(--gm-primary)/30 pb-1">
                             {ui('ui_synastry_new_person', 'CHECK SOMEONE NEW')}
                          </button>
                       </div>
                    </div>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}

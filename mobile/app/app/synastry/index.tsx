import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  ActivityIndicator,
  Dimensions,
  TextInput,
  Alert,
  FlatList,
  RefreshControl,
  Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { 
  Heart, 
  Zap, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  User,
  Sparkles,
  Share2,
  RefreshCcw,
  ShieldCheck,
  Search,
  Clock,
  Send,
  Check,
  X,
  CreditCard,
  History
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

import { colors, font, radius, spacing, shadows } from '@/theme/tokens';
import { synastryApi, userApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export default function SynastryScreen() {
  const { user: authUser } = useAuth();
  const user = authUser as (typeof authUser & { is_premium?: boolean }) | null;
  const [step, setStep] = useState<'mode' | 'quick' | 'manual' | 'invite' | 'loading' | 'result' | 'history'>('mode');
  const [quickData, setQuickData] = useState({ sign_a: 'Aries', sign_b: 'Aries' });
  const [manualData, setManualData] = useState({ name: '', dob: '', tob: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Invite states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInvites();
      fetchReports();
    }
  }, [user]);

  const handleShare = async () => {
    if (!result) return;
    try {
      await Share.share({
        message: `Aşk Uyumu Analizimiz: ${result.title || 'Uyum Analizi'} ✨\n\nAşk: %${result.love_score || result.score || '??'}\nÇekim: %${result.sexual_score || '??'}\n\nGoldMoodAstro ile uyumunuzu keşfedin!\n\nKeşfet: https://goldmoodastro.com/tr/sinastri/result/${result.id}?utm_source=mobile_app&utm_medium=social_share&utm_campaign=synastry`,
        title: 'GoldMoodAstro Aşk Uyumu',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInvites = async () => {
    try {
      const data = await synastryApi.listInvites();
      setInvites(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await synastryApi.list();
      setReports(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 3) return;
    setIsSearching(true);
    try {
      const data = await userApi.search(searchQuery);
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendInvite = async (partnerId: string) => {
    try {
      await synastryApi.createInvite(partnerId);
      Alert.alert('Başarılı', 'Davet gönderildi!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Davet gönderilemedi');
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    setStep('loading');
    setLoading(true);
    try {
      const res = await synastryApi.acceptInvite(inviteId);
      setResult({ type: 'manual', ...res });
      setTimeout(() => { setStep('result'); setLoading(false); }, 3000);
      fetchInvites();
      fetchReports();
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Davet kabul edilemedi');
      setStep('mode');
      setLoading(false);
    }
  };

  const nextSign = (current: string) => {
    const index = SIGNS.indexOf(current);
    return SIGNS[(index + 1) % SIGNS.length];
  };

  const handleQuick = async () => {
    setStep('loading');
    setLoading(true);
    try {
      const res = await synastryApi.quick(quickData);
      setResult({ type: 'quick', ...res });
      setTimeout(() => { setStep('result'); setLoading(false); }, 2500);
    } catch (e) {
      setStep('mode');
      setLoading(false);
    }
  };

  const handleManual = async () => {
    if (!manualData.name || !manualData.dob) return;
    
    setStep('loading');
    setLoading(true);
    try {
      const res = await synastryApi.manual({ partner_data: manualData });
      setResult({ type: 'manual', ...res });
      setTimeout(() => { setStep('result'); setLoading(false); }, 3000);
      fetchReports();
    } catch (e: any) {
      if (e.status === 402) {
        Alert.alert('Bakiye Yetersiz', 'Krediniz yetersiz.');
      }
      setStep('mode');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchInvites(), fetchReports()]);
    setIsRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => step === 'mode' ? router.back() : setStep('mode')} style={styles.backBtn}>
            <ChevronLeft size={24} color={colors.gold} />
          </Pressable>
          <Text style={styles.headerTitle}>Sinastri & Uyum</Text>
          <Pressable onPress={() => setStep('history')} style={styles.historyBtn}>
            <History size={20} color={colors.gold} />
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          {step === 'mode' && (
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
            >
               <View style={styles.hero}>
                  <Text style={styles.heroTitle}>Kozmik Bağınızı Keşfedin</Text>
                  <Text style={styles.heroSubtitle}>Yıldızların aşkınız üzerindeki etkisini bilimsel astroloji ile analiz edin.</Text>
               </View>

               {invites.length > 0 && (
                 <View style={styles.inviteAlert}>
                    <BlurView intensity={20} tint="light" style={styles.inviteBlur}>
                       <View style={styles.inviteHeader}>
                          <Sparkles size={16} color={colors.gold} />
                          <Text style={styles.inviteAlertTitle}>{invites.length} Yeni Davet!</Text>
                       </View>
                       <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.inviteScroll}>
                          {invites.map((inv) => (
                            <View key={inv.id} style={styles.inviteItem}>
                               <View style={styles.inviteInfo}>
                                  <Text style={styles.inviteUser}>{inv.user?.name || 'Bir Kullanıcı'}</Text>
                                  <Text style={styles.inviteAction}>seni analizine davet etti</Text>
                               </View>
                               <View style={styles.inviteBtns}>
                                  <Pressable style={styles.acceptBtn} onPress={() => handleAcceptInvite(inv.id)}>
                                     <Check size={16} color={colors.bgDeep} />
                                  </Pressable>
                                  <Pressable style={styles.declineBtn}>
                                     <X size={16} color={colors.textMuted} />
                                  </Pressable>
                               </View>
                            </View>
                          ))}
                       </ScrollView>
                    </BlurView>
                 </View>
               )}

               <View style={styles.modes}>
                  <Pressable style={styles.modeCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep('quick'); }}>
                     <View style={[styles.modeIcon, { backgroundColor: colors.gold + '15' }]}>
                        <Zap size={28} color={colors.gold} />
                     </View>
                     <View style={styles.modeInfo}>
                        <Text style={styles.modeTitle}>Hızlı Uyum</Text>
                        <Text style={styles.modeDesc}>Sadece burç seçerek anında temel uyum yorumu al.</Text>
                        <View style={styles.freeBadge}><Text style={styles.freeText}>ÜCRETSİZ</Text></View>
                     </View>
                     <ChevronRight size={20} color={colors.textMuted} />
                  </Pressable>

                  <Pressable style={styles.modeCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep('manual'); }}>
                     <View style={[styles.modeIcon, { backgroundColor: colors.plum + '55' }]}>
                        <Star size={28} color={colors.goldLight} />
                     </View>
                     <View style={styles.modeInfo}>
                        <Text style={styles.modeTitle}>Manuel Analiz</Text>
                        <Text style={styles.modeDesc}>Partner bilgilerini girerek derinlemesine rapor oluştur.</Text>
                        <View style={styles.priceBadge}>
                           <CreditCard size={10} color={colors.gold} />
                           <Text style={styles.priceText}>250 KREDİ</Text>
                        </View>
                     </View>
                     <ChevronRight size={20} color={colors.textMuted} />
                  </Pressable>

                  <Pressable style={styles.modeCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setStep('invite'); }}>
                     <View style={[styles.modeIcon, { backgroundColor: colors.surfaceHigh }]}>
                        <User size={28} color={colors.goldLight} />
                     </View>
                     <View style={styles.modeInfo}>
                        <Text style={styles.modeTitle}>Partnerini Davet Et</Text>
                        <Text style={styles.modeDesc}>Gerçek harita verileriyle ortak analiz yapın.</Text>
                        <View style={styles.socialBadge}><Text style={styles.socialText}>SOSYAL</Text></View>
                     </View>
                     <ChevronRight size={20} color={colors.textMuted} />
                  </Pressable>
               </View>

               {reports.length > 0 && (
                 <View style={styles.recentSection}>
                    <Text style={styles.sectionLabel}>SON ANALİZLERİN</Text>
                    {reports.slice(0, 3).map((rep) => (
                      <Pressable key={rep.id} style={styles.recentItem} onPress={() => { setResult(rep); setStep('result'); }}>
                         <Heart size={16} color={colors.gold} fill={rep.result?.score > 70 ? colors.gold : 'transparent'} />
                         <Text style={styles.recentName}>{rep.partner_data?.name || rep.partner_user?.name || 'İsimsiz'}</Text>
                         <Text style={styles.recentScore}>%{rep.result?.score || '??'}</Text>
                         <ChevronRight size={16} color={colors.textMuted} />
                      </Pressable>
                    ))}
                 </View>
               )}
            </ScrollView>
          )}

          {step === 'quick' && (
            <View style={styles.content}>
               <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Burç Uyumu</Text>
                  
                  <View style={styles.quickForm}>
                     <Pressable
                       style={styles.pickerBox}
                       onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setQuickData((prev) => ({ ...prev, sign_a: nextSign(prev.sign_a) })); }}
                     >
                        <Text style={styles.pickerLabel}>SEN</Text>
                        <Text style={styles.pickerValue}>{quickData.sign_a}</Text>
                     </Pressable>

                     <View style={styles.heartCircle}>
                        <Heart size={24} color={colors.gold} fill={colors.gold} />
                     </View>

                     <Pressable
                       style={styles.pickerBox}
                       onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setQuickData((prev) => ({ ...prev, sign_b: nextSign(prev.sign_b) })); }}
                     >
                        <Text style={styles.pickerLabel}>O</Text>
                        <Text style={styles.pickerValue}>{quickData.sign_b}</Text>
                     </Pressable>
                  </View>

                  <Pressable style={styles.submitBtn} onPress={handleQuick}>
                     <Text style={styles.submitText}>UYUMU HESAPLA</Text>
                  </Pressable>
               </View>
            </View>
          )}

          {step === 'manual' && (
            <View style={styles.content}>
               <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.formSection}>
                     <Text style={styles.sectionTitle}>Partner Bilgileri</Text>
                     
                     <View style={styles.manualForm}>
                        <View style={styles.inputGroup}>
                           <Text style={styles.label}>ADI</Text>
                           <TextInput 
                             style={styles.input} 
                             placeholder="Örn: Mehmet" 
                             placeholderTextColor={colors.textMuted + '66'}
                             value={manualData.name}
                             onChangeText={t => setManualData({ ...manualData, name: t })}
                           />
                        </View>
                        <View style={styles.inputGroup}>
                           <Text style={styles.label}>DOĞUM TARİHİ</Text>
                           <TextInput 
                             style={styles.input} 
                             placeholder="YYYY-MM-DD" 
                             placeholderTextColor={colors.textMuted + '66'}
                             value={manualData.dob}
                             onChangeText={t => setManualData({ ...manualData, dob: t })}
                           />
                        </View>
                        <View style={styles.inputGroup}>
                           <Text style={styles.label}>DOĞUM SAATİ (OPSİYONEL)</Text>
                           <TextInput 
                             style={styles.input} 
                             placeholder="HH:mm" 
                             placeholderTextColor={colors.textMuted + '66'}
                             value={manualData.tob}
                             onChangeText={t => setManualData({ ...manualData, tob: t })}
                           />
                        </View>

                        <View style={styles.warningBox}>
                           <ShieldCheck size={14} color={colors.gold} />
                           <Text style={styles.warningText}>Analiz sonrası rapor geçmişinize kaydedilir.</Text>
                        </View>

                        <Pressable style={[styles.submitBtn, { backgroundColor: colors.plumSoft }]} onPress={handleManual}>
                           <Text style={[styles.submitText, { color: '#fff' }]}>ANALİZİ BAŞLAT (250 KREDİ)</Text>
                        </Pressable>
                     </View>
                  </View>
               </ScrollView>
            </View>
          )}

          {step === 'invite' && (
            <View style={styles.content}>
               <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Partner Bul</Text>
                  <Text style={styles.sectionSubtitle}>İsim veya e-posta ile arama yaparak davet gönderin.</Text>
                  
                  <View style={styles.searchBar}>
                     <Search size={20} color={colors.textMuted} />
                     <TextInput 
                        style={styles.searchInput}
                        placeholder="İsim veya e-posta..."
                        placeholderTextColor={colors.textMuted + '66'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                     />
                     {isSearching ? (
                       <ActivityIndicator size="small" color={colors.gold} />
                     ) : (
                       <Pressable onPress={handleSearch}>
                          <Text style={styles.searchText}>ARA</Text>
                       </Pressable>
                     )}
                  </View>

                  <FlatList 
                     data={searchResults}
                     keyExtractor={(item) => item.id}
                     renderItem={({ item }) => (
                       <View style={styles.userItem}>
                          <View style={styles.userAvatar}>
                             <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
                          </View>
                          <View style={styles.userInfo}>
                             <Text style={styles.userName}>{item.name}</Text>
                             <Text style={styles.userEmail}>{item.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}</Text>
                          </View>
                          <Pressable style={styles.sendBtn} onPress={() => handleSendInvite(item.id)}>
                             <Send size={16} color={colors.gold} />
                          </Pressable>
                       </View>
                     )}
                     ListEmptyComponent={
                       !isSearching && searchQuery.length > 0 ? (
                         <Text style={styles.emptyText}>Sonuç bulunamadı.</Text>
                       ) : null
                     }
                  />
               </View>
            </View>
          )}

          {step === 'loading' && (
            <View style={styles.centerContent}>
               <View style={styles.loaderRing}>
                  <Heart size={32} color={colors.gold} fill={colors.gold} />
               </View>
               <Text style={styles.loadingText}>
                  Yıldızlar Konumlanıyor...
               </Text>
            </View>
          )}

          {step === 'result' && result && (
            <View style={styles.content}>
               <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultScroll}>
                  {result.type === 'quick' || !result.result ? (
                    <View style={styles.quickResult}>
                       <View style={styles.resultHeader}>
                          <Text style={styles.resultEmoji}>✨ ❤️ ✨</Text>
                          <Text style={styles.resultTitle}>{result.title || 'Uyum Analizi'}</Text>
                       </View>

                       <View style={styles.scoreGrid}>
                           <View style={styles.scoreItem}>
                              <LinearGradient colors={[colors.surface, colors.surfaceHigh]} style={styles.scoreInner}>
                                 <Text style={styles.scoreLabel}>AŞK</Text>
                                 <Text style={styles.scoreValue}>%{result.love_score || result.score || '??'}</Text>
                              </LinearGradient>
                           </View>
                           <View style={styles.scoreItem}>
                              <LinearGradient colors={[colors.surface, colors.surfaceHigh]} style={styles.scoreInner}>
                                 <Text style={styles.scoreLabel}>ÇEKİM</Text>
                                 <Text style={styles.scoreValue}>%{result.sexual_score || '??'}</Text>
                              </LinearGradient>
                           </View>
                        </View>

                        <LinearGradient colors={[colors.surface + '88', colors.bgDeep + '88']} style={styles.resultCard}>
                           <Text style={styles.resultText}>{result.content || result.reading || 'Analiz sonucu yüklenemedi.'}</Text>
                        </LinearGradient>
                    </View>
                  ) : (
                    <View style={styles.manualResult}>
                       <View style={styles.scoreCircleBox}>
                          <Text style={styles.scoreCircleLabel}>UYUM SKORU</Text>
                          <Text style={styles.scoreCircleValue}>%{result.result?.score || result.score}</Text>
                       </View>

                        <LinearGradient colors={[colors.surface + '88', colors.bgDeep + '88']} style={styles.reportCard}>
                           <View style={styles.reportHeader}>
                              <Sparkles size={20} color={colors.goldLight} />
                              <Text style={styles.reportTitle}>Detaylı Analiz</Text>
                           </View>
                           <Text style={styles.reportText}>{result.result?.reading || result.reading}</Text>
                        </LinearGradient>
                    </View>
                  )}

                  <View style={styles.footerActions}>
                     <Pressable style={styles.footerBtn} onPress={() => setStep('mode')}>
                        <RefreshCcw size={18} color={colors.textMuted} />
                        <Text style={styles.footerBtnText}>YENİ ANALİZ</Text>
                     </Pressable>
                     <Pressable 
                        style={[styles.footerBtn, { borderColor: colors.gold + '44', backgroundColor: colors.gold + '08' }]}
                        onPress={handleShare}
                      >
                         <Share2 size={18} color={colors.gold} />
                         <Text style={[styles.footerBtnText, { color: colors.gold }]}>PAYLAŞ</Text>
                      </Pressable>
                  </View>
               </ScrollView>
            </View>
          )}

          {step === 'history' && (
            <View style={styles.content}>
               <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Analiz Geçmişi</Text>
                  
                  <FlatList 
                     data={reports}
                     keyExtractor={(item) => item.id}
                     renderItem={({ item }) => (
                       <Pressable style={styles.historyItem} onPress={() => { setResult(item); setStep('result'); }}>
                          <View style={styles.historyIcon}>
                             <Heart size={20} color={colors.gold} fill={item.result?.score > 75 ? colors.gold : 'transparent'} />
                          </View>
                          <View style={styles.historyInfo}>
                             <Text style={styles.historyName}>{item.partner_data?.name || item.partner_user?.name || 'İsimsiz'}</Text>
                             <Text style={styles.historyDate}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
                          </View>
                          <Text style={styles.historyScore}>%{item.result?.score || '??'}</Text>
                          <ChevronRight size={16} color={colors.textMuted} />
                       </Pressable>
                     )}
                     ListEmptyComponent={<Text style={styles.emptyText}>Henüz bir analiziniz yok.</Text>}
                     refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
                  />
               </View>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDeep },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  historyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.display, fontSize: 18, color: colors.text, letterSpacing: 0.5 },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  hero: { marginVertical: 24, gap: 8 },
  heroTitle: { fontFamily: font.display, fontSize: 28, color: colors.text, lineHeight: 34 },
  heroSubtitle: { fontFamily: font.serif, fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  
  inviteAlert: { marginBottom: 24, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.gold + '33' },
  inviteBlur: { padding: 16, gap: 12 },
  inviteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inviteAlertTitle: { fontFamily: font.sansBold, fontSize: 12, color: colors.gold, letterSpacing: 1 },
  inviteScroll: { flexDirection: 'row' },
  inviteItem: { width: 220, backgroundColor: colors.surfaceHigh + '88', padding: 12, borderRadius: radius.lg, marginRight: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inviteInfo: { flex: 1 },
  inviteUser: { fontFamily: font.sansBold, fontSize: 13, color: colors.text },
  inviteAction: { fontFamily: font.sans, fontSize: 10, color: colors.textMuted },
  inviteBtns: { flexDirection: 'row', gap: 6 },
  acceptBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },

  modes: { gap: 16 },
  modeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface + '88', padding: 18, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, gap: 16 },
  modeIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modeInfo: { flex: 1, gap: 4 },
  modeTitle: { fontFamily: font.display, fontSize: 17, color: colors.text },
  modeDesc: { fontFamily: font.sans, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  
  freeBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.success + '22', borderRadius: 4, marginTop: 2 },
  freeText: { fontFamily: font.sansBold, fontSize: 8, color: colors.success },
  priceBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.gold + '22', borderRadius: 4, marginTop: 2 },
  priceText: { fontFamily: font.sansBold, fontSize: 8, color: colors.gold },
  socialBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.info + '22', borderRadius: 4, marginTop: 2 },
  socialText: { fontFamily: font.sansBold, fontSize: 8, color: colors.info },

  recentSection: { marginTop: 32, gap: 12 },
  sectionLabel: { fontFamily: font.sansBold, fontSize: 10, color: colors.textMuted, letterSpacing: 2, marginLeft: 4 },
  recentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface + '44', padding: 14, borderRadius: radius.lg, gap: 12 },
  recentName: { flex: 1, fontFamily: font.sansBold, fontSize: 14, color: colors.textDim },
  recentScore: { fontFamily: font.display, fontSize: 14, color: colors.gold },

  formSection: { marginTop: 12, gap: 20 },
  sectionTitle: { fontFamily: font.display, fontSize: 24, color: colors.text, textAlign: 'center' },
  sectionSubtitle: { fontFamily: font.serif, fontSize: 14, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic' },
  
  quickForm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 },
  pickerBox: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, minHeight: 110, justifyContent: 'center' },
  pickerLabel: { fontFamily: font.sansBold, fontSize: 9, color: colors.gold, textAlign: 'center', marginTop: 10, letterSpacing: 2 },
  pickerValue: { fontFamily: font.display, fontSize: 18, color: colors.text, textAlign: 'center', paddingVertical: 24 },
  heartCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgDeep, borderWidth: 1, borderColor: colors.lineSoft, alignItems: 'center', justifyContent: 'center', ...shadows.soft },
  
  manualForm: { backgroundColor: colors.surface + '66', padding: 20, borderRadius: radius.xl * 1.5, borderWidth: 1, borderColor: colors.lineSoft, gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontFamily: font.sansBold, fontSize: 9, color: colors.gold, letterSpacing: 1.5, marginLeft: 8 },
  input: { backgroundColor: colors.bgDeep + '66', borderRadius: radius.lg, padding: 14, color: colors.text, fontFamily: font.sans, fontSize: 15, borderWidth: 1, borderColor: colors.lineSoft },
  warningBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, backgroundColor: colors.gold + '08', borderRadius: radius.lg },
  warningText: { fontFamily: font.sans, fontSize: 10, color: colors.gold, fontStyle: 'italic' },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingHorizontal: 16, height: 56, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineSoft, gap: 12 },
  searchInput: { flex: 1, color: colors.text, fontFamily: font.sans, fontSize: 14 },
  searchText: { fontFamily: font.sansBold, fontSize: 12, color: colors.gold },
  
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSoft, gap: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gold + '22', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.display, fontSize: 16, color: colors.gold },
  userInfo: { flex: 1 },
  userName: { fontFamily: font.sansBold, fontSize: 14, color: colors.text },
  userEmail: { fontFamily: font.sans, fontSize: 11, color: colors.textMuted },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  
  submitBtn: { backgroundColor: colors.gold, height: 60, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: 12, ...shadows.gold },
  submitText: { fontFamily: font.sansBold, fontSize: 14, color: colors.bgDeep, letterSpacing: 1.5 },
  
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  loaderRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.gold, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: font.display, fontSize: 18, color: colors.gold, letterSpacing: 1 },
  
  resultScroll: { paddingBottom: 40, gap: 24 },
  quickResult: { gap: 24 },
  resultHeader: { alignItems: 'center', gap: 8, marginVertical: 12 },
  resultEmoji: { fontSize: 28 },
  resultTitle: { fontFamily: font.display, fontSize: 24, color: colors.text, textAlign: 'center' },
  scoreGrid: { flexDirection: 'row', gap: 12 },
  scoreItem: { flex: 1, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.lineSoft },
  scoreInner: { flex: 1, padding: 20, alignItems: 'center', gap: 4 },
  scoreLabel: { fontFamily: font.sansBold, fontSize: 9, color: colors.textMuted, letterSpacing: 1 },
  scoreValue: { fontFamily: font.display, fontSize: 26, color: colors.gold },
  resultCard: { padding: 28, borderRadius: radius.xl * 1.5, borderWidth: 1, borderColor: colors.lineSoft, marginTop: 10 },
  resultText: { fontFamily: font.serif, fontSize: 17, color: colors.textDim, lineHeight: 28, fontStyle: 'italic', textAlign: 'center' },
  
  manualResult: { gap: 24 },
  scoreCircleBox: { alignSelf: 'center', width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: colors.gold, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: colors.bgDeep, ...shadows.gold },
  scoreCircleLabel: { fontFamily: font.sansBold, fontSize: 9, color: colors.textMuted },
  scoreCircleValue: { fontFamily: font.display, fontSize: 44, color: colors.gold },
  reportCard: { backgroundColor: colors.surface + '88', padding: 24, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.lineSoft, gap: 16 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  reportTitle: { fontFamily: font.display, fontSize: 18, color: colors.text },
  reportText: { fontFamily: font.serif, fontSize: 16, color: colors.textDim, lineHeight: 28, fontStyle: 'italic' },
  
  footerActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  footerBtn: { flex: 1, height: 54, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  footerBtnText: { fontFamily: font.sansBold, fontSize: 11, color: colors.textMuted, letterSpacing: 1 },
  
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface + '44', padding: 16, borderRadius: radius.lg, marginBottom: 12, gap: 12, borderWidth: 1, borderColor: colors.lineSoft },
  historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  historyInfo: { flex: 1 },
  historyName: { fontFamily: font.sansBold, fontSize: 15, color: colors.text },
  historyDate: { fontFamily: font.sans, fontSize: 11, color: colors.textMuted },
  historyScore: { fontFamily: font.display, fontSize: 16, color: colors.gold },
  emptyText: { textAlign: 'center', marginTop: 40, fontFamily: font.serif, color: colors.textMuted, fontStyle: 'italic' }
});

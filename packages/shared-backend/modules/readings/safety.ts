const BLOCKED_PATTERNS = [
  /öl(ü|u)m/i,
  /ağır hastalık/i,
  /agir hastalik/i,
  /ayrılık kesin/i,
  /ayrilik kesin/i,
  /ihanet/i,
  /kesinlikle/i,
  /kaçınılmaz/i,
  /kacinilmaz/i,
];

export function isUnsafeReading(content: string) {
  return BLOCKED_PATTERNS.some((p) => p.test(content));
}

export function safeFallbackReading(signLabel: string) {
  return [
    `Bugün ${signLabel} vurgunuz iç sesinizi daha net duymanıza yardım ediyor.`,
    'Keskin kararlar yerine gözlem, düzenleme ve sakin iletişim iyi sonuç verir.',
    'İlişkilerde varsayım yapmak yerine açık bir soru sormak, iş tarafında ise küçük bir işi tamamlamak enerjinizi toparlar.',
  ].join(' ');
}

// FAZ 9 / FAZ 17 entegrasyonu — reading-specific safety check
// Ortak moderation _shared/contentModeration'dan reuse.

import { checkContent } from '../_shared/contentModeration';

export function isUnsafeReading(content: string): boolean {
  return !checkContent(content, 'reading').safe;
}

export function safeFallbackReading(signLabel: string) {
  return [
    `Bugün ${signLabel} vurgunuz iç sesinizi daha net duymanıza yardım ediyor.`,
    'Keskin kararlar yerine gözlem, düzenleme ve sakin iletişim iyi sonuç verir.',
    'İlişkilerde varsayım yapmak yerine açık bir soru sormak, iş tarafında ise küçük bir işi tamamlamak enerjinizi toparlar.',
  ].join(' ');
}

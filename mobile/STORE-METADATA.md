# GoldMoodAstro Store Metadata

Last updated: 2026-10-03

## App Name

GoldMoodAstro

## Subtitle / Short Description

TR: Astroloji, tarot ve ruhsal danışmanlık  
EN: Astrology, tarot and spiritual guidance  
DE: Astrologie, Tarot und spirituelle Beratung

## Long Description

### TR

GoldMoodAstro; astroloji, tarot, numeroloji, kahve falı, rüya yorumu ve ruhsal rehberlik alanlarında danışmanlarla güvenli şekilde buluşabileceğiniz mobil danışmanlık platformudur.

Danışman profillerini inceleyebilir, uygun zaman aralıklarını görebilir, sesli veya görüntülü randevu oluşturabilir ve seanslarınızı uygulama içinden takip edebilirsiniz. Doğum haritası, günlük yorumlar, sinastri, tarot ve diğer içerikler farkındalık ve kişisel rehberlik amacıyla sunulur.

GoldMoodAstro’daki yorumlar ve danışmanlık içerikleri eğlence, farkındalık ve kişisel gelişim amaçlıdır. Sağlık, hukuk, finans veya güvenlik kararlarında profesyonel destek ve gerçek dünya bilgisi önceliklidir.

### EN

GoldMoodAstro is a mobile guidance platform where you can safely meet consultants for astrology, tarot, numerology, coffee readings, dream interpretation and spiritual guidance.

Browse consultant profiles, review available time slots, book voice or video sessions, and manage your appointments inside the app. Birth charts, daily readings, synastry, tarot and related content are provided for awareness and personal guidance.

GoldMoodAstro readings and consultation content are intended for entertainment, reflection and personal growth. For medical, legal, financial or safety decisions, professional support and real-world information should come first.

### DE

GoldMoodAstro ist eine mobile Beratungsplattform für Astrologie, Tarot, Numerologie, Kaffeesatzlesen, Traumdeutung und spirituelle Orientierung.

Sie können Beraterprofile ansehen, freie Zeiten prüfen, Sprach- oder Videositzungen buchen und Ihre Termine in der App verwalten. Geburtshoroskope, tägliche Deutungen, Synastrie, Tarot und weitere Inhalte dienen der Reflexion und persönlichen Orientierung.

Die Deutungen und Beratungsinhalte von GoldMoodAstro dienen Unterhaltung, Bewusstsein und persönlicher Entwicklung. Bei medizinischen, rechtlichen, finanziellen oder sicherheitsrelevanten Entscheidungen sollten professionelle Hilfe und reale Informationen Vorrang haben.

## Keywords

TR: astroloji, tarot, fal, doğum haritası, kahve falı, rüya yorumu, numeroloji, sinastri, burç, danışmanlık

EN: astrology, tarot, horoscope, birth chart, coffee reading, dream interpretation, numerology, synastry, zodiac, guidance

DE: astrologie, tarot, horoskop, geburtshoroskop, kaffeesatzlesen, traumdeutung, numerologie, synastrie, sternzeichen, beratung

## Category

Primary: Lifestyle  
Secondary: Entertainment

## Age Rating Notes

Suggested: 17+ / 18+ where available, because the app includes paid spiritual guidance, live voice/video sessions and entertainment-oriented fortune/astrology content.

Required review note: "Astrology, tarot and fortune-style content is for entertainment, awareness and personal guidance only. It is not medical, legal, financial or emergency advice."

## Support / Marketing URLs

Support URL: `https://goldmoodastro.com/contact`  
Marketing URL: `https://goldmoodastro.com`  
Privacy Policy URL: `https://goldmoodastro.com/legal/privacy`  
Terms URL: `https://goldmoodastro.com/legal/terms`
Google Play account deletion URL: `https://goldmoodastro.com/tr/account-deletion` (publish and verify the public page before entering it in Play Console)

The public deletion page explains the seven-day request process and links directly to the authenticated deletion form. Store account deletion and Data Safety fields must be filled in Play Console after this page is live. Do not use `/tr/profile/privacy` as the Play external URL because unauthenticated visitors are redirected to login without an explanation.

## Review access and account deletion

- Account deletion is available in the app under Profile → Privacy and Data, and on the web after login. Verify both customer and consultant accounts can submit and cancel a request.
- If the account has an auto-renewing store subscription, the app links to Apple or Google subscription management and explains that deleting the account does not stop billing. Verify this on both platforms.
- The backend schedules deletion seven days after request and runs its sweep every six hours. Confirm actual account and related-data removal, completion notice, backups, external media, legally retained payment records and Apple Sign-In token revocation before review. The seven-day wait is not a substitute for immediate deletion if a future flow defers deletion to subscription expiry.
- State actual retained data and retention periods consistently in the published Privacy Policy and both store privacy forms. Do not promise that every record is immediately or universally erased.

## Android permissions and foreground service declaration

- The production build blocks legacy broad storage and draw-over-other-apps permissions. Recheck the final merged AAB manifest after every native dependency update, then test photo selection on Android 12 and Android 14+.
- `expo-audio` supplies `FOREGROUND_SERVICE_MEDIA_PLAYBACK` for the Relax ambient mixer, which intentionally plays after the app enters the background (`src/hooks/useAmbientMixer.ts`). Keep this permission only while that feature is offered. In Play Console, declare the media playback foreground service, describe the user-started Relax playback, and provide the required demonstration video. Test playback, notification controls and stop behavior on an Android 14+ device.
- The app records voice questions only while foregrounded. `expo-audio` includes an audio recording service but the app does not enable `allowsBackgroundRecording`; do not claim background recording or add microphone foreground-service permission without a matching product behavior and device test.

## Demo Accounts

Create or verify before App Review:

- Customer: `review-customer@goldmoodastro.com`
- Consultant: `review-consultant@goldmoodastro.com`
- Password: store in the private App Review notes only, never in git.

Suggested App Review notes:

```text
Use the customer demo account to browse consultants, create a booking, review subscription screens and test account deletion/export.
Use the consultant demo account to review booking approval, availability, wallet/KYC states and call entry screens.
Payments and IAP should be tested in sandbox mode.
Account deletion: Profile → Privacy and Data → Request Account Deletion. Store subscription management is linked before confirmation.
Live one-to-one sessions use external checkout; app credits and premium use native in-app purchases.
In user and consultant messaging, open a conversation to report a message or block the other participant. Blocked accounts cannot send messages to each other. Reports appear in the admin chat review queue.
```

## Screenshots Still Needed

- iPhone 6.7"
- iPhone 6.5"
- iPhone 5.5" if required by App Store Connect
- Android phone screenshots for Play Console
- Tablet screenshots only if tablet support is enabled in a later release

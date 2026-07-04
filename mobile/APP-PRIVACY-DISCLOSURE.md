# GoldMoodAstro App Privacy Disclosure

Last updated: 2026-07-04

Use this checklist when filling App Store Connect > App Privacy. The app does not use data for tracking and does not declare tracking domains.

## Data Linked To The User

- Contact Info: name, email address, phone number
- Identifiers: user ID
- Financial Info: payment info handled for checkout/subscription flows, purchase history
- User Content: photos or videos, audio data, customer support messages, other user content
- Sensitive Info: birth date/time/place and astrology consultation inputs

## Purposes

All declared data is used for App Functionality:

- Account creation, login, profile and consultant matching
- Booking, payment, subscription and credit operations
- Birth chart, tarot, coffee, dream, synastry and related spiritual guidance features
- In-app audio/video questions, live sessions, chat, reviews and support
- Safety, legal/KVKK account export/deletion and customer support workflows

## Tracking

- Tracking: No
- Third-party advertising: No
- Data broker sharing: No
- Cross-app or cross-site tracking: No

## Required Reason APIs

Declared in `mobile/app/app.json` under `expo.privacyManifests`:

- `NSPrivacyAccessedAPICategoryUserDefaults` with reason `CA92.1`
- `NSPrivacyAccessedAPICategoryFileTimestamp` with reason `C617.1`
- `NSPrivacyAccessedAPICategoryDiskSpace` with reason `E174.1`
- `NSPrivacyAccessedAPICategorySystemBootTime` with reason `35F9.1`

Before submission, archive the iOS build and generate Xcode's Privacy Report to confirm the merged app and SDK manifests match this disclosure.

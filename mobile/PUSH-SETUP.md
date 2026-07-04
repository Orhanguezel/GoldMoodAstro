# Mobile Push Setup

## Current State

- Android Firebase file exists at `mobile/app/google-services.json`.
- iOS Firebase file is intentionally missing from git: `mobile/app/GoogleService-Info.plist`.
- iOS app config already points to `./GoogleService-Info.plist` through `expo.ios.googleServicesFile`.
- Backend expects FCM tokens, so iOS should use Firebase Cloud Messaging over APNs.

## iOS FCM/APNs Steps

1. In Firebase, create or open the iOS app for bundle id `com.goldmoodastro.app`.
2. Upload the APNs Auth Key or certificate in Firebase Cloud Messaging settings.
3. Download `GoogleService-Info.plist`.
4. Place it at `mobile/app/GoogleService-Info.plist`.
5. Run:

```bash
cd mobile/app
bun run check:release
```

6. Build a real iOS device binary with EAS and test:

```bash
eas build --platform ios --profile preview
```

## Device QA

- Login registers the FCM token through `/push/register-token`.
- Logout calls `/push/unregister-token`.
- Foreground notification appears.
- Tapping `incoming_call`, `booking_reminder`, `favorite_online`, chat and `media_message_*` routes opens the expected screen.

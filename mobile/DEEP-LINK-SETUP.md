# GoldMoodAstro Deep Link Setup

Last updated: 2026-07-04

The app config already declares:

- iOS associated domains: `applinks:goldmoodastro.com`, `applinks:www.goldmoodastro.com`
- Android HTTPS app links for `goldmoodastro.com` and `www.goldmoodastro.com`

The live `.well-known` files must be created only after the production signing identifiers are known.

## Required Values

- Apple Team ID
- iOS bundle identifier: `com.goldmoodastro.app`
- Android package name: `com.goldmoodastro.app`
- Android production signing certificate SHA-256 fingerprint

## `frontend/public/.well-known/apple-app-site-association`

Use this shape after replacing `APPLE_TEAM_ID`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appIDs": ["APPLE_TEAM_ID.com.goldmoodastro.app"],
        "components": [
          { "/": "/auth/*" },
          { "/": "/booking/*" },
          { "/": "/consultants/*" },
          { "/": "/call/*" },
          { "/": "/profile/*" },
          { "/": "/tr/*" },
          { "/": "/en/*" },
          { "/": "/de/*" }
        ]
      }
    ]
  }
}
```

Serve it without a file extension and with JSON content type.

## `frontend/public/.well-known/assetlinks.json`

Use this shape after replacing `ANDROID_SHA256_FINGERPRINT`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.goldmoodastro.app",
      "sha256_cert_fingerprints": ["ANDROID_SHA256_FINGERPRINT"]
    }
  }
]
```

## Verification

After deploy:

```bash
curl -i https://goldmoodastro.com/.well-known/apple-app-site-association
curl -i https://goldmoodastro.com/.well-known/assetlinks.json
```

Then verify on real builds with:

```bash
xcrun simctl openurl booted "https://goldmoodastro.com/auth/password-reset"
adb shell am start -a android.intent.action.VIEW -d "https://goldmoodastro.com/auth/password-reset" com.goldmoodastro.app
```

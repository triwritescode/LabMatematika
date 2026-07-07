# Build a manually-installable APK

This builds a release `.apk` using the native Android project already checked
into `android/` — no Expo/EAS account needed, fully local/offline.

> Note: the release build is signed with the **debug keystore**
> (`android/app/debug.keystore`), so it installs fine on any device but is
> **not** suitable for Play Store submission. That's expected for
> side-loading/manual install.

---

## 1. Prerequisites

- **JDK 17+** (JDK 21 confirmed working)
- **Android SDK** with `platform-tools` and `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) set
- Node deps installed: `pnpm install`

Check your env:

```bash
java -version
echo $ANDROID_HOME
```

---

## 2. Sync native project (only if `android/` is missing or out of date)

If you ever run `expo prebuild --clean` or pull changes that touch native
config (`app.json` plugins, package name, icons), regenerate native code first:

```bash
npx expo prebuild -p android
```

Skip this if `android/` already exists and builds fine — this repo already
has it committed.

---

## 3. Build the release APK

```bash
cd android
./gradlew assembleRelease
```

First run downloads Gradle + dependencies — can take several minutes.

Output APK:

```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 4. Install on device

### Via USB (adb)

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Manually on the phone

1. Copy `app-release.apk` to the device (USB transfer, cloud drive, etc).
2. On the phone, open the file with a file manager.
3. If prompted, allow **"Install unknown apps"** for that app (Settings →
   Apps → Special access → Install unknown apps).
4. Tap **Install**.

---

## Troubleshooting

- **`SDK location not found`** — create `android/local.properties` with:
  ```
  sdk.dir=/path/to/Android/Sdk
  ```
- **Build fails after changing `app.json`** — re-run `npx expo prebuild -p android` to regenerate native config, then rebuild.
- **Clean build** — `cd android && ./gradlew clean assembleRelease`.

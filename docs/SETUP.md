# Auth Setup — Supabase + Google Sign-In

The app ships with all auth code wired up but **no real credentials**. Fill these
in to make sign-in work. Native Google sign-in only works in a **dev build**
(`expo run:android` / `run:ios`), not Expo Go.

---

## 1. Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. Open **SQL Editor** → paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) → **Run**.
   This creates the `profiles` table, RLS policies, and the signup trigger.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Google Cloud OAuth clients

In <https://console.cloud.google.com> → **APIs & Services → Credentials**:

### a) Web application client (this is the one the app uses)
- **Create Credentials → OAuth client ID → Web application**.
- Copy its **Client ID** → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
- Also copy its **Client secret** — you need it in step 3.

### b) Android client (enables the native account picker)
- **Create Credentials → OAuth client ID → Android**.
- **Package name**: `com.labmatematika.app` (matches `app.json` → `android.package`).
- **SHA-1 fingerprint**: get it from the project after prebuild:
  ```bash
  cd android && ./gradlew signingReport
  ```
  Use the **SHA1** under the `debug` variant for local dev. Add your release
  keystore's SHA-1 too before shipping.
- No env var needed for this one — Google links it by package + SHA-1.

> You need a **separate SHA-1 for every keystore** (local debug, each dev's
> machine, EAS build credentials, Play App Signing). Add them all as Android
> OAuth clients.

---

## 3. Wire Google into Supabase

Supabase Dashboard → **Authentication → Providers → Google**:
- Toggle **Enabled**.
- **Client ID**: the **Web** client ID from step 2a.
- **Client Secret**: the Web client secret from step 2a.
- Under **Authorized Client IDs**, add the **Web** client ID (and the Android
  client ID) so `signInWithIdToken` accepts the token. Save.

---

## 4. Local env

```bash
cp .env.example .env.local
# then edit .env.local with the three values from steps 1 and 2a
```

`.env.local` is gitignored. `EXPO_PUBLIC_` vars are inlined at build time, so
**rebuild** after changing them.

---

## 5. Build & run

```bash
npx expo prebuild --clean     # regenerates android/ with the google-signin plugin
npx expo run:android          # or run:ios
```

---

## Flow to verify

1. Launch → signed-out user lands on the **login** screen.
2. Tap **Masuk dengan Google** → native account picker → pick account.
3. First time → **onboarding** (first name, last name, age; first/last prefilled
   from the Google account). Finish → main app.
4. Kill & reopen → session persists, goes straight to the app.
5. Sign out (wired via `useAuth().signOut()`) → back to login.

## Troubleshooting

- **`DEVELOPER_ERROR` on sign-in** → SHA-1 / package name mismatch, or the wrong
  client ID in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (must be the **Web** ID, not Android).
- **Token rejected by Supabase** → add the Web client ID to Supabase's
  *Authorized Client IDs* (step 3).
- **Nothing happens in Expo Go** → expected; native sign-in needs a dev build.

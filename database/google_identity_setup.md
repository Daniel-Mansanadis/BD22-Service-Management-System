# Google sign-in setup

The login and registration pages use the official Google Identity Services button. Google returns an ID token, which the existing Supabase Auth client exchanges for a BD22 session. New Google accounts receive a `profiles` row through the existing `handle_new_user` database trigger.

## Google Cloud Console

1. Select or create the Google Cloud project for BD22.
2. Configure the OAuth consent screen / Google Auth Platform branding and audience. Add the app name, support email, and authorized domains. Publish the app or add test users while it is in testing.
3. Create an OAuth client ID with application type **Web application**.
4. Add each website origin to **Authorized JavaScript origins**, including the local origin used for development (for example `http://localhost:8080`) and the production origin (for example `https://your-domain.example`). Origins must match the actual scheme, host, and port; do not include a page path.
5. Copy the Web client ID into `googleClientId` in `js/supabase-config.js`. Keep the client secret out of all frontend files.

## Supabase Auth

1. Open **Authentication → Sign In / Providers → Google** in the Supabase project used by `js/supabase-config.js`.
2. Enable Google and enter the same Web client ID and its client secret from Google Cloud Console. Save the provider settings.
3. Keep the existing `public.handle_new_user` trigger installed so new Google identities receive a customer profile. The trigger defaults Google sign-ups to the `customer` role and uses the Google name/email; company and phone can be completed later in Account Settings.
4. Ensure Supabase Auth's site URL and allowed URLs include this website. The Google Identity Services ID-token flow returns directly to the current page, so it does not use a Google redirect URI.

The client ID is intentionally a placeholder until the BD22 Google Cloud OAuth client is created. Google sign-in buttons appear after a real client ID is set and Google is enabled in Supabase Auth.

## Password recovery codes

The login page uses Supabase Auth's `resetPasswordForEmail` and verifies the submitted code with OTP type `recovery`. To send a numeric code instead of a link, open **Authentication → Email Templates → Reset Password** and use `{{ .Token }}` in the message body. Remove `{{ .ConfirmationURL }}` from that template, save it, and ensure the Email provider and SMTP delivery are enabled. Supabase may return the same response for registered and unregistered addresses to prevent account enumeration, so the page uses neutral delivery feedback.

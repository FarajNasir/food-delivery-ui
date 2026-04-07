# 🔑 Notification API Keys Setup Guide

This guide provides step-by-step instructions for obtaining the credentials required for your **Food Delivery Notification Engine**.

---

## 🔥 1. Firebase (Push Notifications)
Firebase handles the "Instant" alerts on the Owner Dashboard.

### Step A: Create a Project
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add Project"** and follow the setup wizard.
3.  In the Project Overview, click the **Web icon (</>)** to register a web app.
4.  **Important**: Copy the `firebaseConfig` object and paste it into your `src/lib/firebase.ts` file.

### Step B: Generate Service Account Key (For Edge Function)
1.  Go to Project Settings (Gear icon) > **Service Accounts**.
2.  Click **"Generate New Private Key"**.
3.  Download the JSON file.
4.  **Action**: Open this file and copy the `project_id`, `client_email`, and `private_key` into your **Supabase Edge Function Secrets**.

### Step C: Get VAPID Key (For Browser)
1.  Go to Project Settings > **Cloud Messaging**.
2.  Scroll down to **Web Configuration** > **Web Push certificates**.
3.  Click **"Generate Key Pair"**.
4.  Copy the long string (VAPID Key) and paste it as `VAPID_KEY` in `src/lib/firebase.ts`.

---

## 💬 2. WhatsApp (Via Twilio)
Recommended for the "Offline" backup channel.

1.  Create a free account at [Twilio.com](https://www.twilio.com/).
2.  Go to the **Twilio Console** and find your **Account SID** and **Auth Token**.
3.  Go to **Messaging** > **Try it Out** > **Send a WhatsApp Message**.
4.  Follow the steps to link your sandbox number.
5.  **Action**: Store these as `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in Supabase Secrets.

> [!NOTE]
> To use a Custom Sender name (e.g., "Kilkeel Eats"), you must submit a "WhatsApp Sender" request on Twilio, which takes 24-48 hours for Meta to approve.

---

## 📧 3. Email (Via Resend)
The fastest and most modern way to send emails in 2024.

1.  Sign up at [Resend.com](https://resend.com/).
2.  Go to **API Keys** and click **"Create API Key"**.
3.  Give it "Full Access" and copy the key immediately.
4.  **Action**: Store this as `RESEND_API_KEY` in Supabase Secrets.

> [!TIP]
> For production, go to **Domains** on Resend and add your domain (e.g., `kilkeeleats.com`) and verify your DNS records. This ensures your emails don't go to the Spam folder.

---

## 🛡️ How to Save these in Supabase
Once you have these keys, your TL (Rakesh) should run these commands in the terminal (or add them via Supabase Dashboard > Edge Functions > notify > Settings):

```bash
supabase secrets set FIREBASE_PROJECT_ID="your-id"
supabase secrets set FIREBASE_CLIENT_EMAIL="your-email"
supabase secrets set FIREBASE_PRIVATE_KEY="your-key"
supabase secrets set TWILIO_ACCOUNT_SID="your-sid"
supabase secrets set TWILIO_AUTH_TOKEN="your-token"
supabase secrets set RESEND_API_KEY="your-resend-key"
```

# 🔑 API Credentials Guide

This guide explains how to find and generate the API keys required for the notifications and delivery systems. 

---

## 1. Firebase (Push Notifications)
We need the **Service Account Key** to send push notifications from the server.

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project.
3.  Click the **Settings Gear (⚙️)** next to "Project Overview" and select **Project Settings**.
4.  Go to the **Service Accounts** tab.
5.  Click the blue **Generate new private key** button.
6.  A `.json` file will download. **Please share this file safely.**

---

## 2. Twilio (WhatsApp Notifications)
Used for sending WhatsApp alerts to owners and delivery drivers.

1.  Log in to your [Twilio Console](https://www.twilio.com/console).
2.  On the **Dashboard/Home** page, look for the **Account Info** section.
3.  Copy the following:
    *   **Account SID**
    *   **Auth Token** (Click "Show" to reveal it)
4.  If you have a WhatsApp number set up, copy the **WhatsApp Number** (e.g., `whatsapp:+1234567890`).

---

## 3. Shipday (Delivery Management)
Used for dispatching orders and real-time driver tracking.

1.  Log in to your [Shipday Dashboard](https://app.shipday.com/).
2.  Click on **Settings** in the left sidebar.
3.  Select the **API** tab.
4.  Click **Generate Key** (if not already generated) or copy the existing **API Key**.

---

## 4. SendGrid (Email Notifications)
Used for sending order confirmation emails to customers.

1.  Log in to [SendGrid](https://app.sendgrid.com/).
2.  In the left sidebar, go to **Settings** > **API Keys**.
3.  Click **Create API Key**.
4.  Give it a name (e.g., "Food App Production") and select "Full Access".
5.  Copy the key. **Important:** SendGrid only shows the key once.
6.  **Domain Authentication**: Go to **Settings** > **Sender Authentication** and verify your domain so emails don't go to spam.

---

## ⚠️ Safety Warning
**Never share these keys in public chats or emails.** Use a secure password manager or a one-time secret sharing tool to send them to the development team.

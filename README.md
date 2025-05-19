# 🤖 Sara Chatbot

A personal AI assistant designed to help recruiters and hiring managers learn about Sara's (or your configured persona's) professional background, leadership style, and accomplishments. Built using Next.js, Tailwind CSS, and OpenAI APIs, this chatbot delivers context-aware answers and invites users to leave their email for follow-up.

---

## 🚀 Purpose

- Provide a user-friendly interface to chat with Sara’s AI assistant  
- Answer nuanced questions about Sara’s experience, even when not explicitly listed in her resume  
- Collect interested recruiters’ email addresses for future contact  

---

## 🧱 Tech Stack

- **Framework:** Next.js (App Router)  
- **Styling:** Tailwind CSS  
- **API:** OpenAI (via GPT-4o)  
- **Logging:** Client-side logging to Google Sheets Webhook  
- **Deployment:** Vercel  

---

## 📁 Structure

### `/src/app/`

- `page.tsx`: Main chat UI with message display, user input, and email capture  
- `layout.tsx`: Global layout and font configuration  
- `api/chat/route.ts`: Handles chat responses via OpenAI (logging is handled on the client side)  
- `api/log/route.ts`: Sends user input and optional email to Google Sheets  

### `public/`

- Static assets (if any)  

### `styles/` or `globals.css`

- Base styling and font variables  

---

## 🛠 Setup

1. **Clone the repo:**

```bash
git clone https://github.com/your-username/sara-chatbot.git
cd sara-chatbot
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up your `.env.local` file:**

```env
OPENAI_API_KEY=your-openai-key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GOOGLE_SHEETS_WEBHOOK_URL=your-webhook-url
```

> ⚠️ These variables are required both locally and in Vercel → Settings → Environment Variables.

> ⚠️ **Important Tip:**  
> Even if your OpenAI API key is valid, it will fail if your account has no credits remaining.  
> If you see an error like “quota exceeded,” visit [OpenAI Billing](https://platform.openai.com/account/billing) to check or top up your quota.

4. **Run the dev server:**

```bash
npm run dev
```

Then visit: [http://localhost:3000](http://localhost:3000)

---

## 💬 Example Use Case

> _“Does Sara have experience with GTM strategy or pricing?”_

The chatbot will:
- Embed the question
- Pass it to OpenAI with Sara’s assistant instructions
- Return a helpful response
- Optionally log the interaction and email

---

## 📊 Logging Architecture

The chatbot uses client-side logging to capture key interaction data and send it to a Google Sheets webhook for review and analysis.

**Flow:**

1. 🧠 User sends a message or submits their email via the chat UI (`page.tsx`)
2. 🔐 A `sessionId` is generated (if not already present) and persisted in `localStorage`
3. 📤 The frontend sends a POST request to `/api/log` with:
   - `userInput` and `botReply` (for chat interactions)
   - or `email` (for follow-up)
   - plus `sessionId`, `userAgent`, and `ip`
4. 📄 The `/api/log` route formats and forwards the data to a configured Google Sheets webhook
5. 📊 Google Sheets receives the data for review, grouped by session ID

This setup enables full visibility into chatbot usage while respecting user privacy.

---

## 🔒 Privacy Notes

- User messages are logged only if configured  
- Email submissions are optional and stored via webhook securely  

---

## ✅ To Do

- [ ] Enable persistent session context  
- [ ] Add analytics for user interaction tracking  

---

## ✨ Created by Sara Swart

Built for a smarter, more human recruiting experience.

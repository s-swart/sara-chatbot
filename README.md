# 🤖 Sara Chatbot

A personal AI assistant designed to help recruiters and hiring managers learn about Sara Swart's professional background, leadership style, and accomplishments. Built using Next.js, Tailwind CSS, and OpenAI APIs, this chatbot delivers context-aware answers and invites users to leave their email for follow-up.

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
- **Logging:** Google Sheets Webhook  
- **Deployment:** Vercel  

---

## 📁 Structure

### `/src/app/`

- `page.tsx`: Main chat UI with message display, user input, and email capture  
- `layout.tsx`: Global layout and font configuration  
- `api/chat/route.ts`: Handles chat responses via OpenAI  
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
GOOGLE_SHEETS_WEBHOOK_URL=your-webhook-url
```

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

## 🔒 Privacy Notes

- User messages are logged only if configured  
- Email submissions are optional and stored via webhook securely  

---

## ✅ To Do

- [ ] Add Supabase integration for embedding search (future enhancement)  
- [ ] Enable persistent session context  
- [ ] Add analytics for user interaction tracking  

---

## ✨ Created by Sara Swart

Built for a smarter, more human recruiting experience.
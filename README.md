# 🚀 LocalBiz AI WhatsApp Agent – Free SaaS Alternative for Local Businesses

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Made with FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://docker.com)
[![WhatsApp API](https://img.shields.io/badge/WhatsApp-Official%20API-25D366)](https://developers.facebook.com/docs/whatsapp)

> **24/7 AI receptionist for salons, clinics, and cloud kitchens – 100% free, no subscription fees, zero ban risk.**

Local businesses waste hours answering the same questions: "What are your hours?", "How much for a haircut?", "Do you deliver?" This bot automates all that using **official WhatsApp Cloud API** + **dual‑engine LLM failover (Groq Llama 3.3 → Gemini 2.0 Flash)**. Pure English responses. Deploy in 5 minutes with Docker.

---

## 📋 Table of Contents

1. [Why This is a SaaS Killer](#why-this-is-a-saas-killer)
2. [Features](#features)
3. [Architecture Overview](#architecture-overview)
4. [Tech Stack](#tech-stack)
5. [Prerequisites](#prerequisites)
6. [Quick Start (5 minutes)](#quick-start-5-minutes)
7. [Detailed Setup Guide](#detailed-setup-guide)
   - [Meta WhatsApp Cloud API Setup](#meta-whatsapp-cloud-api-setup)
   - [Groq API Key Setup](#groq-api-key-setup)
   - [Gemini API Key Setup](#gemini-api-key-setup)
   - [Environment Configuration](#environment-configuration)
   - [Running Locally with Docker](#running-locally-with-docker)
   - [Running Without Docker](#running-without-docker)
8. [Webhook Configuration (ngrok)](#webhook-configuration-ngrok)
9. [Testing the Bot](#testing-the-bot)
10. [Deployment to Production](#deployment-to-production)
    - [Render.com](#rendercom)
    - [Railway.app](#railwayapp)
    - [AWS EC2 / VPS](#aws-ec2--vps)
11. [Troubleshooting & Common Errors](#troubleshooting--common-errors)
12. [API Endpoints](#api-endpoints)
13. [Environment Variables Reference](#environment-variables-reference)
14. [Project Structure](#project-structure)
15. [Contributing](#contributing)
16. [License](#license)
17. [FAQs](#faqs)
18. [Support & Contact](#support--contact)

---

## 🌟 Why This is a SaaS Killer

| Feature | ManyChat / Intercom / Tidio | **LocalBiz AI (This Project)** |
|---------|-----------------------------|--------------------------------|
| Monthly cost | $15 – $300+ | **$0** (free tier of Meta API + Groq/Gemini) |
| WhatsApp integration | Official (but paid) | **Official Meta API** – free first 1k conversations/month |
| Ban risk | Low | **Zero** (uses official API) |
| AI engine | Fixed (often GPT-3.5) | **Dual failover** – Llama 3.3 → Gemini 2.0 |
| Response time | ~2-5 seconds | ~1-3 seconds (Groq is blazing fast) |
| Self-hostable | No | **Yes** – full control over data |
| Open source | No | **Yes** – MIT license |
| Language | English only | English (pure, professional) |

**For a small business handling 30-50 customer messages per day, this bot saves 10+ hours weekly and costs absolutely nothing.**

---

## ✨ Features

- ✅ **Official WhatsApp API** – No QR code scanning, no ban risk.
- ✅ **Dual-engine AI failover** – If Groq fails, Gemini takes over instantly.
- ✅ **Pure English responses** – Professional and clear.
- ✅ **Docker support** – One command to run anywhere.
- ✅ **Webhook ready** – Works with Meta’s verification.
- ✅ **Free tier friendly** – Groq free tier, Gemini free tier, Meta 1000 free conversations/month.
- ✅ **Easy deployment** – Render, Railway, or your own VPS.
- ✅ **Customizable prompts** – Change the AI personality easily.
- ✅ **Production-grade logging** – See every incoming message and error.
- ✅ **Simple web dashboard** – Check bot status at a glance.

---

## 🏗️ Architecture Overview


[Customer] ---(WhatsApp)---> [Meta Cloud API] ---(HTTP POST)---> [Your Server: FastAPI]
|
v
[AI Failover Layer]
|
(Primary) Groq Llama 3.3
| (if fails)
(Fallback) Gemini 2.0 Flash
|
v
[Reply back to Meta API]
|
v
[Customer] <---(WhatsApp)--- [Meta Cloud API] <---(HTTP POST)--- [Your Server]


**Data flow:**
1. Customer sends a message to your business WhatsApp number.
2. Meta forwards it to your webhook URL (`/webhook`).
3. FastAPI extracts the message and passes it to `ai_failover.py`.
4. The failover layer tries Groq Llama 3.3 first. If any error (rate limit, outage), it switches to Gemini 2.0 Flash.
5. The AI reply is sent back to Meta API using your access token.
6. Meta delivers the reply to the customer.

No queue, no delay – average response time ~2 seconds.

---

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Backend framework | FastAPI (Python) | Async, fast, built-in validation |
| WhatsApp integration | Meta Cloud API v18.0 | Official, free tier, reliable |
| Primary LLM | Groq Llama 3.3 (70B) | Blazing fast inference, 0.5¢/1M tokens |
| Fallback LLM | Gemini 2.0 Flash | Free, good quality, always available |
| Containerization | Docker + Docker Compose | Easy deployment, reproducible |
| Webhook tunneling | ngrok (for local dev) | Expose localhost to internet |
| Hosting (optional) | Render, Railway, AWS | Any cloud with Docker support |

---

## 📋 Prerequisites

Before you start, make sure you have:

- A **Meta Developer Account** (free) – [sign up here](https://developers.facebook.com/)
- A **WhatsApp Business Number** (you can convert a personal number or use a new one)
- A **Groq API key** (free) – [get it here](https://console.groq.com/)
- A **Gemini API key** (free) – [get it here](https://aistudio.google.com/)
- **Docker** installed (or Python 3.11+ if running without Docker)
- **ngrok** (for local testing) – [download here](https://ngrok.com/)

---

## ⚡ Quick Start (5 minutes)

This is the fastest way to get the bot running on your local machine for testing.

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/LocalBiz-AI-WhatsApp-Agent.git
cd LocalBiz-AI-WhatsApp-Agent

# 2. Copy environment variables and edit them
cp backend/.env.example backend/.env
nano backend/.env   # Add your actual API keys

# 3. Run with Docker
docker-compose up -d

# 4. Expose local server to internet (in a new terminal)
ngrok http 8000

# 5. Configure Meta webhook (see detailed guide below)
# Use your ngrok URL: https://xxxx.ngrok.io/webhook
# Set verify token same as in .env

# 6. Send a message to your WhatsApp business number – enjoy!
```


## 📖 Detailed Setup Guide

### 1. Meta WhatsApp Cloud API Setup
Go to Meta for Developers.

Create a new app → Business → WhatsApp.

In the app dashboard, go to WhatsApp → Getting Started.

Note down:

Phone Number ID (looks like 123456789012345)

WhatsApp Business Account ID

Generate a permanent access token:

Go to App Settings → Basic → App Secret (copy it)

Use the Graph API Explorer to generate a token with whatsapp_business_messaging permission.

Or use the "Generate Token" button in WhatsApp > API Setup.

Add a recipient phone number (your own test number) to the allowed list.

Copy the token to your .env file as WHATSAPP_TOKEN.

### 2. Groq API Key Setup
Go to console.groq.com.

Sign up / log in.

Go to API Keys → Create API Key.

Copy the key starting with gsk_.

Add to .env as GROQ_API_KEY.

### 3. Gemini API Key Setup
Go to aistudio.google.com.

Click Get API key.

Create a key (free tier allows 60 requests per minute).

Copy the key starting with AIzaSy.

Add to .env as GEMINI_API_KEY.

### 4. Environment Configuration

Your backend/.env file should look like this (no quotes around values):

```
WHATSAPP_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERIFY_TOKEN=mySuperSecretVerifyToken123
PHONE_NUMBER_ID=123456789012345
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

⚠️ Security: Never commit .env to GitHub. It's already in .gitignore.
```
## 5. Running Locally with Docker
### Build and start the container
docker-compose up -d

### Check logs
docker-compose logs -f

### Stop the container
docker-compose down
```
The API will be available at http://localhost:8000. To verify it's running, you can add a health endpoint (optional – see API section).
```

## 6. ## 6. Running Without Docker (for development)

cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

## 🔗 Webhook Configuration (ngrok)

Because Meta needs a public HTTPS URL to send webhooks, you must expose your local server.

Install ngrok from ngrok.com.

Run: ngrok http 8000

Copy the HTTPS forwarding URL (e.g., https://abc123.ngrok.io).

Go back to Meta Developer Dashboard → WhatsApp → Configuration.

Edit the webhook:

Callback URL: https://abc123.ngrok.io/webhook

Verify token: the same VERIFY_TOKEN you put in .env

Click Verify and save. Meta will send a GET request to your server – it should respond with the challenge.

After verification, subscribe the webhook to the messages field.

Done! Now every incoming message will hit your /webhook endpoint.

## 🧪 Testing the Bot

Send a WhatsApp message to your business number (the one registered with Meta).

Example messages to try:

"What are your opening hours?"

"How much for a haircut?"

"I want to book an appointment for tomorrow at 3 PM"

Check the logs: docker-compose logs -f or uvicorn terminal.

You should see:
```
INFO: Groq reply success
```
or, if fallback was used:
```
WARNING: Groq failed: ... Falling back to Gemini.
INFO: Gemini fallback success
```
If something goes wrong, see Troubleshooting.

## 🚀 Deployment to Production


## Option 1: Render.com (easiest, free tier)
Push your code to a GitHub repository.

Go to render.com, sign up with GitHub.

Click New + → Web Service.

Connect your repository.

Use these settings:

Environment: Docker

Branch: main

Root Directory: (leave empty)

Dockerfile Path: Dockerfile

Port: 8000

Add environment variables (same as .env).

Click Create Web Service.

Render will give you a public URL like https://yourapp.onrender.com.

Use that URL as the webhook callback in Meta dashboard (https://yourapp.onrender.com/webhook).

Done!

## Option 2: Railway.app
Push code to GitHub.

Go to railway.app, click New Project → Deploy from GitHub repo.

Select your repo.

Railway automatically detects Dockerfile.

Add environment variables in the dashboard.

Get the generated URL and set as webhook.

## Option 3: AWS EC2 / VPS
# SSH into your server
sudo apt update && sudo apt install docker.io docker-compose -y
git clone https://github.com/yourusername/LocalBiz-AI-WhatsApp-Agent.git
cd LocalBiz-AI-WhatsApp-Agent
# Copy your .env file (use scp or create it manually)
docker-compose up -d --build
```
Then use your server's public IP with a reverse proxy (like Nginx) to enable HTTPS. Meta requires HTTPS, so obtain a free SSL certificate from Let's Encrypt.
```
## 🐛 Troubleshooting & Common Errors

| Error                                           | Likely Cause                                      | Solution                                                                                  |
|-------------------------------------------------|---------------------------------------------------|-------------------------------------------------------------------------------------------|
| `403 Forbidden` on webhook verification        | Wrong `VERIFY_TOKEN` in Meta dashboard            | Make sure the token matches exactly with `.env`.                                          |
| `"error": "invalid access token"`              | `WHATSAPP_TOKEN` expired or incorrect             | Generate a new token in Meta dashboard.                                                   |
| `Groq failed: Rate limit exceeded`              | Too many requests on free tier                    | Wait a few seconds; fallback to Gemini will work.                                         |
| `Gemini failed: ...`                           | API key invalid or quota exceeded                 | Check your Gemini key or enable billing.                                                  |
| `ModuleNotFoundError: No module named 'groq'`  | Dependencies not installed                        | Run `pip install -r requirements.txt` inside the container or rebuild Docker.            |
| Webhook not receiving messages                  | You forgot to subscribe to `messages` event       | Go to Meta Dashboard → WhatsApp → Configuration → Webhook fields → Manage → Subscribe to `messages`. |
| `ConnectionError` when sending reply           | Outbound internet blocked on your server          | Ensure your server can reach `https://graph.facebook.com`.                                |
| Bot replies with "Sorry, I'm temporarily unavailable" | Both AI engines failed                           | Check your API keys and internet connectivity.                                            |
| `ImportError: cannot import name 'get_ai_reply'` | Wrong folder structure (`utils` outside `backend`) | Move `utils/` folder inside `backend/` as shown in project structure.                    |

---

## 📡 API Endpoints

| Method | Endpoint     | Description                                    |
|--------|--------------|------------------------------------------------|
| GET    | `/webhook`   | Meta verification endpoint                     |
| POST   | `/webhook`   | Receives incoming WhatsApp messages and replies |
| GET    | `/health`    | Health check (add manually – see below)        |

**To add a health check**, insert this in `backend/main.py`:

```python
@app.get("/health")
async def health():
    return {"status": "alive", "version": "1.0.0"}
```


Then restart the server. The frontend dashboard will use /health to show status.


## 🔧 Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `WHATSAPP_TOKEN` | Permanent access token from Meta | Yes | None |
| `VERIFY_TOKEN` | Your secret token for webhook verification | Yes | None |
| `PHONE_NUMBER_ID` | The WhatsApp phone number ID (numeric) | Yes | None |
| `GROQ_API_KEY` | API key for Groq Llama 3.3 | Yes | None |
| `GEMINI_API_KEY` | API key for Google Gemini | Yes | None |


## 📁 Project Structure
LocalBiz-AI-WhatsApp-Agent/
│
├── backend/
│ ├── __init__.py # Makes backend a Python package
│ ├── main.py # FastAPI server & webhook handler
│ ├── requirements.txt # Python dependencies
│ ├── .env.example # Template for environment variables
│ └── utils/
│ ├── __init__.py # Makes utils a subpackage
│ └── ai_failover.py # Dual-engine failover logic
│
├── frontend/
│ └── index.html # Simple status dashboard
│
├── docker-compose.yml # One-command orchestration
├── Dockerfile # Container definition
├── .gitignore # Ignore sensitive and temporary files
├── LICENSE # MIT License
├── README.md # This file
└── CONTRIBUTING.md # Guidelines for contributors

```Note: The __init__.py files can be completely empty. They just signal Python that the folders are importable packages. ```

## 🤝 Contributing

```
We love contributions! See CONTRIBUTING.md for guidelines.
Short version:

Fork, branch, PR.

Keep code Pythonic and well‑commented.

Keep responses in pure English.

Test locally before submitting.

Update documentation if needed.
```

---

## 📄 License & Open-Source Usage
This software is proudly licensed under the **MIT License** – see the `LICENSE` file for full details.
You are fully encouraged to use this repository for **commercial projects**, modify the architecture, and distribute it as a white-label solution for local businesses, completely free of charge.

---

## ❓ Frequently Asked Questions (FAQs)

**Q: Is there any risk of my business WhatsApp number getting banned?**
**A:** Absolutely **No**. Unlike unauthorized scraping tools, this architecture is fully integrated with the **Official Meta WhatsApp Cloud API**. It is 100% compliant with WhatsApp Business Policies, carrying zero risk of account bans.

**Q: Do I need a Facebook Business Manager account to run this?**
**A:** Yes. To access the official API, a Meta Business Manager account is required. The setup is completely free and takes only a few minutes to verify your business.

**Q: What are the costs associated with the Meta API?**
**A:** Meta provides the first **1,000 service conversations per month for free**. (A conversation is defined as a 24-hour open chat window with a customer). For 95% of local businesses, this free tier is more than sufficient.

**Q: What happens if a business exceeds the 1,000 free conversations?**
**A:** If you scale beyond the free tier, Meta charges a highly nominal fee (approximately ~$0.005 to $0.01 per service conversation, depending on your region). It remains incredibly cost-effective compared to traditional SaaS models.

**Q: Can I customize the AI's personality and responses?**
**A:** Yes! You can easily modify the AI's behavior by editing the `SYSTEM_PROMPT` variable located in `backend/utils/ai_failover.py`. You can instruct it to act as a clinic receptionist, a restaurant order-taker, or a boutique consultant.

**Q: Does this bot support images, voice notes, or PDF menus?**
**A:** The current open-source version handles text-based customer support. However, the architecture is extensible; you can add media support by parsing the `media` field in the incoming Meta Webhook payload.

**Q: Can I deploy this on free cloud platforms?**
**A:** Yes. While Heroku has ended its free tier, you can seamlessly deploy the Python/Flask backend on platforms like **Render**, **Railway**, or **PythonAnywhere** using their generous free tiers.

**Q: How do I monitor the Dual-Engine AI failover?**
**A:** Check your deployment logs. You will explicitly see print statements logging `"Groq reply success"` for primary execution, or `"Gemini fallback success"` if rate limits triggered the failover protocol.

**Q: Why are there empty `__init__.py` files in the directories?**
**A:** These are essential Python markers. They define directories like `backend` and `backend/utils` as modular packages, enabling clean, absolute imports (e.g., `from utils.ai_failover import get_ai_reply`).

**Q: Can I use one deployment for multiple different businesses?**
**A:** Yes. For a multi-tenant SaaS approach, each business will need its own WhatsApp Business Number. You can containerize the app using Docker and spin up separate instances with unique `.env` configurations for each client.

**Q: How fast is the AI response time?**
**A:** Extremely fast. Groq Llama 3.3 typically processes replies in 1–2 seconds. In the event of a fallback, Gemini 2.0 Flash takes 2–3 seconds. The total round-trip latency (including Meta API webhooks) is generally under 5 seconds.

---

## 📈 Future Roadmap

We are continuously evolving this project into the ultimate AI automation tool. Upcoming features include:

- [ ] **Google Calendar API Integration:** Autonomous, real-time appointment booking.
- [ ] **Multilingual NLP Support:** Native processing for Spanish, Hindi, Roman Urdu, and more.
- [ ] **React.js Admin Dashboard:** A web UI for business owners to view conversation histories.
- [ ] **Sentiment Escalation System:** Automatically flags and routes angry customers to a human agent.
- [ ] **E-commerce Integrations:** Shopify / WooCommerce webhook support for automated order tracking.
- [ ] **Dynamic Prompt Engineering UI:** Edit the AI's system prompt directly from a web panel without server redeployments.

---

## 📞 Support, Contact & Community
- **Bug Reports & Feature Requests:** Please [open an issue](https://github.com/YOUR_USERNAME/LocalBiz-AI-WhatsApp-Agent/issues) on GitHub.
- **Community Discussions:** Join the conversation in our [GitHub Discussions](#) tab.

<div align="center">
  <h2>Thank you for using LocalBiz AI WhatsApp Agent! 🚀</h2>
</div>

<br>

<div align="center">
  <b>Built with ❤️ by Muhammad Umair Ghaffar</b><br>
  <i>An 18-year-old AI Automation Specialist & Developer based in Lahore, Pakistan 🇵🇰</i>
  <br><br>
  <b>If this project helped you save SaaS fees, please consider giving it a ⭐ on GitHub and sharing it with local business owners!</b>
</div>


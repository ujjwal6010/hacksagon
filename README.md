# Janani

**AI-powered, multilingual voice assistant for rural maternal healthcare.** Janani empowers low-literate pregnant women in rural India with life-saving prenatal care insights delivered through simple, natural voice conversations — in any of 22+ Indian languages.

Built for the Hacksagon hackathon.

## Key Features

- **Voice-First Interface** — Speak in any Indian language; Janani listens, understands, and responds in the same language via Sarvam AI STT/TTS.
- **RAG-Powered Medical Intelligence** — Retrieval-Augmented Generation grounded in a 1.4 MB clinical health book, powered by LangChain + ChromaDB + Groq (Llama 3).
- **Twilio Voice Pipeline** — Toll-free phone calls for users without smartphones. Full STT → Translate → RAG → Translate → TTS → Play pipeline over a live call.
- **Clinical Data Extraction** — Every conversation is automatically parsed for symptoms, medications, fetal movement, severity scores, and relief indicators.
- **Smart Dashboards** — Patient health overview, doctor summary with red-flag detection, and simplified family summary — all auto-generated from conversation data.
- **SOS Panic Button & AI-Triggered Alerts** — Manual long-press or AI-detected emergencies trigger voice calls + SMS to the patient's emergency contact.
- **Post-Call SMS Alerts** — After every phone call, Groq analyzes the transcript and sends a severity-graded SMS summary to a family member.
- **Automated Health Summaries** — Cron-powered daily, weekly, and monthly AI-generated health reports stored per patient.
- **Progressive Web App** — Installable on any device with offline caching via Workbox service worker.
- **22+ Language Support** — Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Sanskrit, Kashmiri, Sindhi, Dogri, Konkani, Manipuri, Maithili, Santali, Nepali, and English.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, Framer Motion, Lucide Icons |
| **Backend API** | Node.js, Express 5 |
| **AI / RAG Service** | Python 3.11, FastAPI, LangChain, ChromaDB, Groq (Llama 3.1/3.3) |
| **Database** | MongoDB Atlas (Mongoose ODM + Motor async driver) |
| **Voice & Telephony** | Twilio (Calls, SMS, TwiML) |
| **Speech AI** | Sarvam AI (STT: saaras:v3, TTS: bulbul:v3, Translate API) |
| **Embeddings** | FastEmbed (BAAI/bge-small-en-v1.5) |
| **Audio Processing** | FFmpeg (WAV → MP3 conversion for telephony) |
| **Auth** | JWT + bcrypt |
| **PWA** | vite-plugin-pwa, Workbox |


---

## Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **MongoDB Atlas** cluster (or a local MongoDB instance)
- **npm** (comes with Node.js)
- **pip** / **venv** for Python dependencies
- **FFmpeg** (auto-installed on Alpine via the Docker image; required locally for the voice pipeline)

### External API Keys Required

| Service | Purpose | Sign-up |
|---|---|---|
| Groq | LLM inference (Llama 3.x) | [console.groq.com](https://console.groq.com) |
| Sarvam AI | Indian-language STT, TTS, Translation | [sarvam.ai](https://www.sarvam.ai) |
| Twilio | Voice calls & SMS | [twilio.com](https://www.twilio.com) |
| HuggingFace | Embedding model download (optional, auto-cached) | [huggingface.co](https://huggingface.co) |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ujjwal6010/hacksagon.git
cd hacksagon
```

### 2. Backend Setup

```bash
cd backend

# Install Node.js dependencies
npm install

# Create a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Configure the following variables in `backend/.env`:

| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://USER:PASS@cluster.mongodb.net/janani` |
| `DB_NAME` | Database name | `janani` |
| `PORT` | Node.js server port | `5000` |
| `JWT_SECRET` | Secret for JWT token signing | Any strong random string |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:5173,https://your-app.vercel.app` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `ACxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `xxxxxxxxxxxx` |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | `+1xxxxxxxxxx` |
| `MY_PHONE_NUMBER` | Target phone for outbound calls | `+91xxxxxxxxxx` |
| `WEBHOOK_BASE_URL` | Public URL for Twilio webhooks | `https://your-ngrok-url.ngrok.io` |
| `RELATIVE_PHONE_NUMBER` | Emergency contact for SMS alerts | `+91xxxxxxxxxx` |
| `GROQ_API_KEY` | Groq API key | `gsk_xxxxxxxxxxxx` |
| `SARVAM_API_KEY` | Sarvam AI API key | `sk_xxxxxxxxxxxx` |
| `HUGGINGFACEHUB_API_TOKEN` | HuggingFace token (optional) | `hf_xxxxxxxxxxxx` |

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

Create a `.env` file in `frontend/` if you need to override the API URL:

```
VITE_API_URL=http://localhost:5000
```

### 5. Start Development Servers

**Terminal 1 — Python RAG Service:**

```bash
cd backend
source .venv/bin/activate
python python/api.py
# Runs on http://localhost:8000
# First run downloads the embedding model and ingests health_book.txt (~1-2 min)
```

**Terminal 2 — Node.js API:**

```bash
cd backend
node server.js
# Runs on http://localhost:5000
```

**Terminal 3 — Frontend:**

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                  │
│  Landing Page ←→ Auth ←→ Voice Interface ←→ Dashboard           │
│  Sarvam STT/TTS (browser-direct)  │  PWA + Service Worker       │
└──────────────────────┬──────────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────────┐
│                   NODE.JS / EXPRESS (port 5000)                  │
│  /api/auth   → JWT signup/login/profile                         │
│  /api/voice  → Twilio call pipeline (trigger, webhook, TTS)     │
│  /api/ask    → Proxy to Python RAG                              │
│  /api/dashboard → Health stats, doctor/family summaries          │
│  /api/sos    → Panic button, incident tracking                  │
│  /api/inbound → Inbound call handler                            │
│  summaryCron → Daily/weekly/monthly AI summaries                │
└──────────┬──────────────────────┬───────────────────────────────┘
           │                      │
   ┌───────▼────────┐   ┌────────▼───────────────────────────────┐
   │  MongoDB Atlas  │   │  PYTHON / FastAPI (port 8000)          │
   │  Users          │   │  /ask  → RAG pipeline                  │
   │  HealthLogs     │   │  LangChain + ChromaDB + Groq           │
   │  Incidents      │   │  Sarvam Translate (server-side)        │
   └─────────────────┘   │  Clinical data extraction              │
                          │  MongoDB persistence (Motor)           │
                          └───────────────────────────────────────┘
```

### Directory Structure

```
hacksagon/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection helper
│   │   └── env.js             # Environment validation
│   ├── controllers/
│   │   └── auth.controller.js # Auth controller
│   ├── models/
│   │   ├── User.js            # User schema (name, email, phone, pregnancy info)
│   │   ├── HealthLog.js       # Health log with interaction history & summaries
│   │   └── Incident.js        # SOS incident tracking
│   ├── routes/
│   │   ├── auth.js            # POST /signup, /login, PUT /profile
│   │   ├── voice.js           # Twilio voice pipeline (926 lines)
│   │   ├── dashboard.js       # GET health data, doctor/family summaries
│   │   ├── sos.js             # POST trigger, GET status, POST resolve
│   │   └── inbound.js         # Inbound call handler
│   ├── services/
│   │   ├── auth.service.js    # Auth business logic
│   │   └── summaryCron.js     # Cron-based AI health summaries
│   ├── python/
│   │   ├── api.py             # FastAPI app — /ask endpoint
│   │   ├── rag_service.py     # RAG chain (retrieve → generate)
│   │   ├── ingest.py          # health_book.txt → ChromaDB
│   │   ├── prompts.py         # System prompts for RAG & extraction
│   │   ├── schemas.py         # Pydantic models
│   │   └── health_book.txt    # 1.4 MB clinical reference document
│   ├── server.js              # Express entry point
│   ├── start.sh               # Docker entrypoint (Python + Node)
│   ├── Dockerfile             # Multi-stage Docker build
│   ├── .env.example           # Environment variable template
│   ├── package.json
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Landing page, voice interface, navbar
│   │   ├── Auth.jsx           # Login/signup modals
│   │   ├── Dashboard.jsx      # Health dashboard with tabs
│   │   ├── index.css          # Global styles + design system
│   │   └── main.jsx           # React entry point
│   ├── public/                # Static assets, PWA icons
│   ├── index.html             # HTML shell
│   ├── vite.config.js         # Vite + PWA configuration
│   ├── vercel.json            # Vercel deployment config
│   └── package.json
└── .gitignore
```

### Request Lifecycle — Voice Call

```
User calls → Twilio webhook → /api/voice/webhook (greeting + record)
→ Recording complete → /api/voice/process-ai
  1. Download recording from Twilio (WAV)
  2. Sarvam STT → native text + detected language
  3. Sarvam Translate → English
  4. Python RAG (/ask) → English medical answer
  5. Sarvam Translate → native language answer
  6. Sarvam TTS → WAV → FFmpeg → MP3
  7. Save interaction to MongoDB (symptoms, severity, etc.)
  8. Twilio: play MP3 + offer menu (repeat / new question)

Call ends → /api/voice/call-status
  → Groq analyzes transcript → severity (GREEN/YELLOW/RED)
  → SMS summary sent to relative
  → If RED/EMERGENCY → SOS protocol (voice call + SMS + incident log)
```

### Request Lifecycle — Web Chat

```
User speaks/types → Browser Sarvam STT (voice) or text input
→ POST /api/ask → proxy to Python :8000/ask
  1. Translate query to English (Sarvam, Groq fallback)
  2. Retrieve top-5 document chunks from ChromaDB
  3. Stream answer via Groq (Llama 3.1-8b)
  4. Translate answer back to user's language
  5. Extract clinical data (symptoms, meds, severity)
  6. Save to MongoDB
→ Response played via browser Sarvam TTS
```

### Database Schema

```
users
├── _id (ObjectId, PK)
├── name (String, required)
├── email (String, unique, sparse)
├── phoneNumber (String, unique, sparse)
├── password (String, bcrypt hashed)
├── pregnancyDate (String)
├── allergies (String)
├── medicalHistory (String)
└── createdAt (Date)

healthlogs
├── _id (ObjectId, PK)
├── phone_number (String, unique, indexed)
├── user_email (String)
├── history[] ── per-interaction records
│   ├── timestamp (Date)
│   ├── user_message_native / user_message_english (String)
│   ├── rag_reply_native / rag_reply_english (String)
│   ├── symptoms[] ── { name, status, reported_time }
│   ├── medications[] ── { name, taken, taken_time, effect_noted }
│   ├── relief_noted (Boolean)
│   ├── relief_details (String)
│   ├── fetal_movement_status (Enum: Yes/No/Invalid)
│   ├── severity_score (Number, 0-10)
│   └── ai_summary (String)
├── summaries[] ── AI-generated periodic summaries
│   ├── type (Enum: daily/weekly/monthly)
│   ├── period_start / period_end (Date)
│   ├── summary_english / summary_native (String)
│   ├── total_interactions (Number)
│   ├── symptoms_timeline / medications_timeline (String)
│   ├── avg_severity (Number)
│   └── doctor_notes (String)
├── created_at (Date)
└── updated_at (Date)

incidents (SOS)
├── _id (ObjectId, PK)
├── user_email / user_phone (String)
├── patient_name (String)
├── trigger_source (Enum: AI-Detected / Manual-Press)
├── severity (Enum: RED / CRITICAL)
├── notes (String)
├── resolved (Boolean)
├── resolved_at (Date)
├── resolved_by (String)
└── created_at (Date)
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register (name, email/phone, password) |
| `POST` | `/api/auth/login` | Login (identifier + password → JWT) |
| `PUT` | `/api/auth/profile` | Update pregnancy date, allergies, medical history |

### AI Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ask` | Proxy to Python RAG service |
| `GET` | `/api/ai-health` | Check Python service health |

### Voice (Twilio)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/voice/trigger` | Initiate outbound Twilio call |
| `POST` | `/api/voice/webhook` | Twilio webhook — greeting + record |
| `POST` | `/api/voice/process-ai` | Process recording through AI pipeline |
| `POST` | `/api/voice/post-reply` | DTMF menu (1 = repeat, 2 = new question) |
| `POST` | `/api/voice/new-query` | Record a new question |
| `POST` | `/api/voice/call-status` | Post-call analysis + SMS alert |

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/:identifier` | Full health overview (symptoms, meds, stats) |
| `GET` | `/api/dashboard/:identifier/summary/doctor` | Doctor-facing clinical summary with red flags |
| `GET` | `/api/dashboard/:identifier/summary/family` | Simplified family-facing summary |
| `GET` | `/api/dashboard/:identifier/history` | Paginated conversation history |

### SOS

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sos/trigger` | Manual panic button trigger |
| `GET` | `/api/sos/status/:email` | Check active SOS status |
| `POST` | `/api/sos/resolve/:id` | Resolve an SOS incident |
| `GET` | `/api/sos/history/:email` | SOS incident audit trail |

### Health Checks

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Node.js server health |
| `GET` | `localhost:8000/health` | Python RAG service health |

---

## Available Scripts

### Backend

| Command | Description |
|---|---|
| `npm start` | Start both Python + Node via `start.sh` |
| `npm run dev` | Start Node.js server only |
| `python python/api.py` | Start Python RAG service only |
| `python python/ingest.py` | Re-ingest health_book.txt into ChromaDB |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (hot reload) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## Cron Jobs

The `summaryCron` service runs three scheduled tasks (IST timezone):

| Schedule | Type | Description |
|---|---|---|
| Daily at 9:00 PM IST | `daily` | Summarizes the last 24 hours of interactions |
| Weekly on Sunday 9:00 PM IST | `weekly` | Summarizes the last 7 days |
| 1st of every month at midnight IST | `monthly` | Summarizes the last 30 days |

Each summary is generated by Groq (Llama 3.3-70b) and stored in the patient's `healthlogs.summaries` array.

---

## Troubleshooting

### Python RAG Service Won't Start

**Error:** `ModuleNotFoundError: No module named 'langchain'`

**Solution:** Ensure you're in the virtual environment and dependencies are installed:
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### First Run Is Slow (~2 minutes)

The RAG service downloads the `BAAI/bge-small-en-v1.5` embedding model (~130 MB) and ingests `health_book.txt` on first startup. Subsequent starts use the cached `vectordb/` directory.

### Twilio Webhooks Not Working

Twilio needs a publicly accessible URL. For local development:
```bash
ngrok http 5000
```
Then set `WEBHOOK_BASE_URL=https://xxxx.ngrok.io` in your `.env`.

### MongoDB Connection Issues

**Error:** `MongooseError: connect ECONNREFUSED`

- Verify your `MONGO_URI` is correct
- Ensure your IP is whitelisted in MongoDB Atlas → Network Access
- Check that the database user has read/write permissions

### CORS Errors

Add your frontend URL to `ALLOWED_ORIGINS` in the backend `.env`:
```
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
```

All `*.vercel.app` subdomains are automatically allowed.

### Voice Pipeline Errors

- Ensure FFmpeg is installed: `ffmpeg -version`
- Check that `SARVAM_API_KEY` and `GROQ_API_KEY` are valid
- The `public/tts/` directory is auto-created for temporary audio files

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project was built for the Hacksagon hackathon.

---

## Acknowledgments

- **[Sarvam AI](https://www.sarvam.ai)** — Indian-language speech and translation APIs
- **[Groq](https://groq.com)** — Ultra-fast LLM inference
- **[LangChain](https://langchain.com)** — RAG framework
- **[Twilio](https://twilio.com)** — Voice and SMS infrastructure
- **[ChromaDB](https://www.trychroma.com)** — Vector database for embeddings

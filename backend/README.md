# Janani Backend

## Architecture

The backend is a **dual-service architecture**:

1. **Node.js / Express 5** (port 5000) — API gateway, auth, Twilio voice pipeline, dashboards, SOS
2. **Python / FastAPI** (port 8000) — AI/RAG microservice, clinical extraction, translation

## Project Structure

```
backend/
├── config/
│   ├── db.js               # MongoDB connection helper
│   └── env.js              # Environment variable validation
├── controllers/
│   └── auth.controller.js  # Auth business logic
├── models/
│   ├── User.js             # User schema (name, email, pregnancy info)
│   ├── HealthLog.js        # Health log with interaction history & summaries
│   └── Incident.js         # SOS incident tracking (with GPS coordinates)
├── routes/
│   ├── auth.js             # POST /signup, /login, PUT /profile
│   ├── voice.js            # Twilio voice pipeline (STT → RAG → TTS)
│   ├── dashboard.js        # GET health stats, doctor/family summaries
│   ├── sos.js              # POST trigger (GPS), GET status, POST resolve
│   └── inbound.js          # Inbound call handler
├── services/
│   ├── auth.service.js     # Auth business logic
│   └── summaryCron.js      # Cron-based AI health summaries
├── python/
│   ├── api.py              # FastAPI app — /ask endpoint + clinical extraction
│   ├── rag_service.py      # RAG chain (retrieve → generate)
│   ├── ingest.py           # health_book.txt → ChromaDB
│   ├── prompts.py          # System prompts for RAG & extraction
│   ├── schemas.py          # Pydantic models
│   └── health_book.txt     # 1.4 MB clinical reference document
├── public/tts/             # Generated TTS audio (auto-created)
├── server.js               # Express entry point
├── package.json
├── requirements.txt
├── Dockerfile
└── start.sh                # Docker entrypoint
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install

# Python (use venv)
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `DB_NAME` | ✅ | Database name (default: `janani`) |
| `PORT` | ✅ | Server port (default: `5000`) |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `GROQ_API_KEY` | ✅ | Groq API key for Llama 3.3 |
| `SARVAM_API_KEY` | ✅ | Sarvam AI API key (STT, TTS, Translate) |
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | ✅ | Twilio phone number |
| `MY_PHONE_NUMBER` | ✅ | Target phone for outbound calls |
| `RELATIVE_PHONE_NUMBER` | ✅ | Emergency contact for SOS alerts |
| `WEBHOOK_BASE_URL` | ✅ | Public URL (ngrok) for Twilio webhooks |
| `ALLOWED_ORIGINS` | ❌ | CORS origins (comma-separated) |

### 3. Start Services

**Terminal 1 — Python RAG:**
```bash
cd backend/python
python api.py
# Runs on http://localhost:8000
```

**Terminal 2 — Node.js API:**
```bash
cd backend
node server.js
# Runs on http://localhost:5000
```

**Terminal 3 — Ngrok (for Twilio webhooks):**
```bash
ngrok http 5000
# Copy the HTTPS URL → set as WEBHOOK_BASE_URL in .env
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register new user |
| `POST` | `/api/auth/login` | Login → JWT token |
| `PUT` | `/api/auth/profile` | Update pregnancy info, allergies |

### AI Chat
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ask` | Proxy to Python RAG service |

### Voice (Twilio)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/voice/trigger` | Initiate outbound call |
| `POST` | `/api/voice/webhook` | Twilio webhook — greeting + record |
| `POST` | `/api/voice/process-ai` | Process recording through AI pipeline |
| `POST` | `/api/voice/call-status` | Post-call analysis + SMS + SOS detection |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/:id` | Health overview (symptoms, meds, severity, relief rate) |
| `GET` | `/api/dashboard/:id/summary/doctor` | Doctor-facing clinical summary |
| `GET` | `/api/dashboard/:id/summary/family` | Simplified family summary |
| `GET` | `/api/dashboard/:id/history` | Paginated conversation history |

### SOS Emergency
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/sos/trigger` | Panic button trigger (accepts `latitude`, `longitude`) |
| `GET` | `/api/sos/status/:email` | Check active SOS status |
| `POST` | `/api/sos/resolve/:id` | Resolve an incident |
| `GET` | `/api/sos/history/:email` | SOS audit trail |

**SOS Protocol:** When triggered, the system simultaneously:
1. Creates an Incident in MongoDB (with GPS coordinates)
2. Places a voice call to the emergency contact
3. Sends an SMS with patient location + nearby hospital links

## Key Features

- **Relief Detection** — AI extracts relief signals from conversations (20+ keywords) to calculate Relief Rate
- **GPS-Enabled SOS** — Browser geolocation captured on SOS trigger, sent as Google Maps links in SMS
- **Nearby Hospitals** — Embedded Google Maps iframe on dashboard showing hospitals near the user
- **5-Min Cooldown** — Prevents accidental repeated SOS triggers
- **Post-Call Analysis** — Groq analyzes full conversation transcript for severity scoring and emergency detection

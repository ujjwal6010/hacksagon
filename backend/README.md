# Janani Backend — Foundation Setup Quick Start

## Project Structure

```
backend/
├── config/              # Configuration modules
│   ├── env.js          # Environment variable loader
│   └── db.js           # MongoDB connection manager
├── models/             # Mongoose schemas (normalized)
│   ├── User.js         # Authenticated user model
│   └── HealthLog.js    # Patient interaction history + summaries
├── python/             # Python AI service
│   ├── api.py          # FastAPI placeholder
│   └── (future modules)
├── public/tts/         # Generated TTS audio folder
├── server.js           # Node.js HTTP entry point
├── package.json        # Node dependencies
├── requirements.txt    # Python dependencies
├── .env.example        # Environment template
├── verify.js           # DB connection verification script
├── Dockerfile          # Multi-stage build
└── start.sh            # Service startup orchestration
```

## Setup Instructions

### 1. Install Dependencies

**Node:**
```bash
cd backend
npm install
cp .env.example .env
```

**Python:**
```bash
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate (Windows)
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/janani_db
NODE_ENV=development
PORT=5000
PYTHON_SERVICE_URL=http://localhost:8000
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
# In another terminal:
mongo  # to verify connection
```

**Docker MongoDB:**
```bash
docker run -d -p 27017:27017 --name janani_mongo mongo:7
```

### 4. Verify Setup

```bash
cd backend
node verify.js
```

Expected output:
```
📋 Janani Backend Verification

1️⃣  Connecting to MongoDB...
✓ MongoDB connected successfully
2️⃣  Testing User model schema...
3️⃣  Testing HealthLog model schema...
4️⃣  Testing User validation...
   ✓ PASSED: Correctly rejected user without email/phone
5️⃣  Testing HealthLog validation...
   ✓ PASSED: Correctly rejected HealthLog without identity
6️⃣  Testing valid document creation...
   ✓ PASSED: Valid User document created
   ✓ PASSED: Valid HealthLog document created

✅ All validations passed!
```

### 5. Start Services (Manual)

**Terminal 1 — Python AI Service:**
```bash
cd backend/python
python api.py
# Should output: INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 — Node API Server:**
```bash
cd backend
npm start
# Should output: ✓ Janani Backend running on port 5000
```

**OR use the startup script:**
```bash
cd backend
chmod +x start.sh
./start.sh
```

### 6. Verify Services Running

```bash
curl http://localhost:5000/health
# {"status":"ok","timestamp":"..."}

curl http://localhost:8000/health
# {"status":"ok"}
```

---

## Data Model Overview

### User Collection
- **Purpose:** Authenticated users (doctors, support staff, future)
- **Validation:** At least email OR phoneNumber required
- **Fields:** name, email, phoneNumber (unique, sparse), passwordHash, timestamps

### HealthLog Collection
- **Purpose:** Patient interaction history (one document per patient)
- **Identity Priority:** phoneNumber > email > userId
- **Sections:**
  - **history[]** — All interactions (text/voice/calls)
  - **summaries[]** — AI-generated daily/weekly/monthly summaries
- **Interaction Structure:**
  - source, languages (detected/requested/response)
  - userInput (native, English, raw transcript)
  - aiOutput (English, native, model, retrieval metadata)
  - clinical (symptoms, medications, relief, fetal movement, severity)
  - meta (session IDs, Twilio refs, processing status)

---

## Next Phase (Waiting for Instructions)

This foundation includes:
✅ Project structure (Node + Python)
✅ Environment config loading
✅ MongoDB connection setup
✅ User model (normalized validation)
✅ HealthLog model (fully normalized as specified)
✅ Verification script
✅ Dockerfile + startup orchestration

**NOT included** (per scope):
❌ Routes, controllers, or APIs
❌ Authentication logic
❌ AI, Twilio, or dashboard functionality
❌ Extra features

---

## Ready for Next Phase

Stop here and wait for next instruction to proceed with:
- Phase 2A: Authentication module
- Phase 2B: Dashboard service foundation
- Phase 2C: Twilio + voice service integration
- etc.

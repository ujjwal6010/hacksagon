const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const twilio = require('twilio');
const HealthLog = require('../models/HealthLog');
const User = require('../models/User');

const router = express.Router();
const processedRecordings = new Set();

// Track per-call error counts to prevent infinite "System busy" loops
const callErrorCounts = new Map();
const callLastAudioUrl = new Map();
const callUserIdentity = new Map();   // callSid -> { email, phone } from logged-in user
const MAX_ERRORS_PER_CALL = 2;

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  MY_PHONE_NUMBER,
  WEBHOOK_BASE_URL,
  SARVAM_API_KEY,
} = process.env;

function voiceResponseXml(builderFn) {
  const vr = new twilio.twiml.VoiceResponse();
  builderFn(vr);
  return vr.toString();
}

function normalizeBulbulLanguage(languageCode) {
  const supported = new Set([
    'hi-IN',
    'bn-IN',
    'mr-IN',
    'te-IN',
    'ta-IN',
    'gu-IN',
    'kn-IN',
    'ml-IN',
    'pa-IN',
    'or-IN',
    'as-IN',
    'en-IN',
  ]);
  return supported.has(languageCode) ? languageCode : 'hi-IN';
}

async function downloadTwilioRecording(recordingUrl, targetFilePath) {
  const url = `${recordingUrl}.wav`;
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    auth: {
      username: TWILIO_ACCOUNT_SID,
      password: TWILIO_AUTH_TOKEN,
    },
  });
  fs.writeFileSync(targetFilePath, response.data);
}

async function downloadTwilioRecordingWithRetry(recordingUrl, targetFilePath, retries = 4, delayMs = 1200) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      await downloadTwilioRecording(recordingUrl, targetFilePath);
      return;
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      const shouldRetry = status === 404 || status === 429 || (status >= 500 && status < 600) || !status;

      if (!shouldRetry || attempt === retries) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

async function sarvamSTT(audioPath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath));
  form.append('model', 'saaras:v3');

  const response = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
    headers: {
      ...form.getHeaders(),
      'api-subscription-key': SARVAM_API_KEY,
    },
    timeout: 120000,
  });

  const text = response.data.transcript || response.data.text || '';
  const languageCode = response.data.language_code || response.data.language || 'hi-IN';
  return { text, languageCode };
}

async function sarvamTranslate(text, sourceLanguageCode, targetLanguageCode) {
  if (!text || sourceLanguageCode === targetLanguageCode) {
    return text;
  }

  const response = await axios.post(
    'https://api.sarvam.ai/translate',
    {
      input: text,
      source_language_code: sourceLanguageCode,
      target_language_code: targetLanguageCode,
      mode: 'formal',
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY,
      },
      timeout: 60000,
    }
  );

  return response.data.translated_text || response.data.output || text;
}

async function queryPythonRag(englishQuery, userPhone, userEmail) {
  const response = await axios.post(
    'http://localhost:8000/ask',
    {
      query: englishQuery,
      language_code: 'en-IN',
      user_phone: userPhone || '',
      user_email: userEmail || '',
      source: 'voice_call',
    },
    { timeout: 120000 }
  );

  return response.data.english_answer || response.data.localized_answer || 'Please consult your doctor for support.';
}

function splitTextIntoChunks(text, maxLen = 490) {
  if (text.length <= maxLen) return [text];

  const chunks = [];
  let remaining = text;

  while (remaining.length > maxLen) {
    let splitIdx = remaining.lastIndexOf('। ', maxLen);
    if (splitIdx === -1) splitIdx = remaining.lastIndexOf('. ', maxLen);
    if (splitIdx === -1) splitIdx = remaining.lastIndexOf(', ', maxLen);
    if (splitIdx === -1) splitIdx = remaining.lastIndexOf(' ', maxLen);
    if (splitIdx === -1) splitIdx = maxLen;

    // Include the delimiter in the chunk
    const chunk = remaining.slice(0, splitIdx + 1).trim();
    if (chunk) chunks.push(chunk);
    remaining = remaining.slice(splitIdx + 1).trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

async function sarvamTTS(text, languageCode, outputPath) {
  const targetLanguage = normalizeBulbulLanguage(languageCode);
  const chunks = splitTextIntoChunks(text);
  const audioBuffers = [];

  for (const chunk of chunks) {
    const response = await axios.post(
      'https://api.sarvam.ai/text-to-speech',
      {
        inputs: [chunk],
        target_language_code: targetLanguage,
        speaker: 'priya',
        pace: 1,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: 'bulbul:v3',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': SARVAM_API_KEY,
        },
        timeout: 120000,
      }
    );

    const audioBase64 = response.data?.audios?.[0];
    if (!audioBase64) {
      throw new Error('No audio output returned from TTS');
    }
    audioBuffers.push(Buffer.from(audioBase64, 'base64'));
  }

  fs.writeFileSync(outputPath, Buffer.concat(audioBuffers));
  return outputPath;
}

function deriveSimpleClinicalData(queryEnglish, answerEnglish) {
  const lowered = queryEnglish.toLowerCase();
  const symptoms = [];
  const medicationKeywords = [];

  if (lowered.includes('headache')) symptoms.push({ name: 'headache', reported_time: '', status: 'active' });
  if (lowered.includes('nausea')) symptoms.push({ name: 'nausea', reported_time: '', status: 'active' });
  if (lowered.includes('pain')) symptoms.push({ name: 'pain', reported_time: '', status: 'active' });

  if (lowered.includes('iron')) {
    medicationKeywords.push({ name: 'iron tablet', taken: false, taken_time: '', effect_noted: '' });
  }

  return {
    symptoms,
    medications: medicationKeywords,
    relief_noted: answerEnglish.toLowerCase().includes('better'),
    relief_details: '',
    fetal_movement_status: 'No',
    severity_score: symptoms.length ? 5 : 3,
    ai_summary: answerEnglish.slice(0, 240),
  };
}

async function saveVoiceInteraction({ from, userMessageNative, userMessageEnglish, aiReplyNative, aiReplyEnglish, callSid }) {
  const clinical = deriveSimpleClinicalData(userMessageEnglish, aiReplyEnglish);

  // Check if this call is linked to a logged-in user account
  const identity = callSid ? callUserIdentity.get(callSid) : null;
  const userEmail = identity?.email || '';
  const userPhone = identity?.phone || '';

  // Determine the best filter to find/create the right document
  let filter;
  let phoneForDb;
  if (userEmail) {
    // User is logged in with email — save under their account
    phoneForDb = userPhone || `email:${userEmail}`;
    filter = { $or: [{ user_email: userEmail }, { phone_number: phoneForDb }] };
  } else if (userPhone) {
    phoneForDb = userPhone;
    filter = { phone_number: userPhone };
  } else {
    // Fallback to Twilio caller number
    phoneForDb = from || 'anonymous';
    filter = { phone_number: phoneForDb };
  }

  await HealthLog.updateOne(
    filter,
    {
      $setOnInsert: {
        phone_number: phoneForDb,
        created_at: new Date(),
      },
      $set: {
        updated_at: new Date(),
        ...(userEmail ? { user_email: userEmail } : {}),
      },
      $push: {
        history: {
          timestamp: new Date(),
          user_message_native: userMessageNative,
          user_message_english: userMessageEnglish,
          rag_reply_native: aiReplyNative,
          rag_reply_english: aiReplyEnglish,
          symptoms: clinical.symptoms,
          medications: clinical.medications,
          relief_noted: clinical.relief_noted,
          relief_details: clinical.relief_details,
          fetal_movement_status: clinical.fetal_movement_status,
          severity_score: clinical.severity_score,
          ai_summary: clinical.ai_summary,
        },
      },
    },
    { upsert: true }
  );
}

router.post('/trigger', async (req, res) => {
  try {
    console.log(`[voice] TRIGGER called. Body: ${JSON.stringify(req.body)}`);
    const { user_email, user_phone } = req.body || {};
    console.log(`[voice] TRIGGER parsed: user_email="${user_email}", user_phone="${user_phone}"`);
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const call = await client.calls.create({
      to: MY_PHONE_NUMBER,
      from: TWILIO_PHONE_NUMBER,
      url: `${WEBHOOK_BASE_URL}/api/voice/webhook`,
      method: 'POST',
    });

    // Link this callSid to the logged-in user's identity
    if (user_email || user_phone) {
      callUserIdentity.set(call.sid, { email: user_email || '', phone: user_phone || '' });
      console.log(`[voice] ✅ Linked call ${call.sid} to user: ${user_email || user_phone}`);
    } else {
      console.log(`[voice] ⚠️ No user identity provided for call ${call.sid}`);
    }

    return res.status(200).json({
      message: 'Call initiated successfully',
      callSid: call.sid,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to initiate call', error: error.message });
  }
});

router.post('/webhook', (req, res) => {
  // Reset error counter for this call when entering the main webhook
  const callSid = req.body.CallSid;
  if (callSid) {
    callErrorCounts.delete(callSid);
  }

  const xml = voiceResponseXml((vr) => {
    vr.say(
      {
        language: 'hi-IN',
        voice: 'Polly.Aditi',
      },
      'Namaste. Main Janani AI hoon. Aap kisi bhi bhaasha mein baat kar sakti hain. Kripya apni baat khatam karne ke baad hash key dabayein.'
    );

    vr.record({
      action: '/api/voice/process-ai',
      method: 'POST',
      finishOnKey: '#',
      timeout: 6,
      maxLength: 120,
      playBeep: true,
      transcribe: false,
    });

    vr.say(
      {
        language: 'hi-IN',
        voice: 'Polly.Aditi',
      },
      'Koi awaaz nahi mili. Kripya dobara try karein.'
    );

    vr.redirect('/api/voice/webhook');
  });

  res.type('text/xml');
  return res.send(xml);
});

router.post('/process-ai', (req, res) => {
  const { RecordingUrl, RecordingStatus, RecordingSid, CallSid, From, To, Direction } = req.body;

  if (RecordingStatus && RecordingStatus !== 'completed') {
    return res.status(200).send('');
  }

  if (RecordingSid && processedRecordings.has(RecordingSid)) {
    return res.status(200).send('');
  }

  if (!RecordingUrl) {
    const xml = voiceResponseXml((vr) => {
      vr.say({ language: 'hi-IN', voice: 'Polly.Aditi' }, 'Recording nahi mili. Kripya dobara koshish karein.');
      vr.redirect('/api/voice/webhook');
    });
    res.type('text/xml');
    return res.send(xml);
  }

  // Mark recording immediately to avoid duplicate processing
  if (RecordingSid) {
    processedRecordings.add(RecordingSid);
  }

  // ── Respond INSTANTLY with a hold message so the caller isn't waiting in silence ──
  const xml = voiceResponseXml((vr) => {
    vr.say(
      { language: 'hi-IN', voice: 'Polly.Aditi' },
      'Ek second, main aapka jawab dhundh rahi hoon.'
    );
    // Keep the call alive with a long pause while background processing runs
    vr.pause({ length: 30 });
    // Safety fallback — if processing somehow takes >30s, loop back
    vr.say({ language: 'hi-IN', voice: 'Polly.Aditi' }, 'Abhi thoda aur samay lagega.');
    vr.pause({ length: 30 });
    vr.redirect('/api/voice/webhook');
  });

  res.type('text/xml');
  res.send(xml);

  // ── Fire-and-forget: process the pipeline in the background ──
  processVoicePipeline({ RecordingUrl, CallSid, From, To, Direction }).catch((err) => {
    console.error(`[voice] [${CallSid}] Background pipeline fatal:`, err.message);
  });
});

async function processVoicePipeline({ RecordingUrl, CallSid, From, To, Direction }) {
  const timestamp = Date.now();
  const tmpDir = path.join(__dirname, '..', 'public', 'tts');
  const inputPath = path.join(tmpDir, `input_${timestamp}.wav`);
  const outputPath = path.join(tmpDir, `reply_${timestamp}.wav`);

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Auto-link: if no identity mapped yet, look up the user's phone in the users collection
  if (CallSid && !callUserIdentity.has(CallSid)) {
    try {
      // For outbound calls (triggered from website), From = Twilio number, To = user's phone
      // For inbound calls, From = user's phone, To = Twilio number
      const isOutbound = Direction && Direction.startsWith('outbound');
      const userPhone = isOutbound ? To : From;
      console.log(`[voice] [${CallSid}] Call direction: ${Direction || 'unknown'}, From=${From}, To=${To}, looking up user by: ${userPhone}`);

      if (userPhone) {
        const user = await User.findOne({
          $or: [
            { phoneNumber: userPhone },
            { phoneNumber: userPhone.replace('+', '') },
            { phoneNumber: userPhone.replace(/^\+91/, '') },
            { phoneNumber: userPhone.replace(/^\+1/, '') },
          ]
        });
        if (user) {
          callUserIdentity.set(CallSid, { email: user.email || '', phone: user.phoneNumber || userPhone });
          console.log(`[voice] [${CallSid}] ✅ Auto-linked to user: ${user.email || user.phoneNumber}`);
        } else {
          console.log(`[voice] [${CallSid}] No registered user found for phone ${userPhone}`);
        }
      }
    } catch (err) {
      console.log(`[voice] [${CallSid}] User lookup failed: ${err.message}`);
    }
  }

  let pipelineStep = 'init';

  try {
    pipelineStep = 'download-recording';
    console.log(`[voice] [${CallSid}] Downloading recording: ${RecordingUrl}`);
    await downloadTwilioRecordingWithRetry(RecordingUrl, inputPath);

    pipelineStep = 'sarvam-stt';
    console.log(`[voice] [${CallSid}] Running Sarvam STT...`);
    const stt = await sarvamSTT(inputPath);
    const userNativeText = (stt.text || '').trim();
    const detectedLanguage = stt.languageCode || 'hi-IN';
    console.log(`[voice] [${CallSid}] STT result: lang=${detectedLanguage}, text="${userNativeText.slice(0, 80)}"`);

    if (!userNativeText) {
      // No speech detected — redirect call back to main menu
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      await client.calls(CallSid).update({
        twiml: voiceResponseXml((vr) => {
          vr.say({ language: 'hi-IN', voice: 'Polly.Aditi' }, 'Aapki awaaz saaf nahi mili. Kripya dubara bolein.');
          vr.redirect(`${WEBHOOK_BASE_URL}/api/voice/webhook`);
        }),
      });
      return;
    }

    pipelineStep = 'translate-to-english';
    console.log(`[voice] [${CallSid}] Translating to English...`);
    const userEnglishText = await sarvamTranslate(userNativeText, detectedLanguage, 'en-IN');
    console.log(`[voice] [${CallSid}] English: "${userEnglishText.slice(0, 80)}"`);

    pipelineStep = 'python-rag';
    console.log(`[voice] [${CallSid}] Querying Python RAG...`);
    const identity = callUserIdentity.get(CallSid);
    console.log(`[voice] [${CallSid}] User identity lookup: ${identity ? JSON.stringify(identity) : 'NOT FOUND'} (map size: ${callUserIdentity.size})`);
    const aiEnglishReply = await queryPythonRag(userEnglishText, identity?.phone || From || null, identity?.email || '');
    console.log(`[voice] [${CallSid}] RAG reply: "${aiEnglishReply.slice(0, 80)}"`);

    pipelineStep = 'translate-to-native';
    console.log(`[voice] [${CallSid}] Translating reply to ${detectedLanguage}...`);
    const aiNativeReply = await sarvamTranslate(aiEnglishReply, 'en-IN', detectedLanguage);

    pipelineStep = 'sarvam-tts';
    console.log(`[voice] [${CallSid}] Running Sarvam TTS...`);
    await sarvamTTS(aiNativeReply, detectedLanguage, outputPath);

    pipelineStep = 'save-interaction';
    await saveVoiceInteraction({
      from: From,
      userMessageNative: userNativeText,
      userMessageEnglish: userEnglishText,
      aiReplyNative: aiNativeReply,
      aiReplyEnglish: aiEnglishReply,
      callSid: CallSid,
    });

    // Reset error count on success
    if (CallSid) {
      callErrorCounts.delete(CallSid);
    }

    const publicAudioUrl = `${WEBHOOK_BASE_URL}/public/tts/${path.basename(outputPath)}`;

    // Store the audio URL so the caller can replay it
    callLastAudioUrl.set(CallSid, publicAudioUrl);

    // ── Interrupt the hold message and play the AI response + menu ──
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.calls(CallSid).update({
      twiml: voiceResponseXml((vr) => {
        vr.play(publicAudioUrl);
        vr.pause({ length: 1 });
        const gather = vr.gather({
          numDigits: 1,
          action: `${WEBHOOK_BASE_URL}/api/voice/post-reply`,
          method: 'POST',
          timeout: 5,
        });
        gather.say(
          { language: 'hi-IN', voice: 'Polly.Aditi' },
          'Jawab dobara sunne ke liye 1 dabayein. Naya sawaal poochne ke liye 2 dabayein.'
        );
        // If no digit pressed, default to new query
        vr.redirect(`${WEBHOOK_BASE_URL}/api/voice/new-query`);
      }),
    });

    console.log(`[voice] [${CallSid}] ✅ Pipeline complete, playing TTS response`);
  } catch (error) {
    const errMsg = error?.response?.data
      ? `HTTP ${error.response.status}: ${JSON.stringify(error.response.data).slice(0, 200)}`
      : error.message;
    console.error(`[voice] [${CallSid}] ❌ PIPELINE FAILED at step "${pipelineStep}": ${errMsg}`);

    const errorCount = (callErrorCounts.get(CallSid) || 0) + 1;
    callErrorCounts.set(CallSid, errorCount);

    try {
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

      if (errorCount >= MAX_ERRORS_PER_CALL) {
        console.error(`[voice] [${CallSid}] ⛔ Max errors (${MAX_ERRORS_PER_CALL}) reached, hanging up`);
        callErrorCounts.delete(CallSid);

        await client.calls(CallSid).update({
          twiml: voiceResponseXml((vr) => {
            vr.say(
              { language: 'hi-IN', voice: 'Polly.Aditi' },
              'Maaf kijiye, hamara system abhi kaam nahi kar raha hai. Kripya kuch der baad dobara call karein. Dhanyavaad.'
            );
            vr.hangup();
          }),
        });
      } else {
        await client.calls(CallSid).update({
          twiml: voiceResponseXml((vr) => {
            vr.say(
              { language: 'hi-IN', voice: 'Polly.Aditi' },
              'System mein thodi samasya aa rahi hai. Kripya dobara apni baat bolein.'
            );
            vr.record({
              action: `${WEBHOOK_BASE_URL}/api/voice/process-ai`,
              method: 'POST',
              finishOnKey: '#',
              timeout: 6,
              maxLength: 120,
              playBeep: true,
              transcribe: false,
            });
            vr.say({ language: 'hi-IN', voice: 'Polly.Aditi' }, 'Koi awaaz nahi mili.');
            vr.hangup();
          }),
        });
      }
    } catch (updateErr) {
      console.error(`[voice] [${CallSid}] Failed to update call after error:`, updateErr.message);
    }
  } finally {
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
  }
}

// ── Post-reply menu: press 1 to rehear, press 2 for new query ──
router.post('/post-reply', (req, res) => {
  const { Digits, CallSid } = req.body;

  if (Digits === '1') {
    // Replay the last response
    const lastUrl = callLastAudioUrl.get(CallSid);
    const xml = voiceResponseXml((vr) => {
      if (lastUrl) {
        vr.play(lastUrl);
        vr.pause({ length: 1 });
      } else {
        vr.say({ language: 'hi-IN', voice: 'Polly.Aditi' }, 'Maaf kijiye, pichla jawab uplabdh nahi hai.');
      }
      const gather = vr.gather({
        numDigits: 1,
        action: `${WEBHOOK_BASE_URL}/api/voice/post-reply`,
        method: 'POST',
        timeout: 5,
      });
      gather.say(
        { language: 'hi-IN', voice: 'Polly.Aditi' },
        'Jawab dobara sunne ke liye 1 dabayein. Naya sawaal poochne ke liye 2 dabayein.'
      );
      vr.redirect(`${WEBHOOK_BASE_URL}/api/voice/new-query`);
    });
    res.type('text/xml');
    return res.send(xml);
  }

  // Default (press 2 or anything else) → new query
  const xml = voiceResponseXml((vr) => {
    vr.redirect(`${WEBHOOK_BASE_URL}/api/voice/new-query`);
  });
  res.type('text/xml');
  return res.send(xml);
});

// ── New query: skip the full greeting, go straight to recording ──
router.post('/new-query', (req, res) => {
  const xml = voiceResponseXml((vr) => {
    vr.say(
      { language: 'hi-IN', voice: 'Polly.Aditi' },
      'Kripya apna sawaal bolein aur phir hash key dabayein.'
    );
    vr.record({
      action: '/api/voice/process-ai',
      method: 'POST',
      finishOnKey: '#',
      timeout: 6,
      maxLength: 120,
      playBeep: true,
      transcribe: false,
    });
    vr.say(
      { language: 'hi-IN', voice: 'Polly.Aditi' },
      'Koi awaaz nahi mili. Kripya dobara try karein.'
    );
    vr.redirect('/api/voice/new-query');
  });
  res.type('text/xml');
  return res.send(xml);
});

// Clean up stale tracking entries periodically (every 10 minutes)
setInterval(() => {
  callErrorCounts.clear();
  callLastAudioUrl.clear();
}, 10 * 60 * 1000);

module.exports = router;


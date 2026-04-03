const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const twilio = require('twilio');
const HealthLog = require('../models/HealthLog');

const router = express.Router();
const processedRecordings = new Set();

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

async function queryPythonRag(englishQuery, userPhone) {
  const response = await axios.post(
    'http://localhost:8000/ask',
    {
      query: englishQuery,
      language_code: 'en-IN',
      user_phone: userPhone,
      source: 'voice_call',
    },
    { timeout: 120000 }
  );

  return response.data.english_answer || response.data.localized_answer || 'Please consult your doctor for support.';
}

async function sarvamTTS(text, languageCode, outputPath) {
  const targetLanguage = normalizeBulbulLanguage(languageCode);
  const response = await axios.post(
    'https://api.sarvam.ai/text-to-speech',
    {
      inputs: [text],
      target_language_code: targetLanguage,
      speaker: 'anushka',
      pitch: 0,
      pace: 1,
      loudness: 1,
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

  fs.writeFileSync(outputPath, Buffer.from(audioBase64, 'base64'));
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

async function saveVoiceInteraction({ from, userMessageNative, userMessageEnglish, aiReplyNative, aiReplyEnglish }) {
  const clinical = deriveSimpleClinicalData(userMessageEnglish, aiReplyEnglish);

  await HealthLog.updateOne(
    { phone_number: from || 'anonymous' },
    {
      $setOnInsert: {
        phone_number: from || 'anonymous',
        created_at: new Date(),
      },
      $set: {
        updated_at: new Date(),
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
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const call = await client.calls.create({
      to: MY_PHONE_NUMBER,
      from: TWILIO_PHONE_NUMBER,
      url: `${WEBHOOK_BASE_URL}/api/voice/webhook`,
      method: 'POST',
    });

    return res.status(200).json({
      message: 'Call initiated successfully',
      callSid: call.sid,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to initiate call', error: error.message });
  }
});

router.post('/webhook', (req, res) => {
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

router.post('/process-ai', async (req, res) => {
  const { RecordingUrl, RecordingStatus, RecordingSid, From } = req.body;

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

  const timestamp = Date.now();
  const tmpDir = path.join(__dirname, '..', 'public', 'tts');
  const inputPath = path.join(tmpDir, `input_${timestamp}.wav`);
  const outputPath = path.join(tmpDir, `reply_${timestamp}.wav`);

  try {
    await downloadTwilioRecordingWithRetry(RecordingUrl, inputPath);

    const stt = await sarvamSTT(inputPath);
    const userNativeText = (stt.text || '').trim();
    const detectedLanguage = stt.languageCode || 'hi-IN';

    if (!userNativeText) {
      const xml = voiceResponseXml((vr) => {
        vr.say({ language: 'hi-IN', voice: 'Polly.Aditi' }, 'Aapki awaaz saaf nahi mili. Kripya dubara bolkar hash key dabayein.');
        vr.redirect('/api/voice/webhook');
      });

      if (RecordingSid) {
        processedRecordings.add(RecordingSid);
      }

      res.type('text/xml');
      return res.status(200).send(xml);
    }

    const userEnglishText = await sarvamTranslate(userNativeText, detectedLanguage, 'en-IN');
    const aiEnglishReply = await queryPythonRag(userEnglishText, From || null);
    const aiNativeReply = await sarvamTranslate(aiEnglishReply, 'en-IN', detectedLanguage);

    await sarvamTTS(aiNativeReply, detectedLanguage, outputPath);

    await saveVoiceInteraction({
      from: From,
      userMessageNative: userNativeText,
      userMessageEnglish: userEnglishText,
      aiReplyNative: aiNativeReply,
      aiReplyEnglish: aiEnglishReply,
    });

    const publicAudioUrl = `${WEBHOOK_BASE_URL}/public/tts/${path.basename(outputPath)}`;

    const xml = voiceResponseXml((vr) => {
      vr.play(publicAudioUrl);
      vr.pause({ length: 1 });
      vr.redirect('/api/voice/webhook');
    });

    if (RecordingSid) {
      processedRecordings.add(RecordingSid);
    }

    res.type('text/xml');
    return res.send(xml);
  } catch (error) {
    const xml = voiceResponseXml((vr) => {
      vr.say({ language: 'hi-IN', voice: 'Polly.Aditi' }, 'System busy hai. Kripya thodi der baad dobara try karein.');
      vr.redirect('/api/voice/webhook');
    });

    res.type('text/xml');
    return res.status(200).send(xml);
  } finally {
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
  }
});

module.exports = router;

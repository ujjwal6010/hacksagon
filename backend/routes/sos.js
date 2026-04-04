const express = require('express');
const twilio = require('twilio');
const User = require('../models/User');
const Incident = require('../models/Incident');

const router = express.Router();

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  RELATIVE_PHONE_NUMBER,
  WEBHOOK_BASE_URL,
} = process.env;

// ── Shared SOS Protocol ──────────────────────────────────────────────
// Called by both manual (panic button) and AI-detected triggers.
// Actions: Voice call → SMS → Log to Incidents collection
async function executeSosProtocol({ userEmail, userPhone, patientName, triggerSource, notes, latitude, longitude }) {
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const targetPhone = RELATIVE_PHONE_NUMBER;

  if (!targetPhone) {
    console.error('[SOS] No RELATIVE_PHONE_NUMBER configured, cannot execute SOS');
    return null;
  }

  const safeName = patientName || 'the patient';

  // 1. Log incident to DB immediately
  const incident = await Incident.create({
    user_email: userEmail || '',
    user_phone: userPhone || '',
    patient_name: safeName,
    trigger_source: triggerSource,
    severity: 'CRITICAL',
    notes: notes || '',
    latitude: latitude || null,
    longitude: longitude || null,
  });

  console.log(`[SOS] 🚨 Incident created: ${incident._id} (${triggerSource}) for ${safeName}`);

  // 2. Voice call + SMS in parallel
  const voicePromise = (async () => {
    try {
      const call = await client.calls.create({
        to: targetPhone,
        from: TWILIO_PHONE_NUMBER,
        twiml: `<Response>
          <Pause length="1"/>
          <Say voice="Polly.Aditi" language="hi-IN">
            Yeh ek emergency alert hai Janani ki taraf se.
          </Say>
          <Pause length="1"/>
          <Say voice="Polly.Amy" language="en-US">
            URGENT: This is an emergency alert from Janani. ${safeName} requires immediate medical attention. Please check on them now.
          </Say>
          <Pause length="1"/>
          <Say voice="Polly.Amy" language="en-US">
            Repeating: ${safeName} needs immediate help. Please respond now.
          </Say>
        </Response>`,
      });
      console.log(`[SOS] ✅ Voice call placed: ${call.sid}`);
      return call.sid;
    } catch (err) {
      console.error(`[SOS] Voice call failed:`, err.message);
      return null;
    }
  })();

  const smsPromise = (async () => {
    try {
      console.log(`[SOS] SMS debug: lat=${latitude}, lng=${longitude}`);
      const smsBody = latitude && longitude
        ? `EMERGENCY from Janani: ${safeName} needs immediate medical attention!\n\nLocation: https://maps.google.com/?q=${latitude},${longitude}\nHospitals: https://www.google.com/maps/search/hospitals/@${latitude},${longitude},14z\n\nPlease check on them NOW.`
        : `EMERGENCY from Janani: ${safeName} needs immediate medical attention! Source: ${triggerSource}. Please check on them NOW.`;
      console.log(`[SOS] SMS body preview: ${smsBody.slice(0, 120)}...`);
      const msg = await client.messages.create({
        to: targetPhone,
        from: TWILIO_PHONE_NUMBER,
        body: smsBody,
      });
      console.log(`[SOS] ✅ SMS sent: ${msg.sid}`);
      return msg.sid;
    } catch (err) {
      console.error(`[SOS] SMS failed:`, err.message);
      return null;
    }
  })();

  await Promise.all([voicePromise, smsPromise]);

  return incident;
}

// ── POST /api/sos/trigger ─────────────────────────────────────────────
// Manual panic button trigger from the Dashboard
router.post('/trigger', async (req, res) => {
  try {
    const { user_email, latitude, longitude } = req.body;

    if (!user_email) {
      return res.status(400).json({ success: false, message: 'user_email is required' });
    }

    // Cooldown: prevent multiple SOS within 5 minutes
    const recentIncident = await Incident.findOne({
      user_email,
      resolved: false,
      created_at: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    });

    if (recentIncident) {
      return res.status(429).json({
        success: false,
        message: 'SOS already active. Please wait before triggering again.',
        incident_id: recentIncident._id,
      });
    }

    // Look up user name
    let patientName = 'the patient';
    try {
      const user = await User.findOne({ email: user_email });
      if (user?.name) patientName = user.name;
    } catch (e) { /* fallback */ }

    const incident = await executeSosProtocol({
      userEmail: user_email,
      userPhone: '',
      patientName,
      triggerSource: 'Manual-Press',
      notes: 'Triggered via Dashboard panic button',
      latitude: latitude || null,
      longitude: longitude || null,
    });

    if (!incident) {
      return res.status(500).json({ success: false, message: 'SOS failed — no relative phone configured' });
    }

    return res.status(200).json({
      success: true,
      message: 'SOS alert sent successfully',
      incident_id: incident._id,
    });
  } catch (err) {
    console.error('[SOS] Trigger error:', err.message);
    return res.status(500).json({ success: false, message: 'SOS trigger failed', error: err.message });
  }
});

// ── GET /api/sos/status/:email ────────────────────────────────────────
// Check if there is an active (unresolved) SOS for this user
router.get('/status/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const incident = await Incident.findOne({ user_email: email, resolved: false }).sort({ created_at: -1 });

    return res.status(200).json({
      active: !!incident,
      incident: incident || null,
    });
  } catch (err) {
    return res.status(500).json({ active: false, incident: null, error: err.message });
  }
});

// ── POST /api/sos/resolve/:id ─────────────────────────────────────────
// Dismiss / resolve an active SOS incident
router.post('/resolve/:id', async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolved_at: new Date(), resolved_by: req.body.resolved_by || 'dashboard' },
      { new: true }
    );

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found' });
    }

    console.log(`[SOS] ✅ Incident ${incident._id} resolved`);
    return res.status(200).json({ success: true, incident });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to resolve', error: err.message });
  }
});

// ── GET /api/sos/history/:email ───────────────────────────────────────
// Get all SOS incidents for a user (for audit trail)
router.get('/history/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const incidents = await Incident.find({ user_email: email }).sort({ created_at: -1 }).limit(50);
    return res.status(200).json({ incidents });
  } catch (err) {
    return res.status(500).json({ incidents: [], error: err.message });
  }
});

// Export both the router and the shared function (for voice.js to use)
module.exports = router;
module.exports.executeSosProtocol = executeSosProtocol;

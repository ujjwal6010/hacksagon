const express = require('express');
const twilio = require('twilio');

const router = express.Router();

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  WEBHOOK_BASE_URL,
} = process.env;

async function triggerCallbackCall(targetNumber) {
  if (!targetNumber) {
    return;
  }
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  await client.calls.create({
    to: targetNumber,
    from: TWILIO_PHONE_NUMBER,
    url: `${WEBHOOK_BASE_URL}/api/voice/webhook`,
    method: 'POST',
  });
}

router.post('/sms', async (req, res) => {
  const from = req.body.From;

  try {
    await triggerCallbackCall(from);
  } catch (error) {
    // Intentionally continue to return TwiML response even if callback trigger fails.
  }

  const twiml = new twilio.twiml.MessagingResponse();
  twiml.message('Namaste! Janani se aapko ek call aa raha hai.');

  res.type('text/xml');
  return res.send(twiml.toString());
});

router.post('/call', async (req, res) => {
  const from = req.body.From;
  const vr = new twilio.twiml.VoiceResponse();

  vr.say(
    {
      language: 'hi-IN',
      voice: 'Polly.Aditi',
    },
    'Aapka missed call mil gaya hai.'
  );
  vr.hangup();

  res.type('text/xml');
  res.send(vr.toString());

  try {
    await triggerCallbackCall(from);
  } catch (error) {
    // No-op: caller already received synchronous response.
  }
});

module.exports = router;

const cron = require('node-cron');
const axios = require('axios');
const HealthLog = require('../models/HealthLog');

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function extractRange(periodType) {
  const now = new Date();
  const end = new Date(now);
  let start = new Date(now);

  if (periodType === 'daily') {
    start.setDate(start.getDate() - 1);
  } else if (periodType === 'weekly') {
    start.setDate(start.getDate() - 7);
  } else {
    start.setMonth(start.getMonth() - 1);
  }

  return { start, end };
}

function buildTimeline(interactions) {
  return interactions
    .map((item) => {
      const date = new Date(item.timestamp).toISOString();
      const symptoms = (item.symptoms || []).map((s) => `${s.name}:${s.status}`).join(', ') || 'none';
      const medications = (item.medications || [])
        .map((m) => `${m.name}:${m.taken ? 'taken' : 'skipped'}`)
        .join(', ') || 'none';
      return `[${date}] severity=${item.severity_score || 0}; symptoms=${symptoms}; medications=${medications}; relief=${
        item.relief_noted ? 'yes' : 'no'
      }`;
    })
    .join('\n');
}

async function generateSummaryWithGroq(periodType, interactions) {
  const timeline = buildTimeline(interactions);
  const prompt = `You are generating a ${periodType} maternal health summary. Return strict JSON with keys: summary_english, summary_native, symptoms_timeline, medications_timeline, doctor_notes.\n\nTimeline:\n${timeline}`;

  const response = await axios.post(
    GROQ_URL,
    {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 120000,
    }
  );

  const raw = response.data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(raw);
}

async function generateAndPersist(periodType) {
  const { start, end } = extractRange(periodType);

  const logs = await HealthLog.find({
    history: {
      $elemMatch: {
        timestamp: { $gte: start, $lte: end },
      },
    },
  });

  for (const log of logs) {
    const interactions = (log.history || []).filter(
      (item) => new Date(item.timestamp) >= start && new Date(item.timestamp) <= end
    );

    if (!interactions.length) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const avgSeverity =
      interactions.reduce((sum, item) => sum + (item.severity_score || 0), 0) / interactions.length;

    let summary;
    try {
      summary = await generateSummaryWithGroq(periodType, interactions);
    } catch (error) {
      summary = {
        summary_english: `${periodType} summary generated with fallback mode.`,
        summary_native: `${periodType} summary generated with fallback mode.`,
        symptoms_timeline: 'Unable to generate symptom timeline from AI service.',
        medications_timeline: 'Unable to generate medication timeline from AI service.',
        doctor_notes: 'AI model unavailable at generation time.',
      };
    }

    log.summaries.push({
      type: periodType,
      period_start: start,
      period_end: end,
      generated_at: new Date(),
      summary_english: summary.summary_english || '',
      summary_native: summary.summary_native || '',
      total_interactions: interactions.length,
      symptoms_timeline: summary.symptoms_timeline || '',
      medications_timeline: summary.medications_timeline || '',
      avg_severity: Number(avgSeverity.toFixed(2)),
      doctor_notes: summary.doctor_notes || '',
    });

    log.updated_at = new Date();
    await log.save();
  }
}

function initSummaryCron() {
  cron.schedule(
    '0 21 * * *',
    async () => {
      await generateAndPersist('daily');
    },
    { timezone: 'Asia/Kolkata' }
  );

  cron.schedule(
    '0 21 * * 0',
    async () => {
      await generateAndPersist('weekly');
    },
    { timezone: 'Asia/Kolkata' }
  );

  cron.schedule(
    '0 0 1 * *',
    async () => {
      await generateAndPersist('monthly');
    },
    { timezone: 'Asia/Kolkata' }
  );
}

module.exports = { initSummaryCron };

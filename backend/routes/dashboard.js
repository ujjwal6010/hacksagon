const express = require('express');
const HealthLog = require('../models/HealthLog');

const router = express.Router();

async function findUserLog(identifier) {
  let log = await HealthLog.findOne({ phone_number: identifier });
  if (!log) {
    log = await HealthLog.findOne({ user_email: identifier });
  }
  return log;
}

function buildSymptoms(history) {
  const map = new Map();

  history.forEach((interaction) => {
    (interaction.symptoms || []).forEach((symptom) => {
      const key = symptom.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: symptom.name,
          firstReported: interaction.timestamp,
          lastReported: interaction.timestamp,
          status: symptom.status || 'active',
          occurrences: 0,
          timeline: [],
        });
      }
      const existing = map.get(key);
      existing.occurrences += 1;
      if (interaction.timestamp < existing.firstReported) {
        existing.firstReported = interaction.timestamp;
      }
      if (interaction.timestamp > existing.lastReported) {
        existing.lastReported = interaction.timestamp;
      }
      existing.status = symptom.status || existing.status;
      existing.timeline.push({
        date: interaction.timestamp,
        status: symptom.status || 'active',
        reportedTime: symptom.reported_time || '',
      });
    });
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.lastReported) - new Date(a.lastReported));
}

function buildMedications(history) {
  const map = new Map();

  history.forEach((interaction) => {
    (interaction.medications || []).forEach((medication) => {
      const key = medication.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name: medication.name,
          timesTaken: 0,
          timesSkipped: 0,
          lastMentioned: interaction.timestamp,
          effects: [],
        });
      }

      const existing = map.get(key);
      if (medication.taken) {
        existing.timesTaken += 1;
      } else {
        existing.timesSkipped += 1;
      }
      if (interaction.timestamp > existing.lastMentioned) {
        existing.lastMentioned = interaction.timestamp;
      }
      if (medication.effect_noted) {
        existing.effects.push(medication.effect_noted);
      }
    });
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.lastMentioned) - new Date(a.lastMentioned));
}

function buildRecentInteractions(history) {
  return [...history]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20)
    .map((item) => ({
      id: item._id,
      timestamp: item.timestamp,
      userMessage: item.user_message_native || item.user_message_english || '',
      aiReply: item.rag_reply_native || item.rag_reply_english || '',
      severity: item.severity_score || 0,
      symptoms: (item.symptoms || []).map((s) => ({ name: s.name, status: s.status })),
      medications: item.medications || [],
      reliefNoted: item.relief_noted || false,
      reliefDetails: item.relief_details || '',
      fetalMovement: item.fetal_movement_status || 'No',
      aiSummary: item.ai_summary || '',
    }));
}

router.get('/:identifier', async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier);
    const log = await findUserLog(identifier);

    if (!log) {
      return res.status(200).json({
        found: false,
        message: 'No health records found for this user.',
        data: {
          symptoms: [],
          medications: [],
          recentInteractions: [],
          summaries: [],
          stats: { totalInteractions: 0, avgSeverity: 0, reliefRate: 0 },
        },
      });
    }

    const history = log.history || [];
    const totalInteractions = history.length;
    const avgSeverity =
      totalInteractions > 0
        ? Number((history.reduce((sum, h) => sum + (h.severity_score || 0), 0) / totalInteractions).toFixed(1))
        : 0;
    const reliefCount = history.filter((h) => h.relief_noted).length;
    const reliefRate = totalInteractions > 0 ? Math.round((reliefCount / totalInteractions) * 100) : 0;
    const lastActivity =
      totalInteractions > 0
        ? history.reduce((last, h) => (h.timestamp > last ? h.timestamp : last), history[0].timestamp)
        : null;

    return res.status(200).json({
      found: true,
      data: {
        symptoms: buildSymptoms(history),
        medications: buildMedications(history),
        recentInteractions: buildRecentInteractions(history),
        summaries: log.summaries || [],
        stats: {
          totalInteractions,
          avgSeverity,
          reliefRate,
          lastActivity,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load dashboard', error: error.message });
  }
});

router.get('/:identifier/summary/doctor', async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier);
    const log = await findUserLog(identifier);
    const history = (log && log.history) || [];

    if (!history.length) {
      return res.status(200).json({ summary: 'No patient interactions recorded yet.' });
    }

    const highSeverityEvents = history.filter((item) => (item.severity_score || 0) >= 7);
    const activeSymptoms = [
      ...new Set(
        history
          .flatMap((item) => item.symptoms || [])
          .filter((symptom) => symptom.status === 'active')
          .map((symptom) => symptom.name)
      ),
    ];
    const skippedMedications = [
      ...new Set(
        history
          .flatMap((item) => item.medications || [])
          .filter((medication) => !medication.taken)
          .map((medication) => medication.name)
      ),
    ];
    const fetalMovementConcern = history.some((item) => item.fetal_movement_status === 'No');

    const redFlags = [];
    if (highSeverityEvents.length) {
      redFlags.push(`${highSeverityEvents.length} high-severity events recorded`);
    }
    if (activeSymptoms.length) {
      redFlags.push(`Multiple active symptoms: ${activeSymptoms.join(', ')}`);
    }
    if (fetalMovementConcern) {
      redFlags.push('Patient frequently reports no fetal movement');
    }
    if (skippedMedications.length) {
      redFlags.push(`Medications not taken: ${skippedMedications.join(', ')}`);
    }

    const recentHighSeverity = highSeverityEvents
      .slice(-5)
      .reverse()
      .map((item) => ({
        date: item.timestamp,
        severity: item.severity_score,
        summary: item.ai_summary || 'No summary available',
        symptoms: (item.symptoms || []).map((symptom) => symptom.name),
      }));

    const doctorNotes = history
      .slice(-10)
      .reverse()
      .map((item) => {
        const stamp = new Date(item.timestamp).toLocaleDateString('en-IN');
        const text = item.ai_summary || item.user_message_english || item.user_message_native || '';
        return `[${stamp}] ${text}`;
      })
      .join('\n');

    return res.status(200).json({
      summary: {
        generatedAt: new Date().toISOString(),
        totalInteractions: history.length,
        redFlags,
        activeSymptoms,
        skippedMedications,
        fetalMovementConcern,
        highSeverityEvents: highSeverityEvents.length,
        recentHighSeverity,
        doctorNotes,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate doctor summary', error: error.message });
  }
});

router.get('/:identifier/summary/family', async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier);
    const log = await findUserLog(identifier);
    const history = (log && log.history) || [];

    if (!history.length) {
      return res.status(200).json({ summary: 'No health records available yet. Ask her to talk to Janani!' });
    }

    const averageSeverity = Number(
      (history.reduce((sum, item) => sum + (item.severity_score || 0), 0) / history.length).toFixed(1)
    );

    let overallHealth = 'Needs Immediate Care';
    let message = 'Please ensure she sees a doctor soon.';

    if (averageSeverity <= 3) {
      overallHealth = 'Good';
      message = 'She is doing well! Her recent interactions show healthy patterns. Keep supporting her.';
    } else if (averageSeverity <= 6) {
      overallHealth = 'Needs Attention';
      message = 'She has mentioned some symptoms recently. Please check in with her and monitor closely.';
    }

    const recentSymptoms = history
      .slice(-10)
      .flatMap((item) => item.symptoms || [])
      .map((symptom) => `${symptom.name} (${symptom.status || 'active'})`);

    const medicationsTaken = [
      ...new Set(
        history
          .flatMap((item) => item.medications || [])
          .filter((medication) => medication.taken)
          .map((medication) => medication.name)
      ),
    ];

    const reliefOccurrences = history.filter((item) => item.relief_noted).length;

    return res.status(200).json({
      summary: {
        generatedAt: new Date().toISOString(),
        overallHealth,
        averageSeverity,
        recentSymptoms,
        medicationsTaken,
        reliefOccurrences,
        totalRecentChats: history.length,
        message,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate family summary', error: error.message });
  }
});

router.get('/:identifier/history', async (req, res) => {
  try {
    const identifier = decodeURIComponent(req.params.identifier);
    const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(Number.parseInt(req.query.limit || '20', 10), 1);

    const log = await findUserLog(identifier);
    const history = (log && log.history) || [];
    const sorted = [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = sorted.length;
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;
    const paginated = sorted.slice(start, start + limit);

    return res.status(200).json({
      history: paginated.map((item) => ({
        id: item._id,
        timestamp: item.timestamp,
        userMessageNative: item.user_message_native || '',
        userMessageEnglish: item.user_message_english || '',
        aiReplyNative: item.rag_reply_native || '',
        aiReplyEnglish: item.rag_reply_english || '',
        symptoms: item.symptoms || [],
        medications: item.medications || [],
        reliefNoted: item.relief_noted || false,
        reliefDetails: item.relief_details || '',
        fetalMovement: item.fetal_movement_status || 'No',
        severity: item.severity_score || 0,
        aiSummary: item.ai_summary || '',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load history', error: error.message });
  }
});

module.exports = router;

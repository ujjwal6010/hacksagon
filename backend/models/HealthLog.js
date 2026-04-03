const mongoose = require('mongoose');

const symptomEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    reported_time: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'relieved', 'recurring'],
      default: 'active',
    },
  },
  { _id: false }
);

const medicationEntrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    taken: { type: Boolean, default: false },
    taken_time: { type: String, default: '' },
    effect_noted: { type: String, default: '' },
  },
  { _id: false }
);

const interactionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  user_message_native: { type: String, default: '' },
  user_message_english: { type: String, default: '' },
  rag_reply_native: { type: String, default: '' },
  rag_reply_english: { type: String, default: '' },
  symptoms: { type: [symptomEntrySchema], default: [] },
  medications: { type: [medicationEntrySchema], default: [] },
  relief_noted: { type: Boolean, default: false },
  relief_details: { type: String, default: '' },
  fetal_movement_status: {
    type: String,
    enum: ['Yes', 'No', 'Invalid'],
    default: 'No',
  },
  severity_score: { type: Number, default: 0 },
  ai_summary: { type: String, default: '' },
});

const summarySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  period_start: { type: Date, required: true },
  period_end: { type: Date, required: true },
  generated_at: { type: Date, default: Date.now },
  summary_english: { type: String, default: '' },
  summary_native: { type: String, default: '' },
  total_interactions: { type: Number, default: 0 },
  symptoms_timeline: { type: String, default: '' },
  medications_timeline: { type: String, default: '' },
  avg_severity: { type: Number, default: 0 },
  doctor_notes: { type: String, default: '' },
});

const healthLogSchema = new mongoose.Schema({
  phone_number: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user_email: { type: String, default: '' },
  history: { type: [interactionSchema], default: [] },
  summaries: { type: [summarySchema], default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

healthLogSchema.pre('save', function onSave(next) {
  this.updated_at = new Date();
  next();
});

module.exports = mongoose.model('HealthLog', healthLogSchema);

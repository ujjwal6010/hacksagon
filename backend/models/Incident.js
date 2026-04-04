const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  user_email: { type: String, default: '' },
  user_phone: { type: String, default: '' },
  patient_name: { type: String, default: 'Unknown' },
  trigger_source: {
    type: String,
    enum: ['AI-Detected', 'Manual-Press'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['RED', 'CRITICAL'],
    default: 'CRITICAL',
  },
  notes: { type: String, default: '' },
  resolved: { type: Boolean, default: false },
  resolved_at: { type: Date, default: null },
  resolved_by: { type: String, default: '' },
  created_at: { type: Date, default: Date.now },
});

incidentSchema.index({ user_email: 1, resolved: 1 });
incidentSchema.index({ created_at: -1 });

module.exports = mongoose.model('Incident', incidentSchema);

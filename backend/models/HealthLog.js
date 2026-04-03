import mongoose from 'mongoose';

/**
 * Interaction Schema (Nested)
 * Represents one conversation turn in a session
 */
const interactionSchema = new mongoose.Schema(
  {
    interactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ['website_text', 'website_voice', 'voice_call', 'support_chat'],
      required: true,
    },
    language: {
      detected: String,
      requested: String,
      response: String,
    },
    userInput: {
      nativeText: String,
      englishText: String,
      rawTranscript: String,
    },
    aiOutput: {
      englishText: String,
      nativeText: String,
      model: String,
      retrievalUsed: Boolean,
      retrievedSourcesCount: Number,
    },
    clinical: {
      symptoms: [
        {
          name: String,
          status: {
            type: String,
            enum: ['active', 'relieved', 'recurring', 'unknown'],
          },
          reportedTime: String,
        },
      ],
      medications: [
        {
          name: String,
          taken: Boolean,
          takenTime: String,
          effectNoted: String,
        },
      ],
      reliefNoted: Boolean,
      reliefDetails: String,
      fetalMovementStatus: {
        type: String,
        enum: ['yes', 'no', 'unknown'],
      },
      severityScore: {
        type: Number,
        min: 0,
        max: 10,
      },
      aiSummary: String,
    },
    meta: {
      channelSessionId: String,
      twilioCallSid: String,
      twilioRecordingSid: String,
      processingStatus: {
        type: String,
        enum: ['success', 'partial', 'failed'],
        default: 'success',
      },
      errorMessage: String,
    },
  },
  { _id: true }
);

/**
 * GeneratedSummary Schema (Nested)
 * Represents AI-generated periodic summary of interactions
 */
const generatedSummarySchema = new mongoose.Schema(
  {
    summaryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    periodStart: Date,
    periodEnd: Date,
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    totalInteractions: Number,
    avgSeverity: Number,
    summaryEnglish: String,
    summaryNative: String,
    symptomsTimeline: String,
    medicationsTimeline: String,
    doctorNotes: String,
  },
  { _id: true }
);

/**
 * HealthLog Schema (Main)
 * 
 * Normalized design:
 * - One document per patient/user
 * - Contains full interaction history
 * - Contains generated summaries
 * - Single unique identity: phoneNumber > email > userId
 */
const healthLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    name: String,
    phoneNumber: {
      type: String,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      sparse: true,
      index: true,
      lowercase: true,
    },
    preferredLanguage: {
      type: String,
      default: 'hi-IN',
    },
    history: [interactionSchema],
    summaries: [generatedSummarySchema],
  },
  {
    timestamps: true,
  }
);

/**
 * Compound index for unique identity lookups
 * Priority: phoneNumber > email > userId
 */
healthLogSchema.index({ phoneNumber: 1, email: 1, userId: 1 }, { sparse: true });

/**
 * Pre-validation hook: Ensure at least one stable identifier
 */
healthLogSchema.pre('validate', function (next) {
  if (!this.phoneNumber && !this.email && !this.userId) {
    this.invalidate(
      'phoneNumber',
      'At least one of phoneNumber, email, or userId is required'
    );
  }
  next();
});

const HealthLog = mongoose.model('HealthLog', healthLogSchema);

export default HealthLog;

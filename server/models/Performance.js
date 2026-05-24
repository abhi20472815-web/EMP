const mongoose = require('mongoose');

const PerformanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewPeriod: {
      type: String,
      required: [true, 'Please specify the review period'],
      trim: true,
    },
    ratings: {
      qualityOfWork: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      communication: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      teamwork: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
      dependability: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
      },
    },
    feedback: {
      strengths: {
        type: String,
        default: '',
      },
      growthAreas: {
        type: String,
        default: '',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Performance', PerformanceSchema);

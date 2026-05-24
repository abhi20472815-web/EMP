const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['Casual', 'Sick', 'Annual', 'Unpaid'],
      required: [true, 'Please specify the type of leave'],
    },
    startDate: {
      type: Date,
      required: [true, 'Please specify the start date'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please specify the end date'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    reason: {
      type: String,
      required: [true, 'Please add a reason for the leave'],
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comment: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Leave', LeaveSchema);

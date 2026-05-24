const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a notice title'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please add notice content'],
      trim: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetRoles: {
      type: String,
      enum: ['All', 'Manager', 'Employee'],
      default: 'All',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notice', NoticeSchema);

const Notice = require('../models/Notice');

// @desc    Create a notice announcement
// @route   POST /api/notices
// @access  Private (Admin Only)
exports.createNotice = async (req, res) => {
  try {
    const { title, content, targetRoles } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Please provide a title and content' });
    }

    const notice = await Notice.create({
      title,
      content,
      targetRoles: targetRoles || 'All',
      authorId: req.user.id,
    });

    // Populate author
    const populatedNotice = await Notice.findById(notice._id).populate('authorId', 'name designation role');

    res.status(201).json({
      success: true,
      data: populatedNotice,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all notice announcements
// @route   GET /api/notices
// @access  Private
exports.getNotices = async (req, res) => {
  try {
    let query = {};

    // Filter by targeting roles unless admin
    if (req.user.role === 'employee') {
      query.targetRoles = { $in: ['All', 'Employee'] };
    } else if (req.user.role === 'manager') {
      query.targetRoles = { $in: ['All', 'Manager'] };
    }

    const notices = await Notice.find(query)
      .populate('authorId', 'name designation role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete notice announcement
// @route   DELETE /api/notices/:id
// @access  Private (Admin Only)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);

    if (!notice) {
      return res.status(404).json({ success: false, error: 'Notice announcement not found' });
    }

    await Notice.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: 'Notice announcement deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

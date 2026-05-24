const Performance = require('../models/Performance');
const User = require('../models/User');

// @desc    Create a new performance review
// @route   POST /api/performance
// @access  Private (Admin & Manager Only)
exports.createPerformanceReview = async (req, res) => {
  try {
    const { employeeId, reviewPeriod, ratings, feedback } = req.body;

    if (!employeeId || !reviewPeriod || !ratings) {
      return res.status(400).json({ success: false, error: 'Please provide employeeId, reviewPeriod and ratings' });
    }

    const { qualityOfWork, communication, teamwork, dependability } = ratings;

    if (
      qualityOfWork === undefined ||
      communication === undefined ||
      teamwork === undefined ||
      dependability === undefined
    ) {
      return res.status(400).json({ success: false, error: 'Please provide scores for all rating categories' });
    }

    // Verify employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee to review not found' });
    }

    // Managers cannot review themselves
    if (employeeId === req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You cannot write a performance review for yourself' });
    }

    const review = await Performance.create({
      employeeId,
      reviewerId: req.user.id,
      reviewPeriod,
      ratings: {
        qualityOfWork,
        communication,
        teamwork,
        dependability,
      },
      feedback: feedback || { strengths: '', growthAreas: '' },
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get performance reviews
// @route   GET /api/performance
// @access  Private
exports.getPerformanceReviews = async (req, res) => {
  try {
    let query = {};

    // Filter by role
    if (req.user.role === 'employee') {
      query.employeeId = req.user.id;
    }

    // If query contains specific employee ID, and user is manager/admin, filter by it
    if (req.query.employeeId && req.user.role !== 'employee') {
      query.employeeId = req.query.employeeId;
    }

    const reviews = await Performance.find(query)
      .populate('employeeId', 'name email department designation role')
      .populate('reviewerId', 'name designation role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get performance metrics for an employee
// @route   GET /api/performance/stats/:employeeId
// @access  Private
exports.getEmployeePerformanceStats = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    // Scope check: Employees can only check their own stats
    if (req.user.role === 'employee' && req.user.id !== employeeId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const reviews = await Performance.find({ employeeId });

    if (reviews.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          averageRatings: {
            qualityOfWork: 0,
            communication: 0,
            teamwork: 0,
            dependability: 0,
            overall: 0,
          },
          totalReviews: 0,
        },
      });
    }

    let sums = { qualityOfWork: 0, communication: 0, teamwork: 0, dependability: 0 };
    reviews.forEach((r) => {
      sums.qualityOfWork += r.ratings.qualityOfWork;
      sums.communication += r.ratings.communication;
      sums.teamwork += r.ratings.teamwork;
      sums.dependability += r.ratings.dependability;
    });

    const count = reviews.length;
    const averageRatings = {
      qualityOfWork: parseFloat((sums.qualityOfWork / count).toFixed(1)),
      communication: parseFloat((sums.communication / count).toFixed(1)),
      teamwork: parseFloat((sums.teamwork / count).toFixed(1)),
      dependability: parseFloat((sums.dependability / count).toFixed(1)),
    };

    // Overall average
    const overall = parseFloat(
      (
        (averageRatings.qualityOfWork +
          averageRatings.communication +
          averageRatings.teamwork +
          averageRatings.dependability) /
        4
      ).toFixed(1)
    );

    averageRatings.overall = overall;

    res.status(200).json({
      success: true,
      data: {
        averageRatings,
        totalReviews: count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

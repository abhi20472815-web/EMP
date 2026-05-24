const express = require('express');
const router = express.Router();
const {
  createNotice,
  getNotices,
  deleteNotice,
} = require('../controllers/noticeController');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .post(protect, authorize('admin'), createNotice)
  .get(protect, getNotices);

router.delete('/:id', protect, authorize('admin'), deleteNotice);

module.exports = router;

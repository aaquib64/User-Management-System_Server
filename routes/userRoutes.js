const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/userController');

// My profile routes (must be before /:id to avoid conflict)
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);

// Admin & Manager
router.get('/', protect, restrictTo('admin', 'manager'), getUsers);
router.get('/:id', protect, restrictTo('admin', 'manager'), getUserById);

// Admin only
router.post('/', protect, restrictTo('admin'), createUser);
router.put('/:id', protect, restrictTo('admin', 'manager'), updateUser);
router.delete('/:id', protect, restrictTo('admin'), deleteUser);

module.exports = router;
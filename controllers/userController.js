const User = require('../models/userModel');

// @route   GET /api/users
// @access  Admin, Manager
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/users/:id
// @access  Admin, Manager
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Manager cannot view admin users
    if (req.user.role === 'manager' && user.role === 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/users
// @access  Admin only
const createUser = async (req, res) => {
  const { name, email, password, role, status } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: 'Email already exists' });

    const user = await User.create({
      name,
      email,
      password: password || 'Password@123', // default password
      role: role || 'user',
      status: status || 'active',
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/users/:id
// @access  Admin, Manager (manager cannot edit admins)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Manager cannot edit admin users
    if (req.user.role === 'manager' && user.role === 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Manager cannot change roles
    if (req.user.role === 'manager' && req.body.role) {
      return res.status(403).json({ message: 'Manager cannot change roles' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.status = req.body.status || user.status;
    user.updatedBy = req.user._id;

    // Only admin can change role
    if (req.user.role === 'admin' && req.body.role) {
      user.role = req.body.role;
    }

    // Update password only if provided
    if (req.body.password) {
      user.password = req.body.password; // pre-save hook re-hashes it
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      status: updated.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   DELETE /api/users/:id  (soft delete)
// @access  Admin only
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    user.status = 'inactive';
    user.updatedBy = req.user._id;
    await user.save();

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/users/me
// @access  Any logged-in user
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PUT /api/users/me
// @access  Any logged-in user
const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');

    user.name = req.body.name || user.name;
    user.updatedBy = req.user._id;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updated = await user.save();
    res.json({
      _id: updated._id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      status: updated.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
};
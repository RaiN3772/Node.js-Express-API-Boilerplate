const express = require('express');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const userRoutes = require('./user');

const router = express.Router();

// Define routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);

module.exports = router;

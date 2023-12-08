const express = require('express');
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const userRoutes = require('./user');
const brandRoutes = require('./brand');
const carRoutes = require('./car');

const router = express.Router();

// Define routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);
router.use('/brand', brandRoutes);
router.use('/car', carRoutes);

module.exports = router;

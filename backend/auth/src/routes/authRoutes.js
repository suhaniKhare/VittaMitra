import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public auth endpoints
router.post('/signup', registerUser);
router.post('/login', loginUser);

// Protected endpoints
router.get('/me', protect, getMe);

export default router;

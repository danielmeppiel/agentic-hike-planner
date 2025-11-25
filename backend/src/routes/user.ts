import { Router } from 'express';
import { UserController, AuthController } from '../controllers/UserController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const userController = new UserController();
const authController = new AuthController();

// Authentication routes (no auth required) - these can be called via /user/ OR /auth/
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// User profile routes (authentication required)
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.get('/statistics', authenticateToken, userController.getStatistics);
router.put('/preferences', authenticateToken, userController.updatePreferences);

export default router;
import { Router } from 'express';
import { AuthController } from '../controllers/UserController';

const router = Router();
const authController = new AuthController();

// Authentication routes (no auth required)
router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

export default router;

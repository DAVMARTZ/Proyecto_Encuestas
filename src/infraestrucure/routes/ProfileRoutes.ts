import { Router } from 'express';
import { ProfileAdapter } from '../adapter/ProfileAdapter';
import { ProfileApplication } from '../../application/ProfileApplication';
import { ProfileController } from '../controller/ProfileController';

import { authenticateToken } from '../web/authMiddleware'; 

const router = Router();

// Inyección de dependencias
const adapter = new ProfileAdapter();
const application = new ProfileApplication(adapter);
const controller = new ProfileController(application);

// endpoints protegidos usando authenticateToken
router.get('/', authenticateToken, controller.getProfile);
router.put('/', authenticateToken, controller.updateProfile);

export default router;
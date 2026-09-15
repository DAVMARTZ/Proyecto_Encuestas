import { Router } from 'express';
import { SurveyAdapter } from '../adapter/SurveyAdapter';
import { SurveyApplication } from '../../application/SurveyApplication';
import { SurveyController } from '../controller/SurveyController';
// import { authMiddleware } from '../middlewares/auth.middleware'; // Descomenta cuando apliques tu middleware JWT

const router = Router();

// Wiring hexagonal limpio
const surveyAdapter = new SurveyAdapter();
const surveyApplication = new SurveyApplication(surveyAdapter);
const surveyController = new SurveyController(surveyApplication);

// Endpoints
router.post('/surveys', /* authMiddleware, */ surveyController.create);
router.get('/surveys', surveyController.getAll);
router.get('/surveys/:id', surveyController.getById);
router.put('/surveys/:id', /* authMiddleware, */ surveyController.update);
router.patch('/surveys/:id/publish', /* authMiddleware, */ surveyController.publish);
router.patch('/surveys/:id/deactivate', /* authMiddleware, */ surveyController.deactivate);

export const SurveyRoutes = router;
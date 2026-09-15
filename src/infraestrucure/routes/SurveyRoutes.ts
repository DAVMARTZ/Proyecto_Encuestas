import { Router } from 'express';
import { SurveyAdapter } from '../adapter/SurveyAdapter';
import { SurveyApplication } from '../../application/SurveyApplication';
import { SurveyController } from '../controller/SurveyController';
import { authenticateToken } from '../web/authMiddleware';

const router = Router();

// ynyección de dependencias manual
const adapter = new SurveyAdapter();
const application = new SurveyApplication(adapter);
const controller = new SurveyController(application);

//requieren que el usuario esté logueado
router.post('/', authenticateToken, controller.createSurvey);
router.get('/', authenticateToken, controller.getSurveys);
router.get('/:id', authenticateToken, controller.getSurveyDetail);
router.put('/:id', authenticateToken, controller.updateSurvey);

// Endpoints específicos para cambiar el estado de la encuesta
router.patch('/:id/publish', authenticateToken, controller.publishSurvey);
router.patch('/:id/deactivate', authenticateToken, controller.deactivateSurvey);

export default router;
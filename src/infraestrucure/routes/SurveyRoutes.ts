import { Router } from 'express';
import { SurveyAdapter } from '../adapter/SurveyAdapter';
import { SurveyApplication } from '../../application/SurveyApplication';
import { SurveyController } from '../controller/SurveyController';
import { validateSurveyPayload } from '../util/surveyValidator';

const router = Router();

const surveyAdapter = new SurveyAdapter();
const surveyApplication = new SurveyApplication(surveyAdapter);
const surveyController = new SurveyController(surveyApplication);

// Endpoints
router.post('/surveys', validateSurveyPayload, surveyController.create);
router.get('/surveys', surveyController.getAll);
router.get('/surveys/:id', surveyController.getById);
router.put('/surveys/:id', validateSurveyPayload, surveyController.update);

// Publicación y cambios de estado
router.patch('/surveys/:id/publish', surveyController.publish);
router.patch('/surveys/:id/activate', surveyController.activate);

// Inactivación lógica (cero borrado físico)
router.patch('/surveys/:id/deactivate', surveyController.deactivate);
router.delete('/surveys/:id', surveyController.delete);

export const SurveyRoutes = router;
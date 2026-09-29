import { Router } from 'express';
import { SurveyResponseAdapter } from '../adapter/SurveyResponseAdapter';
import { SurveyResponseApplication } from '../../application/SurveyResponseApplication';
import { SurveyResponseController } from '../controller/SurveyResponseController';
import { validateSurveyResponse } from '../util/surveyResponseValidator';
const router = Router();

const responseAdapter = new SurveyResponseAdapter();
const responseApplication = new SurveyResponseApplication(responseAdapter);
const responseController = new SurveyResponseController(responseApplication);

// Endpoints 
router.post(
  '/surveys/:surveyId/responses',
  validateSurveyResponse, 
  responseController.submit
);

router.get(
  '/surveys/:surveyId/responses',
  responseController.getResults
);


// ------------------------
router.get(
  '/surveys/:surveyId/estudiantes',
  responseController.getStudentsBySurvey
);

router.get(
  '/surveys/:surveyId/estudiantes/:studentId/respuestas',
  responseController.getStudentAnswers
);




export const SurveyResponseRoutes = router;
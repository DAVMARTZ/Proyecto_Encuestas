import { Router } from "express";
import { SurveyResponseAdapter } from "../adapter/SurveyResponseAdapter";
import { SurveyAdapter } from "../adapter/SurveyAdapter";
import { SurveyResponseApplication } from "../../application/SurveyResponseApplication";
import { SurveyResponseController } from "../controller/SurveyResponseController";
import { authenticateToken } from "../web/authMiddleware";

const router = Router();

const responseAdapter = new SurveyResponseAdapter();
const surveyAdapter = new SurveyAdapter();
const responseApplication = new SurveyResponseApplication(responseAdapter, surveyAdapter);
const responseController = new SurveyResponseController(responseApplication);

// ==========================================
// RUTAS DE RESPUESTAS A ENCUESTAS
// ==========================================

// Enviar respuestas a una encuesta (Público o con token opcional)
router.post(
  "/surveys/:surveyId/responses",
  responseController.submit
);

// Consultar todas las respuestas detalladas de una encuesta (Protegido)
router.get(
  "/surveys/:surveyId/responses",
  authenticateToken,
  responseController.getResults
);

// Consultar estadísticas y métricas agregadas de una encuesta (Protegido)
router.get(
  "/surveys/:surveyId/statistics",
  authenticateToken,
  responseController.getStatistics
);

export const SurveyResponseRoutes = router;

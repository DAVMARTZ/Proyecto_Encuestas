import { Router } from "express";
import { SurveyResponseAdapter } from "../adapter/SurveyResponseAdapter";
import { SurveyAdapter } from "../adapter/SurveyAdapter";
import { SurveyResponseApplication } from "../../application/SurveyResponseApplication";
import { SurveyResponseController } from "../controller/SurveyResponseController";
import { authenticateToken } from "../web/authMiddleware";
import { authorizeRole } from "../web/roleMiddleware";
import { ROLES } from "../../domain/Role";

const router = Router();

const responseAdapter = new SurveyResponseAdapter();
const surveyAdapter = new SurveyAdapter();
const responseApplication = new SurveyResponseApplication(responseAdapter, surveyAdapter);
const responseController = new SurveyResponseController(responseApplication);

// ==========================================
// RUTAS DE RESPUESTAS A ENCUESTAS
// ==========================================

// Enviar respuestas a una encuesta (Requiere sesión, una vez por usuario)
router.post(
  "/surveys/:surveyId/responses",
  authenticateToken,
  responseController.submit
);

// Consultar las encuestas respondidas por el usuario de la sesión
router.get("/users/me/responses", authenticateToken, responseController.getMine);

// Consultar todas las respuestas detalladas de una encuesta (Solo Admin)
router.get(
  "/surveys/:surveyId/responses",
  authenticateToken,
  authorizeRole(ROLES.ADMIN),
  responseController.getResults
);

// Consultar estadísticas y métricas agregadas de una encuesta (Solo Admin)
router.get(
  "/surveys/:surveyId/statistics",
  authenticateToken,
  authorizeRole(ROLES.ADMIN),
  responseController.getStatistics
);

export const SurveyResponseRoutes = router;

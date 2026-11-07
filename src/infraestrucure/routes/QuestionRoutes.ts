import { Router } from "express";
import { QuestionAdapter } from "../adapter/QuestionAdapter";
import { QuestionApplication } from "../../application/QuestionApplication";
import { QuestionController } from "../controller/QuestionController";
import { authenticateToken } from "../web/authMiddleware";

const router = Router();

const questionAdapter = new QuestionAdapter();
const questionApp = new QuestionApplication(questionAdapter);
const questionController = new QuestionController(questionApp);

// ==========================================
// RUTAS DE PREGUNTAS
// ==========================================

// Obtener todas las preguntas de una encuesta específica
router.get("/surveys/:surveyId/questions", questionController.getBySurveyId);

// Obtener una pregunta por su ID
router.get("/questions/:id", questionController.getById);

// Crear una pregunta asociada a una encuesta (Protegido con JWT)
router.post(
  "/surveys/:surveyId/questions",
  authenticateToken,
  questionController.create
);

// Crear una pregunta enviando surveyId en el body (Protegido con JWT)
router.post(
  "/questions",
  authenticateToken,
  questionController.create
);

// Actualizar una pregunta (Protegido con JWT)
router.put(
  "/questions/:id",
  authenticateToken,
  questionController.update
);

// Inactivar lógicamente una pregunta (PATCH)
router.patch("/questions/:id/deactivate", authenticateToken, questionController.deactivate);

// Reactivar lógicamente una pregunta (PATCH)
router.patch("/questions/:id/activate", authenticateToken, questionController.activate);

// Baja lógica vía DELETE sin borrado físico
router.delete("/questions/:id", authenticateToken, questionController.delete);

export const QuestionRoutes = router;

import { Router } from "express";
import { QuestionAdapter } from "../adapter/QuestionAdapter";
import { SurveyAdapter } from "../adapter/SurveyAdapter";
import { QuestionApplication } from "../../application/QuestionApplication";
import { QuestionController } from "../controller/QuestionController";
import { authenticateToken } from "../web/authMiddleware";
import { authorizeRole } from "../web/roleMiddleware";
import { ROLES } from "../../domain/Role";

const router = Router();

const questionAdapter = new QuestionAdapter();
const surveyAdapter = new SurveyAdapter();
const questionApp = new QuestionApplication(questionAdapter, surveyAdapter);
const questionController = new QuestionController(questionApp);
const onlyAdmin = authorizeRole(ROLES.ADMIN);

// ==========================================
// RUTAS DE PREGUNTAS (Solo Admin)
// Quien responde recibe las preguntas en GET /surveys/:id
// ==========================================

// Obtener todas las preguntas de una encuesta específica
router.get("/surveys/:surveyId/questions", authenticateToken, onlyAdmin, questionController.getBySurveyId);

// Obtener una pregunta por su ID
router.get("/questions/:id", authenticateToken, onlyAdmin, questionController.getById);

// Crear una pregunta asociada a una encuesta en borrador
router.post("/surveys/:surveyId/questions", authenticateToken, onlyAdmin, questionController.create);

// Crear una pregunta enviando surveyId en el body
router.post("/questions", authenticateToken, onlyAdmin, questionController.create);

// Actualizar una pregunta
router.put("/questions/:id", authenticateToken, onlyAdmin, questionController.update);

// Inactivar lógicamente una pregunta (PATCH)
router.patch("/questions/:id/deactivate", authenticateToken, onlyAdmin, questionController.deactivate);

// Reactivar lógicamente una pregunta (PATCH)
router.patch("/questions/:id/activate", authenticateToken, onlyAdmin, questionController.activate);

// Baja lógica vía DELETE sin borrado físico
router.delete("/questions/:id", authenticateToken, onlyAdmin, questionController.delete);

export const QuestionRoutes = router;

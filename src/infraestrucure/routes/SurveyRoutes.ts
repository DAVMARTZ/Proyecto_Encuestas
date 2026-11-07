import { Router } from "express";
import { SurveyAdapter } from "../adapter/SurveyAdapter";
import { SurveyApplication } from "../../application/SurveyApplication";
import { SurveyController } from "../controller/SurveyController";
import { authenticateToken } from "../web/authMiddleware";

const router = Router();

const surveyAdapter = new SurveyAdapter();
const surveyApplication = new SurveyApplication(surveyAdapter);
const surveyController = new SurveyController(surveyApplication);

// ==========================================
// RUTAS DE ENCUESTAS
// ==========================================

// Obtener todas las encuestas (Público o filtrado)
router.get("/surveys", surveyController.getAll);

// Obtener una encuesta por ID (con sus preguntas y opciones para responder)
router.get("/surveys/:id", surveyController.getById);

// Obtener encuestas creadas por un usuario específico (Protegido)
router.get("/users/:userId/surveys", authenticateToken, surveyController.getByUserId);

// Crear encuesta (Protegido con JWT)
router.post("/surveys", authenticateToken, surveyController.create);

// Actualizar encuesta (Protegido con JWT)
router.put("/surveys/:id", authenticateToken, surveyController.update);

// Publicar / activar encuesta (Protegido con JWT)
router.patch("/surveys/:id/publish", authenticateToken, surveyController.publish);
router.patch("/surveys/:id/activate", authenticateToken, surveyController.activate);

// Inactivar lógicamente encuesta (Protegido con JWT)
router.patch("/surveys/:id/deactivate", authenticateToken, surveyController.deactivate);

// Baja lógica vía DELETE (Protegido con JWT)
router.delete("/surveys/:id", authenticateToken, surveyController.delete);

export const SurveyRoutes = router;

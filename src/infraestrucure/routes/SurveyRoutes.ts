import { Router } from "express";
import { SurveyAdapter } from "../adapter/SurveyAdapter";
import { SurveyResponseAdapter } from "../adapter/SurveyResponseAdapter";
import { SurveyApplication } from "../../application/SurveyApplication";
import { SurveyController } from "../controller/SurveyController";
import { authenticateToken } from "../web/authMiddleware";
import { authorizeRole } from "../web/roleMiddleware";
import { ROLES } from "../../domain/Role";

const router = Router();

const surveyAdapter = new SurveyAdapter();
const surveyApplication = new SurveyApplication(surveyAdapter, new SurveyResponseAdapter());
const surveyController = new SurveyController(surveyApplication);
const onlyAdmin = authorizeRole(ROLES.ADMIN);

// ==========================================
// RUTAS DE ENCUESTAS
// ==========================================

// Obtener las encuestas publicadas (Admin puede incluir borradores e inactivas con ?includeInactive=true)
router.get("/surveys", authenticateToken, surveyController.getAll);

// Obtener una encuesta por ID (con sus preguntas y opciones para responder)
router.get("/surveys/:id", authenticateToken, surveyController.getById);

// Obtener encuestas creadas por un usuario específico (Solo Admin)
router.get("/users/:userId/surveys", authenticateToken, onlyAdmin, surveyController.getByUserId);

// Crear encuesta en estado borrador (Solo Admin)
router.post("/surveys", authenticateToken, onlyAdmin, surveyController.create);

// Actualizar encuesta en borrador (Solo Admin)
router.put("/surveys/:id", authenticateToken, onlyAdmin, surveyController.update);

// Publicar un borrador (Solo Admin)
router.patch("/surveys/:id/publish", authenticateToken, onlyAdmin, surveyController.publish);

// Devolver a borrador una encuesta publicada sin respuestas (Solo Admin)
router.patch("/surveys/:id/draft", authenticateToken, onlyAdmin, surveyController.returnToDraft);

// Reactivar una encuesta inactiva (Solo Admin)
router.patch("/surveys/:id/activate", authenticateToken, onlyAdmin, surveyController.activate);

// Inactivar lógicamente encuesta (Solo Admin)
router.patch("/surveys/:id/deactivate", authenticateToken, onlyAdmin, surveyController.deactivate);

// Baja lógica vía DELETE (Solo Admin)
router.delete("/surveys/:id", authenticateToken, onlyAdmin, surveyController.delete);

export const SurveyRoutes = router;

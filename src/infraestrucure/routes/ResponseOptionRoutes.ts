import { Router } from "express";
import { ResponseOptionAdapter } from "../adapter/ResponseOptionAdapter";
import { QuestionAdapter } from "../adapter/QuestionAdapter";
import { SurveyAdapter } from "../adapter/SurveyAdapter";
import { ResponseOptionApplication } from "../../application/ResponseOptionApplication";
import { ResponseOptionController } from "../controller/ResponseOptionController";
import { authenticateToken } from "../web/authMiddleware";
import { authorizeRole } from "../web/roleMiddleware";
import { ROLES } from "../../domain/Role";

const router = Router();

const optionAdapter = new ResponseOptionAdapter();
const questionAdapter = new QuestionAdapter();
const surveyAdapter = new SurveyAdapter();
const optionApp = new ResponseOptionApplication(optionAdapter, questionAdapter, surveyAdapter);
const optionController = new ResponseOptionController(optionApp);
const onlyAdmin = authorizeRole(ROLES.ADMIN);

// ==========================================
// RUTAS DE OPCIONES DE RESPUESTA (Solo Admin)
// Quien responde recibe las opciones en GET /surveys/:id
// ==========================================

// Obtener todas las opciones de una pregunta
router.get("/questions/:questionId/options", authenticateToken, onlyAdmin, optionController.getByQuestionId);

// Obtener una opción por su ID
router.get("/options/:id", authenticateToken, onlyAdmin, optionController.getById);

// Crear una opción para una pregunta de una encuesta en borrador
router.post("/questions/:questionId/options", authenticateToken, onlyAdmin, optionController.create);

// Crear una opción con questionId en el body
router.post("/options", authenticateToken, onlyAdmin, optionController.create);

// Actualizar una opción
router.put("/options/:id", authenticateToken, onlyAdmin, optionController.update);

// Inactivar lógicamente una opción (PATCH)
router.patch("/options/:id/deactivate", authenticateToken, onlyAdmin, optionController.deactivate);

// Reactivar lógicamente una opción (PATCH)
router.patch("/options/:id/activate", authenticateToken, onlyAdmin, optionController.activate);

// Baja lógica vía DELETE sin borrado físico
router.delete("/options/:id", authenticateToken, onlyAdmin, optionController.delete);

export const ResponseOptionRoutes = router;

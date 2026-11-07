import { Router } from "express";
import { ResponseOptionAdapter } from "../adapter/ResponseOptionAdapter";
import { ResponseOptionApplication } from "../../application/ResponseOptionApplication";
import { ResponseOptionController } from "../controller/ResponseOptionController";
import { authenticateToken } from "../web/authMiddleware";

const router = Router();

const optionAdapter = new ResponseOptionAdapter();
const optionApp = new ResponseOptionApplication(optionAdapter);
const optionController = new ResponseOptionController(optionApp);

// ==========================================
// RUTAS DE OPCIONES DE RESPUESTA
// ==========================================

// Obtener todas las opciones de una pregunta
router.get("/questions/:questionId/options", optionController.getByQuestionId);

// Obtener una opción por su ID
router.get("/options/:id", optionController.getById);

// Crear una opción para una pregunta (Protegido con JWT)
router.post(
  "/questions/:questionId/options",
  authenticateToken,
  optionController.create
);

// Crear una opción con questionId en el body (Protegido con JWT)
router.post(
  "/options",
  authenticateToken,
  optionController.create
);

// Actualizar una opción (Protegido con JWT)
router.put(
  "/options/:id",
  authenticateToken,
  optionController.update
);

// Inactivar lógicamente una opción (PATCH)
router.patch("/options/:id/deactivate", authenticateToken, optionController.deactivate);

// Reactivar lógicamente una opción (PATCH)
router.patch("/options/:id/activate", authenticateToken, optionController.activate);

// Baja lógica vía DELETE sin borrado físico
router.delete("/options/:id", authenticateToken, optionController.delete);

export const ResponseOptionRoutes = router;

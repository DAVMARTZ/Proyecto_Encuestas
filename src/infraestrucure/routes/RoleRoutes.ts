import { Router } from "express";
import { RoleAdapter } from "../adapter/RoleAdapter";
import { RoleApplication } from "../../application/RoleApplication";
import { RoleController } from "../controller/RoleController";
import { authenticateToken } from "../web/authMiddleware";
import { authorizeRole } from "../web/roleMiddleware";
import { ROLES } from "../../domain/Role";

const router = Router();

// Inyección de dependencias (Arquitectura Hexagonal)
const roleAdapter = new RoleAdapter();
const roleApp = new RoleApplication(roleAdapter);
const roleController = new RoleController(roleApp);

// ==========================================
// RUTAS DE ROLES
// ==========================================

// Listar todos los roles
router.get("/roles", authenticateToken, authorizeRole(ROLES.ADMIN), roleController.getAll);

// Obtener un rol por su ID
router.get("/roles/:id", authenticateToken, authorizeRole(ROLES.ADMIN), roleController.getById);

// Crear un nuevo rol (Protegido: Solo ADMIN roleId 1)
router.post("/roles", authenticateToken, authorizeRole(ROLES.ADMIN), roleController.create);

// Actualizar un rol (Protegido: Solo ADMIN roleId 1)
router.put("/roles/:id", authenticateToken, authorizeRole(ROLES.ADMIN), roleController.update);

// Inactivar lógicamente un rol (PATCH) (Protegido: Solo ADMIN)
router.patch("/roles/:id/deactivate", authenticateToken, authorizeRole(ROLES.ADMIN), roleController.deactivate);

// Reactivar lógicamente un rol (PATCH) (Protegido: Solo ADMIN)
router.patch("/roles/:id/activate", authenticateToken, authorizeRole(ROLES.ADMIN), roleController.activate);

// Baja lógica vía DELETE sin borrado físico (Protegido: Solo ADMIN)
router.delete("/roles/:id", authenticateToken, authorizeRole(ROLES.ADMIN), roleController.delete);

export default router;

import { Router } from "express";
import { UserAdapter } from "../adapter/UserAdapter";
import { UserApplication } from "../../application/UserApplication";
import { UserController } from "../controller/UserController";
import { authenticateToken } from "../web/authMiddleware";
import { authorizeRole, authorizeSelfOrAdmin } from "../web/roleMiddleware";
import { ROLES } from "../../domain/Role";

const router = Router();

const userAdapter = new UserAdapter();
const userApp = new UserApplication(userAdapter);
const userController = new UserController(userApp);

// ==========================================
// RUTAS PROTEGIDAS (Requieren Token de Firebase)
// El inicio de sesión y el registro se hacen en Firebase
// ==========================================

// Listar todos los usuarios (Solo Admin)
router.get("/users", authenticateToken, authorizeRole(ROLES.ADMIN), userController.getAllUsers);

// Consultar usuario por email (Solo Admin)
router.get("/users/email/:email", authenticateToken, authorizeRole(ROLES.ADMIN), userController.getUserByEmail);

// Consultar perfil del usuario autenticado
router.get("/users/me", authenticateToken, userController.getProfile);

// Consultar usuario por ID (El propio usuario o Admin)
router.get("/users/:id", authenticateToken, authorizeSelfOrAdmin, userController.getUserById);

// Actualizar usuario (completo) (El propio usuario o Admin)
router.put("/users/:id", authenticateToken, authorizeSelfOrAdmin, userController.updateUser);

// Actualizar usuario (parcial) (El propio usuario o Admin)
router.patch("/users/:id", authenticateToken, authorizeSelfOrAdmin, userController.updateUser);

// Inactivación lógica (baja lógica vía DELETE sin borrado físico - Solo Admin roleId 1)
router.delete("/users/:id", authenticateToken, authorizeRole(ROLES.ADMIN), userController.deleteUser);

// Inactivación lógica explícita (Solo Admin roleId 1)
router.patch("/users/:id/deactivate", authenticateToken, authorizeRole(ROLES.ADMIN), userController.deactivateUser);

// Reactivación lógica explícita (Solo Admin roleId 1)
router.patch("/users/:id/activate", authenticateToken, authorizeRole(ROLES.ADMIN), userController.activateUser);

export default router;
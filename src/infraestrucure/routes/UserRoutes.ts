import { Router } from "express";
import { UserAdapter } from "../adapter/UserAdapter";
import { UserApplication } from "../../application/UserApplication";
import { UserController } from "../controller/UserController";
import { authenticateToken } from "../web/authMiddleware";
import { authorizeRole } from "../web/roleMiddleware";

const router = Router();

const userAdapter = new UserAdapter();
const userApp = new UserApplication(userAdapter);
const userController = new UserController(userApp);

// ==========================================
// RUTAS PÚBLICAS
// ==========================================

// Registro de usuario
router.post("/users", async (req, res) => {
    try {
        await userController.createUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la creacion de usuario", error });
    }
});

// Inicio de sesión (Login)
router.post("/users/login", async (req, res) => {
    try {
        await userController.login(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la autenticación de usuario", error });
    }
});

// ==========================================
// RUTAS PROTEGIDAS (Requieren Token JWT)
// ==========================================

// Listar todos los usuarios
router.get("/users", authenticateToken, async (req, res) => {
    try {
        await userController.getAllUsers(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la consulta de datos", error });
    }
});

// Consultar usuario por email
router.get("/users/email/:email", authenticateToken, async (req, res) => {
    try {
        await userController.getUserByEmail(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la consulta de datos", error });
    }
});

// Consultar usuario por ID
router.get("/users/:id", authenticateToken, async (req, res) => {
    try {
        await userController.getUserById(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al consultar usuario", error });
    }
});

// Actualizar usuario (completo)
router.put("/users/:id", authenticateToken, async (req, res) => {
    try {
        await userController.updateUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario", error });
    }
});

// Actualizar usuario (parcial)
router.patch("/users/:id", authenticateToken, async (req, res) => {
    try {
        await userController.updateUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario", error });
    }
});

// Inactivación lógica (baja lógica vía DELETE sin borrado físico - Solo Admin roleId 1)
router.delete("/users/:id", authenticateToken, authorizeRole(1), async (req, res) => {
    try {
        await userController.deleteUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al inactivar usuario", error });
    }
});

// Inactivación lógica explícita (Solo Admin roleId 1)
router.patch("/users/:id/deactivate", authenticateToken, authorizeRole(1), async (req, res) => {
    try {
        await userController.deactivateUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al inactivar usuario", error });
    }
});

// Reactivación lógica explícita (Solo Admin roleId 1)
router.patch("/users/:id/activate", authenticateToken, authorizeRole(1), async (req, res) => {
    try {
        await userController.activateUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al reactivar usuario", error });
    }
});

export default router;
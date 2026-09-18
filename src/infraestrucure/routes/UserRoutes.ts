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

// Rutas públicas
router.post("/login", async (req, res) => {
    await userController.login(req, res);
});

router.post("/register", async (req, res) => {
    try {
        await userController.register(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en el registro de usuario", error });
    }
});

// Rutas protegidas (gestión de usuarios)
router.post("/users", authenticateToken, authorizeRole("administrador", "admin"), async (req, res) => {
    try {
        await userController.createUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la creacion de usuario", error });
    }
});

router.get("/users", authenticateToken, authorizeRole("administrador", "admin"), async (req, res) => {
    try {
        await userController.getAllUsers(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la consulta de datos", error });
    }
});

router.get("/users/email/:email", authenticateToken, async (req, res) => {
    try {
        await userController.getUserByEmail(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la consulta de datos", error });
    }
});

router.get("/users/:id", authenticateToken, async (req, res) => {
    try {
        await userController.getUserById(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al consultar usuario", error });
    }
});

router.put("/users/:id", authenticateToken, authorizeRole("administrador", "admin"), async (req, res) => {
    try {
        await userController.UpdateUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario", error });
    }
});

router.delete("/users/:id", authenticateToken, authorizeRole("administrador", "admin"), async (req, res) => {
    try {
        await userController.deleteUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar usuario", error });
    }
});

export default router;
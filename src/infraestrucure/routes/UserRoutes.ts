import { Router } from "express";
import { UserAdapter } from "../adapter/UserAdapter";
import { UserApplication } from "../../application/UserApplication";
import { UserController } from "../controller/UserController";

const router = Router();

const userAdapter = new UserAdapter();
const userApp = new UserApplication(userAdapter);
const userController = new UserController(userApp);

router.post("/users", async (req, res) => {
    try {
        await userController.createUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la creacion de usuario", error });
    }
});

router.get("/users", async (req, res) => {
    try {
        await userController.getAllUsers(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la consulta de datos", error });
    }
});

router.get("/users/email/:email", async (req, res) => {
    try {
        await userController.getUserByEmail(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error en la consulta de datos", error });
    }
});

router.get("/users/:id", async (req, res) => {
    try {
        await userController.getUserById(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al consultar usuario", error });
    }
});

router.put("/users/:id", async (req, res) => {
    try {
        await userController.updateUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario", error });
    }
});

router.patch("/users/:id", async (req, res) => {
    try {
        await userController.updateUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar usuario", error });
    }
});

// Inactivación lógica (baja lógica vía DELETE sin borrado físico)
router.delete("/users/:id", async (req, res) => {
    try {
        await userController.deleteUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al inactivar usuario", error });
    }
});

// Inactivación lógica explícita
router.patch("/users/:id/deactivate", async (req, res) => {
    try {
        await userController.deactivateUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al inactivar usuario", error });
    }
});

// Reactivación lógica explícita
router.patch("/users/:id/activate", async (req, res) => {
    try {
        await userController.activateUser(req, res);
    } catch (error) {
        res.status(500).json({ message: "Error al reactivar usuario", error });
    }
});

export default router;
import { Router } from "express";
import { UserAdapter } from "../adapter/UserAdapter";
import { UserApplication } from "../../application/UserApplication"
import { UserController } from "../controller/UserController";

const router = Router();

const userAdapter = new UserAdapter();
const userApp = new UserApplication(userAdapter);
const userController = new UserController(userApp);

router.post("/users", async (req,res)=>{
    try {
        await userController.createUser(req,res);
    } catch (error) {
        res.status(500).json({message: "Error en la creacion de usuario", error});
    }
});

router.get("/users", async (req,res)=>{
    try {
        await userController.getAllUsers(req,res);
    } catch (error) {
        res.status(500).json({message: "Error en la consulta de datos", error});
    }
});

router.get("/users/email/:email", async (req,res)=>{
    try {
        await userController.getUserByEmail(req,res);
    } catch (error) {
        res.status(500).json({message: "Error en la consulta de datos", error});
    }
});

export default router;
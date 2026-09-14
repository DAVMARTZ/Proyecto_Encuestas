import type { Request, Response } from "express";
import { loadUserData } from "../util/user_validation";
import { loadUpdateUserData } from "../util/user-update-validation";
import { loadEmail } from "../util/email-validation";
import { UserApplication } from "../../application/UserApplication";
import { User } from "../../domain/User"

export class UserController {

    private app : UserApplication;

    constructor(application: UserApplication){
        this.app = application;
    }

    async login(req: Request, res: Response): Promise<string | Response>{
        try {
            const {email, password} = req.body;
            if(!email || !password)
            {
                return res.status(400).json({
                    error: "Email y contraseña requeridos"
                });
            }
            const token = await this.app.login(email, password);
            return res.status(200).json({message: "Login exitoso", token});
        } catch (error) {
            return res.status(401).json({error: "Credenciales invalidas" });
        }
    }

    async createUser(req: Request, res: Response): Promise<Response>{
        try {
            //Validar los datos de entrada
            const {name, email, password, status, role} = loadUserData(req.body);

            const user: Omit<User, "id"> = {name, email, password, status, role};
            const userId = await this.app.createUser(user);

            return res
            .status(201)
            .json({message: "Usuario creado con exito", userId})
        } catch (error) {
            if (error instanceof Error){
                return res
                .status(500)
                .json({
                    error: "Error interno del servidor",
                    details: error.message,
                });                            
            }
            return res.status(500).json({error: "Error interno del servidor"});
        }
    }

    async register(req: Request, res: Response): Promise<Response> {
        try {
            const { name, email, password, status, role } = loadUserData(req.body);

            const user: Omit<User, "id"> = { name, email, password, status, role };
            const { userId, token, role: assignedRole } = await this.app.register(user);

            return res
                .status(201)
                .json({ message: "Registro exitoso", userId, token, role: assignedRole });
        } catch (error) {
            if (error instanceof Error) {
                return res
                    .status(400)
                    .json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async UpdateUser(req: Request, res: Response): Promise<Response>{
        try {
            const id = Number(req.params.id);
            if(Number.isNaN(id)){
                return res.status(400).json({error: 'Id Invalido'});
            }

            const dataLoad = loadUpdateUserData(req.body);
            const updated = await this.app.updateUser(id, dataLoad);

            if (!updated) {
                return res.status(404).json({error: "Usuario no encontrado sin cambios"});
            }
            return res.status(200).json({message: "Usuario actualizado con exito"});

        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({error: error.message});
            }
            return res.status(500).json({error: "Error interno del servidor" });
        }
    }

    async getUserById(req: Request, res: Response): Promise<Response>{
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) return res.status(400).json({error: "ID invalido"});
            
            const user = await this.app.getUserById(id);
            if(!user)
                return res.status(404).json({error: "Usuario no encontrado"});

            return res.status(200).json(user);
        } catch (error) {
            if (error instanceof Error){
                return res.status(500).json({error: "Error interno del servidor", details: error.message});
            }
            return res.status(500).json({error: "Error interno del servidor"});
        }

    }
    
    async getUserByEmail(req: Request, res: Response): Promise<Response> {
        try {
            const {email} = loadEmail(req.params);
            const user = await this.app.getUserByEmail(email);

            if(!user){
                return res.status(404).json({message: "Usuario no encontrado"});
            }

            return res.status(200).json(user);
        } catch (error) {
            if(error instanceof Error) {
                return res.status(400).json({error: error.message});
            }
            return res.status(500).json({
                error: "Error interno del servidor",
                details: error instanceof Error ? error.message: "Error desconocido",
            });
        }
    }

    async getAllUsers(req: Request, res: Response): Promise<Response> {
        try {
            const users = await this.app.getAllUsers();
            return res.status(200).json(users);
        } catch (error) {
            return res.status(500).json({message: "Error al obtener usuarios", error});            
        }
    }

    async deleteUser(req: Request, res: Response): Promise<Response> {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) return res.status(400).json({error: "ID invalido"});

            const deleted = await this.app.deleteUser(id);
            if(!deleted)
                return res.status(404).json({error: "Usuario no encontrdo"});

            return res.status(200).json({message: "Usuario eliminado con exito"});
        } catch (error) {
            if (error instanceof Error){
                return res.status(500).json({
                    error: "Error interno del servidor",
                    details: error.message,
                });
            }
            return res.status(500).json({error: "Error interno del servidor"});
        }
    }

}


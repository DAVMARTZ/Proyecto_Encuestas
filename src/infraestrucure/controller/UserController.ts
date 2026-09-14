import { Request, Response } from "express";
import { loadUserData } from "../util/user_validation";
import type { promises } from "dns";
import { loadUpdateUserData } from "../util/user-update-validation";
import { loadEmail } from "../util/email-validation";

export class userController {
    private app : UserApplication;

    constructor(application: UserApplication){
        this.app = application;
    }

    async createUser(req: Request, res: Response): Promise<Response>{
        try {
            //Validar los datos de entrada
            const {name, email, password, status} = loadUserData(req.body);

            const user: Omit<User, "id"> = {name, email, password, status};
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

    async UpdateUser(req: Request, res: Response): Promise<Response>{
        try {
            const id = Number(req.params.id);
            if(Number.isNaN(id)){
                return res.status(400).json({error: 'Id Invalido'});
            }

            const dataLoad = loadUpdateUserData(req.body);
            const updated = await this.app.UpdateUser(id, dataLoad);

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


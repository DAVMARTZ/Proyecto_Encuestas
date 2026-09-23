import { Request, Response } from "express";
import { loadUserData } from "../util/user_validation";
import { loadUpdateUserData } from "../util/user-update-validation";
import { loadEmail } from "../util/email-validation";
import { UserApplication } from "../../application/UserApplication";
import { User } from "../../domain/User";

export class UserController {
    private app: UserApplication;

    constructor(application: UserApplication) {
        this.app = application;
    }

    async createUser(req: Request, res: Response): Promise<Response> {
        try {
            const data = loadUserData(req.body);
            const user: Omit<User, "id"> = {
                ...data,
                status: data.status !== undefined ? Number(data.status) : (data.statusUser !== undefined ? Number(data.statusUser) : 1)
            };
            const userId = await this.app.createUser(user);

            return res
                .status(201)
                .json({ message: "Usuario creado con éxito", userId });
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes("ya está registrado")) {
                    return res.status(409).json({ error: error.message });
                }
                return res
                    .status(400)
                    .json({
                        error: "Error en validación o datos",
                        details: error.message,
                    });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async updateUser(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
            }

            const dataLoad = loadUpdateUserData(req.body);
            const updated = await this.app.updateUser(id, dataLoad as Partial<User>);

            if (!updated) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            return res.status(200).json({ message: "Usuario actualizado con éxito" });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getUserById(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
            }

            const user = await this.app.getUserById(id);
            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json(user);
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({ error: "Error interno del servidor", details: error.message });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async getUserByEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email } = loadEmail(req.params);
            const user = await this.app.getUserByEmail(email);

            if (!user) {
                return res.status(404).json({ message: "Usuario no encontrado" });
            }

            return res.status(200).json(user);
        } catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({
                error: "Error interno del servidor",
                details: error instanceof Error ? error.message : "Error desconocido",
            });
        }
    }

    async getAllUsers(req: Request, res: Response): Promise<Response> {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const users = await this.app.getAllUsers(includeInactive);
            return res.status(200).json(users);
        } catch (error) {
            return res.status(500).json({ message: "Error al obtener usuarios", error });
        }
    }

    /**
     * Inactivación lógica (baja lógica vía DELETE sin borrado físico)
     */
    async deleteUser(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
            }

            const deactivated = await this.app.deleteUser(id);
            if (!deactivated) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json({ message: "Usuario dado de baja lógicamente con éxito (status: 0 - INACTIVO)" });
        } catch (error) {
            if (error instanceof Error) {
                return res.status(500).json({
                    error: "Error interno del servidor",
                    details: error.message,
                });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    /**
     * Endpoint explícito para inactivar lógicamente
     */
    async deactivateUser(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
            }

            const deactivated = await this.app.deactivateUser(id);
            if (!deactivated) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json({ message: "Usuario inactivado correctamente (status: 0 - INACTIVO)" });
        } catch (error) {
            return res.status(500).json({ error: "Error al inactivar usuario" });
        }
    }

    /**
     * Endpoint explícito para reactivar lógicamente
     */
    async activateUser(req: Request, res: Response): Promise<Response> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
            }

            const activated = await this.app.activateUser(id);
            if (!activated) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json({ message: "Usuario reactivado correctamente (status: 1 - ACTIVO)" });
        } catch (error) {
            return res.status(500).json({ error: "Error al reactivar usuario" });
        }
    }
}

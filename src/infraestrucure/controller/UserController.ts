import { Request, Response } from "express";
import { loadUpdateUserData } from "../util/user-update-validation";
import { loadEmail } from "../util/email-validation";
import { UserApplication } from "../../application/UserApplication";
import { User } from "../../domain/User";
import { isAdmin } from "../web/roleMiddleware";
import { parseId, sendError } from "../util/http-utils";

export class UserController {
    private app: UserApplication;

    constructor(application: UserApplication) {
        this.app = application;
    }

    updateUser = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = parseId(req.params.id);
            if (id === null) {
                return res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
            }

            const dataLoad = loadUpdateUserData(req.body);

            // Solo un administrador puede cambiar rol o estado, y nunca los suyos
            if (!isAdmin(req) || (req as any).user.userId === id) {
                delete dataLoad.roleId;
                delete dataLoad.status;
            }

            const updated = await this.app.updateUser(id, dataLoad as Partial<User>);

            if (!updated) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }
            return res.status(200).json({ message: "Usuario actualizado con éxito" });
        } catch (error) {
            return sendError(res, error);
        }
    };

    getProfile = async (req: Request, res: Response): Promise<Response> => {
        try {
            const authUser = (req as any).user;
            const id = authUser?.userId || authUser?.id;
            if (!id) {
                return res.status(401).json({ error: "Usuario no autenticado" });
            }

            const user = await this.app.getUserById(Number(id));
            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json(user);
        } catch (error) {
            return sendError(res, error);
        }
    };

    getUserById = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = parseId(req.params.id);
            if (id === null) {
                return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
            }

            const user = await this.app.getUserById(id);
            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json(user);
        } catch (error) {
            return sendError(res, error);
        }
    };

    getUserByEmail = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { email } = loadEmail(req.params);
            const user = await this.app.getUserByEmail(email);

            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json(user);
        } catch (error) {
            return sendError(res, error);
        }
    };

    getAllUsers = async (req: Request, res: Response): Promise<Response> => {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const users = await this.app.getAllUsers(includeInactive);

            return res.status(200).json(users);
        } catch (error) {
            return sendError(res, error);
        }
    };

    /**
     * Inactivación lógica (baja lógica vía DELETE sin borrado físico)
     */
    deleteUser = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = parseId(req.params.id);
            if (id === null) {
                return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
            }

            if ((req as any).user.userId === id) {
                return res.status(400).json({ error: "No puedes inactivar tu propia cuenta" });
            }

            const deactivated = await this.app.deleteUser(id);
            if (!deactivated) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json({ message: "Usuario dado de baja lógicamente con éxito (status: 0 - INACTIVO)" });
        } catch (error) {
            return sendError(res, error);
        }
    };

    /**
     * Endpoint explícito para inactivar lógicamente
     */
    deactivateUser = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = parseId(req.params.id);
            if (id === null) {
                return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
            }

            if ((req as any).user.userId === id) {
                return res.status(400).json({ error: "No puedes inactivar tu propia cuenta" });
            }

            const deactivated = await this.app.deactivateUser(id);
            if (!deactivated) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json({ message: "Usuario inactivado correctamente (status: 0 - INACTIVO)" });
        } catch (error) {
            return sendError(res, error);
        }
    };

    /**
     * Endpoint explícito para reactivar lógicamente
     */
    activateUser = async (req: Request, res: Response): Promise<Response> => {
        try {
            const id = parseId(req.params.id);
            if (id === null) {
                return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
            }

            const activated = await this.app.activateUser(id);
            if (!activated) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            return res.status(200).json({ message: "Usuario reactivado correctamente (status: 1 - ACTIVO)" });
        } catch (error) {
            return sendError(res, error);
        }
    };
}

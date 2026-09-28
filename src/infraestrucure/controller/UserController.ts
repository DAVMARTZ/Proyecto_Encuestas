import { Request, Response } from "express";
import { loadUserData } from "../util/user_validation";
import { loadUpdateUserData } from "../util/user-update-validation";
import { loadEmail } from "../util/email-validation";
import { UserApplication } from "../../application/UserApplication";
import { User } from "../../domain/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class UserController {
    private app: UserApplication;

    constructor(application: UserApplication) {
        this.app = application;
    }

    async loginUser(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body;

            // 1. Validar que vengan los campos requeridos
            if (!email || !password) {
                return res.status(400).json({ error: "El correo y la contraseña son obligatorios" });
            }

            // 2. Traer el usuario desde la capa de aplicación/dominio
            const user = await this.app.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }

            // 3. Comparar la contraseña ingresada contra el hash mapeado en el dominio (user.password)
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: "Credenciales inválidas" });
            }

            // 4. Generar el JWT incluyendo la propiedad del rol
            const secretKey = process.env.JWT_SECRET || 'mi_clave_secreta_desarrollo_123';
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.roleId || user.roleId // Usamos el nombre que tenga en tu entidad
                },
                secretKey,
                { expiresIn: '2h' }
            );

            // 5. Excluir la contraseña sensible antes de retornar los datos al frontend
            const { password: pwd, ...userWithoutPassword } = user;

            // Agrega este console.log para ver exactamente cómo se llaman las propiedades en tu consola
            console.log("USUARIO EN LOGUEO:", userWithoutPassword);

            return res.status(200).json({
                message: "Inicio de sesión exitoso",
                token: token,
                user: userWithoutPassword
            });


        } catch (error) {
            console.error("ERROR REAL DEL LOGIN:", error);
            if (error instanceof Error) {
                return res.status(500).json({
                    error: "Error al procesar el inicio de sesión",
                    details: error.message,
                });
            }
            return res.status(500).json({ error: "Error interno del servidor" });
        }
    }

    async createUser(req: Request, res: Response): Promise<Response> {
        try {
            //Validar los datos de entrada
            const { name, email, password, status } = loadUserData(req.body);
            // El hash de la contraseña lo hace UserApplication.createUser
            const user: Omit<User, "id"> = { name, email, password, status: status ?? 1 };
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
            const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const id = parseInt(rawId ?? "", 10);
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
            const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const id = parseInt(rawId ?? "", 10);
            if (isNaN(id) || id <= 0) {
                return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
            }

            const user = await this.app.getUserById(id);
            if (!user) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            const { password: _, ...usuarioSinPassword } = user;
            return res.status(200).json(usuarioSinPassword);
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

            const { password: _, ...usuarioSinPassword } = user;
            return res.status(200).json(usuarioSinPassword);
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

            const usersSafe = users.map((user) => {
                const { password: _, ...usuarioSinPassword } = user;
                return usuarioSinPassword;
            });

            return res.status(200).json(usersSafe);
        } catch (error) {
            return res.status(500).json({ message: "Error al obtener usuarios", error });
        }
    }

    /**
     * Inactivación lógica (baja lógica vía DELETE sin borrado físico)
     */
    async deleteUser(req: Request, res: Response): Promise<Response> {
        try {
            const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const id = parseInt(rawId ?? "", 10);
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
            const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const id = parseInt(rawId ?? "", 10);
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
            const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const id = parseInt(rawId ?? "", 10);
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
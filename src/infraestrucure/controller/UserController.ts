import { Request, Response } from "express";
import { loadUserData } from "../util/user_validation";
import { loadUpdateUserData } from "../util/user-update-validation";
import { loadEmail } from "../util/email-validation";
import { UserApplication } from "../../application/UserApplication";
import { User } from "../../domain/User";
import bcrypt from "bcrypt";
import { AuthApplication } from "../../application/AuthApplication";
import nodemailer from "nodemailer";

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
            // 4. Generar el JWT delegando a AuthApplication y usando roleId para Angular
            const token = AuthApplication.generateToken({
                id: user.id,
                email: user.email,
                roleId: user.roleId 
            });

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


    /**
     * Envía el correo de recuperación con el enlace seguro
     */
    async sendRecoveryEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email } = req.body;
 
            if (!email) {
                return res.status(400).json({ error: "El correo es obligatorio." });
            }
 
            const token = await this.app.generatePasswordResetToken(email);
 
            // Por seguridad, la API responde igual exista o no el correo: no revelamos
            // si una cuenta está registrada.
            if (!token) {
                return res.status(200).json({
                    message: "Si el correo está registrado, recibirás un enlace de recuperación."
                });
            }
 
            const resetLink = `${process.env.FRONTEND_URL || "http://localhost:4200"}/reset-password?token=${token}`;
 
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            });
 
            const mailOptions = {
                from: `"Encuestas UE" <${process.env.GMAIL_USER}>`,
                to: email,
                subject: "Recuperación de Contraseña - Encuestas UE",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #0d6efd; text-align: center;">Recuperación de Contraseña</h2>
                        <p style="font-size: 16px; color: #333;">Solicitaste restablecer tu contraseña en la plataforma Encuestas UE.</p>
                        <p style="font-size: 16px; color: #333;">Haz clic en el siguiente botón para cambiar tu contraseña (el enlace expira en 15 minutos):</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="padding: 12px 24px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Restablecer Contraseña</a>
                        </div>
                        <p style="font-size: 12px; color: #888; text-align: center;">Si no puedes presionar el botón, copia y pega esta dirección en tu navegador:<br>${resetLink}</p>
                    </div>
                `
            };
 
            await transporter.sendMail(mailOptions);
 
            return res.status(200).json({
                message: "Si el correo está registrado, recibirás un enlace de recuperación."
            });
 
        } catch (error) {
            return res.status(500).json({ error: "Error interno al procesar el envío del correo." });
        }
    }
 
    /**
     * Recibe el token y la nueva contraseña para procesar el cambio
     */
    async resetPassword(req: Request, res: Response): Promise<Response> {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) return res.status(400).json({ error: "Faltan datos requeridos." });
 
            await this.app.resetPassword(token, newPassword);
            return res.status(200).json({ message: "Contraseña actualizada correctamente." });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
 
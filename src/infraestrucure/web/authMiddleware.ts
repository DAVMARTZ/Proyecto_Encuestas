import type { Request, Response, NextFunction } from "express";
import { UserApplication } from "../../application/UserApplication";
import { UserAdapter } from "../adapter/UserAdapter";
import { firebaseAuth } from "../config/firebase";
import { sendError } from "../util/http-utils";

const userApp = new UserApplication(new UserAdapter());

/**
 * Middleware para validar el token de Firebase de la petición y cargar al usuario.
 * El usuario se crea como STUDENT en su primer ingreso. El rol siempre sale de la base de datos.
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

    if (!token) {
        res.status(401).json({ error: "Acceso no autorizado: Se requiere token de autenticación" });
        return;
    }

    let identity: { uid: string; email?: string; name?: string };
    try {
        identity = await firebaseAuth.verifyIdToken(token);
    } catch (error) {
        res.status(401).json({ error: "Token inválido o expirado" });
        return;
    }

    try {
        const user = await userApp.getOrCreateSessionUser(identity);
        if (Number(user.status) === 0) {
            res.status(403).json({ error: "El usuario se encuentra inactivo" });
            return;
        }

        (req as any).user = { userId: user.id, email: user.email, roleId: user.roleId };
        next();
    } catch (error) {
        sendError(res, error);
    }
}

import type { Request, Response, NextFunction } from "express";
import { ROLES } from "../../domain/Role";

/**
 * Indica si el usuario autenticado de la petición es administrador.
 */
export function isAdmin(req: Request): boolean {
    return (req as any).user?.roleId === ROLES.ADMIN;
}

/**
 * Middleware para validar que el usuario autenticado tenga los roles requeridos.
 *
 * Ejemplo de uso en rutas:
 * router.delete("/users/:id", authenticateToken, authorizeRole(ROLES.ADMIN), userController.deleteUser);
 */
export function authorizeRole(...allowedRoles: number[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user) {
            res.status(401).json({ error: "Usuario no autenticado" });
            return;
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(user.roleId)) {
            res.status(403).json({ error: "Acceso denegado: permisos insuficientes para realizar esta acción" });
            return;
        }

        next();
    };
}

/**
 * Middleware para rutas /users/:id: permite al propio usuario o a un administrador.
 */
export function authorizeSelfOrAdmin(req: Request, res: Response, next: NextFunction): void {
    const user = (req as any).user;

    if (!user) {
        res.status(401).json({ error: "Usuario no autenticado" });
        return;
    }

    if (user.userId !== Number(req.params.id) && !isAdmin(req)) {
        res.status(403).json({ error: "Acceso denegado: permisos insuficientes para realizar esta acción" });
        return;
    }

    next();
}

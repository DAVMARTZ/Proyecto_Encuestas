import type { Request, Response, NextFunction } from "express";

/**
 * Middleware para validar que el usuario autenticado tenga los roles requeridos.
 * Puede recibir IDs numéricos de rol (ej: authorizeRole(1)) o nombres de rol si se manejan en el payload.
 * 
 * Ejemplo de uso en rutas:
 * router.delete("/users/:id", authenticateToken, authorizeRole(1), userController.deleteUser);
 */
export function authorizeRole(...allowedRoles: (number | string)[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user) {
            res.status(401).json({ error: "Usuario no autenticado" });
            return;
        }

        const userRoleId = user.roleId ?? user.role;

        if (allowedRoles.length > 0 && !allowedRoles.includes(userRoleId)) {
            res.status(403).json({ error: "Acceso denegado: permisos insuficientes para realizar esta acción" });
            return;
        }

        next();
    };
}

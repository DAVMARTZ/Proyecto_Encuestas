import type { Request, Response, NextFunction } from "express";

export function authorizeRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;

        if (!user) {
            res.status(401).json({ error: "No autenticado: token requerido" });
            return;
        }

        const userRole = (user.role || user.rol || "").toLowerCase();
        const allowedRoles = roles.map(r => r.toLowerCase());

        if (!allowedRoles.includes(userRole)) {
            res.status(403).json({ error: "Acceso denegado: permisos insuficientes" });
            return;
        }

        next();
    };
}

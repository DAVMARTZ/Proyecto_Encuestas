import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Método para interceptar peticiones y validar sesión
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({ message: 'No se proporcionó un token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
        req.user = { id: decoded.id }; // Inyectamos el id al request
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token no válido o expirado' });
    }
};
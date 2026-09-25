import { authenticateToken } from '../web/authMiddleware';

/**
 * Re-exportación para evitar duplicación de lógica JWT y mantener compatibilidad
 */
export const verifyToken = authenticateToken;
import jwt from "jsonwebtoken";

// Mejor práctica: Usar variable de entorno con un fallback unificado
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_desarrollo_123';

export class AuthApplication {
  static generateToken(payload: object): string {
    // Unificamos el tiempo de expiración a 2h como lo pedía el controlador originalmente
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
  }

  static verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }
}
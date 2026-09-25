import jwt from "jsonwebtoken";

const JWT_SECRET = "l2P99rV848ij_pBH5x5XHgTulbBMcOqNNmBM97qtmK8";

export class AuthApplication {
  static generateToken(payload: object): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
  }

  static verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }
}

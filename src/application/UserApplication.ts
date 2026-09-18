import bcrypt from "bcryptjs";
import { User } from "../domain/User";
import { UserPort } from "../domain/UserPort";
import { AuthApplication } from "./AuthApplication";

export class UserApplication {
  private port: UserPort;

  constructor(port: UserPort) {
    this.port = port;
  }

  async login(correo: string, password: string): Promise<string> {
    const existUser = await this.port.getUserByEmail(correo);
    if (!existUser) {
      throw new Error("Credenciales invalidas");
    }
    const passMatch = await bcrypt.compare(password, existUser.password);
    if (!passMatch) {
      throw new Error("Credenciales invalidas");
    }
    const token = AuthApplication.generateToken({
      id: existUser.id,
      correo: existUser.correo,
      rol: existUser.rol,
      role: existUser.rol,
    });
    return token;
  }

  async createUser(user: Omit<User, "id">): Promise<string> {
    const existUser = await this.port.getUserByEmail(user.correo);
    if (existUser) {
      throw new Error("Este correo ya está registrado");
    }
    const hashedPassword = await bcrypt.hash(user.password, 12);
    user.password = hashedPassword;
    return this.port.createUser(user);
  }

  async register(user: Omit<User, "id">): Promise<{ userId: string; token: string; rol: string }> {
    const userId = await this.createUser(user);
    const token = AuthApplication.generateToken({
      id: userId,
      correo: user.correo,
      rol: user.rol,
      role: user.rol,
    });
    return { userId, token, rol: user.rol };
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.port.getUserById(id);
  }

  async getUserByEmail(correo: string): Promise<User | null> {
    return await this.port.getUserByEmail(correo);
  }

  async getAllUsers(): Promise<User[]> {
    return await this.port.getAllUsers();
  }

  async updateUser(id: string, user: Partial<User>): Promise<boolean> {
    const existingUser = await this.port.getUserById(id);
    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }
    if (user.correo) {
      const emailTaken = await this.port.getUserByEmail(user.correo);
      if (emailTaken && emailTaken.id !== id) {
        throw new Error("El correo ya está en uso");
      }
    }
    return this.port.updateUser(id, user);
  }

  async deleteUser(id: string): Promise<boolean> {
    return await this.port.deleteUser(id);
  }
}
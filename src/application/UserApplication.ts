import bcrypt from "bcryptjs";
import { User } from "../domain/User";
import { UserPort } from "../domain/UserPort";
import { AuthApplication } from "./AuthApplication";

export class UserApplication {
  private port: UserPort;

  constructor(port: UserPort) {
    this.port = port;
  }

  async createUser(user: Omit<User, "id">): Promise<number> {
    const existUser = await this.port.getUserByEmail(user.email);
    if (existUser) {
      throw new Error("Este email ya está registrado");
    }

    // Hashear la contraseña con bcrypt (cost factor 10)
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;

    return this.port.createUser(user);
  }

  async login(email: string, password: string): Promise<{ token: string; user: Omit<User, "password"> }> {
    const user = await this.port.getUserByEmail(email);
    if (!user) {
      throw new Error("Credenciales inválidas");
    }

    if (user.status === 0 || user.statusUser === 0) {
      throw new Error("El usuario se encuentra inactivo");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Credenciales inválidas");
    }

    const token = AuthApplication.generateToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    const { password: _, ...usuarioSinPassword } = user;
    return { token, user: usuarioSinPassword };
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.port.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.port.getUserByEmail(email);
  }

  async getAllUsers(includeInactive: boolean = false): Promise<User[]> {
    return await this.port.getAllUsers(includeInactive);
  }

  async updateUser(id: number, user: Partial<User>): Promise<boolean> {
    const existingUser = await this.port.getUserById(id);
    if (!existingUser) {
      throw new Error("Usuario no encontrado");
    }
    if (user.email) {
      const emailTaken = await this.port.getUserByEmail(user.email);
      if (emailTaken && emailTaken.id !== id) {
        throw new Error("El email ya está en uso");
      }
    }
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    return this.port.updateUser(id, user);
  }

  /**
   * Baja lógica del usuario (cambio de estado a INACTIVO, sin borrado físico)
   */
  async deleteUser(id: number): Promise<boolean> {
    return await this.port.deleteUser(id);
  }

  /**
   * Inactivación lógica explícita
   */
  async deactivateUser(id: number): Promise<boolean> {
    return await this.port.deactivateUser(id);
  }

  /**
   * Reactivación lógica del usuario
   */
  async activateUser(id: number): Promise<boolean> {
    return await this.port.activateUser(id);
  }
}

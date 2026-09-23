import { User } from "../domain/User";
import { UserPort } from "../domain/UserPort";

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
    return this.port.createUser(user);
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

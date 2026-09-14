import { User } from "../domain/User";
import { UserPort } from "../domain/UserPort";

export class UserApplication {
  private port: UserPort;

  constructor(port: UserPort) {
    this.port = port;
  }
  async createUser(user: Omit<User, "id">): Promise<number> {
    //Antes de crear un usuario debo validar : el email no existe
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

  async getAllUsers(): Promise<User[]> {
    return await this.port.getAllUsers();
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

  async deleteUser(id: number): Promise<boolean> {
    return await this.port.deleteUser(id);
  }
}

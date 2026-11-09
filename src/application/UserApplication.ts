import { SessionUser, User } from "../domain/User";
import { UserPort } from "../domain/UserPort";

export class UserApplication {
  private port: UserPort;

  constructor(port: UserPort) {
    this.port = port;
  }

  /**
   * Devuelve el usuario de la sesión a partir de su cuenta de Firebase.
   * En su primer ingreso lo crea como STUDENT. Las cuentas se enlazan solo por UID,
   * nunca por correo, para que nadie herede otra cuenta registrando su correo en Firebase.
   */
  async getOrCreateSessionUser(identity: { uid: string; email?: string; name?: string }): Promise<SessionUser> {
    const existing = await this.port.getSessionUserByFirebaseUid(identity.uid);
    if (existing) {
      return existing;
    }

    if (!identity.email) {
      throw new Error("La cuenta de Firebase no tiene un correo asociado");
    }

    try {
      const name = (identity.name || identity.email.split("@")[0]).slice(0, 150);
      await this.port.createUser({ name, email: identity.email, firebaseUid: identity.uid, status: 1 });
    } catch (error) {
      // Dos peticiones simultáneas del primer ingreso: la otra ya lo creó
      const created = await this.port.getSessionUserByFirebaseUid(identity.uid);
      if (created) {
        return created;
      }
      if (await this.port.getUserByEmail(identity.email)) {
        throw new Error("Este correo ya está registrado con otra cuenta");
      }
      throw error;
    }

    const created = await this.port.getSessionUserByFirebaseUid(identity.uid);
    if (!created) {
      throw new Error("No se pudo iniciar la sesión del usuario");
    }
    return created;
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

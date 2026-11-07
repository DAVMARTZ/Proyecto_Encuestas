import { Role } from "../domain/Role";
import { RolePort } from "../domain/RolePort";

/**
 * Capa de Aplicación - Casos de Uso para Roles
 * Aplica el principio de Responsabilidad Única (SRP) y no depende de frameworks ni ORMs.
 */
export class RoleApplication {
  private port: RolePort;

  constructor(port: RolePort) {
    this.port = port;
  }

  /**
   * Crea un nuevo rol validando que el nombre no exista previamente.
   */
  async createRole(data: Omit<Role, "roleId">): Promise<number> {
    if (!data.name || data.name.trim() === "") {
      throw new Error("El nombre del rol es obligatorio");
    }

    const normalizedName = data.name.toUpperCase().trim();
    const existingRole = await this.port.getRoleByName(normalizedName);
    if (existingRole) {
      throw new Error("El rol ya se encuentra registrado");
    }

    const roleToCreate: Omit<Role, "roleId"> = {
      ...data,
      name: normalizedName,
      status: data.status !== undefined ? Number(data.status) : 1,
    };

    return await this.port.createRole(roleToCreate);
  }

  /**
   * Obtiene todos los roles del sistema (con opción de incluir inactivos).
   */
  async getAllRoles(includeInactive: boolean = false): Promise<Role[]> {
    return await this.port.getAllRoles(includeInactive);
  }

  /**
   * Obtiene un rol por su identificador numérico.
   */
  async getRoleById(id: number): Promise<Role | null> {
    const role = await this.port.getRoleById(id);
    if (!role) {
      throw new Error("Rol no encontrado");
    }
    return role;
  }

  /**
   * Actualiza los datos de un rol.
   */
  async updateRole(id: number, data: Partial<Role>): Promise<boolean> {
    const existingRole = await this.port.getRoleById(id);
    if (!existingRole) {
      throw new Error("Rol no encontrado");
    }

    if (data.name) {
      const normalizedName = data.name.toUpperCase().trim();
      const roleWithName = await this.port.getRoleByName(normalizedName);
      if (roleWithName && roleWithName.roleId !== id) {
        throw new Error("Ya existe otro rol con ese nombre");
      }
      data.name = normalizedName;
    }

    return await this.port.updateRole(id, data);
  }

  /**
   * Inactivación lógica del rol (status = 0, sin borrado físico).
   */
  async deactivateRole(id: number): Promise<boolean> {
    const role = await this.port.getRoleById(id);
    if (!role) {
      throw new Error("Rol no encontrado");
    }
    return await this.port.deactivateRole(id);
  }

  /**
   * Reactivación lógica del rol (status = 1).
   */
  async activateRole(id: number): Promise<boolean> {
    const role = await this.port.getRoleById(id);
    if (!role) {
      throw new Error("Rol no encontrado");
    }
    return await this.port.activateRole(id);
  }

  /**
   * Eliminación lógica (baja lógica vía DELETE sin borrado físico).
   */
  async deleteRole(id: number): Promise<boolean> {
    return await this.deactivateRole(id);
  }
}


import { Repository } from "typeorm";
import { RolePort } from "../../domain/RolePort";
import { Role as RoleDomain } from "../../domain/Role";
import { RoleEntity } from "../entities/RoleEntity";
import { AppDataSource } from "../config/data-base";

/**
 * Adaptador de Infraestructura para Roles con TypeORM
 * Implementa RolePort asegurando que la base de datos se comunique con el dominio limpiamente.
 */
export class RoleAdapter implements RolePort {
  private repository: Repository<RoleEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(RoleEntity);
  }

  /**
   * Mapeo de Entidad TypeORM a Modelo puro de Dominio
   */
  private toDomain(entity: RoleEntity): RoleDomain {
    return {
      roleId: entity.roleId,
      name: entity.name,
      description: entity.description,
      status: entity.status,
    };
  }

  async createRole(role: Omit<RoleDomain, "roleId">): Promise<number> {
    const entity = this.repository.create({
      name: role.name,
      description: role.description,
      status: role.status !== undefined ? Number(role.status) : 1,
    });

    const saved = await this.repository.save(entity);
    return saved.roleId;
  }

  async getAllRoles(includeInactive: boolean = false): Promise<RoleDomain[]> {
    const whereClause = includeInactive ? {} : { status: 1 };
    const entities = await this.repository.find({
      where: whereClause,
      order: { roleId: "ASC" },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async getRoleById(id: number): Promise<RoleDomain | null> {
    const entity = await this.repository.findOne({ where: { roleId: id } });
    return entity ? this.toDomain(entity) : null;
  }

  async getRoleByName(name: string): Promise<RoleDomain | null> {
    const entity = await this.repository.findOne({ where: { name } });
    return entity ? this.toDomain(entity) : null;
  }

  async updateRole(id: number, role: Partial<RoleDomain>): Promise<boolean> {
    const existing = await this.repository.findOne({ where: { roleId: id } });
    if (!existing) return false;

    if (role.name !== undefined) existing.name = role.name;
    if (role.description !== undefined) existing.description = role.description;
    if (role.status !== undefined) existing.status = Number(role.status);

    await this.repository.save(existing);
    return true;
  }

  async deactivateRole(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 0 });
    return (result.affected ?? 0) > 0;
  }

  async activateRole(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 1 });
    return (result.affected ?? 0) > 0;
  }

  async deleteRole(id: number): Promise<boolean> {
    return await this.deactivateRole(id);
  }
}


import { Repository } from "typeorm";
import type { UserPort } from "../../domain/UserPort";
import type { User as UserDomain } from "../../domain/User";
import { User as UserEntity } from "../entities/User";
import { RoleEntity } from "../entities/RoleEntity";
import { AppDataSource } from "../config/data-base";
import { compressImage, decompressImage } from "../util/imageCompressor";

export class UserAdapter implements UserPort {
  private userRepository: Repository<UserEntity>;
  private roleRepository: Repository<RoleEntity>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(UserEntity);
    this.roleRepository = AppDataSource.getRepository(RoleEntity);
  }

  private toDomain(user: UserEntity): UserDomain {
    return {
      id: user.userId,
      name: user.name,
      email: user.email,
      password: user.passwordHash,
      avatarBase64: decompressImage(user.photoData, user.photoMimeType),
      createdAt: user.createdAt,
      status: user.status,
      statusUser: user.status,
      roleId: user.roleId,
    };
  }

  private async toEntity(user: Omit<UserDomain, "id">): Promise<UserEntity> {
    const userEntity = new UserEntity();
    userEntity.name = user.name;
    userEntity.email = user.email.toLowerCase().trim();
    userEntity.passwordHash = user.password;

    // Foto de perfil del usuario: se comprime con gzip y se guarda como binario (bytea/varbinary)
    if (user.avatarBase64) {
      const { compressedBuffer, mimeType } = compressImage(user.avatarBase64);
      userEntity.photoData = compressedBuffer;
      userEntity.photoMimeType = mimeType;
    }

    userEntity.status = user.status !== undefined ? Number(user.status) : (user.statusUser !== undefined ? Number(user.statusUser) : 1);

    if (user.roleId) {
      userEntity.roleId = user.roleId;
    } else {
      const studentRole = await this.roleRepository.findOne({ where: { name: 'STUDENT' } });
      userEntity.roleId = studentRole ? studentRole.roleId : 1;
    }

    return userEntity;
  }

  async createUser(user: Omit<UserDomain, "id">): Promise<number> {
    try {
      const newUser = await this.toEntity(user);
      const savedUser = await this.userRepository.save(newUser);
      return savedUser.userId;
    } catch (error) {
      console.error("Error creando usuario: ", error);
      throw error;
    }
  }

  async updateUser(id: number, user: Partial<UserDomain>): Promise<boolean> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { userId: id },
      });
      if (!existingUser) return false;

      if (user.name !== undefined) existingUser.name = user.name;
      if (user.email !== undefined) existingUser.email = user.email.toLowerCase().trim();
      if (user.password !== undefined) existingUser.passwordHash = user.password;
      
      // Actualizar foto de perfil comprimida
      if (user.avatarBase64 !== undefined) {
        if (user.avatarBase64) {
          const { compressedBuffer, mimeType } = compressImage(user.avatarBase64);
          existingUser.photoData = compressedBuffer;
          existingUser.photoMimeType = mimeType;
        } else {
          existingUser.photoData = undefined;
          existingUser.photoMimeType = undefined;
        }
      }

      if (user.status !== undefined) existingUser.status = Number(user.status);
      if (user.statusUser !== undefined) existingUser.status = Number(user.statusUser);
      if (user.roleId !== undefined) existingUser.roleId = user.roleId;

      await this.userRepository.save(existingUser);
      return true;
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      throw error;
    }
  }

  /**
   * Baja lógica del usuario (status_user = 0) sin borrado físico
   */
  async deleteUser(id: number): Promise<boolean> {
    return this.deactivateUser(id);
  }

  async deactivateUser(id: number): Promise<boolean> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { userId: id },
      });
      if (!existingUser) return false;
      
      existingUser.status = 0;
      await this.userRepository.save(existingUser);
      return true;
    } catch (error) {
      console.error("Error al inactivar lógicamente el usuario:", error);
      throw error;
    }
  }

  async activateUser(id: number): Promise<boolean> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: { userId: id },
      });
      if (!existingUser) return false;
      
      existingUser.status = 1;
      await this.userRepository.save(existingUser);
      return true;
    } catch (error) {
      console.error("Error al reactivar el usuario:", error);
      throw error;
    }
  }

  async getUserById(id: number): Promise<UserDomain | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { userId: id },
      });
      return user ? this.toDomain(user) : null;
    } catch (error) {
      console.error("Error obteniendo usuario por ID:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<UserDomain | null> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    return user ? this.toDomain(user) : null;
  }

  async getAllUsers(includeInactive: boolean = false): Promise<UserDomain[]> {
    try {
      const whereClause = includeInactive ? {} : { status: 1 };
      const users = await this.userRepository.find({
        where: whereClause,
        order: { userId: 'ASC' }
      });
      return users.map((u) => this.toDomain(u));
    } catch (error) {
      console.error("Error obteniendo usuarios:", error);
      throw error;
    }
  }
}

import { Repository } from "typeorm";
import type { UserPort } from "../../domain/UserPort";
import type { SessionUser, User as UserDomain } from "../../domain/User";
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
      avatarBase64: decompressImage(user.photoData, user.photoMimeType),
      createdAt: user.createdAt,
      status: user.status,
      roleId: user.roleId,
    };
  }

  private async toEntity(user: Omit<UserDomain, "id">): Promise<UserEntity> {
    const userEntity = new UserEntity();
    userEntity.name = user.name;
    userEntity.email = user.email.toLowerCase().trim();
    userEntity.firebaseUid = user.firebaseUid;

    // Foto de perfil del usuario: se comprime con gzip y se guarda como binario (bytea/varbinary)
    if (user.avatarBase64) {
      const { compressedBuffer, mimeType } = compressImage(user.avatarBase64);
      userEntity.photoData = compressedBuffer;
      userEntity.photoMimeType = mimeType;
    }

    userEntity.status = Number(user.status);

    if (user.roleId) {
      userEntity.roleId = user.roleId;
    } else {
      // Todo registro nuevo es STUDENT; nunca se asigna otro rol por defecto
      const studentRole = await this.roleRepository.findOne({ where: { name: 'STUDENT', status: 1 } });
      if (!studentRole) {
        throw new Error("No existe el rol STUDENT activo en el sistema");
      }
      userEntity.roleId = studentRole.roleId;
    }

    return userEntity;
  }

  async createUser(user: Omit<UserDomain, "id">): Promise<number> {
    const newUser = await this.toEntity(user);
    const savedUser = await this.userRepository.save(newUser);
    return savedUser.userId;
  }

  async updateUser(id: number, user: Partial<UserDomain>): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({
      where: { userId: id },
    });
    if (!existingUser) return false;

    if (user.name !== undefined) existingUser.name = user.name;
    
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
    if (user.roleId !== undefined) existingUser.roleId = user.roleId;

    await this.userRepository.save(existingUser);
    return true;
  }

  /**
   * Baja lógica del usuario (status_user = 0) sin borrado físico
   */
  async deleteUser(id: number): Promise<boolean> {
    return this.deactivateUser(id);
  }

  async deactivateUser(id: number): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({
      where: { userId: id },
    });
    if (!existingUser) return false;
    
    existingUser.status = 0;
    await this.userRepository.save(existingUser);
    return true;
  }

  async activateUser(id: number): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({
      where: { userId: id },
    });
    if (!existingUser) return false;
    
    existingUser.status = 1;
    await this.userRepository.save(existingUser);
    return true;
  }

  async getUserById(id: number): Promise<UserDomain | null> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
    });
    return user ? this.toDomain(user) : null;
  }

  async getUserByEmail(email: string): Promise<UserDomain | null> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    return user ? this.toDomain(user) : null;
  }

  /**
   * Consulta liviana (sin foto) que se ejecuta en cada petición autenticada
   */
  async getSessionUserByFirebaseUid(firebaseUid: string): Promise<SessionUser | null> {
    const user = await this.userRepository.findOne({
      where: { firebaseUid },
      select: { userId: true, email: true, status: true, roleId: true },
    });
    return user ? { id: user.userId, email: user.email, status: user.status, roleId: user.roleId } : null;
  }

  async getAllUsers(includeInactive: boolean = false): Promise<UserDomain[]> {
    const whereClause = includeInactive ? {} : { status: 1 };
    const users = await this.userRepository.find({
      where: whereClause,
      order: { userId: 'ASC' }
    });
    return users.map((u) => this.toDomain(u));
  }
}

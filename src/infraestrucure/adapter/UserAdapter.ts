import type { UserPort } from "../../domain/UserPort";
import type { User as UserDomain } from "../../domain/User";
import { User as UserEntity } from "../entities/User";
import { AppDataSource } from "../config/data-base";
import type { Repository } from "typeorm";

export class UserAdapter implements UserPort {
  private userRepository: Repository<UserEntity>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(UserEntity);
  }

  private toDomain(user: UserEntity): UserDomain {
    return {
      id: user.user_id,
      nombre: user.name,
      correo: user.email,
      password: user.password_hash,
      status: user.status_user,
      rol: user.role as any,
    };
  }

  private toEntity(user: Omit<UserDomain, "id">): UserEntity {
    const userEntity = new UserEntity();
    userEntity.name = user.nombre;
    userEntity.email = user.correo;
    userEntity.password_hash = user.password;
    userEntity.status_user = user.status;
    userEntity.role = user.rol as any;
    return userEntity;
  }

  async createUser(user: Omit<UserDomain, "id">): Promise<string> {
    const newUser = this.toEntity(user);
    const savedUser = await this.userRepository.save(newUser);
    return savedUser.user_id;
  }

  async updateUser(id: string, user: Partial<UserDomain>): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({ where: { user_id: id } });
    if (!existingUser) return false;

    Object.assign(existingUser, {
      name: user.nombre ?? existingUser.name,
      email: user.correo ?? existingUser.email,
      password_hash: user.password ?? existingUser.password_hash,
      status_user: user.status ?? existingUser.status_user,
      role: (user.rol as any) ?? existingUser.role,
    });

    await this.userRepository.save(existingUser);
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({ where: { user_id: id } });
    if (!existingUser) return false;
    
    // BORRADO LÓGICO: Solo actualiza el estatus a 0
    existingUser.status_user = 0;
    await this.userRepository.save(existingUser);
    return true;
  }

  async getUserById(id: string): Promise<UserDomain | null> {
    const user = await this.userRepository.findOne({ where: { user_id: id } });
    return user ? this.toDomain(user) : null;
  }

  async getUserByEmail(correo: string): Promise<UserDomain | null> {
    const user = await this.userRepository.findOne({ where: { email: correo } });
    return user ? this.toDomain(user) : null;
  }

  async getAllUsers(): Promise<UserDomain[]> {
    const users = await this.userRepository.find({ where: { status_user: 1 } });
    return users.map((user) => this.toDomain(user));
  }
}
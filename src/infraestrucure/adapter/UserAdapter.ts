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
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      password: user.password,
      status: user.status,
      rol: user.rol as any,
    };
  }

  private toEntity(user: Omit<UserDomain, "id">): UserEntity {
    const userEntity = new UserEntity();
    userEntity.nombre = user.nombre;
    userEntity.correo = user.correo;
    userEntity.password = user.password;
    userEntity.status = user.status;
    userEntity.rol = user.rol as any;
    return userEntity;
  }

  async createUser(user: Omit<UserDomain, "id">): Promise<string> {
    const newUser = this.toEntity(user);
    const savedUser = await this.userRepository.save(newUser);
    return savedUser.id;
  }

  async updateUser(id: string, user: Partial<UserDomain>): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({ where: { id } as any });
    if (!existingUser) return false;

    Object.assign(existingUser, {
      nombre: user.nombre ?? existingUser.nombre,
      correo: user.correo ?? existingUser.correo,
      password: user.password ?? existingUser.password,
      status: user.status ?? existingUser.status,
      rol: user.rol ?? existingUser.rol,
    });

    await this.userRepository.save(existingUser);
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({ where: { id } as any });
    if (!existingUser) return false;
    
    // BORRADO LÓGICO: Solo actualiza el estatus a 0
    existingUser.status = 0;
    await this.userRepository.save(existingUser);
    return true;
  }

  async getUserById(id: string): Promise<UserDomain | null> {
    const user = await this.userRepository.findOne({ where: { id } as any });
    return user ? this.toDomain(user) : null;
  }

  async getUserByEmail(correo: string): Promise<UserDomain | null> {
    const user = await this.userRepository.findOne({ where: { correo } as any });
    return user ? this.toDomain(user) : null;
  }

  async getAllUsers(): Promise<UserDomain[]> {
    const users = await this.userRepository.find({ where: { status: 1 } });
    return users.map((user) => this.toDomain(user));
  }
}
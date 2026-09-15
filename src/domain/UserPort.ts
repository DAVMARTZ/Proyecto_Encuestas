import { User } from "./User";

export interface UserPort {
    createUser(user: Omit<User, "id">): Promise<string>;
    updateUser(id: string, user: Partial<User>): Promise<boolean>;
    deleteUser(id: string): Promise<boolean>;
    getUserById(id: string): Promise<User | null>;
    getUserByEmail(correo: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
}
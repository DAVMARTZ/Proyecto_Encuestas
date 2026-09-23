import { User } from "./User";

export interface UserPort {
    createUser(user: Omit<User, "id">): Promise<number>;
    updateUser(id: number, user: Partial<User>): Promise<boolean>;
    deleteUser(id: number): Promise<boolean>; // Inactivación lógica (baja lógica)
    deactivateUser(id: number): Promise<boolean>; // Inactivación lógica explícita
    activateUser(id: number): Promise<boolean>; // Reactivación
    getUserById(id: number): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    getAllUsers(includeInactive?: boolean): Promise<User[]>;
}
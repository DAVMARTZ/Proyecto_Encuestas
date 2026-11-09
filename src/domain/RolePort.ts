import { Role } from "./Role";

export interface RolePort {
    createRole(role: Omit<Role, "roleId">): Promise<number>;
    getAllRoles(includeInactive?: boolean): Promise<Role[]>;
    getRoleById(id: number): Promise<Role | null>;
    getRoleByName(name: string): Promise<Role | null>;
    updateRole(id: number, role: Partial<Role>): Promise<boolean>;
    deactivateRole(id: number): Promise<boolean>;
    activateRole(id: number): Promise<boolean>;
}


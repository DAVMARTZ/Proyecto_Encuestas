export type RoleStatus = 0 | 1 | number;

// IDs fijos de los roles base creados por init_database.sql
export const ROLES = {
    ADMIN: 1,
    STUDENT: 2,
} as const;

export interface Role {
    roleId?: number;
    name: string;
    description?: string;
    status: RoleStatus;
}


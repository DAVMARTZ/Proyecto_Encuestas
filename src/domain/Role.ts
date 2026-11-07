export type RoleStatus = 0 | 1 | number;

export interface Role {
    roleId?: number;
    name: string;
    description?: string;
    status: RoleStatus;
}


export type UserStatus = 0 | 1 | number;

export interface User {
    id?: number;
    name: string;
    email: string;
    password: string;
    avatarBase64?: string;
    createdAt?: Date;
    status: UserStatus;
    statusUser?: UserStatus;
    roleId?: number;
}
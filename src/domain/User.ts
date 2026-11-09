export type UserStatus = 0 | 1 | number;

export interface User {
    id?: number;
    name: string;
    email: string;
    firebaseUid?: string;
    avatarBase64?: string;
    createdAt?: Date;
    status: UserStatus;
    roleId?: number;
}

export type SessionUser = Pick<User, "id" | "email" | "status" | "roleId">;

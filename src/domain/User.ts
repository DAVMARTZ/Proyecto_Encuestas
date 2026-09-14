export enum UserRole {
    ADMIN = 'admin',
    ESTUDIANTE = 'estudiante',
    CLIENTE = 'cliente'
}

export interface User {
    id: number;
    name: string;
    email: string;
    password: string;
    status: number;
    role: UserRole;
}
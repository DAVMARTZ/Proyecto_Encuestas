export enum UserRole {
    ADMIN = 'Administrador',
    ESTUDIANTE = 'Estudiante',
    DOCENTE = 'Docente'
}

export interface User {
    id: string; 
    nombre: string;
    correo: string;
    password: string;
    status: number; 
    rol: UserRole;
}
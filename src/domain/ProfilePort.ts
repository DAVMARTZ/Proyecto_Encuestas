// Contrato para aislar el dominio de la base de datos
export interface ProfilePort {
    getProfile(id: string): Promise<any>;
    updateProfile(id: string, data: { nombre?: string; foto_perfil?: string }): Promise<any>;
}
import { ProfilePort } from '../domain/ProfilePort';

export class ProfileApplication {
    constructor(private readonly profilePort: ProfilePort) {}

    // Método para consultar el perfil garantizando que exista
    async getProfile(userId: string) {
        const profile = await this.profilePort.getProfile(userId);
        if (!profile) throw new Error('Usuario no encontrado');
        return profile;
    }

    // Método para validar y enviar la actualización de datos
    async updateProfile(userId: string, data: { nombre?: string; foto_perfil?: string }) {
        if (!data.nombre && !data.foto_perfil) {
            throw new Error('No hay datos válidos para actualizar');
        }
        return await this.profilePort.updateProfile(userId, data);
    }
}
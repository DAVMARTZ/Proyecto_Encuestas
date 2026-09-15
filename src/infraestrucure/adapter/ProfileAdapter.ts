import { ProfilePort } from '../../domain/ProfilePort';
import { AppDataSource } from '../config/data-base';
import { User } from '../entities/User'; 

export class ProfileAdapter implements ProfilePort {
    
    // Método para consultar el perfil
    async getProfile(id: string) {
        const repo = AppDataSource.getRepository(User);
        return await repo.findOne({ 
            where: { id } as any, 
            select: ['id', 'nombre', 'correo', 'rol', 'foto_perfil'] as any
        });
    }

    // Método para actualizar nombre y foto
    async updateProfile(id: string, data: { nombre?: string; foto_perfil?: string }) {
        const repo = AppDataSource.getRepository(User);
        await repo.update(id, data);
        return this.getProfile(id); 
    }
}
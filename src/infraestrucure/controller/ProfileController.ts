import { Request, Response } from 'express';
import { ProfileApplication } from '../../application/ProfileApplication';

export class ProfileController {
    constructor(private readonly app: ProfileApplication) {}

    // Método http para traer los datos del usuario logueado
    getProfile = async (req: Request, res: Response) => {
        try {
            const profile = await this.app.getProfile(req.user.id);
            res.status(200).json(profile);
        } catch (error: any) {
            res.status(404).json({ error: error.message });
        }
    };

    // Método http para actualizar el usuario logueado
    updateProfile = async (req: Request, res: Response) => {
        try {
            const { nombre, foto_perfil } = req.body;
            const updated = await this.app.updateProfile(req.user.id, { nombre, foto_perfil });
            res.status(200).json({ message: 'Perfil actualizado', data: updated });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };
}

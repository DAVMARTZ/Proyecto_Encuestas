import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/data-base';
import { RoleEntity } from '../entities/RoleEntity';

const router = Router();

router.get('/roles', async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const roleRepo = AppDataSource.getRepository(RoleEntity);
    const where = includeInactive ? {} : { status: 1 };
    const roles = await roleRepo.find({ where, order: { roleId: 'ASC' } });
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar roles', error });
  }
});

router.post('/roles', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'El nombre del rol es obligatorio' });
    }
    const roleRepo = AppDataSource.getRepository(RoleEntity);
    const newRole = roleRepo.create({
      name: name.toUpperCase().trim(),
      description,
      status: 1
    });
    const saved = await roleRepo.save(newRole);
    res.status(201).json(saved);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'El rol ya existe' });
    }
    res.status(500).json({ message: 'Error al crear rol', error });
  }
});

// Inactivación lógica (baja lógica sin borrado físico)
router.patch('/roles/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
    }
    const roleRepo = AppDataSource.getRepository(RoleEntity);
    const role = await roleRepo.findOneBy({ roleId: id });
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    role.status = 0;
    await roleRepo.save(role);
    res.status(200).json({ message: 'Rol inactivado correctamente (status: 0 - INACTIVO)' });
  } catch (error) {
    res.status(500).json({ message: 'Error al inactivar rol', error });
  }
});

router.delete('/roles/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
    }
    const roleRepo = AppDataSource.getRepository(RoleEntity);
    const role = await roleRepo.findOneBy({ roleId: id });
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    role.status = 0;
    await roleRepo.save(role);
    res.status(200).json({ message: 'Rol dado de baja lógicamente con éxito (status: 0 - INACTIVO)' });
  } catch (error) {
    res.status(500).json({ message: 'Error al dar de baja el rol', error });
  }
});

// Reactivación lógica
router.patch('/roles/:id/activate', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID inválido. Debe ser un entero positivo.' });
    }
    const roleRepo = AppDataSource.getRepository(RoleEntity);
    const role = await roleRepo.findOneBy({ roleId: id });
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    role.status = 1;
    await roleRepo.save(role);
    res.status(200).json({ message: 'Rol reactivado correctamente (status: 1 - ACTIVO)' });
  } catch (error) {
    res.status(500).json({ message: 'Error al reactivar rol', error });
  }
});

export default router;

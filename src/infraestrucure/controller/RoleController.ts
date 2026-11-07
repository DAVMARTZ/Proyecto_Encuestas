import { Request, Response } from "express";
import { RoleApplication } from "../../application/RoleApplication";
import { loadRoleData, loadUpdateRoleData } from "../util/role-validation";

/**
 * Controlador HTTP para Roles
 * Mantiene la misma trazabilidad y manejo de errores que UserController.
 */
export class RoleController {
  private roleApp: RoleApplication;

  constructor(roleApp: RoleApplication) {
    this.roleApp = roleApp;
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const data = loadRoleData(req.body);
      const roleId = await this.roleApp.createRole({
        name: data.name,
        description: data.description,
        status: data.status !== undefined ? Number(data.status) : 1,
      });

      return res.status(201).json({
        message: "Rol creado con éxito",
        roleId,
      });
    } catch (error: any) {
      if (error.message.includes("ya se encuentra registrado")) {
        return res.status(409).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  };

  getAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const roles = await this.roleApp.getAllRoles(includeInactive);
      return res.status(200).json(roles);
    } catch (error: any) {
      return res.status(500).json({ error: "Error al consultar roles", details: error.message });
    }
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      const role = await this.roleApp.getRoleById(id);
      return res.status(200).json(role);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      const dataLoad = loadUpdateRoleData(req.body);
      await this.roleApp.updateRole(id, dataLoad);
      return res.status(200).json({ message: "Rol actualizado con éxito" });
    } catch (error: any) {
      if (error.message.includes("Ya existe otro rol")) {
        return res.status(409).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  };

  deactivate = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      await this.roleApp.deactivateRole(id);
      return res.status(200).json({ message: "Rol inactivado correctamente (status: 0 - INACTIVO)" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  activate = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      await this.roleApp.activateRole(id);
      return res.status(200).json({ message: "Rol reactivado correctamente (status: 1 - ACTIVO)" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    return this.deactivate(req, res);
  };
}

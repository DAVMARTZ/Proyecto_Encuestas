import { Request, Response } from "express";
import { RoleApplication } from "../../application/RoleApplication";
import { loadRoleData, loadUpdateRoleData } from "../util/role-validation";
import { parseId, sendError } from "../util/http-utils";

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
    } catch (error) {
      return sendError(res, error);
    }
  };

  getAll = async (req: Request, res: Response): Promise<Response> => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const roles = await this.roleApp.getAllRoles(includeInactive);
      return res.status(200).json(roles);
    } catch (error) {
      return sendError(res, error);
    }
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      const role = await this.roleApp.getRoleById(id);
      return res.status(200).json(role);
    } catch (error) {
      return sendError(res, error);
    }
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      const dataLoad = loadUpdateRoleData(req.body);
      await this.roleApp.updateRole(id, dataLoad);
      return res.status(200).json({ message: "Rol actualizado con éxito" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  deactivate = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      await this.roleApp.deactivateRole(id);
      return res.status(200).json({ message: "Rol inactivado correctamente (status: 0 - INACTIVO)" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  activate = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseId(req.params.id);
      if (id === null) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      await this.roleApp.activateRole(id);
      return res.status(200).json({ message: "Rol reactivado correctamente (status: 1 - ACTIVO)" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    return this.deactivate(req, res);
  };
}

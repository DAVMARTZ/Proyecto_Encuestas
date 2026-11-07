import { Request, Response } from "express";
import { ResponseOptionApplication } from "../../application/ResponseOptionApplication";
import { loadOptionData, loadUpdateOptionData } from "../util/questionValidator";

/**
 * Controlador HTTP para Opciones de Respuesta
 */
export class ResponseOptionController {
  private optionApp: ResponseOptionApplication;

  constructor(optionApp: ResponseOptionApplication) {
    this.optionApp = optionApp;
  }

  create = async (req: Request, res: Response): Promise<Response> => {
    try {
      const questionId = req.params.questionId ? Number(req.params.questionId) : Number(req.body.questionId);
      const data = loadOptionData({
        ...req.body,
        questionId,
      });

      const optionId = await this.optionApp.createOption({
        ...data,
        status: data.status !== undefined ? Number(data.status) : 1,
      });

      return res.status(201).json({
        message: "Opción de respuesta creada con éxito",
        optionId,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  getByQuestionId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const questionId = parseInt(req.params.questionId, 10);
      if (isNaN(questionId) || questionId <= 0) {
        return res.status(400).json({ error: "ID de pregunta inválido. Debe ser un entero positivo." });
      }

      const includeInactive = req.query.includeInactive === "true";
      const options = await this.optionApp.getOptionsByQuestion(questionId, includeInactive);
      return res.status(200).json(options);
    } catch (error: any) {
      return res.status(500).json({ error: "Error al consultar opciones", details: error.message });
    }
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      const option = await this.optionApp.getOptionById(id);
      return res.status(200).json(option);
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

      const dataLoad = loadUpdateOptionData(req.body);
      await this.optionApp.updateOption(id, dataLoad);
      return res.status(200).json({ message: "Opción actualizada correctamente" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  deactivate = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id <= 0) {
        return res.status(400).json({ error: "ID inválido. Debe ser un entero positivo." });
      }

      await this.optionApp.deactivateOption(id);
      return res.status(200).json({ message: "Opción inactivada correctamente (status: 0 - INACTIVO)" });
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

      await this.optionApp.activateOption(id);
      return res.status(200).json({ message: "Opción reactivada correctamente (status: 1 - ACTIVO)" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    return this.deactivate(req, res);
  };
}

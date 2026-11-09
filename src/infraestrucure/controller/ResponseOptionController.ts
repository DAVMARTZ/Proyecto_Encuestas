import { Request, Response } from "express";
import { ResponseOptionApplication } from "../../application/ResponseOptionApplication";
import { loadOptionData, loadUpdateOptionData } from "../util/questionValidator";
import { parseId, sendError } from "../util/http-utils";

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
    } catch (error) {
      return sendError(res, error);
    }
  };

  getByQuestionId = async (req: Request, res: Response): Promise<Response> => {
    try {
      const questionId = parseId(req.params.questionId);
      if (questionId === null) {
        return res.status(400).json({ error: "ID de pregunta inválido. Debe ser un entero positivo." });
      }

      const includeInactive = req.query.includeInactive === "true";
      const options = await this.optionApp.getOptionsByQuestion(questionId, includeInactive);
      return res.status(200).json(options);
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

      const option = await this.optionApp.getOptionById(id);
      return res.status(200).json(option);
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

      const dataLoad = loadUpdateOptionData(req.body);
      await this.optionApp.updateOption(id, dataLoad);
      return res.status(200).json({ message: "Opción actualizada correctamente" });
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

      await this.optionApp.deactivateOption(id);
      return res.status(200).json({ message: "Opción inactivada correctamente (status: 0 - INACTIVO)" });
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

      await this.optionApp.activateOption(id);
      return res.status(200).json({ message: "Opción reactivada correctamente (status: 1 - ACTIVO)" });
    } catch (error) {
      return sendError(res, error);
    }
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    return this.deactivate(req, res);
  };
}

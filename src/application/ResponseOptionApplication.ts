import { ResponseOption } from "../domain/ResponseOption";
import { ResponseOptionPort } from "../domain/ResponseOptionPort";

/**
 * Capa de Aplicación - Casos de Uso para Opciones de Respuesta
 */
export class ResponseOptionApplication {
  private port: ResponseOptionPort;

  constructor(port: ResponseOptionPort) {
    this.port = port;
  }

  /**
   * Crea una opción de respuesta vinculada a una pregunta.
   */
  async createOption(data: ResponseOption): Promise<number> {
    if (!data.questionId || Number(data.questionId) <= 0) {
      throw new Error("El ID de la pregunta es obligatorio");
    }

    if (!data.optionText || data.optionText.trim() === "") {
      throw new Error("El texto de la opción no puede estar vacío");
    }

    const optionToSave: ResponseOption = {
      ...data,
      questionId: Number(data.questionId),
      displayOrder: data.displayOrder ? Number(data.displayOrder) : 1,
      status: data.status !== undefined ? Number(data.status) : 1,
    };

    return await this.port.createOption(optionToSave);
  }

  /**
   * Obtiene todas las opciones de una pregunta.
   */
  async getOptionsByQuestion(questionId: number, includeInactive: boolean = false): Promise<ResponseOption[]> {
    if (!questionId || questionId <= 0) {
      throw new Error("ID de pregunta inválido");
    }
    return await this.port.getOptionsByQuestion(questionId, includeInactive);
  }

  /**
   * Obtiene una opción por su identificador numérico.
   */
  async getOptionById(id: number): Promise<ResponseOption> {
    const option = await this.port.getOptionById(id);
    if (!option) {
      throw new Error("Opción de respuesta no encontrada");
    }
    return option;
  }

  /**
   * Actualiza una opción de respuesta.
   */
  async updateOption(id: number, data: Partial<ResponseOption>): Promise<boolean> {
    const existing = await this.port.getOptionById(id);
    if (!existing) {
      throw new Error("Opción de respuesta no encontrada");
    }
    return await this.port.updateOption(id, data);
  }

  /**
   * Inactivación lógica (status = 0).
   */
  async deactivateOption(id: number): Promise<boolean> {
    const existing = await this.port.getOptionById(id);
    if (!existing) {
      throw new Error("Opción de respuesta no encontrada");
    }
    return await this.port.deactivateOption(id);
  }

  /**
   * Reactivación lógica (status = 1).
   */
  async activateOption(id: number): Promise<boolean> {
    const existing = await this.port.getOptionById(id);
    if (!existing) {
      throw new Error("Opción de respuesta no encontrada");
    }
    return await this.port.activateOption(id);
  }

  /**
   * Baja lógica vía DELETE sin borrado físico.
   */
  async deleteOption(id: number): Promise<boolean> {
    return await this.deactivateOption(id);
  }
}


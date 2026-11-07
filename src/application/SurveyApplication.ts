import { SurveyPort } from "../domain/SurveyPort";
import { Survey } from "../domain/Survey";

export class SurveyApplication {
  constructor(private readonly surveyPort: SurveyPort) {}

  /**
   * Crea una nueva encuesta con estado inicial activo (1).
   */
  async createSurvey(data: Omit<Survey, "surveyId" | "status" | "createdAt">): Promise<number> {
    if (!data.title || data.title.trim() === "") {
      throw new Error("El título de la encuesta es obligatorio.");
    }
    if (!data.userId) {
      throw new Error("El ID del usuario creador es obligatorio.");
    }

    const newSurvey: Survey = {
      ...data,
      status: 1,
    };

    return await this.surveyPort.save(newSurvey);
  }

  /**
   * Recupera las encuestas generales del sistema.
   */
  async getAllSurveys(includeInactive: boolean = false): Promise<Survey[]> {
    return await this.surveyPort.findAll(includeInactive);
  }

  /**
   * Busca una encuesta por su ID numérico (incluyendo sus preguntas y opciones).
   */
  async getSurveyById(id: number): Promise<Survey> {
    const survey = await this.surveyPort.findById(id);
    if (!survey) {
      throw new Error("La encuesta solicitada no existe.");
    }
    return survey;
  }

  /**
   * Recupera las encuestas creadas por un usuario específico (docente o admin).
   */
  async getSurveysByUserId(userId: number, includeInactive: boolean = false): Promise<Survey[]> {
    if (!userId || userId <= 0) {
      throw new Error("ID de usuario creador inválido.");
    }
    return await this.surveyPort.findByUserId(userId, includeInactive);
  }

  /**
   * Actualiza la información de una encuesta solo si está activa.
   */
  async updateSurvey(id: number, data: Partial<Survey>): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);

    if (!survey) {
      throw new Error("La encuesta que intenta editar no existe.");
    }
    if (Number(survey.status) === 0) {
      throw new Error("No se pueden modificar encuestas inactivadas.");
    }

    return await this.surveyPort.update(id, data);
  }

  /**
   * Publica/Activa la encuesta para que pueda recibir respuestas.
   */
  async publishSurvey(id: number): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);

    if (!survey) {
      throw new Error("La encuesta no existe.");
    }
    if (Number(survey.status) === 1) {
      throw new Error("La encuesta ya se encuentra activa/publicada.");
    }

    return await this.surveyPort.updateStatus(id, 1);
  }

  /**
   * Inactiva lógicamente la encuesta (baja lógica, sin borrado físico).
   */
  async deactivateSurvey(id: number): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);

    if (!survey) {
      throw new Error("La encuesta no existe.");
    }
    if (Number(survey.status) === 0) {
      throw new Error("La encuesta ya está inactiva.");
    }

    return await this.surveyPort.deactivate(id);
  }

  /**
   * Reactiva la encuesta.
   */
  async activateSurvey(id: number): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);

    if (!survey) {
      throw new Error("La encuesta no existe.");
    }
    if (Number(survey.status) === 1) {
      throw new Error("La encuesta ya se encuentra activa.");
    }

    return await this.surveyPort.activate(id);
  }

  /**
   * Baja lógica mediante DELETE /surveys/:id (cero borrado físico).
   */
  async deleteSurvey(id: number): Promise<boolean> {
    return await this.deactivateSurvey(id);
  }
}

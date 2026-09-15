import { SurveyPort, Survey, SurveyStatus } from '../domain/Survey';

export class SurveyApplication {
  constructor(private readonly surveyPort: SurveyPort) {}

  /**
   * 1. Crear encuesta en estado Borrador
   */
  async createSurvey(data: Omit<Survey, 'id' | 'status'>): Promise<string> {
    if (!data.surveyTypeId) {
      throw new Error('El tipo de encuesta es obligatorio.');
    }
    if (!data.itemId) {
      throw new Error('El ítem a evaluar es obligatorio.');
    }
    if (!data.title || data.title.trim() === '') {
      throw new Error('El título de la encuesta es obligatorio.');
    }

    const newSurvey: Survey = {
      ...data,
      status: 'Borrador', // Forzado por regla de negocio
    };

    return await this.surveyPort.save(newSurvey);
  }

  /**
   * 2. Consultar todas las encuestas
   */
  async getAllSurveys(): Promise<Survey[]> {
    return await this.surveyPort.findAll();
  }

  /**
   * 3. Consultar una encuesta por su ID
   */
  async getSurveyById(id: string): Promise<Survey> {
    const survey = await this.surveyPort.findById(id);
    if (!survey) {
      throw new Error('La encuesta solicitada no existe.');
    }
    return survey;
  }

  /**
   * 4. Editar encuesta (Validando estrictamente que esté en estado Borrador)
   */
  async updateSurvey(id: string, data: Partial<Survey>): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);
    if (!survey) {
      throw new Error('La encuesta que intenta editar no existe.');
    }

    if (survey.status !== 'Borrador') {
      throw new Error('No se puede modificar una encuesta que ya ha sido publicada o cerrada.');
    }

    return await this.surveyPort.update(id, data);
  }

  /**
   * 5. Publicar encuesta (Pasa de Borrador a Publicada)
   */
  async publishSurvey(id: string): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);
    if (!survey) {
      throw new Error('La encuesta no existe.');
    }

    if (survey.status === 'Publicada') {
      throw new Error('La encuesta ya se encuentra publicada.');
    }

    // Aquí se acoplará la validación de preguntas del Dev 4 en el futuro.
    return await this.surveyPort.updateStatus(id, 'Publicada');
  }

  /**
   * 6. Desactivar encuesta (Pasa a Inactiva / Cerrada)
   */
  async deactivateSurvey(id: string): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);
    if (!survey) {
      throw new Error('La encuesta no existe.');
    }

    if (survey.status === 'Inactiva') {
      throw new Error('La encuesta ya está inactiva.');
    }

    return await this.surveyPort.updateStatus(id, 'Inactiva');
  }
}
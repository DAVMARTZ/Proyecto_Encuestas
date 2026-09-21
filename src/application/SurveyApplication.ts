import { SurveyPort } from '../domain/SurveyPort';
import { Survey } from '../domain/Survey';

export class SurveyApplication {
  constructor(private readonly surveyPort: SurveyPort) {}

  /**
   * Crea una nueva encuesta forzando el estado inicial a 'Borrador'.
   * @param data Datos básicos de la encuesta excluyendo campos autogenerados.
   * @returns El ID (UUID) de la encuesta recién creada.
   */
  async createSurvey(data: Omit<Survey, 'surveyId' | 'statusSurvey' | 'createdAt'>): Promise<string> {
    if (!data.title || data.title.trim() === '') {
      throw new Error('El título de la encuesta es obligatorio.');
    }
    if (!data.userId) {
      throw new Error('El ID del usuario creador es obligatorio.');
    }

    const newSurvey: Survey = {
      ...data,
      statusSurvey: 'Borrador',
    };

    return await this.surveyPort.save(newSurvey);
  }

  /**
   * Recupera todo el listado de encuestas disponibles.
   * @returns 
   */
  async getAllSurveys(): Promise<Survey[]> {
    return await this.surveyPort.findAll();
  }

  /**
   * Busca una encuesta específica por su identificador único.
   * @param id UUID de la encuesta.
   * @returns La encuesta encontrada.
   */
  async getSurveyById(id: string): Promise<Survey> {
    const survey = await this.surveyPort.findById(id);
    if (!survey) {
      throw new Error('La encuesta solicitada no existe.');
    }
    return survey;
  }

  /**
   * Actualiza la información de una encuesta solo si está en estado 'Borrador'.
   * @param id UUID de la encuesta.
   * @param data Objeto con los campos a actualizar.
   * @returns 
   */
  async updateSurvey(id: string, data: Partial<Survey>): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);
    
    if (!survey) {
      throw new Error('La encuesta que intenta editar no existe.');
    }
    if (survey.statusSurvey !== 'Borrador') {
      throw new Error('Solo se pueden modificar encuestas en estado Borrador.');
    }

    return await this.surveyPort.update(id, data);
  }

  /**
   * Cambia el estado de una encuesta a 'Publicada'.
   * @param id UUID de la encuesta.
   * @returns 
   */
  async publishSurvey(id: string): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);
    
    if (!survey) {
      throw new Error('La encuesta no existe.');
    }
    if (survey.statusSurvey === 'Publicada') {
      throw new Error('La encuesta ya se encuentra publicada.');
    }

    return await this.surveyPort.updateStatus(id, 'Publicada');
  }

  /**
   * Cambia el estado de una encuesta a 'Inactiva'.
   * @param id UUID de la encuesta.
   * @returns 
   */
  async deactivateSurvey(id: string): Promise<boolean> {
    const survey = await this.surveyPort.findById(id);
    
    if (!survey) {
      throw new Error('La encuesta no existe.');
    }
    if (survey.statusSurvey === 'Inactiva') {
      throw new Error('La encuesta ya está inactiva.');
    }

    return await this.surveyPort.updateStatus(id, 'Inactiva');
  }
}
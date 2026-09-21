import { Repository } from 'typeorm';
import { SurveyResponsePort, SurveyResponse } from '../../domain/SurveyResponse';
import { SurveyResponseEntity } from '../entities/SurveyResponseEntity';
import { AppDataSource } from '../config/data-base';

export class SurveyResponseAdapter implements SurveyResponsePort {
  private readonly repository: Repository<SurveyResponseEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SurveyResponseEntity);
  }

  /**
   * Guarda el envío y sus respuestas individuales usando typeorm
   */
  async saveResponse(response: SurveyResponse): Promise<string> {
    const entity = this.repository.create({
      surveyId: response.surveyId,
      userId: response.userId,
      details: response.details,
    });

    const saved = await this.repository.save(entity);
    return saved.surveyResponseId;
  }

  /**
   * Obtiene todos los envíos con sus detalles haciendo JOIN a la tabla response_details.
   */
  async getResponsesBySurvey(surveyId: string): Promise<SurveyResponse[]> {
    const entities = await this.repository.find({
      where: { surveyId },
      relations: {
        details: true // Trae todas las respuestas individuales asociadas
      }
    });

    return entities.map(entity => ({
      surveyResponseId: entity.surveyResponseId,
      submittedAt: entity.submittedAt,
      surveyId: entity.surveyId,
      userId: entity.userId,
      details: entity.details.map(detail => ({
        detailId: detail.detailId,
        questionId: detail.questionId,
        optionId: detail.optionId,
        responseText: detail.responseText
      }))
    }));
  }
}
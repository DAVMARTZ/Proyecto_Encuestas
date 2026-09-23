import { Repository } from 'typeorm';
import { SurveyResponsePort, SurveyResponse } from '../../domain/SurveyResponse';
import { SurveyResponseEntity } from '../entities/SurveyResponseEntity';
import { AppDataSource } from '../config/data-base';

export class SurveyResponseAdapter implements SurveyResponsePort {
  private readonly repository: Repository<SurveyResponseEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SurveyResponseEntity);
  }

  async saveResponse(response: SurveyResponse): Promise<number> {
    const entity = this.repository.create({
      surveyId: response.surveyId,
      userId: response.userId,
      status: 1,
      details: response.details.map(d => ({
        questionId: d.questionId,
        optionId: d.optionId,
        responseText: d.responseText,
        status: 1
      })),
    });

    const saved = await this.repository.save(entity);
    return saved.surveyResponseId;
  }

  async getResponsesBySurvey(surveyId: number): Promise<SurveyResponse[]> {
    const entities = await this.repository.find({
      where: { surveyId },
      relations: {
        details: true
      },
      order: { surveyResponseId: 'ASC' }
    });

    return entities.map(entity => ({
      surveyResponseId: entity.surveyResponseId,
      submittedAt: entity.submittedAt,
      surveyId: entity.surveyId,
      userId: entity.userId,
      status: entity.status,
      details: entity.details.map(detail => ({
        detailId: detail.detailId,
        questionId: detail.questionId,
        optionId: detail.optionId,
        responseText: detail.responseText,
        status: detail.status
      }))
    }));
  }
}
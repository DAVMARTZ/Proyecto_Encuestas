import { Repository } from 'typeorm';
import { SurveyPort } from '../../domain/SurveyPort';
import { Survey, SurveyStatus } from '../../domain/Survey';
import { SurveyEntity } from '../entities/Survey'; 
import { AppDataSource } from '../config/data-base';

export class SurveyAdapter implements SurveyPort {
  private readonly repository: Repository<SurveyEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SurveyEntity);
  }

  private toDomain(entity: SurveyEntity): Survey {
    return {
      surveyId: entity.surveyId,
      title: entity.title,
      description: entity.description,
      status: entity.status as SurveyStatus,
      statusSurvey: entity.status as SurveyStatus,
      createdAt: entity.createdAt,
      closeDate: entity.closeDate,
      userId: entity.userId,
    };
  }

  async save(survey: Survey): Promise<number> {
    const entity = this.repository.create({
      title: survey.title,
      description: survey.description,
      status: survey.status !== undefined ? Number(survey.status) : 1, 
      closeDate: survey.closeDate,
      userId: survey.userId,
    });
    
    const saved = await this.repository.save(entity);
    return saved.surveyId;
  }

  async findAll(includeInactive: boolean = false): Promise<Survey[]> {
    const entities = await this.repository.find({
      order: { surveyId: 'ASC' }
    });
    if (!includeInactive) {
      return entities.filter(e => e.status === 1).map((e) => this.toDomain(e));
    }
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: number): Promise<Survey | null> {
    const entity = await this.repository.findOneBy({ surveyId: id });
    return entity ? this.toDomain(entity) : null;
  }

  async update(id: number, survey: Partial<Survey>): Promise<boolean> {
    const updateData: Partial<SurveyEntity> = {};
    if (survey.title !== undefined) updateData.title = survey.title;
    if (survey.description !== undefined) updateData.description = survey.description;
    if (survey.closeDate !== undefined) updateData.closeDate = survey.closeDate;
    if (survey.status !== undefined) updateData.status = Number(survey.status);

    const result = await this.repository.update(id, updateData);
    return (result.affected ?? 0) > 0;
  }

  async updateStatus(id: number, status: SurveyStatus): Promise<boolean> {
    const result = await this.repository.update(id, { status: Number(status) });
    return (result.affected ?? 0) > 0;
  }

  async deactivate(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 0 });
    return (result.affected ?? 0) > 0;
  }

  async activate(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 1 });
    return (result.affected ?? 0) > 0;
  }
}
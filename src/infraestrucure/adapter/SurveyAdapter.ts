import { Repository } from 'typeorm';
import type { SurveyPort, Survey, SurveyStatus } from '../../domain/Survey';
import { SurveyEntity } from '../entities/Survey';
import { AppDataSource } from '../config/data-base';

export class SurveyAdapter implements SurveyPort {
  private readonly repository: Repository<SurveyEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SurveyEntity);
  }

  private toDomain(entity: SurveyEntity): Survey {
    return {
      id: entity.id,
      userId: entity.userId,
      itemId: entity.itemId,
      surveyTypeId: entity.surveyTypeId,
      title: entity.title,
      description: entity.description,
      status: entity.status as SurveyStatus,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async save(survey: Survey): Promise<string> {
    const entity = this.repository.create({
      userId: survey.userId,
      itemId: survey.itemId,
      surveyTypeId: survey.surveyTypeId,
      title: survey.title,
      description: survey.description,
      status: 'Borrador', // Regla inicial
    });
    const saved = await this.repository.save(entity);
    return saved.id;
  }

  async findAll(): Promise<Survey[]> {
    const entities = await this.repository.find();
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<Survey | null> {
    const entity = await this.repository.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async update(id: string, survey: Partial<Survey>): Promise<boolean> {
    const result = await this.repository.update(id, survey);
    return (result.affected ?? 0) > 0;
  }

  async updateStatus(id: string, status: SurveyStatus): Promise<boolean> {
    const result = await this.repository.update(id, { status });
    return (result.affected ?? 0) > 0;
  }
}
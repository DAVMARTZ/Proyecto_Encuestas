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

  /**
   * Mapea una entidad de TypeORM al objeto puro del Dominio.
   */
  private toDomain(entity: SurveyEntity): Survey {
    return {
      surveyId: entity.surveyId,
      title: entity.title,
      description: entity.description,
      statusSurvey: entity.statusSurvey as SurveyStatus,
      createdAt: entity.createdAt,
      closeDate: entity.closeDate,
      userId: entity.userId,
    };
  }

  /**
   * Guarda una nueva encuesta en la base de datos.
   */
  async save(survey: Survey): Promise<string> {
    const entity = this.repository.create({
      title: survey.title,
      description: survey.description,
      statusSurvey: 'Borrador', 
      closeDate: survey.closeDate,
      userId: survey.userId,
    });
    
    const saved = await this.repository.save(entity);
    return saved.surveyId;
  }

  /**
   * Obtiene todos los registros de encuestas en la base de datos.
   */
  async findAll(): Promise<Survey[]> {
    const entities = await this.repository.find();
    return entities.map((e) => this.toDomain(e));
  }

  /**
   * Busca un registro específico por su UUID.
   */
  async findById(id: string): Promise<Survey | null> {
    const entity = await this.repository.findOneBy({ surveyId: id });
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Actualiza propiedades generales de la encuesta excluyendo el estado.
   */
  async update(id: string, survey: Partial<Survey>): Promise<boolean> {
    const updateData: Partial<SurveyEntity> = {};
    if (survey.title !== undefined) updateData.title = survey.title;
    if (survey.description !== undefined) updateData.description = survey.description;
    if (survey.closeDate !== undefined) updateData.closeDate = survey.closeDate;

    const result = await this.repository.update(id, updateData);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Actualiza únicamente la columna de estado de la encuesta.
   */
  async updateStatus(id: string, status: SurveyStatus): Promise<boolean> {
    const result = await this.repository.update(id, { statusSurvey: status });
    return (result.affected ?? 0) > 0;
  }
}
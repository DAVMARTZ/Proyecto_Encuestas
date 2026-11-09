import { Repository } from "typeorm";
import { ResponseOptionPort } from "../../domain/ResponseOptionPort";
import { ResponseOption as ResponseOptionDomain } from "../../domain/ResponseOption";
import { ResponseOptionEntity } from "../entities/ResponseOptionEntity";
import { AppDataSource } from "../config/data-base";

/**
 * Adaptador de Infraestructura para Opciones de Respuesta con TypeORM
 */
export class ResponseOptionAdapter implements ResponseOptionPort {
  private repository: Repository<ResponseOptionEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(ResponseOptionEntity);
  }

  private toDomain(entity: ResponseOptionEntity): ResponseOptionDomain {
    return {
      optionId: entity.optionId,
      optionText: entity.optionText,
      displayOrder: entity.displayOrder,
      status: entity.status,
      questionId: entity.questionId,
    };
  }

  async createOption(option: ResponseOptionDomain): Promise<number> {
    const entity = this.repository.create({
      optionText: option.optionText,
      displayOrder: option.displayOrder,
      status: option.status !== undefined ? Number(option.status) : 1,
      questionId: option.questionId,
    });

    const saved = await this.repository.save(entity);
    return saved.optionId;
  }

  async getOptionsByQuestion(questionId: number, includeInactive: boolean = false): Promise<ResponseOptionDomain[]> {
    const whereClause: any = { questionId };
    if (!includeInactive) {
      whereClause.status = 1;
    }

    const entities = await this.repository.find({
      where: whereClause,
      order: { displayOrder: "ASC" },
    });

    return entities.map((e) => this.toDomain(e));
  }

  async getOptionById(id: number): Promise<ResponseOptionDomain | null> {
    const entity = await this.repository.findOne({ where: { optionId: id } });
    return entity ? this.toDomain(entity) : null;
  }

  async updateOption(id: number, option: Partial<ResponseOptionDomain>): Promise<boolean> {
    const existing = await this.repository.findOne({ where: { optionId: id } });
    if (!existing) return false;

    if (option.optionText !== undefined) existing.optionText = option.optionText;
    if (option.displayOrder !== undefined) existing.displayOrder = option.displayOrder;
    if (option.status !== undefined) existing.status = Number(option.status);

    await this.repository.save(existing);
    return true;
  }

  async deactivateOption(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 0 });
    return (result.affected ?? 0) > 0;
  }

  async activateOption(id: number): Promise<boolean> {
    const result = await this.repository.update(id, { status: 1 });
    return (result.affected ?? 0) > 0;
  }
}


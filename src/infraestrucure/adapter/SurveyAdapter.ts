import { AppDataSource } from '../config/data-base'; 
import { SurveyPort } from '../../domain/SurveyPort';
import { Survey, EstadoEncuesta } from '../../domain/Survey';
import { Encuesta } from '../entities/Encuesta';

export class SurveyAdapter implements SurveyPort {
    
    async create(survey: Survey): Promise<Survey> {
        const repo = AppDataSource.getRepository(Encuesta);
        const newSurvey = repo.create(survey);
        return await repo.save(newSurvey);
    }

    async findAll(filtros?: any): Promise<Survey[]> {
        const repo = AppDataSource.getRepository(Encuesta);
        return await repo.find();
    }

    async findById(id: string): Promise<Survey | null> {
        const repo = AppDataSource.getRepository(Encuesta);
        const result = await repo.findOne({ where: { id: id as any } });
        return result || null;
    }

    async update(id: string, data: Partial<Survey>): Promise<Survey> {
        const repo = AppDataSource.getRepository(Encuesta);
        await repo.update(id, data);
        const updated = await this.findById(id);
        if (!updated) throw new Error('Error al recuperar la encuesta actualizada');
        return updated;
    }

    async changeStatus(id: string, status: EstadoEncuesta): Promise<Survey> {
        const repo = AppDataSource.getRepository(Encuesta);
        await repo.update(id, { estado: status });
        const updated = await this.findById(id);
        if (!updated) throw new Error('Error al recuperar la encuesta actualizada');
        return updated;
    }
}
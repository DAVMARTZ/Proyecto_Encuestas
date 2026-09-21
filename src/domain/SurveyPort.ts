import { Survey, SurveyStatus } from './Survey';

/**
 * Contrato que debe implementar cualquier adaptador de la db
 * Aísla la lógica de negocio de la infraestructura typeorm.
 */
export interface SurveyPort {
    save(survey: Survey): Promise<string>;
    findAll(): Promise<Survey[]>;
    findById(id: string): Promise<Survey | null>;
    update(id: string, survey: Partial<Survey>): Promise<boolean>;
    updateStatus(id: string, status: SurveyStatus): Promise<boolean>;
}
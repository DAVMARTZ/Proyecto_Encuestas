import { Survey, EstadoEncuesta } from './Survey';

export interface SurveyPort {
    // Método para guardar una nueva encuesta 
    create(survey: Survey): Promise<Survey>;
    
    // Método para obtener todas las encuestas (con futuros filtros)
    findAll(filtros?: any): Promise<Survey[]>;
    
    // Método para obtener una encuesta específica 
    findById(id: string): Promise<Survey | null>;
    
    // Método para actualizar datos de una encuesta
    update(id: string, data: Partial<Survey>): Promise<Survey>;
    
    // Método para cambiar únicamente el estado de la encuesta
    changeStatus(id: string, status: EstadoEncuesta): Promise<Survey>;
}
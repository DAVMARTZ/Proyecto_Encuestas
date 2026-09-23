import { ResponseOption } from './ResponseOption';

export type QuestionStatus = 0 | 1 | number;
export type QuestionType = "Escala" | "Abierta" | "Seleccion Multiple"; 

export interface Question {
  questionId?: number;
  questionText: string;
  questionType: QuestionType | string;
  isRequired: boolean;
  displayOrder: number;
  status: QuestionStatus;
  statusQuestion?: QuestionStatus; // Compatibilidad
  surveyId: number;
  options?: ResponseOption[]; 
}
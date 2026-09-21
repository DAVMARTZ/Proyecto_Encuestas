import { ResponseOption } from './ResponseOption';

export type QuestionStatus = "Activa" | "Inactiva";
export type QuestionType = "Escala" | "Abierta" | "Seleccion Multiple"; 

export interface Question {
  questionId?: string;
  questionText: string;
  questionType: QuestionType | string;
  isRequired: boolean;
  displayOrder: number;
  statusQuestion: QuestionStatus | string;
  surveyId: string;
  options?: ResponseOption[]; 
}
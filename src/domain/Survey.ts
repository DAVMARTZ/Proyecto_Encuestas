import { Question } from "./Question";

export type SurveyStatus = 0 | 1 | 2 | number;

export const SURVEY_STATUS = {
    INACTIVE: 0,
    PUBLISHED: 1,
    DRAFT: 2,
} as const;

export interface Survey {
    surveyId?: number;
    title: string;
    description?: string;
    status: SurveyStatus;
    createdAt?: Date;
    closeDate?: Date;
    userId: number;
    questions?: Question[];
    questionCount?: number; // Preguntas activas, en los listados
    answered?: boolean; // Si el usuario de la sesión ya la respondió
    responseCount?: number; // Respuestas activas recibidas
}

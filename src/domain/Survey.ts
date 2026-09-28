export type SurveyStatus = 0 | 1 | number;

export interface SurveyOption {
    optionId: number;
    optionText: string;
    displayOrder: number;
}

export interface SurveyQuestion {
    questionId: number;
    questionText: string;
    questionType: string;
    isRequired: boolean;
    displayOrder: number;
    options: SurveyOption[];
}

export interface Survey {
    surveyId?: number;
    title: string;
    description?: string;
    status: SurveyStatus;
    statusSurvey?: SurveyStatus;
    createdAt?: Date;
    closeDate?: Date;
    userId: number;
    questions?: SurveyQuestion[];
    totalQuestions?: number;
    completed?: boolean;
}
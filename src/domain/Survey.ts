export type SurveyStatus = 0 | 1 | number;

export interface Survey {
    surveyId?: number;
    title: string;
    description?: string;
    status: SurveyStatus;
    statusSurvey?: SurveyStatus;
    createdAt?: Date;
    closeDate?: Date;
    userId: number;
}
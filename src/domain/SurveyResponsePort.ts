import { SurveyResponse } from "./SurveyResponse";

export interface StatisticsFilters {
  from?: Date;
  to?: Date;
}

export interface SentimentCount {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SurveyStatistics {
  surveyId: number;
  totalSubmissions: number;
  totalStudents: number;
  studentsAnswered: number;
  participation?: number; // Porcentaje de estudiantes activos que respondieron
  averageScore?: number;
  sentiment?: SentimentCount;
  questionsSummary: {
    questionId: number;
    questionText: string;
    questionType: string;
    totalAnswers: number;
    optionsCount?: { [optionText: string]: number };
    openAnswers?: string[];
    average?: number;
    sentiment?: SentimentCount;
  }[];
}

export interface SurveyResponsePort {
  saveResponse(response: SurveyResponse): Promise<number>;
  hasUserResponded(surveyId: number, userId: number): Promise<boolean>;
  getRespondedSurveyIds(userId: number): Promise<number[]>;
  countResponsesBySurvey(): Promise<Record<number, number>>;
  getResponsesByUser(userId: number): Promise<SurveyResponse[]>;
  getResponsesBySurvey(surveyId: number): Promise<SurveyResponse[]>;
  getSurveyStatistics(surveyId: number, filters?: StatisticsFilters): Promise<SurveyStatistics>;
}


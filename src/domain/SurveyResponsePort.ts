import { SurveyResponse } from "./SurveyResponse";

export interface SurveyStatistics {
  surveyId: number;
  totalSubmissions: number;
  questionsSummary: {
    questionId: number;
    questionText: string;
    questionType: string;
    totalAnswers: number;
    optionsCount?: { [optionText: string]: number };
    openAnswers?: string[];
  }[];
}

export interface SurveyResponsePort {
  saveResponse(response: SurveyResponse): Promise<number>;
  getResponsesBySurvey(surveyId: number): Promise<SurveyResponse[]>;
  getSurveyStatistics(surveyId: number): Promise<SurveyStatistics>;
}


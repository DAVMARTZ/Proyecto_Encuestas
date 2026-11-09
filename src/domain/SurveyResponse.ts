export interface ResponseDetail {
  detailId?: number;
  responseText?: string;
  questionId: number;
  questionText?: string;
  optionId?: number;
  optionText?: string;
  status?: number;
}

export interface SurveyResponse {
  surveyResponseId?: number;
  submittedAt?: Date;
  surveyId: number;
  surveyTitle?: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  status?: number;
  details: ResponseDetail[];
}

// Re-exportamos SurveyResponsePort para mantener compatibilidad si algún archivo anterior lo importaba
export type { SurveyResponsePort } from "./SurveyResponsePort";

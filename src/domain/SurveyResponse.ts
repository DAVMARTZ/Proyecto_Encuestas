export interface ResponseDetail {
  detailId?: number;
  responseText?: string; 
  questionId: number;
  optionId?: number; 
  status?: number;
}

export interface SurveyResponse {
  surveyResponseId?: number;
  submittedAt?: Date;
  surveyId: number;
  userId?: number; 
  status?: number;
  details: ResponseDetail[];
}

export interface SurveyResponsePort {
  saveResponse(response: SurveyResponse): Promise<number>;
  getResponsesBySurvey(surveyId: number): Promise<SurveyResponse[]>;
}
export interface ResponseDetail {
  detailId?: string;
  responseText?: string; 
  questionId: string;
  optionId?: string; 
}

export interface SurveyResponse {
  surveyResponseId?: string;
  submittedAt?: Date;
  surveyId: string;
  userId?: string; 
  details: ResponseDetail[];
}

export interface SurveyResponsePort {
  saveResponse(response: SurveyResponse): Promise<string>;
  getResponsesBySurvey(surveyId: string): Promise<SurveyResponse[]>;
}
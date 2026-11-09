import { Question } from "./Question";

export interface QuestionPort {
  createQuestion(question: Question): Promise<number>;
  getQuestionsBySurvey(surveyId: number, includeInactive?: boolean): Promise<Question[]>;
  getQuestionById(id: number): Promise<Question | null>;
  updateQuestion(id: number, question: Partial<Question>): Promise<boolean>;
  deactivateQuestion(id: number): Promise<boolean>;
  activateQuestion(id: number): Promise<boolean>;
}


import { Survey, SurveyStatus } from "./Survey";

export interface SurveyPort {
    save(survey: Survey): Promise<number>;
    findAll(includeInactive?: boolean): Promise<Survey[]>;
    findById(id: number): Promise<Survey | null>;
    findByUserId(userId: number, includeInactive?: boolean): Promise<Survey[]>;
    update(id: number, survey: Partial<Survey>): Promise<boolean>;
    updateStatus(id: number, status: SurveyStatus): Promise<boolean>;
    deactivate(id: number): Promise<boolean>;
    activate(id: number): Promise<boolean>;
}

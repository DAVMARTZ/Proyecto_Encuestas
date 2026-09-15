export type SurveyStatus = "Borrador" | "Publicada" | "Inactiva" ;

export interface Survey{
    id?: string;
    userId?: string;
    itemId: string;
    surveyTypeId: string;
    title: string;
    description?: string;
    status: SurveyStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SurveyPort {
    save(survey: Survey): Promise<string>;
    findAll(): Promise<Survey[]>;
    findById(id:String): Promise<Survey | null>;
    update(id: string, survey: Partial<Survey>): Promise<boolean>;
    updateStatus(id: string, status:SurveyStatus): Promise<boolean>;
}
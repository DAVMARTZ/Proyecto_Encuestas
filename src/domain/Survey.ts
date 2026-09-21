/**
 * Define los estados permitidos según la regla de negocio para status_survey.
 */
export type SurveyStatus = "Borrador" | "Publicada" | "Inactiva";

/**
 * Entidad principal de Encuesta con la tabla 'surveys'.
 */
export interface Survey {
    surveyId?: string;
    title: string;
    description?: string;
    statusSurvey: SurveyStatus;
    createdAt?: Date;
    closeDate?: Date;
    userId: string;
}
export type ResponseOptionStatus = "Activa" | "Inactiva";

export interface ResponseOption {
  optionId?: string;
  optionText: string;
  displayOrder: number;
  statusResponseOption: ResponseOptionStatus | string;
  questionId: string;
}
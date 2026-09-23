export type ResponseOptionStatus = 0 | 1 | number;

export interface ResponseOption {
  optionId?: number;
  optionText: string;
  displayOrder: number;
  status: ResponseOptionStatus;
  statusResponseOption?: ResponseOptionStatus; // Compatibilidad
  questionId: number;
}
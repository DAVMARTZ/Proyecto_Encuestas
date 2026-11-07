import { ResponseOption } from "./ResponseOption";

export interface ResponseOptionPort {
  createOption(option: ResponseOption): Promise<number>;
  getOptionsByQuestion(questionId: number, includeInactive?: boolean): Promise<ResponseOption[]>;
  getOptionById(id: number): Promise<ResponseOption | null>;
  updateOption(id: number, option: Partial<ResponseOption>): Promise<boolean>;
  deactivateOption(id: number): Promise<boolean>;
  activateOption(id: number): Promise<boolean>;
  deleteOption(id: number): Promise<boolean>;
}


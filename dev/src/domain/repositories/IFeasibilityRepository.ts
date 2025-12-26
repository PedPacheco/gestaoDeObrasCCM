export interface IFeasibilityRepository {
  exists(idWork: number): Promise<boolean>;
  saveFiles(idWork: number, files: Express.Multer.File[]): Promise<void>;
  findFiles(idWork: number): Promise<{ id: number; caminho_arquivo: string }[]>;
  deleteFiles(idWork: number): Promise<void>;
}

export const FEASIBILITY_REPOSITORY = Symbol('FeasibilityRepository');

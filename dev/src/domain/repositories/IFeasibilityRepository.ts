export interface IFeasibilityRepository {
  exists(idWork: number): Promise<any[]>;
  saveFiles(idWork: number, files: Express.Multer.File[]): Promise<void>;
  findFiles(
    idWork: number,
  ): Promise<{ id: number; caminho_arquivo: string; id_obra: number }[]>;
  deleteFiles(idWork: number): Promise<void>;
}

export const FEASIBILITY_REPOSITORY = Symbol('FeasibilityRepository');

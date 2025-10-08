export interface IUpdateCapexRepository {
  update(data: any[]): Promise<any>;
  getDeletedMaterials(): Promise<any>;
}

export const UPDATE_CAPEX_REPOSITORY = Symbol('UpdateCapexRepository');

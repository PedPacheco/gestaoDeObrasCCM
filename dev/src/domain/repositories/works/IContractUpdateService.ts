export interface IContractUpdateRepository {
  update(data: any[]): Promise<any>;
}

export const CONTRACT_UPDATE_REPOSITORY = Symbol('ContractUpdateRepository');

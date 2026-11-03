export interface ContractUpdateRepositoryInterface {
  ovnota: string;
  ordemDiagrama: string;
  ordemField: string;
  dataEmpreitamento: Date;
}

export interface IContractUpdateRepository {
  update(data: ContractUpdateRepositoryInterface[]): Promise<void>;
}

export const CONTRACT_UPDATE_REPOSITORY = Symbol('ContractUpdateRepository');

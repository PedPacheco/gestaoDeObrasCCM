import { ContractUpdateRepositoryInput } from 'src/domain/types';

export interface IContractUpdateRepository {
  update(data: ContractUpdateRepositoryInput[]): Promise<void>;
}

export const CONTRACT_UPDATE_REPOSITORY = Symbol('ContractUpdateRepository');

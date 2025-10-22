import { Test, TestingModule } from '@nestjs/testing';
import { ContractUpdateService } from 'src/application/works/contractUpdate.service';
import { CONTRACT_UPDATE_REPOSITORY } from 'src/domain/repositories/works/IContractUpdateRepository';

describe('ContractUpdateService', () => {
  let contractUpdateService: ContractUpdateService;

  const mockRepository = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractUpdateService,
        { provide: CONTRACT_UPDATE_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    contractUpdateService = module.get<ContractUpdateService>(
      ContractUpdateService,
    );

    jest.clearAllMocks();
  });

  it('Deve mapear ordemDiagrama começando com 170 para ordem_dci', async () => {
    const data = [{ ordemDiagrama: '170123' }] as any;

    await contractUpdateService.update(data);

    expect(mockRepository.update).toHaveBeenCalledWith([
      { ordemDiagrama: '170123', ordemField: 'ordem_dci' },
    ]);
  });

  it('Deve mapear ordemDiagrama começando com 190 para ordem_dcd', async () => {
    const data = [{ ordemDiagrama: '190456' }] as any;

    await contractUpdateService.update(data);

    expect(mockRepository.update).toHaveBeenCalledWith([
      { ordemDiagrama: '190456', ordemField: 'ordem_dcd' },
    ]);
  });

  it('Deve mapear ordemDiagrama começando com 150 para ordem_dca', async () => {
    const data = [{ ordemDiagrama: '150789' }] as any;

    await contractUpdateService.update(data);

    expect(mockRepository.update).toHaveBeenCalledWith([
      { ordemDiagrama: '150789', ordemField: 'ordem_dca' },
    ]);
  });

  it('Deve mapear ordemDiagrama começando com 180 para ordem_dcim', async () => {
    const data = [{ ordemDiagrama: '180999' }] as any;

    await contractUpdateService.update(data);

    expect(mockRepository.update).toHaveBeenCalledWith([
      { ordemDiagrama: '180999', ordemField: 'ordem_dcim' },
    ]);
  });

  it('Deve mapear ordemDiagrama começando com 200 para diagrama', async () => {
    const data = [{ ordemDiagrama: '200555' }] as any;

    await contractUpdateService.update(data);

    expect(mockRepository.update).toHaveBeenCalledWith([
      { ordemDiagrama: '200555', ordemField: 'diagrama' },
    ]);
  });

  it('Deve lançar erro caso a ordemDiagrama seja inválida', async () => {
    const data = [{ ordemDiagrama: '999999' }] as any;

    await expect(contractUpdateService.update(data)).rejects.toThrow(
      'Ordem inválida: 999999',
    );

    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('Deve processar múltiplos itens e mapear corretamente ordemField para cada um', async () => {
    const data = [
      { ordemDiagrama: '170111' },
      { ordemDiagrama: '190222' },
      { ordemDiagrama: '150333' },
      { ordemDiagrama: '180444' },
      { ordemDiagrama: '200555' },
    ] as any;

    await contractUpdateService.update(data);

    expect(mockRepository.update).toHaveBeenCalledWith([
      { ordemDiagrama: '170111', ordemField: 'ordem_dci' },
      { ordemDiagrama: '190222', ordemField: 'ordem_dcd' },
      { ordemDiagrama: '150333', ordemField: 'ordem_dca' },
      { ordemDiagrama: '180444', ordemField: 'ordem_dcim' },
      { ordemDiagrama: '200555', ordemField: 'diagrama' },
    ]);
  });
});

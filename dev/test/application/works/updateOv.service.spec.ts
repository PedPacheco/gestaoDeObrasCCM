import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FindExistingWorksService } from 'src/application/works/findExistingWorks.service';
import { UpdateOvService } from 'src/application/works/updateOv.service';
import { UPDATE_OV_REPOSITORY } from 'src/domain/repositories/works/IUpdateOvRepository';
import { mockMarketWorks } from '../../mocks/mockWorksController';

describe('UpdateOvService', () => {
  let updateOvService: UpdateOvService;

  const mockRepository = {
    update: jest.fn(),
  };

  const mockFindExistingWorksService = {
    findExistingWorks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOvService,
        { provide: UPDATE_OV_REPOSITORY, useValue: mockRepository },
        {
          provide: FindExistingWorksService,
          useValue: mockFindExistingWorksService,
        },
      ],
    }).compile();

    updateOvService = module.get<UpdateOvService>(UpdateOvService);
  });

  afterEach(jest.clearAllMocks);

  describe('update', () => {
    it('should throw BadRequestException if no data is provided', async () => {
      await expect(updateOvService.update([])).rejects.toThrow(
        BadRequestException,
      );

      await expect(updateOvService.update([])).rejects.toThrow(
        'Nenhum dado enviado.',
      );
    });

    it('should call updateOvRepository.update with transformed data when valid works exist', async () => {
      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([
        { id: 1, ovnota: '1424535' },
      ]);

      await updateOvService.update(mockMarketWorks);

      expect(mockRepository.update).toHaveBeenCalledWith([
        {
          id: 1,
          ovnota: '1424535',
          pep: 'PEP001',
          diagrama: 'DIA001',
          entrada: new Date('2025-06-01'),
          id_gpm: 1,
          id_tipo: 2,
          id_circuito: 3,
          prazo: 0,
          status_ov: 1,
          status_diagrama: 'Aprovado',
          status_pep: 'Validado',
          referencia: 'EQP-123',
          moPlanejada: 7500,
        },
      ]);
    });

    it('should call updateOvRepository.update with transformed data when valid works exist', async () => {
      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([
        { id: 1, ovnota: '1424535' },
      ]);

      await updateOvService.update([
        {
          obra: '1424535',
          pep: null,
          diagrama: null,
          entrada: null,
          idMunicipio: null,
          idTipo: null,
          idCircuito: null,
          prazoTexto: null,
          statusOv: null,
          statusDiagrama: null,
          statusPep: null,
          equipeNumPedido: null,
          moCliente: null,
          moEmpresa: null,
          observacao: 'Obra urgente, prioridade alta.',
          idParceira: 101,
        },
      ]);

      expect(mockRepository.update).toHaveBeenCalledWith([
        { id: 1, ovnota: '1424535' },
      ]);
    });
  });
});

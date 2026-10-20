import { RequestMethod, Type } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ExportBIController } from 'src/interface/controllers/export/exportBi.controller';
import { ExportD5NotesController } from 'src/interface/controllers/export/exportD5.controller';
import { ExportFeasibilityController } from 'src/interface/controllers/export/exportFeasibility.controller';
import { ExportPublicationsController } from 'src/interface/controllers/export/exportPublication.controller';
import { ExportScheduleController } from 'src/interface/controllers/export/exportSchedule.controller';
import { ExportServicesController } from 'src/interface/controllers/export/exportServices.controller';
import { ExportWorksController } from 'src/interface/controllers/export/exportWorks.controller';

/**
 * Garante que a divisão do antigo ExportController não alterou nenhuma URL
 * pública (nem duplicou/perdeu rota).
 */
const EXPECTED_ROUTES = [
  'GET /exportacao/capacidade-execucao',
  'GET /exportacao/forecast',
  'GET /exportacao/metas',

  'GET /exportacao/notas-d5',
  'GET /exportacao/obras-carteira',
  'GET /exportacao/obras-carteira-bi',
  'GET /exportacao/obras-executadas',
  'GET /exportacao/obras-executadas-bi',
  'GET /exportacao/obras-multas',
  'GET /exportacao/ordens',
  'GET /exportacao/programacao',
  'GET /exportacao/programacoes-bi',
  'GET /exportacao/publicacoes',
  'GET /exportacao/relatorio-execucao',
  'GET /exportacao/relatorio-publicacoes',
  'GET /exportacao/reprovacoes',
  'GET /exportacao/resumo-mensal',
  'GET /exportacao/resumo-mensal-forecast',
  'GET /exportacao/servicos',
  'GET /exportacao/suspensoes',
  'GET /exportacao/viabilidade/aguardando-aprovacao',
  'GET /exportacao/viabilidade/aguardando-viabilidade',
];

function collectRoutes(controller: Type<unknown>): string[] {
  const base: string = Reflect.getMetadata(PATH_METADATA, controller);
  const proto = controller.prototype;

  return Object.getOwnPropertyNames(proto)
    .map((name) => proto[name])
    .filter(
      (fn) =>
        typeof fn === 'function' && Reflect.hasMetadata(METHOD_METADATA, fn),
    )
    .map((fn) => {
      const method = RequestMethod[Reflect.getMetadata(METHOD_METADATA, fn)];
      const path = Reflect.getMetadata(PATH_METADATA, fn);
      return `${method} /${base}/${path}`;
    });
}

describe('Export controllers routes', () => {
  const routes = [
    ExportWorksController,
    ExportScheduleController,
    ExportPublicationsController,
    ExportServicesController,
    ExportFeasibilityController,
    ExportBIController,
    ExportD5NotesController,
  ].flatMap(collectRoutes);

  it('should expose exactly the same public routes as the former ExportController', () => {
    expect([...routes].sort()).toEqual(EXPECTED_ROUTES);
  });

  it('should not register the same route in more than one controller', () => {
    expect(new Set(routes).size).toBe(routes.length);
  });
});

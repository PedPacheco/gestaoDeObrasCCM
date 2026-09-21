import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { ButtonComponent } from "@/components/common/Button";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import D5DataItem, {
  SummaryD5DataItem,
} from "@/components/d5Notes/details/dataItemD5";
import { EditableColumnD5 } from "@/components/d5Notes/details/editableColumn";
import { D5NotesTabPanel } from "@/components/d5Notes/details/tabPanelD5Note";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { FormatCurrency, formatPercentage } from "@/utils/formatValue";

dayjs.extend(utc);

const COLUMN_CLASSNAME = "flex flex-col gap-2 px-2 md:px-4 py-2";

interface DetailsParams {
  params: Promise<{ id: string }>;
}

const formatDate = (date: dayjs.Dayjs): string => {
  return date.utc().format("DD/MM/YYYY");
};

function processD5Data(data: any) {
  return {
    criadoEm: formatDate(dayjs(data.criado_em)),
    dataConclusao: data.conclusao_nota
      ? formatDate(dayjs(data.conclusao_nota))
      : null,
    moPlanejada: FormatCurrency(data.mo_planejada) || "",
    totalExecutado: formatPercentage(data.totalExecutado) || 0,
    totalProgramado: formatPercentage(data.totalProgramado) || 0,
  };
}

export default async function DetailsD5({ params }: DetailsParams) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const [filters, d5Note, d5NotesSchedules] = await Promise.all([
    fetchFilters({
      restricao: true,
      tipoRestricao: ["EXECUÇÃO", "PROGRAMAÇÃO", "PUBLICAÇÃO", "REPROVADO"],
      tecnico: true,
      municipio: true,
      parceira: true,
      circuito: true,
      status: true,
      empreendimento: true,
      tipo: true,
    }),

    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/notas-d5/${id}`,
      undefined,
      token,
      { cache: "no-store" },
    ),

    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/notas-d5/programacoes/${id}`,
      undefined,
      token,
      { cache: "no-store" },
    ),
  ]);

  if (!d5Note.success) {
    return <ErrorThrower message={d5Note.message} />;
  }

  const { data } = d5Note;
  const formattedData = processD5Data(data);

  const schedulesData = d5NotesSchedules.success
    ? (d5NotesSchedules.data ?? [])
    : [];

  return (
    <EmotionCacheProvider>
      <main className="flex h-dvh w-full min-w-0 flex-col overflow-hidden">
        {/* Cabeçalho */}
        <header className="flex shrink-0 items-center justify-between px-4 py-4 md:px-8">
          <h1 className="text-xl font-extrabold md:text-2xl">
            Informações gerais
          </h1>

          <ButtonComponent
            text="Salvar alterações"
            styled="px-4 py-3 md:px-6 md:py-4"
          />
        </header>

        {/* Informações gerais */}
        <section className="grid shrink-0 w-full min-w-0 grid-cols-1 gap-y-1 px-2 sm:grid-cols-2 xl:grid-cols-6 md:px-4">
          {/* Coluna 1 */}
          <div className={COLUMN_CLASSNAME}>
            <D5DataItem label="Nota D5" value={data.nota_d5} />
            <D5DataItem label="Obra vinculada" value={data.obra} />
            <D5DataItem label="Ordem/Diagrama" value={data.ordemDiagrama} />
          </div>

          {/* Coluna 2 */}
          <div className={COLUMN_CLASSNAME}>
            <D5DataItem label="Tipo" value={data.tipoObra} />
            <D5DataItem
              label="Local instalação"
              value={data.local_instalacao}
            />
            <D5DataItem label="Município" value={data.municipio} />
          </div>

          {/* Coluna 3 */}
          <div className={COLUMN_CLASSNAME}>
            <D5DataItem label="Regional" value={data.regional} />
            <D5DataItem label="Entrada" value={formattedData.criadoEm} />
            <D5DataItem label="Prazo Contratual (7D)" value={data.prazo} />
          </div>

          {/* Coluna 4 */}
          <div className={COLUMN_CLASSNAME}>
            <D5DataItem
              label="Data conclusão"
              value={formattedData.dataConclusao}
            />
            <D5DataItem label="TME abertura" value={data.tme_abertura} />
            <D5DataItem label="TME executado" value={data.tme_executado} />
          </div>

          {/* Coluna 5 */}
          <div className={COLUMN_CLASSNAME}>
            <D5DataItem
              label="MO planejada"
              value={formattedData.moPlanejada}
            />

            <D5DataItem label="Validação anual" value={data.validacao_anual} />

            <div className="mb-3 flex gap-2">
              <div className="min-w-0 flex-1">
                <SummaryD5DataItem
                  label="Programado"
                  value={formattedData.totalProgramado}
                />
              </div>

              <div className="min-w-0 flex-1">
                <SummaryD5DataItem
                  label="Executado"
                  value={formattedData.totalExecutado}
                />
              </div>
            </div>
          </div>

          {/* Coluna 6 */}
          <div className={COLUMN_CLASSNAME}>
            <EditableColumnD5
              data={data}
              options={filters}
              // onHandleChange={handleDataChange}
            />
          </div>

          {/* Observação */}
          <div className="col-span-full mx-2 mb-4 flex min-h-[96px] min-w-0 items-stretch rounded-md border border-solid border-zinc-700 md:mx-4">
            <label
              htmlFor="observacao"
              className="
                flex
                w-32
                shrink-0
                items-center
                justify-center
                border-r
                border-solid
                border-zinc-700
                px-2
                text-center
                text-sm
                font-semibold
                md:text-base
                xl:text-lg
              "
            >
              Observação
            </label>

            <textarea
              id="observacao"
              name="observacao"
              rows={3}
              className="
                min-h-[94px]
                min-w-0
                flex-1
                resize-y
                bg-transparent
                p-3
                text-left
                text-base
                font-medium
                focus:outline-none
                md:text-lg
              "
            />
          </div>
        </section>

        {/* Tabs e tabela */}
        <section className="flex xl:h-[80%] max-h-[620px] overflow-y-auto min-w-0 flex-1 px-2 pb-6 md:px-4">
          <D5NotesTabPanel schedulesData={schedulesData} />
        </section>
      </main>
    </EmotionCacheProvider>
  );
}

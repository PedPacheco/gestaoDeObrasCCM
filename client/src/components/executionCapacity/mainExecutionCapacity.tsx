"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { UpdateExecutionCapacity } from "@/actions/executionCapacity";
import { fetchData } from "@/actions/fetchData.action";
import { FiltersInterface } from "@/types/filtersInterfaces";
import { getButtonContent } from "@/utils/getButtonContent";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import { ButtonComponent } from "../common/Button";
import ErrorModal from "../common/ErrorModal";
import ModalComponent from "../common/Modal";
import { FiltersExecutionCapacity } from "./filtersExecutionCapacity";
import { FinancialValuesModal } from "./financialValuesModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type RowData = Record<string, string | number | null>;

type FetchParams = Record<string, string | string[] | number | boolean | null>;

interface MainExecutionCapacityProps {
  columns: Record<string, string>;
  token: string;
  data: {
    financialValues: Record<string, string | number>[];
    executionCapacityValues: RowData[];
  };
  filtersData: FiltersInterface;
}

// ─── Dynamic Import ───────────────────────────────────────────────────────────

const TableComponent = dynamic(
  () =>
    import("@/components/executionCapacity/executionCapacityTable").then(
      (mod) => mod.ExecutionCapacityTable,
    ),
  { ssr: false },
);

// ─── Component ────────────────────────────────────────────────────────────────

export function MainExecutionCapacity({
  columns,
  data,
  token,
  filtersData,
}: MainExecutionCapacityProps) {
  const [isPending, startTransition] = useTransition();

  const [year, setYear] = useState<string>(dayjs().year().toString());
  const [teams, setTeams] = useState<string[] | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );

  const [tableData, setTableData] = useState<RowData[]>(
    data.executionCapacityValues,
  );
  const [financialData, setFinancialData] = useState<
    Record<string, string | number>[]
  >(data.financialValues);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openFinancialModal, setOpenFinancialModal] = useState<boolean>(false); // fix: typo no setter

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Improvement #6: dependências granulares para evitar execuções desnecessárias
  useEffect(() => {
    setTableData(data.executionCapacityValues);
    setFinancialData(data.financialValues);
  }, [data.executionCapacityValues, data.financialValues]);

  // Improvement #5: lógica do useMemo separada em funções nomeadas para melhor legibilidade
  const changedData = useMemo(() => {
    const getOriginal = (id: unknown) =>
      data.executionCapacityValues.find((d) => d.id === id) ?? {};

    const hasChanges = (row: RowData): boolean => {
      const original = getOriginal(row.id);
      return (
        !original ||
        Object.keys(row).some(
          (key) => row[key] !== original[key as keyof typeof original],
        )
      );
    };

    const toChangeset = (row: RowData): Record<string, number | null> => {
      const original = getOriginal(row.id);
      const changes: Record<string, number | null> = { id: row.id as number };

      Object.keys(row).forEach((key) => {
        if (row[key] !== original[key as keyof typeof original]) {
          const val = row[key];
          changes[key] = val == null || val === "" ? null : Number(val);
        }
      });

      return changes;
    };

    return tableData.filter(hasChanges).map(toChangeset);
  }, [tableData, data.executionCapacityValues]);

  // Improvement #1 e #2: handlers memoizados com useCallback
  const handleDataFetch = useCallback(
    async (url: string, params: FetchParams) => {
      startTransition(async () => {
        try {
          const response = await fetchData(url, params, token, {
            cache: "no-store",
          });

          if (!response.success) {
            setError(response.message);
            return;
          }

          setTableData(response.data.executionCapacityValues);
          setFinancialData(response.data.financialValues);
        } catch (error) {
          // Improvement #3: sem any no catch
          if (error instanceof Error) setError(error.message);
        }
      });
    },
    [token],
  );

  const handleApplyFilters = useCallback(() => {
    const params: FetchParams = {
      ...Transform(selectedItems),
      equipe: teams,
      ano: year,
    };

    handleDataFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/capacidade-execucao`,
      params,
    );
  }, [selectedItems, teams, year, handleDataFetch]);

  const handleClearFilters = useCallback(() => {
    // Improvement #7: usa o valor calculado diretamente para evitar uso do estado desatualizado
    const currentYear = dayjs().year().toString();

    setSelectedItems({});
    setTeams(null);
    setYear(currentYear);

    handleDataFetch(`${process.env.NEXT_PUBLIC_API_URL}/capacidade-execucao`, {
      ano: currentYear,
    });
  }, [handleDataFetch]);

  const handleSaveChangedData = useCallback(() => {
    startTransition(async () => {
      try {
        const response = await UpdateExecutionCapacity(changedData);

        if (!response.success) {
          setError(response.message);
          return;
        }

        setSuccess(response.message);
        setOpenModal(true);
      } catch (error) {
        // Improvement #3: sem any no catch
        if (error instanceof Error) setError(error.message);
      }
    });
  }, [changedData]);

  const toggleModal = useCallback(() => setOpenModal((prev) => !prev), []);

  const toggleFinancialModal = useCallback(
    () => setOpenFinancialModal((prev) => !prev),
    [],
  );

  return (
    <div className="w-full h-4/5">
      <div className="w-full flex justify-between">
        <div className="w-full">
          <div className="flex flex-col justify-center items-center lg:flex-row lg:justify-start lg:items-start pt-4 px-4">
            <FiltersExecutionCapacity
              filtersData={filtersData}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              setTeams={setTeams}
              teams={teams}
              setYear={setYear}
              year={year}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 w-1/2 lg:w-[90%] mb-4">
            <ButtonComponent
              onClick={handleApplyFilters}
              text={getButtonContent(isPending, "Aplicar filtros")}
              styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
              disabled={isPending}
            />
            <ButtonComponent
              onClick={handleClearFilters}
              text={getButtonContent(isPending, "Limpar filtros")}
              styled="w-full mb-2 lg:w-3/4 lg:mb-0 mx-auto"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="w-[480px] pt-8 pr-16 flex justify-center">
          <ButtonComponent
            text="Financeiro"
            styled="w-full"
            onClick={toggleFinancialModal}
          />
        </div>
      </div>

      <div className="self-start mx-6 2xl:h-[90%] w-[98%] flex flex-col justify-between 2xl:justify-normal pb-4">
        <TableComponent
          columns={columns}
          setTableData={setTableData}
          data={tableData}
        />

        <div className="self-end w-1/4">
          <ButtonComponent
            onClick={handleSaveChangedData}
            text={getButtonContent(isPending, "Atualizar valores")}
            styled="mt-2 lg:w-3/4 mx-auto"
            disabled={isPending || changedData.length === 0}
          />
        </div>
      </div>

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className="font-semibold text-xl">{success}</span>
      </ModalComponent>

      <FinancialValuesModal
        data={financialData}
        onClose={toggleFinancialModal}
        open={openFinancialModal}
      />

      {error && (
        <ErrorModal
          open={true}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </div>
  );
}

"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useTransition } from "react";

import { UpdateExecutionCapacity } from "@/actions/executionCapacity";
import { fetchData } from "@/actions/fetchData.action";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { getButtonContent } from "@/utils/getButtonContent";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import { ButtonComponent } from "../common/Button";
import ErrorModal from "../common/ErrorModal";
import ModalComponent from "../common/Modal";
import { FiltersExecutionCapacity } from "./filtersExecutionCapacity";
import { FinancialValuesModal } from "./financialValuesModal";

interface MainExecutionCapacityProps {
  columns: Record<string, string>;
  token: string;
  data: {
    financialValues: Record<string, string | number>[];
    executionCapacityValues: Record<string, string | number>[];
  };
  filtersData: FiltersInterface;
}

const TableComponent = dynamic(
  () =>
    import("@/components/executionCapacity/executionCapacityTable").then(
      (mod) => mod.ExecutionCapacityTable
    ),
  {
    ssr: false,
  }
);

export function MainExecutionCapacity({
  columns,
  data,
  token,
  filtersData,
}: MainExecutionCapacityProps) {
  const [isPending, startTransition] = useTransition();

  const [year, setYear] = useState<string>(dayjs().year().toString());
  const [teams, setTeams] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );

  const [tableData, setTableData] = useState<
    Record<string, string | number | null>[]
  >(data.executionCapacityValues);

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [openFinancialModal, setOpenFinanciealModal] = useState<boolean>(false);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTableData(data.executionCapacityValues);
  }, [data]);

  const changedData = useMemo(() => {
    return tableData
      .filter((row, index) =>
        Object.keys(row).some(
          (key) => row[key] !== data.executionCapacityValues[index][key]
        )
      )
      .map((row) => {
        const originalRow =
          data.executionCapacityValues.find((d) => d.id === row.id) || {};

        const changes: Record<string, number | null> = { id: row.id as number };

        Object.keys(row).forEach((key) => {
          if (row[key] !== originalRow[key])
            changes[key] =
              row[key] === null || row[key] === "" || row[key] === undefined
                ? null
                : Number(row[key]);
        });
        return changes;
      });
  }, [tableData, data]);

  const handleDataFetch = async (url: string, params: any) => {
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
      } catch (error: any) {
        setError(error.message);
      }
    });
  };

  const handleApplyFilters = () => {
    const newSelectedItems = {
      regionalId: selectedItems.idRegional,
      partnerId: selectedItems.idParceira,
      teams: teams || "",
      year,
    };

    handleDataFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/capacidade-execucao`,
      newSelectedItems
    );
  };

  const handleClearFilters = async () => {
    setSelectedItems({});
    setTeams(null);
    setYear("2025");

    handleDataFetch(`${process.env.NEXT_PUBLIC_API_URL}/capacidade-execucao`, {
      year,
    });
  };

  const handleSaveChangedData = () => {
    startTransition(async () => {
      try {
        const response = await UpdateExecutionCapacity(changedData);

        if (!response.success) {
          setError(response.message);
          return;
        }

        setSuccess(response.message);
        setOpenModal(true);
      } catch (error: any) {
        setError(error.message);
      }
    });
  };

  const toggleModal = () => setOpenModal((prev) => !prev);
  const toggleFinancialModal = () => setOpenFinanciealModal((prev) => !prev);

  return (
    <>
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
        <span className=" font-semibold text-xl">{success}</span>
      </ModalComponent>

      <FinancialValuesModal
        data={data.financialValues}
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
    </>
  );
}

"use client";

import { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";
import { exportExcel } from "@/actions/generateExcel.action";
import { UpdatePublicationRestrictions } from "@/actions/restrictions";
import { useFeedback } from "@/hooks/useFeedback";
import { mountUrl } from "@/utils/mountUrl";
import { Transform } from "@/utils/transform";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import PublicationRestrictionsTable from "../publicationRestrictionsTable";
import RestrictionDrawer from "./RestrictionDrawer";
import RestrictionFilters from "./restrictionFilters";
import ScheduleRestrictionsTable from "./scheduleRestrictionsTable";

const cookies = new Cookies();

interface MainScheduleRestrictionsProps {
  filtersData: any;
  data: any;
  token: string;
  columns: Record<string, string>;
  url: string;
}

export default function MainScheduleRestrictions({
  data,
  filtersData,
  columns,
  token,
  url,
}: MainScheduleRestrictionsProps) {
  const [filteredData, setFilteredData] = useState(data);
  const [page, setPage] = useState(0);

  const { showError } = useFeedback();

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const cookieKey =
    url === "programacao"
      ? "scheduleRestrictionsFilters"
      : "publicationRestrictionFilters";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRestriction, setSelectedRestriction] = useState<any>(null);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isPublication = url === "publicacoes";

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleOpenDrawer = (item: any) => {
    setSelectedRestriction(item);
    setDrawerOpen(true);
  };

  const handleEdit = async (restrictions: any) => {
    setDrawerOpen(false);

    startTransition(async () => {
      try {
        const response = await UpdatePublicationRestrictions(restrictions);

        if (!response.success) {
          showError(response.error || "Erro ao salvar alterações");
          return;
        }

        router.refresh();
      } catch (error: any) {
        showError(error.message);
      }
    });
  };

  const fetchScheduleRestrictions = useCallback(
    (params: Record<string, string | boolean | string | null>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/restricao/${url}`,
            params,
            token,
            { cache: "no-store" },
          );

          setFilteredData(response.data);
        } catch (error: any) {
          showError(error.message);
        }
      });
    },
    [showError, token, url],
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);

    const currentFilters = cookies.get("cookieKey")
      ? cookies.get("cookieKey")
      : {};

    const statusFilter = currentFilters?.statusFilter || {
      done: false,
      pending: false,
    };

    const filtersValues = {
      ...Transform(currentFilters?.selectedItems || {}),
      dataInicial: currentFilters?.startDate || null,
      dataFinal: currentFilters?.endDate || null,

      // 🔥 novo padrão
      status_done: statusFilter.done,
      status_pending: statusFilter.pending,

      page: newPage.toString(),
    };

    fetchScheduleRestrictions(filtersValues);
  };

  const generateExcel = useCallback(
    async (params: Record<string, string>) => {
      const { page, ...formattedParams } = params;

      const url = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao/publicacoes`,
        formattedParams,
      );

      try {
        const response = await exportExcel(url, token);

        if (!response.success) {
          showError(response.message);
          return;
        }

        const downloadUrl = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "Exportação restrições de publicação";
        document.body.append(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error: any) {
        showError(`Erro ao gerar a planilha: ${error.message}`);
      }
    },
    [showError, token],
  );

  const publicationDataFiltered = useMemo(() => {
    if (!isPublication) return filteredData.works;

    if (!selectedUser) return filteredData.works;

    return filteredData.works.filter((item: any) => item.nome === selectedUser);
  }, [filteredData, selectedUser, isPublication]);

  const uniqueNames: string[] = Array.from(
    new Set(data.works.map((item: any) => item.nome)),
  );

  return (
    <>
      {/* <div className="h-full w-full overflow-y-auto px-10"> */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="my-6 w-full flex flex-col px-10">
          <RestrictionFilters
            data={filtersData}
            keyFilters={cookieKey}
            endDate={endDate}
            startDate={startDate}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            uniqueNames={uniqueNames}
            applyFilters={fetchScheduleRestrictions}
            isPending={isPending}
            isPublication={isPublication}
            generateExcel={generateExcel}
          />
        </div>

        {isPublication ? (
          <PublicationRestrictionsTable
            columns={columns}
            data={publicationDataFiltered}
            handleAdd={handleOpenDrawer}
          />
        ) : (
          <ScheduleRestrictionsTable
            columns={columns}
            data={filteredData.works}
            totals={filteredData.totals}
            handleChangePage={handleChangePage}
            page={page}
          />
        )}

        {isPublication ? (
          <RestrictionDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            data={selectedRestriction}
            onSave={handleEdit}
            restrictionsValues={filtersData.restricao}
            isInsert={false}
            idParceira={selectedRestriction?.id_turma}
          />
        ) : undefined}
      </LocalizationProvider>
      {/* </div> */}
    </>
  );
}

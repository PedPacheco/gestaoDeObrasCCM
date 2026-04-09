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
import ErrorModal from "@/components/common/ErrorModal";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import RestrictionDrawer from "./RestrictionDrawer";
import ScheduleRestrictionsTable from "./scheduleRestrictionsTable";
import { UpdatePublicationRestrictions } from "@/actions/restrictions";
import PublicationRestrictionsTable from "../publicationRestrictionsTable";
import RestrictionFilters from "./restrictionFilters";

const cookies = new Cookies();

interface MainScheduleRestrictionsProps {
  filtersData: any;
  data: any;
  token?: string;
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
  const [error, setError] = useState<string | null>();
  const [page, setPage] = useState(0);

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
          setError(response.error || "Erro ao salvar alterações");
          return;
        }

        router.refresh();
      } catch (error: any) {
        setError(error.message);
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
          );

          setFilteredData(response.data);
        } catch (error: any) {
          setError(error.message);
        }
      });
    },
    [token, url],
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);

    const currentFilters = cookies.get("cookieKey")
      ? cookies.get("cookieKey")
      : {};

    const filtersValues = {
      ...Transform(currentFilters?.selectedItems || {}),
      dataInicial: currentFilters?.startDate || null,
      dataFinal: currentFilters?.endDate || null,
      executado: currentFilters?.executed || "false",
      page: newPage.toString(),
    };

    fetchScheduleRestrictions(filtersValues);
  };

  const publicationDataFiltered = useMemo(() => {
    if (!isPublication) return filteredData.works;

    if (!selectedUser) return filteredData.works;

    return filteredData.works.filter(
      (item: any) => item.nome_usuario === selectedUser,
    );
  }, [filteredData, selectedUser, isPublication]);

  const uniqueNames: string[] = Array.from(
    new Set(data.works.map((item: any) => item.nome_usuario)),
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
            idRegional={selectedRestriction?.id_regional}
          />
        ) : undefined}

        {error && (
          <ErrorModal
            open={true}
            message={error}
            onClose={() => setError(null)}
            icon={<ExclamationCircleIcon width={48} height={48} />}
          />
        )}
      </LocalizationProvider>
      {/* </div> */}
    </>
  );
}

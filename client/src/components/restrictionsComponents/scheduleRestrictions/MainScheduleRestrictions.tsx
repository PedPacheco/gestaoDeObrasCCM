"use client";

import { Dayjs } from "dayjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";
import ErrorModal from "@/components/common/ErrorModal";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import RestrictionDrawer from "./RestrictionDrawer";
import ScheduleRestrictionsTable from "./scheduleRestrictionsTable";
import WeeklyScheduleFilters from "./WeeklyScheduleFilters";
import { InsertPublicationRestrictions } from "@/actions/restrictions";

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

  const cookieKey =
    url === "programacao"
      ? "scheduleRestrictionsFilters"
      : "publicationRestrictionFilters";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRestriction, setSelectedRestriction] = useState<any>(null);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleAdd = (item: any) => {
    setSelectedRestriction(item);
    setDrawerOpen(true);
  };

  const handleSave = async (restriction: any) => {
    setDrawerOpen(false);

    startTransition(async () => {
      try {
        const formattedData = Object.fromEntries(
          Object.entries(restriction).map(([key, value]) => [
            key,
            value === "" ? null : value,
          ])
        );

        await InsertPublicationRestrictions(formattedData);

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
            token
          );

          setFilteredData(response.data);
        } catch (error: any) {
          setError(error.message);
        }
      });
    },
    [token, url]
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

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="my-6 w-4/5 flex flex-col">
          <WeeklyScheduleFilters
            data={filtersData}
            keyFilters={cookieKey}
            endDate={endDate}
            startDate={startDate}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            applyFilters={fetchScheduleRestrictions}
            isPending={isPending}
          />
        </div>

        <ScheduleRestrictionsTable
          columns={columns}
          data={filteredData.works}
          totals={filteredData.totals}
          handleChangePage={handleChangePage}
          page={page}
          handleAdd={handleAdd}
        />

        {url === "publicacoes" ? (
          <RestrictionDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            data={selectedRestriction}
            onSave={handleSave}
            restrictionsValues={filtersData.restricao}
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
    </>
  );
}

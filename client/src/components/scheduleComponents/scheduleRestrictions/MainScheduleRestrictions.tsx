"use client";

import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";
import ErrorModal from "@/components/common/ErrorModal";
import { TableWithPagination } from "@/components/common/TableWithPagination";
import { MainInterface } from "@/interfaces/mainInterface";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import WeeklyScheduleFilters from "./WeeklyScheduleFilters";

const cookies = new Cookies();

export default function MainScheduleRestrictions({
  data,
  filtersData,
  columns,
  token,
}: MainInterface<any>) {
  const [filteredData, setFilteredData] = useState(data);
  const [error, setError] = useState<string | null>();
  const [page, setPage] = useState(0);

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  // const [drawerOpen, setDrawerOpen] = useState(false);
  // const [selectedRestriction, setSelectedRestriction] = useState<any>(null);

  // const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  // const handleEdit = (item: any) => {
  //   setSelectedRestriction(item);
  //   setDrawerOpen(true);
  // };

  // const handleSave = async (updatedItem: any) => {
  //   setDrawerOpen(false);

  //   startTransition(async () => {
  //     try {
  //       await UpdateRestrictions(updatedItem);

  //       router.refresh();
  //     } catch (error: any) {
  //       setError(error.message);
  //     }
  //   });
  // };

  const handleDateChange = (newDate: Dayjs | null, key: string) => {
    if (newDate) {
      if (key === "startDate") setStartDate(newDate);
      if (key === "endDate") setEndDate(newDate);
    }
  };

  const fetchScheduleRestrictions = useCallback(
    (params: Record<string, string | boolean | string | null>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/programacao/restricoes`,
            params,
            token
          );

          setFilteredData(response.data);
        } catch (error: any) {
          setError(error.message);
        }
      });
    },
    [token]
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);

    const currentFilters = cookies.get("scheduleForDayFilters")
      ? cookies.get("scheduleForDayFilters")
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
            keyFilters="scheduleRestrictionsFilters"
            endDate={endDate}
            startDate={startDate}
            setEndDate={setEndDate}
            setStartDate={setStartDate}
            handleDateChange={handleDateChange}
            applyFilters={fetchScheduleRestrictions}
            isPending={isPending}
          />
        </div>

        <TableWithPagination
          columns={columns}
          data={filteredData.works}
          totals={filteredData.totals}
          handleChangePage={handleChangePage}
          page={page}
        />

        {/* <EditRestrictionDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          data={selectedRestriction}
          onSave={handleSave}
          restrictionsValues={filtersData.restricao}
        /> */}

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

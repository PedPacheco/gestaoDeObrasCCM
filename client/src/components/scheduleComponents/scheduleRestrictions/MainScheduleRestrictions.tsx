"use client";

import dayjs, { Dayjs } from "dayjs";
import { useCallback, useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import ErrorModal from "@/components/common/ErrorModal";
import { MainInterface } from "@/interfaces/mainInterface";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import WeeklyScheduleFilters from "../weeklySchedule/WeeklyScheduleFilters";
import ScheduleRestrictionsTable from "./scheduleRestrictionsTable";
import EditRestrictionDrawer from "./EditRestrictionDrawer";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { UpdateRestrictions } from "@/actions/schedules";
import { useRouter } from "next/navigation";

export default function MainScheduleRestrictions({
  data,
  filtersData,
  columns,
  token,
}: MainInterface<any>) {
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [error, setError] = useState<string | null>();
  const [weekRange, setWeekRange] = useState<{
    start: string;
    end: string;
  }>({
    start: selectedDate.startOf("isoWeek").format("DD/MM/YYYY"),
    end: selectedDate.endOf("isoWeek").format("DD/MM/YYYY"),
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRestriction, setSelectedRestriction] = useState<any>(null);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleEdit = (item: any) => {
    setSelectedRestriction(item);
    setDrawerOpen(true);
  };

  const handleSave = async (updatedItem: any) => {
    setDrawerOpen(false);

    startTransition(async () => {
      try {
        await UpdateRestrictions(updatedItem);

        router.refresh();
      } catch (error: any) {
        setError(error.message);
      }
    });
  };

  const handleDateChange = (newDate: Dayjs | null) => {
    if (newDate) {
      const startOfWeek = newDate.startOf("isoWeek");
      const endOfWeek = newDate.endOf("isoWeek");
      setSelectedDate(newDate);
      setWeekRange({
        start: startOfWeek.format("DD/MM/YYYY"),
        end: endOfWeek.format("DD/MM/YYYY"),
      });
    }
  };

  const fetchScheduleRestrictions = useCallback(
    (params: Record<string, string | boolean>) => {
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

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="my-6 w-4/5 flex flex-col">
          <WeeklyScheduleFilters
            data={filtersData}
            keyFilters="scheduleRestrictionsFilters"
            dateInitial={selectedDate}
            weekRange={weekRange}
            setWeekRange={setWeekRange}
            handleDateChange={handleDateChange}
            setDateInitial={setSelectedDate}
            applyFilters={fetchScheduleRestrictions}
            isPending={isPending}
          />
        </div>

        <ScheduleRestrictionsTable
          columns={columns}
          data={filteredData}
          onEdit={handleEdit}
        />

        <EditRestrictionDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          data={selectedRestriction}
          onSave={handleSave}
          restrictionsValues={filtersData.restricao}
        />

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

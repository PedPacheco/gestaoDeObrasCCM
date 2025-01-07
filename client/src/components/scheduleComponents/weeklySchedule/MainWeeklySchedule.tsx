"use client";

import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useCallback, useState, useTransition } from "react";

import { MainInterface } from "@/interfaces/mainInterface";

import WeeklyScheduleFilters from "./WeeklyScheduleFilters";
import WeeklyScheduleTable from "./WeeklyScheduleTable";
import { fetchData } from "@/actions/fetchData.action";
import ErrorModal from "@/components/common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

dayjs.extend(isoWeek);

export default function MainWeeklySchedule({
  data,
  filtersData,
  token,
}: MainInterface<any>) {
  const [filteredData, setFilteredData] = useState(data);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [error, setError] = useState<string | null>();
  const [weekRange, setWeekRange] = useState<{
    start: string;
    end: string;
  }>({
    start: selectedDate.startOf("isoWeek").format("DD/MM/YYYY"),
    end: selectedDate.endOf("isoWeek").format("DD/MM/YYYY"),
  });
  const [isPending, startTransition] = useTransition();

  const mondayDate = selectedDate.startOf("isoWeek");

  const weekDates = Array.from({ length: 7 }, (_, index) =>
    mondayDate.add(index, "day").format("DD/MM/YYYY")
  );

  const fetchWeeklySchedule = useCallback(
    (params: Record<string, string | boolean>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/programacao/semanal`,
            params,
            token
          );

          setFilteredData(response.data.data);
        } catch (error: any) {
          setError(error.message);
        }
      });
    },
    [token]
  );

  const handleDateChange = useCallback((newDate: Dayjs | null) => {
    if (newDate) {
      const startOfWeek = newDate.startOf("isoWeek");
      const endOfWeek = newDate.endOf("isoWeek");

      setSelectedDate(newDate);
      setWeekRange({
        start: startOfWeek.format("DD/MM/YYYY"),
        end: endOfWeek.format("DD/MM/YYYY"),
      });
    }
  }, []);

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <WeeklyScheduleFilters
          data={filtersData}
          dateInitial={selectedDate}
          keyFilters="weeklyScheduleFilters"
          weekRange={weekRange}
          setWeekRange={setWeekRange}
          handleDateChange={handleDateChange}
          setDateInitial={setSelectedDate}
          isPending={isPending}
          applyFilters={fetchWeeklySchedule}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2 justify-items-center items w-11/12 lg:h-[95%]">
        {weekDates.map((date, index) => (
          <WeeklyScheduleTable key={index} data={data} filterDate={date} />
        ))}
      </div>

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

"use client";

import dayjs, { Dayjs } from "dayjs";
import { useCallback, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import ErrorModal from "@/components/common/ErrorModal";
import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import WeeklyScheduleFilters from "../weeklySchedule/WeeklyScheduleFilters";

export default function MainScheduleRestrictions({
  data,
  filtersData,
  columns,
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

      <TableComponent columns={columns} data={filteredData} />

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

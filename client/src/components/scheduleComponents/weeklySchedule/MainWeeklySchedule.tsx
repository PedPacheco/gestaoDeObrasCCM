"use client";

import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import nookies from "nookies";
import { useCallback, useEffect, useState } from "react";

import { MainInterface } from "@/interfaces/mainInterface";
import { fetchData } from "@/services/fetchData";

import WeeklyScheduleFilters from "./WeeklyScheduleFilters";
import WeeklyScheduleTable from "./WeeklyScheduleTable";

dayjs.extend(isoWeek);

export default function MainWeeklySchedule({
  data,
  filters,
  token,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [weekRange, setWeekRange] = useState<{
    start: string;
    end: string;
  }>({
    start: selectedDate.startOf("isoWeek").format("DD/MM/YYYY"),
    end: selectedDate.endOf("isoWeek").format("DD/MM/YYYY"),
  });

  const fetchSchedule = useCallback(
    async (params: Record<string, string>) => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/programacao/semanal`,
        params,
        token
      );

      setDataFiltered(response.data);
    },
    [token]
  );

  useEffect(() => {
    const cookies = nookies.get();
    const params = cookies["weeklyScheduleFilters"];

    if (params) {
      fetchSchedule(JSON.parse(params));
    }
  }, [fetchSchedule]);

  const mondayDate = selectedDate.startOf("isoWeek");

  const weekDates = Array.from({ length: 7 }, (_, index) =>
    mondayDate.add(index, "day").format("DD/MM/YYYY")
  );

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

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <WeeklyScheduleFilters
          data={filters}
          onApplyFilters={fetchSchedule}
          dateInitial={selectedDate}
          keyFilters="weeklyScheduleFilters"
          weekRange={weekRange}
          setWeekRange={setWeekRange}
          handleDateChange={handleDateChange}
          setDateInitial={setSelectedDate}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-2 justify-items-center items w-11/12 lg:h-[95%]">
        {weekDates.map((date, index) => (
          <WeeklyScheduleTable
            key={index}
            data={dataFiltered.data}
            filterDate={date}
          />
        ))}
      </div>
    </>
  );
}

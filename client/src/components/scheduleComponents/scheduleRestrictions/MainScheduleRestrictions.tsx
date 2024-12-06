"use client";

import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";

import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";
import { fetchData } from "@/services/fetchData";

import WeeklyScheduleFilters from "../weeklySchedule/WeeklyScheduleFilters";

export default function MainScheduleRestrictions({
  data,
  filters,
  token,
  columns,
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

  async function fetchEntry(params: Record<string, string>) {
    const response = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/restricoes`,
      params,
      token
    );

    setDataFiltered(response.data);
  }

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
          onApplyFilters={fetchEntry}
          keyFilters="scheduleRestrictionsFilters"
          dateInitial={selectedDate}
          weekRange={weekRange}
          setWeekRange={setWeekRange}
          handleDateChange={handleDateChange}
          setDateInitial={setSelectedDate}
        />
      </div>

      <TableComponent columns={columns} data={dataFiltered.data} />
    </>
  );
}

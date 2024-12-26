"use client";

import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";

import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";

import WeeklyScheduleFilters from "../weeklySchedule/WeeklyScheduleFilters";

export default function MainScheduleRestrictions({
  data,
  filtersData,
  columns,
}: MainInterface<any>) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [weekRange, setWeekRange] = useState<{
    start: string;
    end: string;
  }>({
    start: selectedDate.startOf("isoWeek").format("DD/MM/YYYY"),
    end: selectedDate.endOf("isoWeek").format("DD/MM/YYYY"),
  });

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
          data={filtersData}
          keyFilters="scheduleRestrictionsFilters"
          dateInitial={selectedDate}
          weekRange={weekRange}
          setWeekRange={setWeekRange}
          handleDateChange={handleDateChange}
          setDateInitial={setSelectedDate}
        />
      </div>

      <TableComponent columns={columns} data={data} />
    </>
  );
}

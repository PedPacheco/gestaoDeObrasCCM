import { capitalize } from "@/utils/capitalize";
import { SelectComponent } from "../../common/Select";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";
import { ButtonComponent } from "../../common/Button";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
  circuito: { id: string; circuito: string }[];
}

interface SheduleFiltersProps {
  data: filters;
  onApplyFilters: (params: any) => void;
}

export default function ScheduleFilters({
  data,
  onApplyFilters,
}: SheduleFiltersProps) {
  const [selectedYear, setSelectedYear] = useState<Dayjs | null>(dayjs());
  const [selectedItems, setSelectedItems] = useState<Record<string, string>>(
    {}
  );

  function handleApplyFilters() {
    const newSelectedItems = {
      ...selectedItems,
      ano: selectedYear ? selectedYear.year().toString() : "",
    };

    onApplyFilters(newSelectedItems);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setSelectedYear(dayjs());

    onApplyFilters({ ano: selectedYear?.year().toString() });
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <div className="mb-2 lg:ml-4 lg:first:ml-0 w-full">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              views={["year"]}
              value={selectedYear}
              onChange={(value) => setSelectedYear(value)}
              slotProps={{ textField: { size: "small", fullWidth: true } }}
            />
          </LocalizationProvider>
        </div>
        {Object.entries(data).map(([key, value], index) => {
          const valueKey = Object.keys(value[0])[0];
          const displayKey = Object.keys(value[0])[1];

          const filterValue = `${valueKey}${
            key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
          }`;

          return (
            <SelectComponent
              label={capitalize(key)}
              menuItems={value || []}
              selectedItem={selectedItems[filterValue]}
              setSelectedItem={(selectedValue) => {
                setSelectedItems((prev) => ({
                  ...prev,
                  [filterValue]: selectedValue,
                }));
              }}
              valueKey={valueKey}
              displayKey={displayKey}
              key={index}
            />
          );
        })}
      </div>
      <div className=" flex flex-col md:flex-row justify-between items-center xl:justify-around">
        <ButtonComponent
          onClick={handleApplyFilters}
          text="Aplicar filtros"
          styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
        />
        <ButtonComponent
          onClick={handleCleanigFilters}
          text="Limpar filtros"
          styled="w-full mb-2 md:w-1/4 md:mb-0 max-w-md"
        />
      </div>
    </>
  );
}

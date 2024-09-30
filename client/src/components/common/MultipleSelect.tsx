"use client";

import { FormControl, InputLabel, MenuItem } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";

interface SelectProps<T> {
  label: string;
  menuItems: T[];
  selectedItem: T[];
  setSelectedItem: (items: T[]) => void;
  valueKey?: keyof T;
  displayKey?: keyof T;
}

type SelectItem = string | number;

export function MultipleSelectComponent<T>({
  label,
  menuItems,
  selectedItem,
  setSelectedItem,
  valueKey,
  displayKey,
}: SelectProps<T>) {
  const handleChange = (event: SelectChangeEvent<T[]>) => {
    const { value } = event.target;
    setSelectedItem(value as unknown as T[]);
  };

  return (
    <>
      <FormControl className="mb-2 lg:ml-4 lg:first:ml-0 w-full" size="small">
        <InputLabel id={label}>{label}</InputLabel>
        <Select
          labelId={label}
          label={`${label}1`}
          className="w-full"
          multiple
          value={selectedItem}
          onChange={handleChange}
        >
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              value={(valueKey ? item[valueKey] : item) as SelectItem}
            >
              {(displayKey ? item[displayKey] : item) as unknown as SelectItem}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
}

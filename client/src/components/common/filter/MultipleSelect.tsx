"use client";

import { FormControl, InputLabel, MenuItem } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";

interface SelectProps<T> {
  label: string;
  menuItems: any[];
  selectedItem: T[];
  setSelectedItem: (items: T[]) => void;
  valueKey?: string;
  displayKey?: string;
  backgroundColor?: string;
  textColor?: string;
}

type SelectItem = string | number;

export function MultipleSelectComponent<T>({
  label,
  menuItems,
  selectedItem,
  setSelectedItem,
  valueKey,
  displayKey,
  backgroundColor,
  textColor,
}: SelectProps<T>) {
  const handleChange = (event: SelectChangeEvent<T[]>) => {
    const { value } = event.target;
    setSelectedItem(value as unknown as T[]);
  };

  return (
    <>
      <FormControl
        className="lg:ml-4 lg:first:ml-0 w-full"
        sx={{ marginBottom: "0.5rem" }}
        size="small"
      >
        <InputLabel
          id={label}
          sx={{
            color: textColor,
            "& .MuiSelect-select": {
              color: textColor,
            },
            "&.Mui-focused": {
              color: textColor,
            },
          }}
        >
          {label.replace("_", " ")}
        </InputLabel>
        <Select
          labelId={label}
          label={`${label}1`}
          className="w-full"
          multiple
          value={selectedItem || []}
          onChange={handleChange}
          sx={{
            backgroundColor,
            color: textColor,
            "& .MuiSelect-icon": {
              color: textColor,
            },
          }}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 400,
              },
            },
            MenuListProps: {
              style: {
                overflowY: "auto",
                maxHeight: 400,
              },
            },
          }}
        >
          {menuItems.map((item: any, index) => (
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

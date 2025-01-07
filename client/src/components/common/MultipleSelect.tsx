"use client";

import { FormControl, InputLabel, MenuItem } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useState } from "react";

interface SelectProps<T> {
  label: string;
  menuItems: any[];
  selectedItem: T[];
  setSelectedItem: (items: T[]) => void;
  valueKey?: string;
  displayKey?: string;
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
  const itemsPerPage = 20;
  const [visibleItems, setVisibleItems] = useState<T[]>(
    menuItems.slice(0, itemsPerPage)
  );

  const handleChange = (event: SelectChangeEvent<T[]>) => {
    const { value } = event.target;
    setSelectedItem(value as unknown as T[]);
  };

  const handleScroll = (event: React.UIEvent<HTMLUListElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;

    if (scrollTop + clientHeight >= scrollHeight) {
      const nextItems = menuItems.slice(
        visibleItems.length,
        visibleItems.length + itemsPerPage
      );

      if (nextItems.length > 0) {
        setVisibleItems((prev) => [...prev, ...nextItems]);
      }
    }
  };

  return (
    <>
      <FormControl className="mb-2 lg:ml-4 lg:first:ml-0 w-full" size="small">
        <InputLabel id={label}>{label.replace("_", " ")}</InputLabel>
        <Select
          labelId={label}
          label={`${label}1`}
          className="w-full"
          multiple
          value={selectedItem || []}
          onChange={handleChange}
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
              onScroll: handleScroll,
            },
          }}
        >
          {visibleItems.map((item: any, index) => (
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

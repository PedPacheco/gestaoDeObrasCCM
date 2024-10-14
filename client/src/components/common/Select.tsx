"use client";

import { FormControl, InputLabel, MenuItem } from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useEffect, useState } from "react";

interface SelectProps<T> {
  label: string;
  menuItems: T[];
  selectedItem: string;
  setSelectedItem: (item: string) => void;
  valueKey?: keyof T;
  displayKey?: keyof T;
}

type SelectItem = string | number;

export function SelectComponent<T>({
  label,
  menuItems,
  selectedItem,
  setSelectedItem,
  valueKey,
  displayKey,
}: SelectProps<T>) {
  const itemsPerPage = 20;
  const [visibleItems, setVisibleItems] = useState<T[]>([]); // Itens visíveis

  useEffect(() => {
    setVisibleItems(menuItems.slice(0, itemsPerPage));
  }, [menuItems, itemsPerPage]);

  const handleChange: (event: SelectChangeEvent<string>) => void = (event) => {
    const { value } = event.target;
    setSelectedItem(value);
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
          value={selectedItem || ""}
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
          {visibleItems.map((item, index) => {
            return (
              <MenuItem
                key={index}
                value={(valueKey ? item[valueKey] : item) as SelectItem}
              >
                {
                  (displayKey
                    ? item[displayKey]
                    : item) as unknown as SelectItem
                }
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </>
  );
}

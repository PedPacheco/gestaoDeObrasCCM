"use client";

import { ReactNode } from "react";

import { FormControl, MenuItem } from "@mui/material";
import Select from "@mui/material/Select";

export interface SelectProps {
  label: string;
  menuItems: any[];
  selectedItem?: string;
  setSelectedItem?: (item: string) => void;
  valueKey?: string | number;
  displayKey?: string | number;
  disabled?: boolean;
}

type SelectItem = string | number;

export function SelectComponent({
  label,
  menuItems,
  selectedItem,
  setSelectedItem,
  valueKey,
  displayKey,
  disabled = false,
}: SelectProps) {
  return (
    <div className="flex items-center justify-between mb-3 max-w-96 w-[342px] h-10 border border-zinc-700 border-solid rounded-md">
      {label && (
        <p className="h-full flex items-center justify-start font-semibold w-40 p-2 text-center border-r border-zinc-700 border-solid">
          {label}
        </p>
      )}

      <FormControl
        className="flex-1 h-full min-w-32 lg:min-w-36 justify-center"
        size="small"
      >
        <Select
          value={selectedItem}
          displayEmpty
          className="text-center w-full h-full px-2"
          onChange={(e: { target: { value: string } }) =>
            setSelectedItem?.(e.target.value)
          }
          IconComponent={() => null}
          inputProps={{
            className: "text-center text-sm p-2 pr-0",
          }}
          disabled={disabled}
          MenuProps={{
            PaperProps: {
              style: { maxHeight: 400 },
            },
            MenuListProps: {
              style: {
                overflowY: "auto",
                maxHeight: 400,
              },
            },
          }}
        >
          {menuItems.map((item, index) => {
            const value = (valueKey ? item[valueKey] : item) as SelectItem;
            const label = (displayKey ? item[displayKey] : item) as ReactNode;
            return (
              <MenuItem key={index} value={value}>
                {label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
}
